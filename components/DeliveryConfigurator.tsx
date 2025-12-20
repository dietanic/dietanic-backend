
import React, { useState } from 'react';
import { Truck, Zap, Clock, Check, Store, MapPin } from 'lucide-react';
import { INITIAL_WAREHOUSES } from '../constants';

export type DeliveryMethodType = 'standard' | 'express' | 'scheduled' | 'pickup';

interface DeliveryConfiguratorProps {
    subtotal: number;
    selectedMethod: DeliveryMethodType;
    onMethodChange: (method: DeliveryMethodType, pickupLocationId?: string) => void;
}

export const getDeliveryCost = (method: DeliveryMethodType, subtotal: number): number => {
    switch (method) {
        case 'standard': return subtotal > 500 ? 0 : 50;
        case 'express': return 150;
        case 'scheduled': return 100;
        case 'pickup': return 0;
        default: return 0;
    }
};

export const DeliveryConfigurator: React.FC<DeliveryConfiguratorProps> = ({ subtotal, selectedMethod, onMethodChange }) => {
    const [selectedStore, setSelectedStore] = useState('');

    const handleMethodClick = (methodId: DeliveryMethodType) => {
        if (methodId === 'pickup') {
            // Default to first store if not selected
            const defaultStore = selectedStore || INITIAL_WAREHOUSES.find(w => w.type === 'Retail Outlet')?.id;
            setSelectedStore(defaultStore || '');
            onMethodChange(methodId, defaultStore);
        } else {
            onMethodChange(methodId);
        }
    };

    const handleStoreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const storeId = e.target.value;
        setSelectedStore(storeId);
        onMethodChange('pickup', storeId);
    };

    const methods = [
        { 
            id: 'standard', 
            label: 'Standard', 
            icon: Truck, 
            cost: getDeliveryCost('standard', subtotal),
            desc: 'Delivered in 24h.' 
        },
        { 
            id: 'express', 
            label: 'Express', 
            icon: Zap, 
            cost: getDeliveryCost('express', subtotal),
            desc: 'Delivered in 2h.' 
        },
        { 
            id: 'pickup',
            label: 'Store Pickup',
            icon: Store,
            cost: 0,
            desc: 'Collect from store.'
        }
    ];

    const stores = INITIAL_WAREHOUSES.filter(w => w.type === 'Retail Outlet');

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="text-brand-600" size={20} /> Delivery Method
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {methods.map((method) => (
                    <div 
                        key={method.id}
                        onClick={() => handleMethodClick(method.id as DeliveryMethodType)}
                        className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 flex flex-col justify-between h-full group ${
                            selectedMethod === method.id 
                            ? 'border-brand-500 bg-brand-50/50 ring-1 ring-brand-500' 
                            : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className={`font-bold text-sm flex items-center gap-2 ${selectedMethod === method.id ? 'text-brand-700' : 'text-gray-700'}`}>
                                    <method.icon size={16} className={method.id === 'express' ? "text-yellow-500 fill-yellow-500" : ""} /> 
                                    {method.label}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">{method.desc}</p>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200/50 flex justify-between items-center">
                            <span className="text-xs font-semibold text-gray-400">Cost</span>
                            {method.cost === 0 ? (
                                <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">FREE</span>
                            ) : (
                                <span className="text-sm font-bold text-gray-900">₹{method.cost}</span>
                            )}
                        </div>
                        
                        {/* Selected Indicator */}
                        {selectedMethod === method.id && (
                            <div className="absolute -top-2 -right-2 bg-brand-600 text-white p-1 rounded-full shadow-md animate-scale-in">
                                <Check size={12} strokeWidth={4} />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {selectedMethod === 'pickup' && (
                <div className="bg-brand-50 p-4 rounded-lg border border-brand-100 animate-fade-in">
                    <label className="block text-xs font-bold text-brand-800 uppercase mb-2 flex items-center gap-1">
                        <MapPin size={12}/> Select Store Location
                    </label>
                    <select 
                        className="w-full p-2 border border-brand-200 rounded-md text-sm text-gray-700 bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                        value={selectedStore}
                        onChange={handleStoreChange}
                    >
                        {stores.map(store => (
                            <option key={store.id} value={store.id}>{store.name} ({store.address})</option>
                        ))}
                    </select>
                    <p className="text-xs text-brand-600 mt-2">
                        Usually ready for pickup within 45 minutes. You'll receive a notification when ready.
                    </p>
                </div>
            )}
        </div>
    );
};
