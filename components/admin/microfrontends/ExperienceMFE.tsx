
import React, { useState, useEffect, useRef } from 'react';
import { CROService } from '../../../services/storeService';
import { SessionRecording, Experiment, HeatmapData } from '../../../types';
import { Play, MousePointer, FlaskConical, ShieldCheck, Eye, Monitor, Smartphone, AlertTriangle, CheckCircle, BarChart2 } from 'lucide-react';

/**
 * EXPERIENCE & CRO MICROFRONTEND
 * Tools for website analytics, session replay, heatmaps, and experimentation.
 */
export const ExperienceMFE: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'sessions' | 'heatmaps' | 'experiments' | 'privacy'>('sessions');

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Domain Navigation */}
            <nav className="flex space-x-2 border-b border-gray-200 pb-1 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('sessions')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 ${activeTab === 'sessions' ? 'bg-white border border-b-0 border-gray-200 text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Play size={16}/> Session Replay
                </button>
                <button
                    onClick={() => setActiveTab('heatmaps')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 ${activeTab === 'heatmaps' ? 'bg-white border border-b-0 border-gray-200 text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <MousePointer size={16}/> Heatmaps
                </button>
                <button
                    onClick={() => setActiveTab('experiments')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 ${activeTab === 'experiments' ? 'bg-white border border-b-0 border-gray-200 text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <FlaskConical size={16}/> A/B Testing
                </button>
                <button
                    onClick={() => setActiveTab('privacy')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 ${activeTab === 'privacy' ? 'bg-white border border-b-0 border-gray-200 text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <ShieldCheck size={16}/> Privacy & GDPR
                </button>
            </nav>

            <div className="bg-white p-6 rounded-b-lg shadow-sm border border-t-0 border-gray-200 min-h-[600px]">
                {activeTab === 'sessions' && <SessionRecorderView />}
                {activeTab === 'heatmaps' && <HeatmapView />}
                {activeTab === 'experiments' && <ExperimentsView />}
                {activeTab === 'privacy' && <PrivacyCenterView />}
            </div>
        </div>
    );
};

// --- SUB-COMPONENTS ---

const SessionRecorderView: React.FC = () => {
    const [sessions, setSessions] = useState<SessionRecording[]>([]);
    const [activeSession, setActiveSession] = useState<SessionRecording | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackTime, setPlaybackTime] = useState(0); // in ms
    const [playbackSpeed, setPlaybackSpeed] = useState(1);

    // Mock mouse position for the player
    const [mousePos, setMousePos] = useState({ x: 50, y: 50 }); // % coordinates

    useEffect(() => {
        CROService.getSessions().then(setSessions);
    }, []);

    // Playback Loop
    useEffect(() => {
        let animationFrame: number;
        
        const animate = () => {
            if (isPlaying && activeSession) {
                setPlaybackTime(prev => {
                    // Stop if end reached
                    // Assuming string duration is parsed approx or using mock logic
                    // For demo, loop at 10s
                    if (prev > 10000) { setIsPlaying(false); return 0; }
                    
                    // Update Mouse Position based on current time
                    // Find latest event before current time
                    const event = activeSession.events.reduce((prev, curr) => {
                        return (Math.abs(curr.timestamp - prev) < Math.abs(prev - (prev + 16 * playbackSpeed))) ? curr : prev;
                    }, activeSession.events[0]); // Simplified find logic

                    // interpolate logic for smoother movement would go here
                    // For demo, we jump to next random event close to time
                    const nearbyEvent = activeSession.events.find(e => e.timestamp >= prev && e.timestamp < prev + 100);
                    if (nearbyEvent && nearbyEvent.x && nearbyEvent.y) {
                        setMousePos({ x: nearbyEvent.x, y: nearbyEvent.y });
                    }

                    return prev + (16 * playbackSpeed); // ~60fps
                });
                animationFrame = requestAnimationFrame(animate);
            }
        };

        if (isPlaying) {
            animationFrame = requestAnimationFrame(animate);
        }

        return () => cancelAnimationFrame(animationFrame);
    }, [isPlaying, activeSession, playbackSpeed]);

    return (
        <div className="flex h-[600px] border border-gray-200 rounded-lg overflow-hidden">
            {/* List */}
            <div className="w-1/3 border-r border-gray-200 bg-gray-50 flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-white">
                    <h3 className="font-bold text-gray-700">Visitor Recordings</h3>
                    <p className="text-xs text-gray-500">Last 24 Hours</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {sessions.map(s => (
                        <div 
                            key={s.id} 
                            onClick={() => { setActiveSession(s); setPlaybackTime(0); setIsPlaying(false); }}
                            className={`p-4 border-b cursor-pointer hover:bg-gray-100 transition-colors ${activeSession?.id === s.id ? 'bg-blue-50 border-l-4 border-l-brand-600' : ''}`}
                        >
                            <div className="flex justify-between mb-1">
                                <span className="font-bold text-sm text-gray-800 flex items-center gap-2">
                                    {s.device === 'Mobile' ? <Smartphone size={14}/> : <Monitor size={14}/>} {s.visitorId}
                                </span>
                                <span className="text-xs text-gray-500">{new Date(s.startTime).toLocaleTimeString()}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>{s.location} • {s.pageCount} Pages</span>
                                <span className="font-mono">{s.duration}</span>
                            </div>
                            {s.frustrationScore > 5 && (
                                <span className="mt-2 inline-flex items-center gap-1 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">
                                    <AlertTriangle size={10}/> Rage Clicks Detected
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Player */}
            <div className="flex-1 bg-gray-100 flex flex-col relative">
                {activeSession ? (
                    <>
                        <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
                            {/* Mock Screen */}
                            <div className="bg-white shadow-2xl relative overflow-hidden border border-gray-300" 
                                style={{
                                    width: activeSession.device === 'Mobile' ? '375px' : '100%', 
                                    height: activeSession.device === 'Mobile' ? '667px' : '100%',
                                    maxWidth: '100%',
                                    maxHeight: '100%'
                                }}
                            >
                                {/* Mock Website Content Background */}
                                <div className="absolute inset-0 opacity-50 pointer-events-none" style={{
                                    backgroundImage: 'url("https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80")',
                                    backgroundSize: 'cover'
                                }}></div>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <h2 className="text-4xl font-bold text-gray-800 opacity-20 rotate-45">REPLAY MODE</h2>
                                </div>

                                {/* Simulated Mouse Cursor */}
                                <div 
                                    className="absolute w-6 h-6 z-50 transition-all duration-100 ease-linear pointer-events-none"
                                    style={{ left: `${mousePos.x}%`, top: `${mousePos.y}%` }}
                                >
                                    <div className="w-4 h-4 bg-brand-600 rounded-full border-2 border-white shadow-lg relative">
                                        <div className="absolute -bottom-6 -right-6 bg-black/70 text-white text-[10px] px-1 rounded whitespace-nowrap">
                                            {activeSession.visitorId}
                                        </div>
                                    </div>
                                    {/* Trail effect */}
                                    <div className="absolute top-1 left-1 w-4 h-4 bg-brand-400 rounded-full opacity-30 animate-ping"></div>
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="h-16 bg-white border-t border-gray-200 flex items-center px-4 gap-4">
                            <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 bg-brand-600 text-white rounded-full hover:bg-brand-700">
                                {isPlaying ? <div className="w-4 h-4 border-l-4 border-r-4 border-white ml-0.5"></div> : <Play size={16} className="ml-0.5"/>}
                            </button>
                            
                            <div className="flex-1 relative h-2 bg-gray-200 rounded-full group cursor-pointer">
                                <div className="absolute top-0 left-0 h-full bg-brand-500 rounded-full" style={{width: `${(playbackTime / 10000) * 100}%`}}></div>
                            </div>
                            
                            <div className="flex gap-2">
                                {[1, 2, 4].map(speed => (
                                    <button 
                                        key={speed} 
                                        onClick={() => setPlaybackSpeed(speed)}
                                        className={`text-xs font-bold px-2 py-1 rounded ${playbackSpeed === speed ? 'bg-gray-200' : 'text-gray-500 hover:bg-gray-100'}`}
                                    >
                                        {speed}x
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <Play size={48} className="mb-4 opacity-20"/>
                        <p>Select a session to replay</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const HeatmapView: React.FC = () => {
    const [data, setData] = useState<HeatmapData | null>(null);
    const [device, setDevice] = useState<'Desktop' | 'Mobile'>('Desktop');

    useEffect(() => {
        CROService.getHeatmapData('/shop').then(setData);
    }, []);

    if (!data) return <div>Loading Heatmap...</div>;

    const points = device === 'Desktop' ? data.desktopPoints : data.mobilePoints;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Click Heatmap: Shop Page</h3>
                    <p className="text-sm text-gray-500">Aggregated from last 1,000 visitors</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button onClick={()=>setDevice('Desktop')} className={`px-4 py-1.5 text-sm rounded-md font-medium ${device==='Desktop'?'bg-white shadow text-brand-600':'text-gray-500'}`}>Desktop</button>
                    <button onClick={()=>setDevice('Mobile')} className={`px-4 py-1.5 text-sm rounded-md font-medium ${device==='Mobile'?'bg-white shadow text-brand-600':'text-gray-500'}`}>Mobile</button>
                </div>
            </div>

            <div className="relative border border-gray-200 rounded-lg overflow-hidden h-[500px] bg-gray-50">
                {/* Background Image (Mock Shop Page) */}
                <div className="absolute inset-0 bg-white p-4 grid grid-cols-3 gap-4 opacity-50 pointer-events-none">
                    {[1,2,3,4,5,6].map(i => (
                        <div key={i} className="border border-gray-200 rounded h-40 bg-gray-100"></div>
                    ))}
                </div>
                
                {/* Heat Points */}
                {points.map((p, i) => (
                    <div 
                        key={i}
                        className="absolute w-8 h-8 rounded-full blur-md"
                        style={{
                            left: `${p.x}%`, 
                            top: `${p.y}%`,
                            background: `radial-gradient(circle, rgba(255,0,0,0.6) 0%, rgba(255,165,0,0.4) 50%, rgba(255,255,0,0) 70%)`
                        }}
                    ></div>
                ))}
            </div>
        </div>
    );
};

const ExperimentsView: React.FC = () => {
    const [experiments, setExperiments] = useState<Experiment[]>([]);

    useEffect(() => {
        CROService.getExperiments().then(setExperiments);
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-900">Active Experiments</h3>
                <button className="bg-brand-600 text-white px-4 py-2 rounded-md text-sm font-bold shadow-sm hover:bg-brand-700">Create New Test</button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {experiments.map(exp => (
                    <div key={exp.id} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="text-lg font-bold text-gray-900">{exp.name}</h4>
                                    <span className={`text-xs px-2 py-0.5 rounded-full uppercase font-bold ${
                                        exp.status === 'running' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                    }`}>{exp.status}</span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">Started: {new Date(exp.startDate).toLocaleDateString()} • Type: {exp.type}</p>
                            </div>
                            <div className="text-right">
                                <span className="block text-2xl font-bold text-brand-600">{exp.confidenceLevel}%</span>
                                <span className="text-xs text-gray-400 font-bold uppercase">Confidence</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {exp.variants.map((v, i) => {
                                const isWinner = v.conversionRate === Math.max(...exp.variants.map(v => v.conversionRate));
                                return (
                                    <div key={i} className="relative">
                                        <div className="flex justify-between text-sm mb-1 font-medium">
                                            <span className="flex items-center gap-2">
                                                {v.name}
                                                {exp.status === 'concluded' && isWinner && <CheckCircle size={14} className="text-green-500"/>}
                                            </span>
                                            <span>{v.conversionRate}% Conv. ({v.conversions}/{v.visitors})</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                            <div 
                                                className={`h-full ${isWinner ? 'bg-green-500' : 'bg-blue-400'}`} 
                                                style={{width: `${(v.conversionRate / 15) * 100}%`}}
                                            ></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PrivacyCenterView: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-lg">
                <h3 className="font-bold text-blue-900 flex items-center gap-2 mb-2">
                    <ShieldCheck size={20}/> Compliance Status: Good
                </h3>
                <p className="text-blue-800 text-sm">
                    Your platform is currently enforcing GDPR consent banners and PCI-DSS compliant payment tokenization.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-6">
                    <h4 className="font-bold text-gray-900 mb-4">Data Retention Policy</h4>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Visitor Logs</span>
                            <select className="border rounded text-sm p-1">
                                <option>30 Days</option>
                                <option>60 Days</option>
                                <option>90 Days</option>
                            </select>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Session Recordings</span>
                            <select className="border rounded text-sm p-1">
                                <option>14 Days</option>
                                <option>30 Days</option>
                            </select>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Abandoned Carts (PII)</span>
                            <select className="border rounded text-sm p-1">
                                <option>30 Days</option>
                                <option>60 Days</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                    <h4 className="font-bold text-gray-900 mb-4">User Data Requests (GDPR)</h4>
                    <div className="space-y-3">
                        <div className="p-3 bg-gray-50 rounded border border-gray-200 flex justify-between items-center">
                            <div>
                                <p className="text-sm font-bold">req_9921</p>
                                <p className="text-xs text-gray-500">Erasure Request • 2 days ago</p>
                            </div>
                            <button className="text-xs bg-red-600 text-white px-3 py-1 rounded">Process</button>
                        </div>
                        <div className="p-3 bg-gray-50 rounded border border-gray-200 flex justify-between items-center">
                            <div>
                                <p className="text-sm font-bold">req_9925</p>
                                <p className="text-xs text-gray-500">Export Data • 5 hours ago</p>
                            </div>
                            <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded">Export</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
