
import React, { useState, useEffect } from 'react';
import { SettingsService } from '../../services/storeService';
import { TaxSettings } from '../../types';
import { Save, FileText, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';

export const TaxSettingsPanel: React.FC = () => {
    const [settings, setSettings] = useState<TaxSettings>({
        isRegistered: false,
        gstin: '',
        state: 'Maharashtra'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{type: 'success'|'error', text: string}|null>(null);

    useEffect(() => {
        const load = async () => {
            const s = await SettingsService.getTaxSettings();
            setSettings(s);
            setLoading(false);
        };
        load();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            await SettingsService.saveTaxSettings(settings);
            setMessage({ type: 'success', text: 'Tax settings updated successfully.' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update settings.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-gray-500">Loading settings...</div>;

    return (
        <div className="bg-white shadow rounded-lg p-6 animate-fade-in max-w-2xl">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <FileText size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Fiscal & Tax Configuration</h3>
                    <p className="text-sm text-gray-500">Manage GST registration status and store location.</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Registration Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                        <label className="font-medium text-gray-900">GST Registration Status</label>
                        <p className="text-xs text-gray-500 mt-1">
                            {settings.isRegistered 
                                ? 'Your business charges GST on eligible products.' 
                                : 'Your business is currently Unregistered (UR) and does not charge tax.'}
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={settings.isRegistered}
                            onChange={(e) => setSettings({...settings, isRegistered: e.target.checked})}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>

                {!settings.isRegistered && (
                    <div className="flex items-start gap-2 p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-100">
                        <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                        <p>
                            <strong>Unregistered Mode:</strong> All products will be sold without adding tax to the cart total. 
                            Invoices will be marked as "UR" (Unregistered).
                        </p>
                    </div>
                )}

                {/* Details (Only if registered, or we keep them visible but disabled/optional) */}
                <div className={`space-y-4 transition-opacity ${!settings.isRegistered ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN Number</label>
                        <input 
                            type="text" 
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 uppercase font-mono p-2 border"
                            placeholder="27ABCDE1234F1Z5"
                            value={settings.gstin}
                            onChange={(e) => setSettings({...settings, gstin: e.target.value.toUpperCase()})}
                            disabled={!settings.isRegistered}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                            <MapPin size={14}/> Store Location (Origin State)
                        </label>
                        <select 
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border bg-white"
                            value={settings.state}
                            onChange={(e) => setSettings({...settings, state: e.target.value})}
                            disabled={!settings.isRegistered}
                        >
                            <option value="Maharashtra">Maharashtra</option>
                            <option value="Delhi">Delhi</option>
                            <option value="Karnataka">Karnataka</option>
                            <option value="Tamil Nadu">Tamil Nadu</option>
                            <option value="Gujarat">Gujarat</option>
                            <option value="West Bengal">West Bengal</option>
                            {/* Add other states as needed */}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Used to calculate CGST/SGST vs IGST.</p>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    {message ? (
                        <span className={`text-sm flex items-center gap-1 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {message.type === 'success' && <CheckCircle size={16}/>}
                            {message.text}
                        </span>
                    ) : <span></span>}
                    
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="bg-brand-600 text-white px-6 py-2 rounded-md font-medium hover:bg-brand-700 shadow-sm flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : <><Save size={18}/> Save Settings</>}
                    </button>
                </div>
            </form>
        </div>
    );
};
