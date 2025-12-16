
import React, { useState, useEffect, useRef } from 'react';
import { EngagementService, chatEvents, CatalogService } from '../../services/storeService';
import { ChatSession, ChatMessage, Visitor, Order, Product } from '../../types';
import { 
    MessageSquare, Users, Send, Ticket, Clock, Smile, AlertCircle, 
    User as UserIcon, Monitor, ArrowUpDown, Zap, Activity, Bell, Smartphone,
    ShoppingBag, MapPin, Search, Package, TrendingUp, CheckCircle,
    BarChart2, BookOpen, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { KnowledgeBase } from './KnowledgeBase';

export const TrackCommPanel: React.FC = () => {
  // Main Tabs: Inbox | Insights | Knowledge Base
  const [mainTab, setMainTab] = useState<'inbox' | 'insights' | 'knowledge'>('inbox');
  
  // Inbox State
  const [subTab, setSubTab] = useState<'active' | 'visitors'>('active');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  // Neural Context State
  const [customerContext, setCustomerContext] = useState<any>(null);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const [intentTag, setIntentTag] = useState<string>('General');
  
  // Insights State
  const [insights, setInsights] = useState<{
      totalSessions: number,
      aiResolved: number,
      humanEscalated: number,
      topTopics: {topic: string, count: number}[],
      unanswered: number
  } | null>(null);

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
            analyzeChatIntent(m);
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

  useEffect(() => {
      // Calculate insights whenever sessions change
      if (sessions.length > 0) {
          const aiResolved = sessions.filter(s => s.status === 'closed' && s.isAiHandled).length; // Mock field
          const humanEscalated = sessions.length - aiResolved;
          
          setInsights({
              totalSessions: sessions.length,
              aiResolved: Math.round(sessions.length * 0.65), // Mock data for demo visualization
              humanEscalated: Math.round(sessions.length * 0.35),
              topTopics: [
                  { topic: 'Refund Status', count: 42 },
                  { topic: 'Delivery Area', count: 35 },
                  { topic: 'Subscription Pause', count: 18 },
                  { topic: 'Ingredients/Allergy', count: 12 },
              ],
              unanswered: sessions.filter(s => s.status === 'active' && s.unreadCount > 0).length
          });
      }
  }, [sessions]);

  const refresh = async () => {
      const [s, v] = await Promise.all([EngagementService.getSessions(), EngagementService.getMockVisitors()]);
      setSessions(s);
      setVisitors(v);
  };

  const handleSelectSession = async (session: ChatSession) => {
      setActiveSessionId(session.id);
      const m = await EngagementService.getMessages(session.id);
      setMessages(m);
      EngagementService.markSessionRead(session.id);
      analyzeChatIntent(m);

      if (session.userId) {
          const ctx = await EngagementService.getCustomerContext(session.userId);
          setCustomerContext(ctx);
      }
  };

  const analyzeChatIntent = async (msgs: ChatMessage[]) => {
      const fullText = msgs.map(m => m.text.toLowerCase()).join(' ');
      let tag = 'General';
      let searchKeyword = '';

      if (fullText.includes('order') || fullText.includes('late') || fullText.includes('track')) tag = 'Logistics';
      else if (fullText.includes('return') || fullText.includes('refund')) tag = 'Returns';
      else if (fullText.includes('price') || fullText.includes('cost')) tag = 'Billing';
      else if (fullText.includes('salad') || fullText.includes('bowl') || fullText.includes('ingredients')) {
          tag = 'Product Inquiry';
          if (fullText.includes('green')) searchKeyword = 'Green';
          if (fullText.includes('quinoa')) searchKeyword = 'Quinoa';
      }

      setIntentTag(tag);

      if (searchKeyword) {
          const allProducts = await CatalogService.getProducts();
          setSuggestedProducts(allProducts.filter(p => p.name.includes(searchKeyword)));
      } else {
          setSuggestedProducts([]);
      }
  };

  const handleSend = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!chatInput.trim() || !activeSessionId) return;
      await EngagementService.sendMessage(activeSessionId, chatInput, 'agent');
      setChatInput('');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-xl overflow-hidden border border-gray-200 shadow-xl" style={{height: 'calc(100vh - 140px)'}}>
        {/* Main Header with Tabs */}
        <div className="bg-gray-900 text-white px-4 py-3 flex justify-between items-center shadow-md z-20">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <Activity className="text-brand-400" size={20} />
                    <h2 className="font-bold tracking-wide">Support Center</h2>
                </div>
                <div className="flex bg-gray-800 rounded-lg p-1">
                    <button 
                        onClick={() => setMainTab('inbox')}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${mainTab === 'inbox' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        <MessageSquare size={14}/> Inbox
                    </button>
                    <button 
                        onClick={() => setMainTab('insights')}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${mainTab === 'insights' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        <BarChart2 size={14}/> Insights
                    </button>
                    <button 
                        onClick={() => setMainTab('knowledge')}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${mainTab === 'knowledge' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        <BookOpen size={14}/> Knowledge Base
                    </button>
                </div>
            </div>
            
            <div className="flex gap-4 text-xs font-mono">
                <span className="flex items-center gap-1 text-gray-300"><Users size={14}/> Active: {visitors.length}</span>
                <span className="flex items-center gap-1 text-yellow-400"><Zap size={14}/> Response: 1m</span>
            </div>
        </div>

        {/* --- MAIN TAB CONTENT --- */}
        
        {mainTab === 'knowledge' && (
            <div className="flex-1 overflow-y-auto p-6">
                <KnowledgeBase />
            </div>
        )}

        {mainTab === 'insights' && insights && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <p className="text-gray-500 text-xs font-bold uppercase">AI Resolution Rate</p>
                        <h3 className="text-3xl font-bold text-brand-600 mt-2">{Math.round((insights.aiResolved / insights.totalSessions) * 100)}%</h3>
                        <p className="text-xs text-gray-400 mt-1">{insights.aiResolved} sessions auto-handled</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <p className="text-gray-500 text-xs font-bold uppercase">Missed / Unanswered</p>
                        <h3 className="text-3xl font-bold text-red-500 mt-2">{insights.unanswered}</h3>
                        <p className="text-xs text-gray-400 mt-1">Requires immediate attention</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <p className="text-gray-500 text-xs font-bold uppercase">Human Escalations</p>
                        <h3 className="text-3xl font-bold text-blue-600 mt-2">{insights.humanEscalated}</h3>
                        <p className="text-xs text-gray-400 mt-1">Complex queries</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="font-bold text-gray-800 mb-4">Top Customer Questions</h3>
                        <div className="space-y-4">
                            {insights.topTopics.map((topic, idx) => (
                                <div key={idx}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-gray-700">{topic.topic}</span>
                                        <span className="text-gray-500">{topic.count} queries</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div className="bg-brand-500 h-2 rounded-full" style={{width: `${(topic.count / 50) * 100}%`}}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="font-bold text-gray-800 mb-4">Knowledge Base Gaps</h3>
                        <p className="text-sm text-gray-500 mb-4">Queries where AI was unsure. Create articles for these topics:</p>
                        <div className="space-y-2">
                            {['Corporate Catering Pricing', 'Gluten Free Certification', 'Holiday Schedule'].map((gap, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-red-50 border border-red-100 rounded-md">
                                    <span className="text-sm text-red-800 font-medium">{gap}</span>
                                    <button onClick={() => setMainTab('knowledge')} className="text-xs bg-white border border-red-200 text-red-600 px-2 py-1 rounded hover:bg-red-50">Create Article</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {mainTab === 'inbox' && (
            <div className="flex-1 flex overflow-hidden">
                {/* INBOX SIDEBAR */}
                <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                    <div className="p-2 border-b border-gray-100 flex gap-1">
                        <button onClick={() => setSubTab('active')} className={`flex-1 py-2 text-xs font-bold uppercase rounded ${subTab === 'active' ? 'bg-gray-100 text-gray-900' : 'text-gray-400'}`}>Active</button>
                        <button onClick={() => setSubTab('visitors')} className={`flex-1 py-2 text-xs font-bold uppercase rounded ${subTab === 'visitors' ? 'bg-gray-100 text-gray-900' : 'text-gray-400'}`}>Visitors</button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                        {subTab === 'active' && sessions.map(s => (
                            <div key={s.id} onClick={() => handleSelectSession(s)} className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors relative ${activeSessionId === s.id ? 'bg-blue-50 border-l-4 border-l-brand-600' : ''}`}>
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold text-gray-900 text-sm">{s.userName}</span>
                                    <span className="text-[10px] text-gray-400">{new Date(s.lastActive).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                </div>
                                <p className="text-xs text-gray-500 truncate mb-2">{s.lastMessage}</p>
                                <div className="flex gap-2">
                                    {s.unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{s.unreadCount}</span>}
                                    <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded border border-gray-200 uppercase">{s.status}</span>
                                </div>
                            </div>
                        ))}
                        {subTab === 'visitors' && visitors.map(v => (
                            <div key={v.id} className="p-4 border-b hover:bg-gray-50">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-gray-700 text-sm">{v.name}</span>
                                    <span className={`h-2 w-2 rounded-full ${v.status === 'browsing' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                                </div>
                                <div className="text-xs text-gray-500">On: {v.currentPage}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CHAT AREA */}
                <div className="flex-1 flex flex-col bg-gray-50 relative">
                    {activeSessionId ? (
                        <>
                            <div className="bg-white p-3 border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Context</span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-blue-100 text-blue-700">{intentTag}</span>
                                    </div>
                                </div>
                                <button onClick={() => EngagementService.closeSession(activeSessionId!)} className="text-xs border border-gray-300 px-3 py-1.5 rounded hover:bg-red-50 hover:text-red-600">End Chat</button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {messages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm shadow-sm ${msg.sender === 'agent' ? 'bg-gray-900 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                                            <p>{msg.text}</p>
                                            <p className={`text-[10px] mt-1 text-right ${msg.sender === 'agent' ? 'text-gray-400' : 'text-gray-400'}`}>{new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={scrollRef} />
                            </div>

                            <div className="p-4 bg-white border-t border-gray-200">
                                <form onSubmit={handleSend} className="relative">
                                    <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a reply..." className="w-full border border-gray-300 rounded-lg pl-4 pr-12 py-3 outline-none focus:ring-2 focus:ring-brand-500 shadow-sm" autoFocus />
                                    <button type="submit" className="absolute right-2 top-2 p-1.5 bg-brand-600 text-white rounded-md hover:bg-brand-700"><Send size={18}/></button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <MessageSquare size={48} className="mb-4 opacity-20" />
                            <p>Select a conversation to engage</p>
                        </div>
                    )}
                </div>

                {/* CONTEXT SIDEBAR */}
                <div className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
                    {activeSessionId && customerContext ? (
                        <div className="p-4 space-y-6">
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="h-10 w-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold">
                                        {customerContext.metrics.ltvGrade === 'High Value' ? 'HV' : 'STD'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm">{sessions.find(s=>s.id===activeSessionId)?.userName}</h3>
                                        <p className="text-xs text-gray-500">{customerContext.metrics.orderCount} Orders • Lifetime ₹{customerContext.metrics.totalSpend}</p>
                                    </div>
                                </div>
                            </div>
                            {customerContext.lastOrder && (
                                <div>
                                    <h4 className="text-xs font-bold text-gray-900 uppercase mb-2 flex items-center gap-2"><Package size={12}/> Recent Order</h4>
                                    <div className="border border-gray-200 rounded-lg p-3">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold">#{customerContext.lastOrder.id.slice(-6)}</span>
                                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded uppercase font-bold">{customerContext.lastOrder.status}</span>
                                        </div>
                                        <p className="text-xs text-gray-500">{new Date(customerContext.lastOrder.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-400 text-sm">
                            <Activity size={32} className="mx-auto mb-2 opacity-20"/>
                            <p>Customer Context</p>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};
