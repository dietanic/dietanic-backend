
import React, { useState, useEffect } from 'react';
import { DiscountService, CatalogService } from '../../services/storeService';
import { Discount, Category } from '../../types';
import { Trash2, Tag, Plus, Percent, DollarSign, AlertCircle } from 'lucide-react';

export const DiscountManager: React.FC = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newDiscount, setNewDiscount] = useState<Partial<Discount>>({ 
      code: '', 
      type: 'percentage', 
      value: 0, 
      isActive: true,
      minPurchaseAmount: 0,
      applicableCategory: 'All'
  });

  useEffect(() => { refresh(); }, []);

  const refresh = async () => {
      const [d, c] = await Promise.all([DiscountService.getDiscounts(), CatalogService.getCategories()]);
      setDiscounts(d);
      setCategories(c);
  };

  const handleAddDiscount = async (e: React.FormEvent) => {
      e.preventDefault();
      await DiscountService.addDiscount({
          id: 'd'+Date.now(), 
          code: newDiscount.code!.toUpperCase(), 
          type: newDiscount.type!, 
          value: Number(newDiscount.value), 
          isActive: true,
          minPurchaseAmount: Number(newDiscount.minPurchaseAmount) || 0,
          applicableCategory: newDiscount.applicableCategory || 'All'
      } as Discount);
      
      setNewDiscount({ code: '', type: 'percentage', value: 0, isActive: true, minPurchaseAmount: 0, applicableCategory: 'All' });
      setIsAdding(false);
      refresh();
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Tag size={24} className="text-brand-600"/> Promotions & Coupons
                </h3>
                <p className="text-sm text-gray-500">Manage active discount codes and campaign eligibility.</p>
            </div>
            <button 
                onClick={() => setIsAdding(!isAdding)}
                className="bg-brand-600 text-white px-5 py-2.5 rounded-full font-bold shadow-md hover:bg-brand-700 transition-all flex items-center gap-2"
            >
                {isAdding ? 'Cancel' : <><Plus size={18}/> Create Coupon</>}
            </button>
        </div>

        {isAdding && (
            <form onSubmit={handleAddDiscount} className="bg-gray-50 p-6 rounded-2xl border border-gray-200 shadow-inner animate-scale-in">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Promo Code</label>
                        <input 
                            className="w-full border-gray-300 rounded-full px-4 py-2.5 text-sm uppercase border focus:ring-2 focus:ring-brand-500 outline-none" 
                            value={newDiscount.code} 
                            onChange={e=>setNewDiscount({...newDiscount, code: e.target.value})} 
                            placeholder="e.g. SUMMER25" 
                            required
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Value</label>
                            <input 
                                type="number" 
                                className="w-full border-gray-300 rounded-full px-4 py-2.5 text-sm border focus:ring-2 focus:ring-brand-500 outline-none" 
                                value={newDiscount.value} 
                                onChange={e=>setNewDiscount({...newDiscount, value: Number(e.target.value)})} 
                                required
                            />
                        </div>
                        <div className="w-32">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Type</label>
                            <select 
                                className="w-full border-gray-300 rounded-full px-4 py-2.5 text-sm border bg-white focus:ring-2 focus:ring-brand-500 outline-none" 
                                value={newDiscount.type} 
                                onChange={e=>setNewDiscount({...newDiscount, type: e.target.value as any})}
                            >
                                <option value="percentage">% Percent</option>
                                <option value="fixed">₹ Fixed</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Applicable Category</label>
                        <select 
                            className="w-full border-gray-300 rounded-full px-4 py-2.5 text-sm border bg-white focus:ring-2 focus:ring-brand-500 outline-none" 
                            value={newDiscount.applicableCategory} 
                            onChange={e=>setNewDiscount({...newDiscount, applicableCategory: e.target.value})}
                        >
                            <option value="All">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Min. Purchase (₹)</label>
                        <input 
                            type="number" 
                            className="w-full border-gray-300 rounded-full px-4 py-2.5 text-sm border focus:ring-2 focus:ring-brand-500 outline-none" 
                            value={newDiscount.minPurchaseAmount} 
                            onChange={e=>setNewDiscount({...newDiscount, minPurchaseAmount: Number(e.target.value)})} 
                            placeholder="0" 
                        />
                    </div>
                    <div className="lg:col-span-2 flex items-end">
                        <button className="bg-gray-900 text-white px-8 py-2.5 rounded-full font-bold hover:bg-black transition-colors w-full sm:w-auto">
                            Publish Promo Code
                        </button>
                    </div>
                </div>
            </form>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Coupon Detail</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Reward</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Eligibility</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {discounts.map(d => (
                            <tr key={d.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-brand-50 text-brand-600 rounded-xl group-hover:scale-110 transition-transform">
                                            <Tag size={20} />
                                        </div>
                                        <div>
                                            <span className="font-mono font-black text-gray-900 text-lg">{d.code}</span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">Live & Active</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                        d.type === 'percentage' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                    }`}>
                                        {d.type === 'percentage' ? <Percent size={12}/> : <DollarSign size={12}/>}
                                        {d.type === 'percentage' ? `${d.value}% Discount` : `₹${d.value} Off`}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="space-y-1">
                                        <div className="text-sm text-gray-700 font-medium">Valid on: <span className="text-gray-900 font-bold">{d.applicableCategory || 'All Items'}</span></div>
                                        <div className="text-xs text-gray-400">
                                            {d.minPurchaseAmount ? `Min Spend: ₹${d.minPurchaseAmount}` : 'No minimum spend'}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <button 
                                        onClick={async ()=>{if(confirm('Delete coupon?')){await DiscountService.deleteDiscount(d.id); refresh();}}} 
                                        className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-all"
                                    >
                                        <Trash2 size={18}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {discounts.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-20 text-center text-gray-400">
                                    <Tag size={48} className="mx-auto mb-4 opacity-10" />
                                    <p className="text-lg font-medium">No coupons created yet</p>
                                    <p className="text-sm mt-1">Start by clicking the "Create Coupon" button above.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-start gap-4">
            <div className="p-2 bg-white rounded-full text-blue-500 shadow-sm">
                <AlertCircle size={20}/>
            </div>
            <div>
                <h4 className="font-bold text-blue-900">Campaign Tip</h4>
                <p className="text-sm text-blue-800 leading-relaxed mt-1">
                    Coupons can be applied at checkout by customers. Ensure you share the exact code (case insensitive) through your marketing channels. 
                    Codes are validated against cart subtotal before any taxes or shipping fees are added.
                </p>
            </div>
        </div>
    </div>
  );
};
