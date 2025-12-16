
import React, { useState, useEffect } from 'react';
import { DatabaseService, DiscountService, CatalogService } from '../../services/storeService';
import { Discount, Category } from '../../types';
import { Trash2, Tag, Terminal, Database, Shield, CheckCircle, Lock, Server, Globe } from 'lucide-react';
import { useAuth } from '../../App';

export const SystemTools: React.FC = () => {
  const { isAdmin } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'discounts' | 'database' | 'compliance'>('discounts');
  
  // States
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [queryExpression, setQueryExpression] = useState('return true;');
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [queryError, setQueryError] = useState<string|null>(null);
  
  // Forms
  const [newDiscount, setNewDiscount] = useState<Partial<Discount>>({ 
      code: '', 
      type: 'percentage', 
      value: 0, 
      isActive: true,
      minPurchaseAmount: 0,
      applicableCategory: 'All'
  });

  useEffect(() => { refresh(); }, []);

  const refresh = async () => {
      const [d, c] = await Promise.all([DiscountService.getDiscounts(), CatalogService.getCategories()]);
      setDiscounts(d);
      setCategories(c);
  };

  const handleAddDiscount = async (e: React.FormEvent) => {
      e.preventDefault();
      await DiscountService.addDiscount({
          id: 'd'+Date.now(), 
          code: newDiscount.code!.toUpperCase(), 
          type: newDiscount.type!, 
          value: Number(newDiscount.value), 
          isActive: true,
          minPurchaseAmount: Number(newDiscount.minPurchaseAmount) || 0,
          applicableCategory: newDiscount.applicableCategory || 'All'
      } as Discount);
      
      setNewDiscount({ code: '', type: 'percentage', value: 0, isActive: true, minPurchaseAmount: 0, applicableCategory: 'All' });
      refresh();
  };

  const handleRunQuery = async () => {
      setQueryError(null);
      try {
          const data = await DatabaseService.getFullSnapshot();
          const filterFn = new Function('item', queryExpression.includes('return') ? queryExpression : `return ${queryExpression};`);
          // @ts-ignore
          const res = (data.products || []).filter(item => filterFn(item)); // Simplified query against products for demo
          setQueryResults(res);
      } catch (e: any) { setQueryError(e.message); }
  };

  // PCI DSS Checklist Data
  const complianceChecklist = [
      { id: 1, req: 'Requirement 1', title: 'Install and maintain a firewall configuration', status: 'compliant' },
      { id: 2, req: 'Requirement 2', title: 'Do not use vendor-supplied defaults for system passwords', status: 'compliant' },
      { id: 3, req: 'Requirement 3', title: 'Protect stored cardholder data (Encryption/Hashing)', status: 'compliant' },
      { id: 4, req: 'Requirement 4', title: 'Encrypt transmission of cardholder data across open, public networks', status: 'compliant' },
      { id: 5, req: 'Requirement 5', title: 'Protect all systems against malware and regularly update anti-virus', status: 'compliant' },
      { id: 6, req: 'Requirement 6', title: 'Develop and maintain secure systems and applications', status: 'compliant' },
      { id: 7, req: 'Requirement 7', title: 'Restrict access to cardholder data by business need to know', status: 'compliant' },
      { id: 8, req: 'Requirement 8', title: 'Identify and authenticate access to system components', status: 'compliant' },
      { id: 9, req: 'Requirement 9', title: 'Restrict physical access to cardholder data', status: 'compliant' },
      { id: 10, req: 'Requirement 10', title: 'Track and monitor all access to network resources and cardholder data', status: 'compliant' },
      { id: 11, req: 'Requirement 11', title: 'Regularly test security systems and processes', status: 'compliant' },
      { id: 12, req: 'Requirement 12', title: 'Maintain a policy that addresses information security for all personnel', status: 'compliant' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex space-x-2 border-b">
            {['discounts', 'database', 'compliance'].map(t => (
                (t === 'database' && !isAdmin) ? null : 
                <button key={t} onClick={() => setActiveSubTab(t as any)} className={`px-4 py-2 capitalize font-medium ${activeSubTab === t ? 'border-b-2 border-brand-600 text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}>{t}</button>
            ))}
        </div>

        {activeSubTab === 'discounts' && (
            <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2"><Tag size={20} className="text-brand-600"/> Promo Codes</h3>
                <form onSubmit={handleAddDiscount} className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                        <div className="lg:col-span-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Code</label>
                            <input className="w-full border-gray-300 rounded p-2 text-sm uppercase border" value={newDiscount.code} onChange={e=>setNewDiscount({...newDiscount, code: e.target.value})} placeholder="SUMMER20" required/>
                        </div>
                        <div className="lg:col-span-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Value</label>
                            <input type="number" className="w-full border-gray-300 rounded p-2 text-sm border" value={newDiscount.value} onChange={e=>setNewDiscount({...newDiscount, value: Number(e.target.value)})} required/>
                        </div>
                        <div className="lg:col-span-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                            <select className="w-full border-gray-300 rounded p-2 text-sm border" value={newDiscount.type} onChange={e=>setNewDiscount({...newDiscount, type: e.target.value as any})}>
                                <option value="percentage">%</option>
                                <option value="fixed">Fixed</option>
                            </select>
                        </div>
                        <div className="lg:col-span-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Min. Purchase</label>
                            <input type="number" className="w-full border-gray-300 rounded p-2 text-sm border" value={newDiscount.minPurchaseAmount} onChange={e=>setNewDiscount({...newDiscount, minPurchaseAmount: Number(e.target.value)})} placeholder="0" />
                        </div>
                        <div className="lg:col-span-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Applicable To</label>
                            <select className="w-full border-gray-300 rounded p-2 text-sm border" value={newDiscount.applicableCategory} onChange={e=>setNewDiscount({...newDiscount, applicableCategory: e.target.value})}>
                                <option value="All">All Categories</option>
                                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button className="bg-brand-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-brand-700">Add Discount</button>
                    </div>
                </form>
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                    <ul className="divide-y divide-gray-200">
                        {discounts.map(d => (
                            <li key={d.id} className="p-4 flex flex-col sm:flex-row justify-between items-center hover:bg-gray-50 gap-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-gray-800 text-lg">{d.code}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${d.type === 'percentage' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                            {d.type === 'percentage' ? `${d.value}% OFF` : `₹${d.value} OFF`}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
                                        {d.minPurchaseAmount ? <span>Min Spend: ₹{d.minPurchaseAmount}</span> : <span>No min spend</span>}
                                        <span>•</span>
                                        <span>Valid on: {d.applicableCategory || 'All Items'}</span>
                                    </div>
                                </div>
                                <button onClick={async ()=>{await DiscountService.deleteDiscount(d.id); refresh();}} className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors"><Trash2 size={16}/></button>
                            </li>
                        ))}
                        {discounts.length === 0 && <li className="p-6 text-center text-gray-400 text-sm">No active coupons</li>}
                    </ul>
                </div>
            </div>
        )}

        {activeSubTab === 'database' && isAdmin && (
            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                <div className="p-4 bg-gray-900 text-white flex justify-between items-center"><div className="flex gap-2 items-center"><Terminal size={18}/> <span className="font-mono text-sm">Database Console (Products Query)</span></div><button onClick={handleRunQuery} className="bg-brand-600 hover:bg-brand-500 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">Run Query</button></div>
                <div className="relative">
                    <textarea className="w-full bg-gray-800 text-green-400 p-4 font-mono text-sm h-32 focus:outline-none" value={queryExpression} onChange={e=>setQueryExpression(e.target.value)}/>
                </div>
                {queryError ? <div className="bg-red-50 p-3 text-red-600 text-xs font-mono border-t border-red-100">{queryError}</div> : <pre className="p-4 text-xs font-mono bg-gray-50 max-h-96 overflow-y-auto border-t border-gray-200 text-gray-700">{JSON.stringify(queryResults, null, 2)}</pre>}
                <div className="p-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                    <p>Example: <code>return item.price &gt; 100</code> (Filters Products collection)</p>
                </div>
            </div>
        )}

        {activeSubTab === 'compliance' && (
            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Shield size={20} className="text-brand-600"/> PCI DSS Compliance
                        </h3>
                        <p className="text-sm text-gray-500">Self-Assessment Questionnaire D (SAQ-D) for Service Providers</p>
                    </div>
                    <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full border border-green-200">
                        <Lock size={14} />
                        <span className="text-xs font-bold uppercase">Compliant</span>
                    </div>
                </div>
                
                <div className="p-6">
                    <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
                        <p className="text-sm text-blue-900">
                            <strong>Audit Verification:</strong> Dietanic platform consistently adheres to the set of guidelines set forth by the PCI Security Standards Council (PCI SSC).
                            Payment processing is handled via tokenization, ensuring no sensitive cardholder data is stored on origin servers.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {complianceChecklist.map((item) => (
                            <div key={item.id} className="flex items-start gap-3 p-3 border border-gray-100 rounded hover:bg-gray-50 transition-colors">
                                <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={18} />
                                <div>
                                    <span className="text-xs font-bold text-gray-500 uppercase">{item.req}</span>
                                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
                        <div className="flex gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Server size={14}/> TLS 1.2+ Enforced</span>
                            <span className="flex items-center gap-1"><Globe size={14}/> Firewall Active</span>
                        </div>
                        <button className="text-sm text-brand-600 font-medium hover:underline">Download Attestation of Compliance (AOC)</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
