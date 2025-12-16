
import React, { useState, useEffect, useRef } from 'react';
import { DeliveryService, CatalogService } from '../services/storeService';
import { Order, Product, ProofOfDelivery, CartItem } from '../types';
import { 
    MapPin, Truck, CheckCircle, Package, Scan, Camera, PenTool, 
    Navigation, Phone, MoreVertical, X, ChevronRight, ShoppingBag, 
    Plus, Minus, CreditCard, User, Box, Search
} from 'lucide-react';
import { useAuth } from '../App';

export const FieldAgent: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'route' | 'van-sales'>('route');
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Delivery Flow State
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [scanMode, setScanMode] = useState(false);
    const [epodMode, setEpodMode] = useState(false);
    const [scannedCode, setScannedCode] = useState('');
    const [scanSuccess, setScanSuccess] = useState(false);
    
    // ePOD State
    const [signature, setSignature] = useState<string | null>(null);
    const [photo, setPhoto] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // Van Sales State
    const [products, setProducts] = useState<Product[]>([]);
    const [vanCart, setVanCart] = useState<CartItem[]>([]);
    const [salesSearch, setSalesSearch] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [o, p] = await Promise.all([
            DeliveryService.getAssignedOrders(user.id),
            CatalogService.getProducts()
        ]);
        setOrders(o);
        setProducts(p);
        setLoading(false);
    };

    const handleStartScan = () => {
        setScanMode(true);
        setScanSuccess(false);
        setScannedCode('');
        
        // Simulate scanning delay
        setTimeout(() => {
            setScannedCode(`TRK-${selectedOrder?.id.slice(-6).toUpperCase()}`);
            setScanSuccess(true);
        }, 2000);
    };

    // Canvas Logic for Signature
    const startDrawing = (e: any) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e: any) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        if (canvasRef.current) {
            setSignature(canvasRef.current.toDataURL());
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setPhoto(ev.target?.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const completeDelivery = async () => {
        if (!selectedOrder) return;
        
        const proof: ProofOfDelivery = {
            timestamp: new Date().toISOString(),
            signature: signature || undefined,
            photo: photo || undefined,
            receivedBy: 'Customer', // Simplified
            location: { lat: 0, lng: 0 } // Would use navigator.geolocation
        };

        await DeliveryService.completeDelivery(selectedOrder.id, proof);
        
        // Reset
        setEpodMode(false);
        setScanMode(false);
        setSelectedOrder(null);
        setSignature(null);
        setPhoto(null);
        loadData(); // Refresh list
    };

    // --- Van Sales Logic ---
    const addToVanCart = (product: Product) => {
        setVanCart(prev => {
            const existing = prev.find(i => i.id === product.id);
            if (existing) {
                return prev.map(i => i.id === product.id ? {...i, quantity: i.quantity + 1} : i);
            }
            return [...prev, { ...product, quantity: 1, cartItemId: Date.now().toString() }];
        });
    };

    const removeFromVanCart = (id: string) => {
        setVanCart(prev => prev.filter(i => i.id !== id));
    };

    const completeVanSale = async () => {
        if (vanCart.length === 0) return;
        
        const total = vanCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const order: Order = {
            id: `van_${Date.now()}`,
            userId: 'guest_van',
            items: vanCart,
            total,
            subtotal: total,
            status: 'delivered',
            date: new Date().toISOString(),
            shippingAddress: { street: 'Direct Sale', city: 'Mobile Van', state: '', zip: '' },
            assignedDriverId: user.id
        };

        await DeliveryService.createVanSale(order);
        setVanCart([]);
        alert("Sale Complete! Receipt Sent.");
    };

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(salesSearch.toLowerCase()));

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col font-sans max-w-md mx-auto shadow-2xl relative overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 pt-6 sticky top-0 z-30">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <Truck className="text-brand-500" /> Dietanic Logistics
                        </h1>
                        <p className="text-xs text-slate-400">Agent: {user.name} • Status: Active</p>
                    </div>
                    <div className="bg-slate-800 p-2 rounded-full">
                        <User size={20} />
                    </div>
                </div>
                
                <div className="flex bg-slate-800 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('route')}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'route' ? 'bg-brand-600 text-white' : 'text-slate-400'}`}
                    >
                        My Route
                    </button>
                    <button 
                        onClick={() => setActiveTab('van-sales')}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'van-sales' ? 'bg-brand-600 text-white' : 'text-slate-400'}`}
                    >
                        Van Sales
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto pb-20">
                
                {/* --- ROUTE VIEW --- */}
                {activeTab === 'route' && (
                    <div className="p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="font-bold text-gray-700">Today's Deliveries ({orders.length})</h2>
                            <button onClick={loadData} className="text-brand-600 text-sm font-medium">Refresh</button>
                        </div>

                        {loading ? <div className="text-center p-8 text-gray-500">Syncing Route...</div> : orders.length === 0 ? (
                            <div className="text-center p-12 bg-white rounded-xl border border-gray-200">
                                <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                                <h3 className="font-bold text-gray-900">All Caught Up!</h3>
                                <p className="text-gray-500 text-sm">No pending deliveries assigned.</p>
                            </div>
                        ) : (
                            orders.map((order, idx) => (
                                <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="bg-gray-50 p-3 flex justify-between items-center border-b border-gray-100">
                                        <span className="bg-brand-100 text-brand-800 text-xs font-bold px-2 py-1 rounded-full">STOP {idx + 1}</span>
                                        <span className="text-xs text-gray-500 font-mono">#{order.id.slice(-6)}</span>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex justify-between mb-3">
                                            <div>
                                                <h3 className="font-bold text-gray-900">{order.shippingAddress.city}</h3>
                                                <p className="text-sm text-gray-600">{order.shippingAddress.street}</p>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <button className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100">
                                                    <Navigation size={18} />
                                                </button>
                                                <button className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-100">
                                                    <Phone size={18} />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 mb-4">
                                            {order.items.length} Items: {order.items.map(i => i.name).join(', ')}
                                        </div>

                                        <button 
                                            onClick={() => setSelectedOrder(order)}
                                            className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-slate-800"
                                        >
                                            Start Delivery <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* --- VAN SALES VIEW --- */}
                {activeTab === 'van-sales' && (
                    <div className="flex flex-col h-full">
                        <div className="p-4 bg-white border-b border-gray-200 sticky top-0 z-10">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Search Inventory..." 
                                    className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                                    value={salesSearch}
                                    onChange={e => setSalesSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="p-4 grid grid-cols-2 gap-3 pb-32">
                            {filteredProducts.map(prod => (
                                <div key={prod.id} onClick={() => addToVanCart(prod)} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm active:scale-95 transition-transform cursor-pointer">
                                    <div className="h-24 bg-gray-100 rounded mb-2 overflow-hidden">
                                        <img src={prod.image} className="w-full h-full object-cover" alt=""/>
                                    </div>
                                    <h4 className="font-bold text-sm truncate">{prod.name}</h4>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-brand-600 font-bold">₹{prod.price}</span>
                                        <div className="bg-brand-50 p-1 rounded-full text-brand-600"><Plus size={14}/></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Floating Cart for Van Sales */}
                        {vanCart.length > 0 && (
                            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 z-20">
                                <div className="flex justify-between items-center mb-4 cursor-pointer group">
                                    <span className="font-bold flex items-center gap-2">
                                        <ShoppingBag className="text-brand-600"/> Current Sale ({vanCart.reduce((a,b)=>a+b.quantity,0)})
                                    </span>
                                    <span className="text-lg font-bold">₹{vanCart.reduce((a,b)=>a+(b.price*b.quantity),0).toFixed(2)}</span>
                                </div>
                                <button onClick={completeVanSale} className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-brand-700 flex justify-center items-center gap-2">
                                    <CreditCard size={20}/> Collect Cash & Print
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* --- DELIVERY MODALS --- */}

            {/* 1. Scanner Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
                    <div className="p-4 flex justify-between items-center text-white">
                        <h2 className="font-bold text-lg">{scanMode ? 'Scan Package' : 'Verify Order'}</h2>
                        <button onClick={() => { setSelectedOrder(null); setScanMode(false); }} className="p-2 bg-white/20 rounded-full"><X/></button>
                    </div>

                    {!scanMode ? (
                        <div className="flex-1 bg-white rounded-t-2xl p-6 mt-auto h-3/4 flex flex-col">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Delivery for {selectedOrder.shippingAddress.city}</h3>
                            <p className="text-gray-500 mb-6">Order #{selectedOrder.id.slice(-6)} • {selectedOrder.items.length} Items</p>
                            
                            <div className="space-y-4 mb-8">
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-4">
                                    <Package className="text-gray-400" />
                                    <div>
                                        <p className="font-bold text-sm">Package Verification</p>
                                        <p className="text-xs text-gray-500">Scan QR on box to proceed</p>
                                    </div>
                                    <div className="ml-auto">
                                        {scanSuccess ? <CheckCircle className="text-green-500"/> : <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>}
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleStartScan}
                                className={`w-full py-4 rounded-xl font-bold flex justify-center items-center gap-2 ${scanSuccess ? 'bg-green-100 text-green-700' : 'bg-brand-600 text-white'}`}
                            >
                                {scanSuccess ? <><CheckCircle/> Verified</> : <><Scan/> Scan Package Code</>}
                            </button>

                            <button 
                                onClick={() => setEpodMode(true)}
                                disabled={!scanSuccess}
                                className="w-full mt-4 py-4 rounded-xl font-bold bg-slate-900 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Proceed to Proof
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center relative">
                            {/* Simulated Camera View */}
                            <div className="w-64 h-64 border-2 border-white rounded-2xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/20 to-transparent animate-scan"></div>
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-brand-500"></div>
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-brand-500"></div>
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-brand-500"></div>
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-brand-500"></div>
                            </div>
                            <p className="text-white mt-8 animate-pulse">Align QR code within frame...</p>
                            
                            {scanSuccess && (
                                <div className="absolute inset-0 bg-green-500/90 flex flex-col items-center justify-center text-white animate-fade-in">
                                    <CheckCircle size={64} className="mb-4" />
                                    <h3 className="text-2xl font-bold">Matched!</h3>
                                    <p>{scannedCode}</p>
                                    <button onClick={() => setScanMode(false)} className="mt-8 bg-white text-green-600 px-8 py-3 rounded-full font-bold">Continue</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* 2. ePOD Modal */}
            {epodMode && (
                <div className="fixed inset-0 z-50 bg-white flex flex-col animate-slide-in-right">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                        <h2 className="font-bold text-lg">Proof of Delivery</h2>
                        <button onClick={() => setEpodMode(false)} className="text-gray-500"><X/></button>
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto">
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><PenTool size={16}/> Customer Signature</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 touch-none h-40 relative">
                                <canvas 
                                    ref={canvasRef}
                                    width={350}
                                    height={160}
                                    className="w-full h-full"
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDrawing}
                                />
                                {!isDrawing && !signature && <p className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">Sign Here</p>}
                            </div>
                            <button onClick={() => { 
                                const canvas = canvasRef.current; 
                                const ctx = canvas?.getContext('2d'); 
                                ctx?.clearRect(0,0,canvas!.width,canvas!.height); 
                                setSignature(null); 
                            }} className="text-xs text-red-500 mt-2 underline">Clear Signature</button>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><Camera size={16}/> Photo Proof (Optional)</label>
                            <div className="border-2 border-gray-200 rounded-xl h-40 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                                {photo ? (
                                    <img src={photo} className="w-full h-full object-cover" alt="Proof" />
                                ) : (
                                    <>
                                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        <div className="text-center text-gray-400">
                                            <Camera size={32} className="mx-auto mb-2" />
                                            <p className="text-xs">Tap to capture</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-gray-200">
                        <button 
                            onClick={completeDelivery}
                            disabled={!signature}
                            className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
                        >
                            Complete Delivery
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
