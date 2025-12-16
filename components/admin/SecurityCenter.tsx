
import React, { useState, useEffect } from 'react';
import { SecurityService, IdentityService } from '../../services/storeService';
import { AuditLogEntry, SecurityAlert, User } from '../../types';
import { 
    Shield, Eye, Lock, Bell, AlertTriangle, CheckCircle, 
    FileText, UserCheck, Activity, Search, RefreshCw, XCircle,
    Database, Hash, ArrowDown
} from 'lucide-react';

export const SecurityCenter: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'surveillance' | 'audit' | 'access' | 'alerts'>('surveillance');
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Integrity State
    const [integrityStatus, setIntegrityStatus] = useState<'unchecked' | 'valid' | 'corrupted'>('unchecked');
    const [verifying, setVerifying] = useState(false);

    // Drill Down State
    const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 10000);
        return () => clearInterval(interval);
    }, []);

    const refreshData = async () => {
        const [l, a, u] = await Promise.all([
            SecurityService.getLogs(),
            SecurityService.getAlerts(),
            IdentityService.getUsers()
        ]);
        setLogs(l);
        setAlerts(a);
        setUsers(u);
        setIsLoading(false);
    };

    const handleVerifyIntegrity = async () => {
        setVerifying(true);
        // Simulate computation time for chain verification
        setTimeout(async () => {
            const result = await SecurityService.verifyChainIntegrity();
            setIntegrityStatus(result.valid ? 'valid' : 'corrupted');
            setVerifying(false);
            if (!result.valid) {
                SecurityService.createAlert('integrity_breach', 'Audit Trail Tampering Detected. Chain broken at index ' + result.brokenIndex);
                refreshData();
            }
        }, 1500);
    };

    const handleResolveAlert = async (id: string) => {
        await SecurityService.resolveAlert(id);
        refreshData();
    };

    const getSeverityColor = (severity: string) => {
        switch(severity) {
            case 'critical': return 'bg-red-100 text-red-800 border-red-200';
            case 'warning': return 'bg-orange-100 text-orange-800 border-orange-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const filteredLogs = logs.filter(l => 
        l.details.toLowerCase().includes(searchTerm.toLowerCase()) || 
        l.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.target.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in relative">
            {/* Security Header Status */}
            <div className="bg-gray-900 rounded-xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-500/20 rounded-full border border-green-500/50">
                        <Shield size={32} className="text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Sentinel Protection Active</h2>
                        <p className="text-gray-400 text-sm">System integrity: 100% • HIPAA Compliant Storage</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="bg-gray-800 px-4 py-2 rounded-lg text-center border border-gray-700">
                        <span className="block text-2xl font-bold text-red-400">{alerts.filter(a => a.status === 'active').length}</span>
                        <span className="text-xs text-gray-500 uppercase font-bold">Threats</span>
                    </div>
                    <div className="bg-gray-800 px-4 py-2 rounded-lg text-center border border-gray-700">
                        <span className="block text-2xl font-bold text-blue-400">{logs.length}</span>
                        <span className="text-xs text-gray-500 uppercase font-bold">Events</span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm w-fit">
                {[
                    { id: 'surveillance', icon: Eye, label: 'Surveillance' },
                    { id: 'audit', icon: Database, label: 'Tamper-Proof Log' },
                    { id: 'access', icon: UserCheck, label: 'Access Control' },
                    { id: 'alerts', icon: Bell, label: 'Alerts' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                            activeTab === tab.id 
                            ? 'bg-gray-900 text-white shadow-md' 
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[400px]">
                
                {/* 1. Surveillance View */}
                {activeTab === 'surveillance' && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2"><Activity className="text-brand-600"/> Live Operations Feed</h3>
                            <span className="text-xs flex items-center gap-1 text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full animate-pulse">
                                <span className="w-2 h-2 bg-green-600 rounded-full"></span> Live
                            </span>
                        </div>
                        <div className="relative border-l-2 border-gray-200 ml-4 space-y-8">
                            {logs.slice(0, 10).map((log, idx) => (
                                <div key={log.id} className="relative pl-8">
                                    <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-white ${
                                        log.severity === 'critical' ? 'bg-red-500' : 'bg-blue-500'
                                    }`}></div>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">
                                                {log.actorName} <span className="font-normal text-gray-500">performed</span> {log.action.replace('_', ' ')}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">{log.details}</p>
                                            <span className="inline-block mt-2 text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                                                Target: {log.target}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-400 font-mono">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 2. Tamper-Proof Audit Logs */}
                {activeTab === 'audit' && (
                    <div>
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <div className="flex items-center gap-4">
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                                    <input 
                                        type="text" 
                                        placeholder="Search logs..." 
                                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-brand-500 outline-none"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button 
                                    onClick={handleVerifyIntegrity} 
                                    disabled={verifying}
                                    className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                                        integrityStatus === 'valid' ? 'bg-green-100 text-green-700' : 
                                        integrityStatus === 'corrupted' ? 'bg-red-100 text-red-700' : 
                                        'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    {verifying ? <RefreshCw className="animate-spin" size={14}/> : <Hash size={14}/>}
                                    {verifying ? 'Verifying...' : integrityStatus === 'valid' ? 'Chain Valid' : integrityStatus === 'corrupted' ? 'Chain Broken' : 'Verify Integrity'}
                                </button>
                            </div>
                            <button onClick={refreshData} className="p-2 hover:bg-gray-200 rounded-full"><RefreshCw size={16}/></button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">Timestamp</th>
                                        <th className="px-4 py-3 text-left font-medium">Actor</th>
                                        <th className="px-4 py-3 text-left font-medium">Action</th>
                                        <th className="px-4 py-3 text-left font-medium">Chain Hash (SHA-256)</th>
                                        <th className="px-4 py-3 text-left font-medium"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredLogs.map(log => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-mono text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                                            <td className="px-4 py-3 font-medium text-gray-900">{log.actorName}</td>
                                            <td className="px-4 py-3"><span className="bg-gray-100 px-2 py-1 rounded text-xs border">{log.action}</span></td>
                                            <td className="px-4 py-3 font-mono text-xs text-gray-400 truncate max-w-[150px]">{log.hash}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button onClick={() => setSelectedLog(log)} className="text-blue-600 hover:text-blue-800 text-xs font-bold">Drill Down</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 3. Access Control (Customized Access) */}
                {activeTab === 'access' && (
                    <div className="p-6">
                        <div className="mb-6">
                            <h3 className="font-bold text-gray-900">Role-Based Access Control (RBAC)</h3>
                            <p className="text-sm text-gray-500">Manage permissions to prevent unauthorized access to business information.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Role Definitions */}
                            <div className="space-y-4">
                                {['Admin', 'Editor'].map(role => {
                                    // Simulated strict config fetch
                                    const perms = role === 'Admin' 
                                        ? ['View Financials', 'Manage Inventory', 'Manage Users', 'View PHI', 'Access POS']
                                        : ['Manage Inventory', 'Access POS'];
                                    
                                    return (
                                        <div key={role} className="border border-gray-200 rounded-lg p-4 hover:border-brand-300 transition-colors">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Lock size={16} className="text-brand-600"/>
                                                <h4 className="font-bold text-gray-900">{role} Role</h4>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {perms.map(p => (
                                                    <span key={p} className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-600 border border-gray-200">{p}</span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Active Users */}
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 h-fit">
                                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><UserCheck size={16}/> Authorized Personnel</h4>
                                <ul className="space-y-2">
                                    {users.filter(u => u.role !== 'customer').map(u => (
                                        <li key={u.id} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-xs">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{u.name}</p>
                                                    <p className="text-xs text-gray-500 capitalize">{u.role}</p>
                                                </div>
                                            </div>
                                            <span className={`w-2 h-2 rounded-full ${u.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. Instant Alerts */}
                {activeTab === 'alerts' && (
                    <div className="p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <AlertTriangle className="text-red-500" /> Active Security Alerts
                        </h3>
                        <div className="space-y-4">
                            {alerts.length === 0 ? (
                                <div className="text-center py-12 bg-green-50 rounded-lg border border-green-100">
                                    <CheckCircle size={48} className="text-green-500 mx-auto mb-2"/>
                                    <p className="text-green-800 font-medium">All Clear</p>
                                    <p className="text-green-600 text-sm">No active threats detected.</p>
                                </div>
                            ) : (
                                alerts.map(alert => (
                                    <div key={alert.id} className={`p-4 rounded-lg border-l-4 flex justify-between items-start ${
                                        alert.status === 'resolved' 
                                        ? 'bg-gray-50 border-gray-300 opacity-60' 
                                        : 'bg-red-50 border-red-500'
                                    }`}>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-gray-200">{alert.type.replace('_', ' ')}</span>
                                                <span className="text-xs text-gray-500">{new Date(alert.timestamp).toLocaleString()}</span>
                                            </div>
                                            <p className="font-medium text-gray-900">{alert.message}</p>
                                        </div>
                                        {alert.status === 'active' && (
                                            <button 
                                                onClick={() => handleResolveAlert(alert.id)}
                                                className="bg-white border border-gray-300 px-3 py-1 text-xs font-bold rounded hover:bg-gray-100 shadow-sm"
                                            >
                                                Resolve
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Drill Down Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full animate-scale-in overflow-hidden">
                        <div className="bg-gray-900 p-6 flex justify-between items-center text-white">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2"><Database size={20}/> Audit Record</h3>
                                <p className="text-gray-400 text-sm font-mono">{selectedLog.id}</p>
                            </div>
                            <button onClick={() => setSelectedLog(null)}><XCircle className="text-gray-400 hover:text-white" size={24}/></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                                    <span className="text-xs text-gray-500 uppercase font-bold">Timestamp</span>
                                    <p className="font-medium text-gray-900">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                                    <span className="text-xs text-gray-500 uppercase font-bold">Actor</span>
                                    <p className="font-medium text-gray-900">{selectedLog.actorName}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                                    <span className="text-xs text-gray-500 uppercase font-bold">Action</span>
                                    <p className="font-medium text-gray-900">{selectedLog.action}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                                    <span className="text-xs text-gray-500 uppercase font-bold">Target</span>
                                    <p className="font-medium text-gray-900">{selectedLog.target}</p>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 uppercase font-bold">Event Details</span>
                                <div className="bg-gray-50 p-4 rounded border border-gray-200 text-sm mt-1">
                                    {selectedLog.details}
                                </div>
                            </div>
                            <div className="border-t border-gray-200 pt-4">
                                <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2"><Hash size={14}/> Chain Cryptography</h4>
                                <div className="space-y-2 font-mono text-xs">
                                    <div className="flex justify-between items-center text-gray-500">
                                        <span>Previous Hash:</span>
                                        <span>{selectedLog.previousHash}</span>
                                    </div>
                                    <div className="flex justify-center text-gray-300">
                                        <ArrowDown size={16}/>
                                    </div>
                                    <div className="flex justify-between items-center bg-blue-50 p-2 rounded border border-blue-100 text-blue-800">
                                        <span className="font-bold">Current Hash:</span>
                                        <span>{selectedLog.hash}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
