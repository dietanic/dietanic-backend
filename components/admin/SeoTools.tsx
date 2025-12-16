import React, { useState, useEffect } from 'react';
import { performSEOAudit, simulateImageOptimization, generateLLMContent, AuditResult } from '../../services/seoService';
import { Zap, ImageIcon, FileText, Download, Search, CheckCircle, AlertTriangle, BarChart2 } from 'lucide-react';

export const SeoTools: React.FC = () => {
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [saved, setSaved] = useState('0');
  const [llmContent, setLlmContent] = useState('');

  useEffect(() => {
      setLlmContent(generateLLMContent());
  }, []);

  const handleOptimize = async () => {
      setOptimizing(true); setProgress(0); setSaved('0');
      await simulateImageOptimization((p, s) => { setProgress(p); setSaved(s); });
      setOptimizing(false);
  };

  const handleAudit = () => setAuditResult(performSEOAudit());

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium mb-2 flex items-center gap-2"><Zap className="text-yellow-500"/> Speed & Images</h3>
                {optimizing ? (
                    <div className="space-y-2"><div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-brand-600 h-2.5 rounded-full" style={{width: `${progress}%`}}></div></div><p className="text-xs text-center">Saved {saved} MB</p></div>
                ) : (
                    <button onClick={handleOptimize} className="w-full bg-brand-600 text-white px-4 py-2 rounded font-medium hover:bg-brand-700">Optimize Images</button>
                )}
            </div>
            <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium mb-2 flex items-center gap-2"><FileText className="text-blue-500"/> AI Discovery (llm.txt)</h3>
                <div className="bg-gray-50 border p-3 h-24 overflow-y-auto mb-4 font-mono text-xs">{llmContent || 'Loading...'}</div>
                <button onClick={() => {const e = document.createElement('a'); e.href = URL.createObjectURL(new Blob([llmContent], {type:'text/plain'})); e.download='llm.txt'; e.click();}} className="w-full border border-blue-600 text-blue-600 px-4 py-2 rounded font-medium hover:bg-blue-50 flex justify-center gap-2"><Download size={16}/> Download</button>
            </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-medium flex items-center gap-2"><Search className="text-purple-500"/> SEO Audit</h3><button onClick={handleAudit} className="text-brand-600 text-sm hover:underline">Run Audit</button></div>
            {!auditResult ? <div className="text-center py-8"><button onClick={handleAudit} className="bg-purple-600 text-white px-6 py-2 rounded">Start Audit</button></div> : (
                <div className="flex gap-8 items-center">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white ${auditResult.grade === 'A' ? 'bg-green-500' : 'bg-red-500'}`}>{auditResult.grade}</div>
                    <div className="flex-1 space-y-2">{auditResult.issues.map((i, idx) => <div key={idx} className="text-sm bg-red-50 p-2 border-l-4 border-red-400 flex gap-2"><AlertTriangle size={14} className="text-red-500 mt-0.5"/> <span>{i.message}</span></div>)} {auditResult.issues.length === 0 && <p className="text-green-600 flex gap-2"><CheckCircle/> All good!</p>}</div>
                </div>
            )}
        </div>
    </div>
  );
};