
import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Package, FileText, ChevronRight, X, ArrowRight } from 'lucide-react';
import { Order, User as UserType, CustomerProfile } from '../../types';
import { CustomerService } from '../../services/storeService';

interface SmartSearchProps {
    orders: Order[];
    users: UserType[];
    onNavigate: (tab: string) => void;
}

interface SearchResult {
    id: string;
    type: 'customer' | 'order' | 'invoice';
    title: string;
    subtitle: string;
    status?: string;
    value?: string;
    score: number; // Relevance score
    data: any;
}

export const SmartSearch: React.FC<SmartSearchProps> = ({ orders, users, onNavigate }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [customers, setCustomers] = useState<CustomerProfile[]>([]);

    useEffect(() => {
        // Load enriched customer profiles for searching invoices/phone numbers
        const loadCustomers = async () => {
            const c = await CustomerService.getCustomers();
            setCustomers(c);
        };
        loadCustomers();

        // Click outside listener
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const searchResults: SearchResult[] = [];

        // --- 1. Search Users (Customers/Admins) ---
        users.forEach(u => {
            let score = 0;
            if (u.name.toLowerCase().includes(lowerQuery)) score += 10;
            if (u.email.toLowerCase().includes(lowerQuery)) score += 10;
            if (u.id.toLowerCase().includes(lowerQuery)) score += 5;
            
            // Search phone via linked profile
            const profile = customers.find(c => c.userId === u.id);
            if (profile && profile.phone.includes(lowerQuery)) score += 8;

            if (score > 0) {
                searchResults.push({
                    id: u.id,
                    type: 'customer',
                    title: u.name,
                    subtitle: u.email,
                    status: u.status,
                    score,
                    data: u
                });
            }
        });

        // --- 2. Search Orders ---
        orders.forEach(o => {
            let score = 0;
            const customerName = users.find(u => u.id === o.userId)?.name.toLowerCase() || '';
            
            if (o.id.toLowerCase().includes(lowerQuery)) score += 20; // Exact ID match high priority
            if (customerName.includes(lowerQuery)) score += 5; // Contextual match
            if (o.status.includes(lowerQuery)) score += 5; // "Pending" queries
            
            // Natural language: "Orders over 500"
            if (lowerQuery.includes('over') && lowerQuery.match(/\d+/)) {
                const amount = parseInt(lowerQuery.match(/\d+/)![0]);
                if (o.total > amount) score += 5;
            }

            // Natural language: "High value"
            if (lowerQuery.includes('high value') && o.total > 1000) score += 5;

            if (score > 0) {
                searchResults.push({
                    id: o.id,
                    type: 'order',
                    title: `Order #${o.id.slice(-6)}`,
                    subtitle: `${new Date(o.date).toLocaleDateString()} • ${customerName}`,
                    status: o.status,
                    value: `₹${o.total}`,
                    score,
                    data: o
                });
            }
        });

        // --- 3. Search Invoices (via Customer Profiles) ---
        customers.forEach(cust => {
            const user = users.find(u => u.id === cust.userId);
            if (!user) return;

            cust.billing.invoices.forEach(inv => {
                let score = 0;
                if (inv.id.toLowerCase().includes(lowerQuery)) score += 20;
                if (inv.status.includes(lowerQuery)) score += 5; // "Unpaid invoices"
                
                // Natural language check
                if (lowerQuery.includes('invoice') && (user.name.toLowerCase().includes(lowerQuery.replace('invoice','').trim()))) {
                    score += 5;
                }

                if (score > 0) {
                    searchResults.push({
                        id: inv.id,
                        type: 'invoice',
                        title: `Invoice #${inv.id}`,
                        subtitle: `Billed to ${user.name}`,
                        status: inv.status,
                        value: `₹${inv.amount}`,
                        score,
                        data: inv
                    });
                }
            });
        });

        // Sort by relevance
        setResults(searchResults.sort((a, b) => b.score - a.score).slice(0, 8));
        setIsOpen(true);

    }, [query, orders, users, customers]);

    const handleSelectResult = (result: SearchResult) => {
        if (result.type === 'customer') {
            onNavigate('customers');
            // In a real app, we'd trigger a selected user state via URL or context
        } else if (result.type === 'order') {
            onNavigate('orders');
        } else if (result.type === 'invoice') {
            onNavigate('orders'); // Or documents tab
        }
        setIsOpen(false);
        setQuery('');
    };

    const getIcon = (type: string) => {
        switch(type) {
            case 'customer': return <User size={18} className="text-blue-500"/>;
            case 'order': return <Package size={18} className="text-green-500"/>;
            case 'invoice': return <FileText size={18} className="text-purple-500"/>;
            default: return <Search size={18}/>;
        }
    };

    const getStatusColor = (status?: string) => {
        switch(status) {
            case 'active': case 'delivered': case 'paid': return 'bg-green-100 text-green-700';
            case 'pending': case 'processing': return 'bg-yellow-100 text-yellow-700';
            case 'cancelled': case 'overdue': case 'suspended': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div ref={wrapperRef} className="relative w-full max-w-2xl mx-auto mb-8 z-30">
            <div className={`relative flex items-center bg-white border transition-shadow duration-200 rounded-xl ${isOpen && results.length > 0 ? 'rounded-b-none shadow-lg border-brand-200' : 'shadow-sm border-gray-200'}`}>
                <div className="pl-4 text-gray-400">
                    <Search size={20} />
                </div>
                <input
                    type="text"
                    className="w-full py-3 px-4 outline-none text-gray-700 bg-transparent rounded-xl"
                    placeholder="Ask 'Pending orders', 'Jane Smith', or 'Invoice #123'..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => { if(query) setIsOpen(true); }}
                />
                {query && (
                    <button onClick={() => setQuery('')} className="pr-4 text-gray-400 hover:text-gray-600">
                        <X size={18} />
                    </button>
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-t-0 border-gray-200 rounded-b-xl shadow-lg max-h-[400px] overflow-y-auto">
                    <div className="py-2">
                        <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Top Matches</div>
                        {results.map((result) => (
                            <div 
                                key={`${result.type}-${result.id}`}
                                onClick={() => handleSelectResult(result)}
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-4 border-b border-gray-50 last:border-0 group"
                            >
                                <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-white transition-colors">
                                    {getIcon(result.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-medium text-gray-900 truncate flex items-center gap-2">
                                            {result.title}
                                            {result.status && (
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${getStatusColor(result.status)}`}>
                                                    {result.status}
                                                </span>
                                            )}
                                        </h4>
                                        {result.value && <span className="text-sm font-bold text-gray-700">{result.value}</span>}
                                    </div>
                                    <p className="text-sm text-gray-500 truncate">{result.subtitle}</p>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 text-gray-400">
                                    <ArrowRight size={16} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="px-4 py-2 bg-gray-50 text-xs text-center text-gray-500 border-t border-gray-100">
                        Press Enter to see all results
                    </div>
                </div>
            )}
            
            {isOpen && query && results.length === 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-xl shadow-lg p-8 text-center">
                    <div className="mx-auto h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-2 text-gray-400">
                        <Search size={24} />
                    </div>
                    <p className="text-gray-900 font-medium">No results found</p>
                    <p className="text-gray-500 text-sm">Try searching for a name, ID, or status.</p>
                </div>
            )}
        </div>
    );
};
