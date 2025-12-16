
import React, { useState } from 'react';
import { FinanceModule } from '../FinanceModule';
import { PayrollModule } from '../PayrollModule';
import { AssetManager } from '../AssetManager';
import { TaxSettingsPanel } from '../TaxSettings';
import { BarChart3, Users, Box, FileText } from 'lucide-react';

/**
 * FINANCE MICROFRONTEND
 * Encapsulates the entire Financial ERP domain.
 * Contains: Ledger, Receivables, Payables, Payroll, Assets, Tax.
 */
export const FinanceMFE: React.FC = () => {
    const [activeModule, setActiveModule] = useState<'core' | 'payroll' | 'assets' | 'tax'>('core');

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Domain Navigation */}
            <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 inline-flex">
                <button 
                    onClick={() => setActiveModule('core')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-colors ${activeModule === 'core' ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    <BarChart3 size={16}/> Financial Core
                </button>
                <button 
                    onClick={() => setActiveModule('payroll')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-colors ${activeModule === 'payroll' ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    <Users size={16}/> Payroll
                </button>
                <button 
                    onClick={() => setActiveModule('assets')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-colors ${activeModule === 'assets' ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    <Box size={16}/> Assets
                </button>
                <button 
                    onClick={() => setActiveModule('tax')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-colors ${activeModule === 'tax' ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    <FileText size={16}/> Tax Config
                </button>
            </div>

            {/* Module Renderer */}
            <div className="min-h-[600px]">
                {activeModule === 'core' && <FinanceModule />}
                {activeModule === 'payroll' && <PayrollModule />}
                {activeModule === 'assets' && <AssetManager />}
                {activeModule === 'tax' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <TaxSettingsPanel />
                        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                            <h3 className="text-blue-900 font-bold mb-2">Fiscal Compliance Note</h3>
                            <p className="text-blue-800 text-sm">
                                Changes made here propagate to the POS and Ecommerce Checkout microservices immediately.
                                Ensure GSTIN is verified before enabling tax collection.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
