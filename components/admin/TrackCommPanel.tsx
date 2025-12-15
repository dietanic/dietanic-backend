
import React, { useState, useEffect, useRef } from 'react';
import { EngagementService, chatEvents } from '../../services/storeService';
import { ChatSession, ChatMessage, Visitor } from '../../types';
import { MessageSquare, Users, Send, Ticket, Clock, Smile, AlertCircle, User as UserIcon, Monitor, ArrowUpDown, Zap, Activity, Bell, Smartphone } from 'lucide-react';

export const TrackCommPanel: React.FC = () => {
  const [subTab, setSubTab] = useState<'inbox' | 'visitors' | 'analytics'>('inbox');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [chatInput, setChatInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    
    const handleUpdate = async () => {
        const s = await EngagementService.getSessions();
        setSessions(s);
        if (activeSessionId) {
            const m = await EngagementService.getMessages(activeSessionId);
            setMessages(m);
            EngagementService.markSessionRead(activeSessionId);
        }
    };
    chatEvents.addEventListener('update', handleUpdate);
    return () => {
        clearInterval(interval);
        chatEvents.removeEventListener('update', handleUpdate);
    };
  }, [activeSessionId]);

  useEffect(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const refresh = async () => {
      const [s, v] = await Promise.all([EngagementService.getSessions(), EngagementService.getMockVisitors()]);
      setSessions(s);
      setVisitors(v);
  };

  const handleSelectSession = async (id: string) => {
      setActiveSessionId(id);
      const m = await EngagementService.getMessages(id);
      setMessages(m);
      EngagementService.markSessionRead(id);
  };

  const handleSend = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!chatInput.trim() || !activeSessionId) return;
      await EngagementService.sendMessage(activeSessionId, chatInput, 'agent');
      setChatInput('');
  };

  const handlePush = (v: Visitor) => {
      alert(`Push Notification sent to ${v.name}: "Hey! Check out our new salad bowls 🥗"`);
  };

  const handleSMS = (v: Visitor) => {
      alert(`SMS sent to ${v.name}: "Your cart misses you! Complete order for 10% off."`);
  };

  // KPIs
  const totalTickets = sessions.length;
  const overdueTickets = sessions.filter(s => s.status === 'active' && (Date.now() - new Date(s.lastActive).getTime() > 86400000)).length;

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col bg-white shadow rounded-lg overflow-hidden animate-fade-in">
        <div className="border-b border-gray-200 p-4 bg-gray-50 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <MessageSquare className="text-brand-600" />
                <h2 className="text-lg font-bold text-gray-800">TrackComm Support</h2>
            </div>
            <div className="flex bg-white rounded-md shadow-sm border border-gray-200">
                {['inbox', 'visitors', 'analytics'].map(tab => (
                    <button key={tab} onClick={() => setSubTab(tab as any)} className={`px-4 py-1.5 text-sm font-medium capitalize first:rounded-l last:rounded-r ${subTab === tab ? 'bg-brand-50 text-brand-700' : 'hover:bg-gray-50'}`}>
                        {tab}
                    </button>
                ))}
            </div>
        </div>

        {subTab === 'inbox' && (
            <div className="flex-1 flex overflow-hidden">
                <div className="w-80 border-r border-gray-200 overflow-y-auto bg-gray-50">
                    {sessions.map(s => (
                        <div key={s.id} onClick={() => handleSelectSession(s.id)} className={`p-4 border-b cursor-pointer hover:bg-white ${activeSessionId === s.id ? 'bg-white border-l-4 border-l-brand-600' : ''}`}>
                            <div className="flex justify-between mb-1"><span className="font-semibold text-sm">{s.userName}</span><span className="text-xs text-gray-400">{new Date(s.lastActive).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></div>
                            <p className="text-xs text-gray-500 truncate">{s.lastMessage}</p>
                            {s.unreadCount > 0 && <span className="bg-red-100 text-red-800 text-xs px-2 rounded mt-1 inline-block">{s.unreadCount} new</span>}
                        </div>
                    ))}
                    {sessions.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">No active chats.</div>}
                </div>
                <div className="flex-1 flex flex-col bg-white">
                    {activeSessionId ? (
                        <>
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                                {messages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm shadow-sm ${msg.sender === 'agent' ? 'bg-brand-600 text-white rounded-br-none' : 'bg-white border border-gray-200'}`}>
                                            <p>{msg.text}</p>
                                            <p className={`text-[10px] mt-1 text-right ${msg.sender === 'agent' ? 'text-brand-200' : 'text-gray-400'}`}>{new Date(msg.timestamp).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={scrollRef} />
                            </div>
                            <form onSubmit={handleSend} className="p-4 border-t"><div className="relative"><input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type reply..." className="w-full border rounded-full pl-4 pr-12 py-3 outline-none focus:ring-2 focus:ring-brand-500"/><button type="submit" className="absolute right-2 top-1.5 p-1.5 bg-brand-600 text-white rounded-full"><Send size={18}/></button></div></form>
                        </>
                    ) : <div className="flex-1 flex items-center justify-center text-gray-400">Select a conversation</div>}
                </div>
            </div>
        )}

        {subTab === 'visitors' && (
            <div className="flex-1 p-6 overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <Activity className="text-green-500 animate-pulse" size={20}/> Live Visitors
                    </h3>
                    <span className="text-sm text-gray-500">{visitors.length} active now</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visitor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Connect</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {visitors.map(v => (
                                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                                    {v.device === 'Mobile' ? <Smartphone size={18}/> : <Monitor size={18}/>}
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{v.name}</div>
                                                <div className="text-xs text-gray-500">{v.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            v.currentPage === '/cart' 
                                            ? 'bg-orange-100 text-orange-800' 
                                            : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {v.currentPage}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {v.timeOnSite}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className={`flex items-center gap-1 ${
                                            v.status === 'chatting' ? 'text-blue-600' : 
                                            v.status === 'browsing' ? 'text-green-600' : 'text-gray-400'
                                        }`}>
                                            <span className={`h-2 w-2 rounded-full ${
                                                v.status === 'chatting' ? 'bg-blue-600' : 
                                                v.status === 'browsing' ? 'bg-green-600 animate-pulse' : 'bg-gray-400'
                                            }`}></span>
                                            {v.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => handlePush(v)} 
                                                className="text-gray-400 hover:text-brand-600 p-2 hover:bg-brand-50 rounded-full transition-colors" 
                                                title="Send Push Notification"
                                            >
                                                <Bell size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleSMS(v)} 
                                                className="text-gray-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-full transition-colors" 
                                                title="Send SMS"
                                            >
                                                <Smartphone size={18} />
                                            </button>
                                            <button 
                                                onClick={async () => {
                                                    const s = await EngagementService.createOrGetSession(v.id, v.name);
                                                    setActiveSessionId(s.id); 
                                                    setSubTab('inbox');
                                                }} 
                                                className={`p-2 rounded-full transition-colors ${
                                                    v.status === 'chatting' 
                                                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                                                    : 'bg-brand-100 text-brand-600 hover:bg-brand-200'
                                                }`} 
                                                title="Start Live Chat"
                                            >
                                                <MessageSquare size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {subTab === 'analytics' && (
            <div className="flex-1 p-8 overflow-y-auto bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm border flex flex-col items-center text-center"><div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-3"><Ticket size={24} /></div><span className="text-3xl font-bold">{totalTickets}</span><span className="text-sm text-gray-500">Total Tickets</span></div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border flex flex-col items-center text-center"><div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-3"><AlertCircle size={24} /></div><span className="text-3xl font-bold">{overdueTickets}</span><span className="text-sm text-gray-500">Overdue</span></div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border flex flex-col items-center text-center"><div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mb-3"><Clock size={24} /></div><span className="text-3xl font-bold">2h 45m</span><span className="text-sm text-gray-500">Avg. Resolution</span></div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border flex flex-col items-center text-center"><div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-3"><Smile size={24} /></div><span className="text-3xl font-bold">4.8</span><span className="text-sm text-gray-500">Happiness</span></div>
                </div>
            </div>
        )}
    </div>
  );
};
