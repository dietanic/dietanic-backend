import React, { useState, useMemo } from 'react';
import { 
    Calculator, Plus, Trash2, TrendingUp, DollarSign, 
    PieChart, Sparkles, AlertCircle, Info, ArrowRight,
    ChefHat, Scale, Layers
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface Ingredient {
    id: string;
    name: string;
    cost: number;
    quantity: number;
    unit: string;
}

export const PlateProfit: React.FC = () => {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [sellingPrice, setSellingPrice] = useState<number>(0);
    const [overheadPercent, setOverheadPercent] = useState<number>(25);
    const [servings, setServings] = useState<number>(1);
    
    // UI State
    const [newItem, setNewItem] = useState({ name: '', cost: 0, quantity: 1, unit: 'pcs' });
    const [aiInsights, setAiInsights] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Calculations
    const rawCost = useMemo(() => 
        ingredients.reduce((acc, item) => acc + (item.cost * item.quantity), 0)
    , [ingredients]);

    const totalCost = useMemo(() => 
        rawCost * (1 + overheadPercent / 100)
    , [rawCost, overheadPercent]);

    const margin = sellingPrice - totalCost;
    const marginPercent = sellingPrice > 0 ? (margin / sellingPrice) * 100 : 0;
    const perServingCost = servings > 0 ? totalCost / servings : 0;

    const topCostDrivers = useMemo(() => 
        [...ingredients].sort((a, b) => (b.cost * b.quantity) - (a.cost * a.quantity)).slice(0, 3)
    , [ingredients]);

    const addIngredient = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.name || newItem.cost <= 0) return;
        setIngredients([...ingredients, { ...newItem, id: Date.now().toString() }]);
        setNewItem({ name: '', cost: 0, quantity: 1, unit: 'pcs' });
        setAiInsights(null);
    };

    const removeIngredient = (id: string) => {
        setIngredients(ingredients.filter(i => i.id !== id));
        setAiInsights(null);
    };

    const handleAnalyze = async () => {
        if (ingredients.length === 0) return;
        setIsAnalyzing(true);
        setAiInsights(null);
        
        try {
            // Fix: Direct SDK initialization with environment key
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `
                Analyze this recipe cost structure for a professional food brand:
                RECIPE DATA:
                - Ingredients: ${ingredients.map(i => `${i.name} (${i.quantity} ${i.unit} at ₹${i.cost}/unit)`).join(', ')}
                - Overhead: ${overheadPercent}%
                - Target Selling Price: ₹${sellingPrice}
                - Servings: ${servings}
                - Calculated Raw Cost: ₹${rawCost.toFixed(2)}
                - Calculated Margin: ${marginPercent.toFixed(1)}%

                TASK:
                1. Identify the primary cost drivers.
                2. Suggest if the price is too high/low for a premium brand named "Dietanic".
                3. Recommend 2 specific ways to optimize margin (e.g. portion control, alternative sourcing).
                
                Format as a concise, professional summary with bullet points.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
            });

            // Fix: Standard usage of response.text property
            setAiInsights(response.text || "No insights generated.");
        } catch (error) {
            console.error("AI Analysis failed", error);
            setAiInsights("Failed to connect to Intelligence Engine. Please check your API key.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-600 to-brand-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Calculator size={120} />
                </div>
                <div className="relative z-10">
                    <h2 className="text-3xl font-black tracking-tight mb-2">PlateProfit™</h2>
                    <p className="text-brand-100 max-w-lg">
                        Turn every recipe into predictable profit. Calculate exact costs, set confident prices, and optimize margins with AI-driven insights.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Recipe Builder */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <ChefHat className="text-brand-600" size={20} /> Build Your Recipe
                        </h3>
                        
                        <form onSubmit={addIngredient} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <div className="md:col-span-1">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Ingredient</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Avocado" 
                                    className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                    value={newItem.name}
                                    onChange={e => setNewItem({...newItem, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Unit Cost (₹)</label>
                                <input 
                                    type="number" 
                                    placeholder="0" 
                                    className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                    value={newItem.cost || ''}
                                    onChange={e => setNewItem({...newItem, cost: Number(e.target.value)})}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Qty</label>
                                <input 
                                    type="number" 
                                    placeholder="1" 
                                    className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                    value={newItem.quantity || ''}
                                    onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})}
                                />
                            </div>
                            <div className="flex items-end">
                                <button type="submit" className="w-full bg-brand-600 text-white rounded-full py-2.5 font-bold flex items-center justify-center gap-2 hover:bg-brand-700 transition-colors">
                                    <Plus size={18}/> Add
                                </button>
                            </div>
                        </form>

                        <div className="overflow-hidden border border-gray-100 rounded-2xl">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Item</th>
                                        <th className="px-4 py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Unit Price</th>
                                        <th className="px-4 py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Quantity</th>
                                        <th className="px-4 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</th>
                                        <th className="px-4 py-3 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {ingredients.map(item => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-4 py-3 text-sm font-bold text-gray-800">{item.name}</td>
                                            <td className="px-4 py-3 text-sm text-center text-gray-600">₹{item.cost}</td>
                                            <td className="px-4 py-3 text-sm text-center text-gray-600">{item.quantity}</td>
                                            <td className="px-4 py-3 text-sm text-right font-black text-gray-900">₹{(item.cost * item.quantity).toFixed(2)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button onClick={() => removeIngredient(item.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {ingredients.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-sm italic">No ingredients added yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                                {ingredients.length > 0 && (
                                    <tfoot className="bg-brand-50/50 font-black">
                                        <tr>
                                            <td colSpan={3} className="px-4 py-3 text-sm text-brand-800">Total Raw Cost</td>
                                            <td className="px-4 py-3 text-right text-brand-900">₹{rawCost.toFixed(2)}</td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>

                    {/* Cost Drivers */}
                    {ingredients.length > 0 && (
                        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Layers className="text-orange-500" size={20} /> Top Cost Drivers
                            </h3>
                            <div className="space-y-4">
                                {topCostDrivers.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-bold text-gray-700">{item.name}</span>
                                                <span className="text-gray-500">{Math.round(((item.cost * item.quantity) / rawCost) * 100)}% of cost</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2">
                                                <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${((item.cost * item.quantity) / rawCost) * 100}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Margin Analysis */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sticky top-24">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <TrendingUp className="text-green-600" size={20} /> Profitability Analysis
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Selling Price (₹)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                    <input 
                                        type="number" 
                                        className="w-full bg-brand-50 border-2 border-brand-100 rounded-2xl pl-8 pr-4 py-4 text-2xl font-black text-brand-900 outline-none focus:border-brand-500 transition-all"
                                        value={sellingPrice || ''}
                                        onChange={e => setSellingPrice(Number(e.target.value))}
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Overhead (%)</label>
                                    <input 
                                        type="number" 
                                        className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                                        value={overheadPercent}
                                        onChange={e => setOverheadPercent(Number(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Servings</label>
                                    <input 
                                        type="number" 
                                        className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                                        value={servings}
                                        onChange={e => setServings(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-bold">Total Operational Cost</span>
                                    <span className="font-black text-gray-900">₹{totalCost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-bold">Net Margin</span>
                                    <span className={`font-black ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        ₹{margin.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-bold">Cost Per Serving</span>
                                    <span className="font-black text-gray-900">₹{perServingCost.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-black text-gray-700">Profit Margin (%)</span>
                                    <span className={`text-2xl font-black ${marginPercent > 30 ? 'text-green-600' : marginPercent > 10 ? 'text-blue-600' : 'text-red-600'}`}>
                                        {marginPercent.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div 
                                        className={`h-3 rounded-full transition-all duration-500 ${marginPercent > 30 ? 'bg-green-500' : marginPercent > 10 ? 'bg-blue-500' : 'bg-red-500'}`} 
                                        style={{ width: `${Math.max(0, Math.min(100, marginPercent))}%` }}
                                    ></div>
                                </div>
                            </div>

                            <button 
                                onClick={handleAnalyze}
                                disabled={isAnalyzing || ingredients.length === 0}
                                className="w-full bg-gray-900 text-white rounded-full py-4 font-black flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg disabled:opacity-50"
                            >
                                {isAnalyzing ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div> : <Sparkles size={20} className="text-brand-400" />}
                                AI Margin Insight
                            </button>
                        </div>

                        {aiInsights && (
                            <div className="mt-6 p-4 bg-brand-50 border border-brand-100 rounded-2xl animate-scale-in">
                                <div className="flex items-center gap-2 mb-2 text-brand-800 font-bold text-sm">
                                    <Sparkles size={16} /> Analysis & Recommendations
                                </div>
                                <div className="text-xs text-brand-900 leading-relaxed whitespace-pre-wrap">
                                    {aiInsights}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
