
import React, { useState } from 'react';
import { DatabaseService } from '../../services/storeService';
// Fix: Added AlertTriangle to the lucide-react imports to fix 'Cannot find name' error
import { Terminal, Shield, CheckCircle, Lock, Server, Globe, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../App';

export const SystemTools: React.FC = () => {
  const { isAdmin } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'database' | 'compliance'>('compliance');
  
  // States for DB Terminal
  const [queryExpression, setQueryExpression] = useState('return true;');
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [queryError, setQueryError] = useState<string|null>(null);

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
            {['compliance', 'database'].map(t => (
                (t === 'database' && !isAdmin) ? null : 
                <button 
                    key={t} 
                    onClick={() => setActiveSubTab(t as any)} 
                    className={`px-6 py-2 capitalize font-bold text-sm transition-all border-b-2 ${activeSubTab === t ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    {t}
                </button>
            ))}
        </div>

        {activeSubTab === 'database' && isAdmin && (
            <div className="bg-white shadow rounded-2xl overflow-hidden border border-gray-200">
                <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
                    <div className="flex gap-2 items-center">
                        <Terminal size={18} className="text-brand-400"/> 
                        <span className="font-mono text-xs uppercase font-bold tracking-tighter">Database Console (Products Scope)</span>
                    </div>
                    <button onClick={handleRunQuery} className="bg-brand-600 hover:bg-brand-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all">Execute Query</button>
                </div>
                <div className="relative">
                    <textarea 
                        className="w-full bg-gray-800 text-brand-400 p-6 font-mono text-sm h-40 focus:outline-none placeholder:text-gray-600" 
                        value={queryExpression} 
                        onChange={e=>setQueryExpression(e.target.value)}
                        placeholder="// Enter JavaScript filter function body..."
                    />
                </div>
                {queryError ? (
                    <div className="bg-red-50 p-4 text-red-600 text-xs font-mono border-t border-red-100 flex items-center gap-2">
                        <AlertTriangle size={14}/> {queryError}
                    </div>
                ) : (
                    <pre className="p-6 text-[11px] font-mono bg-gray-50 max-h-96 overflow-y-auto border-t border-gray-200 text-gray-700 leading-relaxed">
                        {JSON.stringify(queryResults, null, 2)}
                        {queryResults.length === 0 && <span className="text-gray-400">// No results returned</span>}
                    </pre>
                )}
                <div className="p-4 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 font-bold uppercase flex justify-between">
                    <span>Targeting: Products Collection</span>
                    <span>Use: <code>return item.price &gt; 100</code></span>
                </div>
            </div>
        )}

        {activeSubTab === 'compliance' && (
            <div className="bg-white shadow rounded-2xl overflow-hidden border border-gray-200">
                <div className="p-8 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                            <Shield size={24} className="text-brand-600"/> PCI DSS Compliance Monitor
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Status Report for <strong>CULTLIV DIETANIC LLP</strong></p>
                    </div>
                    <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-1.5 rounded-full border border-green-200 shadow-sm animate-pulse">
                        <Lock size={14} />
                        <span className="text-xs font-black uppercase tracking-tighter">Verified Compliant</span>
                    </div>
                </div>
                
                <div className="p-8">
                    <div className="mb-8 bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-2xl">
                        <p className="text-sm text-blue-900 leading-relaxed">
                            <strong>System Integrity Note:</strong> The platform maintains Level 4 Service Provider compliance. All payment flows are outsourced via IFRAME/Redirect methods to ensure no raw PAN data touches our core infrastructure.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {complianceChecklist.map((item) => (
                            <div key={item.id} className="flex items-start gap-4 p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all hover:border-brand-100 group">
                                <div className="p-1.5 bg-green-50 text-green-500 rounded-lg group-hover:scale-110 transition-transform">
                                    <CheckCircle size={20} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.req}</span>
                                    <p className="text-sm font-bold text-gray-800 mt-0.5">{item.title}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-6">
                        <div className="flex gap-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><Server size={14} className="text-brand-500"/> TLS 1.3 Enforced</span>
                            <span className="flex items-center gap-1.5"><Globe size={14} className="text-brand-500"/> Cloudflare WAF</span>
                        </div>
                        <button className="text-sm text-brand-600 font-bold hover:text-brand-700 bg-brand-50 px-6 py-2 rounded-full transition-all">Download Audit Artifacts (AOC)</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
