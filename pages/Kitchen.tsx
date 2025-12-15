
import React, { useState, useEffect } from 'react';
import { POSService, posEvents } from '../services/storeService';
import { KitchenTicket } from '../types';
import { Clock, CheckCircle, Flame, Check, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Kitchen: React.FC = () => {
    const [tickets, setTickets] = useState<KitchenTicket[]>([]);

    useEffect(() => {
        loadTickets();
        const handleUpdate = () => loadTickets();
        posEvents.addEventListener('kitchen_updated', handleUpdate);
        return () => posEvents.removeEventListener('kitchen_updated', handleUpdate);
    }, []);

    const loadTickets = async () => {
        const t = await POSService.getTickets();
        // Filter out served tickets to keep display clean, or show them in a separate history tab
        // For now, show active tickets (pending, cooking, ready)
        setTickets(t.filter(ticket => ticket.status !== 'served').sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
    };

    const updateStatus = async (ticketId: string, status: KitchenTicket['status']) => {
        await POSService.updateTicketStatus(ticketId, status);
    };

    const getElapsedTime = (timestamp: string) => {
        const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
        return `${diff} min`;
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <ChefHatIcon className="text-brand-500 h-8 w-8" />
                    <h1 className="text-2xl font-bold tracking-wider">KITCHEN DISPLAY SYSTEM</h1>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></span> Live Sync
                    </div>
                    <Link to="/admin" className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700 text-sm font-bold">Exit</Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {tickets.map(ticket => {
                    const isLongWait = (Date.now() - new Date(ticket.timestamp).getTime()) > 1000 * 60 * 15; // 15 mins

                    return (
                        <div key={ticket.id} className={`bg-gray-800 rounded-lg overflow-hidden border-2 flex flex-col ${
                            ticket.status === 'ready' ? 'border-green-500' : 
                            isLongWait ? 'border-red-500' : 'border-gray-700'
                        }`}>
                            {/* Ticket Header */}
                            <div className={`p-3 flex justify-between items-center ${
                                ticket.status === 'ready' ? 'bg-green-900/50' : 
                                isLongWait ? 'bg-red-900/50' : 'bg-gray-700'
                            }`}>
                                <div>
                                    <h2 className="font-bold text-lg">{ticket.tableName}</h2>
                                    <span className="text-xs text-gray-400 font-mono">#{ticket.id.slice(-4)}</span>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1 font-bold font-mono">
                                        <Clock size={14}/> {getElapsedTime(ticket.timestamp)}
                                    </div>
                                    <span className={`text-[10px] uppercase font-bold px-1 rounded ${
                                        ticket.status === 'pending' ? 'bg-yellow-600 text-white' :
                                        ticket.status === 'cooking' ? 'bg-orange-600 text-white' :
                                        'bg-green-600 text-white'
                                    }`}>{ticket.status}</span>
                                </div>
                            </div>

                            {/* Ticket Body */}
                            <div className="p-4 flex-1">
                                {ticket.notes && (
                                    <div className="mb-3 bg-yellow-900/30 text-yellow-200 p-2 rounded text-sm border border-yellow-700/50 flex gap-2 items-start">
                                        <AlertTriangle size={14} className="mt-0.5 flex-shrink-0"/> 
                                        <span>{ticket.notes}</span>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {['Starter', 'Main', 'Dessert', 'Beverage'].map(course => {
                                        const items = ticket.items.filter(i => i.course === course);
                                        if (items.length === 0) return null;
                                        return (
                                            <div key={course}>
                                                <h3 className="text-xs text-gray-500 uppercase font-bold border-b border-gray-700 mb-1">{course}</h3>
                                                {items.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-start py-1">
                                                        <span className="font-bold text-lg">{item.quantity}x</span>
                                                        <span className="flex-1 ml-2 text-md">{item.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="p-3 bg-gray-900/50 border-t border-gray-700 grid grid-cols-2 gap-2">
                                {ticket.status === 'pending' && (
                                    <button onClick={() => updateStatus(ticket.id, 'cooking')} className="col-span-2 bg-orange-600 hover:bg-orange-500 text-white py-3 rounded font-bold flex items-center justify-center gap-2">
                                        <Flame size={18}/> Start Cooking
                                    </button>
                                )}
                                {ticket.status === 'cooking' && (
                                    <button onClick={() => updateStatus(ticket.id, 'ready')} className="col-span-2 bg-green-600 hover:bg-green-500 text-white py-3 rounded font-bold flex items-center justify-center gap-2">
                                        <CheckCircle size={18}/> Mark Ready
                                    </button>
                                )}
                                {ticket.status === 'ready' && (
                                    <button onClick={() => updateStatus(ticket.id, 'served')} className="col-span-2 bg-gray-600 hover:bg-gray-500 text-white py-3 rounded font-bold flex items-center justify-center gap-2">
                                        <Check size={18}/> Served
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
                {tickets.length === 0 && (
                    <div className="col-span-full py-20 text-center text-gray-600">
                        <ChefHatIcon size={64} className="mx-auto mb-4 opacity-20" />
                        <h2 className="text-xl font-medium">All caught up! No active orders.</h2>
                    </div>
                )}
            </div>
        </div>
    );
};

const ChefHatIcon = ({ className, size }: { className?: string, size?: number }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size || 24} 
        height={size || 24} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
        <line x1="6" x2="18" y1="17" y2="17" />
    </svg>
);
