

import React, { useState, useEffect, useRef } from 'react';
import { evaluateAdminQuery, AgentAction } from '../../services/gemini'; // Updated import
import { SalesService, IdentityService, CatalogService } from '../../services/storeService';
import { Bot, X, Send, Command, Sparkles, ChevronRight, Zap } from 'lucide-react';

interface AdminAgentWidgetProps {
    onNavigate: (tabId: string) => void;
}

interface Message {
    id: string;
    sender: 'user' | 'agent';
    text: string;
    type?: 'info' | 'success' | 'error';
}

export const AdminAgentWidget: React.FC<AdminAgentWidgetProps> = ({ onNavigate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', sender: 'agent', text: 'System Online. awaiting command.' }
    ]);
    const [isProcessing, setIsProcessing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsProcessing(true);

        try {
            // 1. Evaluate Intent
            const contextStr = "Current Time: " + new Date().toLocaleString();
            const action = await evaluateAdminQuery(userMsg.text, contextStr);

            // 2. Execute Logic based on Intent
            let responseText = action.message;

            if (action.intent === 'NAVIGATION' && action.target) {
                onNavigate(action.target);
                responseText = `Navigating to ${action.target.toUpperCase()} module...`;
            } 
            else if (action.intent === 'ANALYSIS' && action.dataRequired) {
                // Perform quick analysis locally based on request
                if (action.dataRequired.includes('revenue') || userMsg.text.toLowerCase().includes('sales')) {
                    const orders = await SalesService.getOrders();
                    const today = new Date().toISOString().split('T')[0];
                    const dailyTotal = orders
                        .filter(o => o.date.startsWith(today))
                        .reduce((sum, o) => sum + o.total, 0);
                    responseText = `Today's revenue is ₹${dailyTotal.toLocaleString()} from ${orders.filter(o => o.date.startsWith(today)).length} orders.`;
                }
                else if (userMsg.text.toLowerCase().includes('user') || userMsg.text.toLowerCase().includes('customer')) {
                    const users = await IdentityService.getUsers();
                    responseText = `Total registered users: ${users.length}. (${users.filter(u => u.role === 'customer').length} customers)`;
                }
            }

            setMessages(prev => [...prev, { 
                id: Date.now().toString(), 
                sender: 'agent', 
                text: responseText,
                type: action.intent === 'NAVIGATION' ? 'success' : 'info'
            }]);

        } catch (error) {
            setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'agent', text: 'Error executing command.', type: 'error' }]);
        } finally {
            setIsProcessing(false);
        }
    };

    const suggestions = [
        "Take me to Finance",
        "How are sales today?",
        "Show inventory",
        "Check user count"
    ];

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform border border-gray-700 group"
                title="Admin Agent"
            >
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse border border-gray-900"></div>
                <Bot size={24} className="group-hover:rotate-12 transition-transform" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 w-96 bg-gray-900 rounded-xl shadow-2xl border border-gray-700 flex flex-col overflow-hidden animate-scale-in" style={{ height: '500px' }}>
            {/* Header */}
            <div className="bg-gray-950 p-4 border-b border-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-gray-800 p-2 rounded-lg">
                        <Bot size={20} className="text-brand-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm">System Agent</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online
                        </p>
                    </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Terminal Output */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm bg-gray-900/50">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-lg p-3 ${
                            msg.sender === 'user' 
                            ? 'bg-brand-600 text-white' 
                            : 'bg-gray-800 text-gray-300 border border-gray-700'
                        }`}>
                            {msg.sender === 'agent' && <div className="flex items-center gap-2 mb-1 text-[10px] text-gray-500 uppercase tracking-wider"><Command size={10}/> System Response</div>}
                            <p>{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isProcessing && (
                    <div className="flex justify-start">
                        <div className="bg-gray-800 text-gray-400 p-3 rounded-lg border border-gray-700 flex items-center gap-2">
                            <Sparkles size={14} className="animate-spin" /> Processing...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length < 3 && (
                <div className="px-4 py-2 overflow-x-auto whitespace-nowrap scrollbar-hide flex gap-2 border-t border-gray-800 bg-gray-900">
                    {suggestions.map((s, i) => (
                        <button 
                            key={i} 
                            onClick={() => { setInput(s); }}
                            className="text-xs bg-gray-800 text-brand-300 px-3 py-1.5 rounded-full border border-gray-700 hover:bg-gray-700 transition-colors flex items-center gap-1"
                        >
                            <Zap size={10} /> {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 bg-gray-950 border-t border-gray-800 flex gap-2">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Execute command..." 
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-500 transition-colors font-mono"
                    autoFocus
                />
                <button 
                    type="submit" 
                    disabled={!input.trim() || isProcessing}
                    className="bg-brand-600 hover:bg-brand-500 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronRight size={20} />
                </button>
            </form>
        </div>
    );
};