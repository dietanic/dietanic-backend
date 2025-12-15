import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Minus, User as UserIcon, Check } from 'lucide-react';
import { useAuth } from '../App';
import { EngagementService, chatEvents } from '../services/storeService';
import { ChatSession, ChatMessage } from '../types';

export const TrackCommWidget: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Session
  useEffect(() => {
    const initSession = async () => {
        if (isOpen && !session) {
            const newSession = await EngagementService.createOrGetSession(user.id, user.name);
            setSession(newSession);
            const msgs = await EngagementService.getMessages(newSession.id);
            setMessages(msgs);
        }
    };
    initSession();
  }, [isOpen, user, session]);

  // Listen for updates from Admin side
  useEffect(() => {
      const handleUpdate = async () => {
          if (session) {
              const msgs = await EngagementService.getMessages(session.id);
              setMessages(msgs);
          }
      };

      chatEvents.addEventListener('update', handleUpdate);
      return () => chatEvents.removeEventListener('update', handleUpdate);
  }, [session]);

  // Auto-scroll to bottom
  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputValue.trim() || !session) return;
      
      await EngagementService.sendMessage(session.id, inputValue, 'user');
      setInputValue('');
  };

  if (user.role === 'admin' || user.role === 'editor') return null; // Don't show widget to admins

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Chat Window */}
        {isOpen && (
            <div className="mb-4 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-fade-in transition-all duration-300" style={{ height: '500px' }}>
                {/* Header */}
                <div className="bg-brand-600 p-4 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                                <MessageSquare size={20} />
                            </div>
                            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-brand-600 bg-green-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">TrackComm Support</h3>
                            <p className="text-xs text-brand-100">We typically reply in minutes</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setIsOpen(false)} className="hover:bg-brand-700 p-1 rounded transition-colors">
                            <Minus size={18} />
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                    <div className="text-center text-xs text-gray-400 my-4">Today</div>
                    
                    {messages.length === 0 && (
                        <div className="text-center p-6 text-gray-500 text-sm">
                            <p>👋 Hi {user.name.split(' ')[0]}!</p>
                            <p className="mt-2">How can we help you with your healthy lifestyle journey today?</p>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender !== 'user' && (
                                <div className="h-8 w-8 rounded-full bg-brand-100 flex-shrink-0 flex items-center justify-center mr-2 self-end">
                                    <span className="font-bold text-xs text-brand-600">TC</span>
                                </div>
                            )}
                            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                                msg.sender === 'user' 
                                ? 'bg-brand-600 text-white rounded-br-none' 
                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                            }`}>
                                <p>{msg.text}</p>
                                <p className={`text-[10px] mt-1 text-right ${msg.sender === 'user' ? 'text-brand-200' : 'text-gray-400'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                    <button 
                        type="submit" 
                        disabled={!inputValue.trim()}
                        className="bg-brand-600 hover:bg-brand-700 text-white p-2.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={18} />
                    </button>
                </form>
                
                <div className="bg-gray-50 px-4 py-1 text-center">
                    <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                        Powered by <span className="font-bold text-gray-500">TrackComm</span>
                    </p>
                </div>
            </div>
        )}

        {/* Toggle Button */}
        <button
            onClick={() => setIsOpen(!isOpen)}
            className={`${isOpen ? 'bg-gray-200 text-gray-600' : 'bg-brand-600 text-white shadow-lg hover:scale-105'} h-14 w-14 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-brand-200`}
        >
            {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        </button>
    </div>
  );
};