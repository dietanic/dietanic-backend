
import React, { useState, useEffect } from 'react';
import { POSService, CatalogService, posEvents } from '../services/storeService';
import { Table, Product, Category, CartItem, Reservation } from '../types';
import { 
    LayoutGrid, Users, Coffee, Utensils, X, Check, ChefHat, 
    CreditCard, Trash2, Plus, Minus, ArrowLeft, RefreshCw, 
    Edit3, Save, Move, CalendarClock, Phone, Clock 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const POS: React.FC = () => {
    // Mode States
    const [isEditMode, setIsEditMode] = useState(false);
    const [showReservations, setShowReservations] = useState(false);

    // Data States
    const [tables, setTables] = useState<Table[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [activeTable, setActiveTable] = useState<Table | null>(null);
    const [selectedTableForEdit, setSelectedTableForEdit] = useState<Table | null>(null);
    
    // Terminal State
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [currentOrder, setCurrentOrder] = useState<CartItem[]>([]);
    const [orderNotes, setOrderNotes] = useState('');
    const [isSending, setIsSending] = useState(false);
    
    // Combo/Course Modal
    const [itemToCustomize, setItemToCustomize] = useState<Product | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<'Starter' | 'Main' | 'Dessert' | 'Beverage'>('Main');

    // Grid Configuration
    const GRID_COLS = 8;
    const GRID_ROWS = 6;

    useEffect(() => {
        loadData();
        const handleUpdate = () => loadTables();
        const handleResUpdate = () => loadReservations();
        
        posEvents.addEventListener('tables_updated', handleUpdate);
        posEvents.addEventListener('reservations_updated', handleResUpdate);
        
        return () => {
            posEvents.removeEventListener('tables_updated', handleUpdate);
            posEvents.removeEventListener('reservations_updated', handleResUpdate);
        };
    }, []);

    const loadData = async () => {
        await loadTables();
        await loadReservations();
        const [p, c] = await Promise.all([CatalogService.getProducts(), CatalogService.getCategories()]);
        setProducts(p);
        setCategories(c);
    };

    const loadTables = async () => {
        const t = await POSService.getTables();
        setTables(t);
    };

    const loadReservations = async () => {
        const r = await POSService.getReservations();
        setReservations(r);
    };

    // --- POS Logic ---
    const handleTableSelect = (table: Table) => {
        if (isEditMode) {
            setSelectedTableForEdit(table);
        } else {
            setActiveTable(table);
            setCurrentOrder([]); 
        }
    };

    const addToOrder = (product: Product, course: 'Starter' | 'Main' | 'Dessert' | 'Beverage') => {
        const newItem: CartItem = {
            ...product,
            quantity: 1,
            cartItemId: Date.now().toString(),
            course
        };
        setCurrentOrder(prev => [...prev, newItem]);
        setItemToCustomize(null); 
    };

    const removeFromOrder = (cartItemId: string) => {
        setCurrentOrder(prev => prev.filter(i => i.cartItemId !== cartItemId));
    };

    const sendToKitchen = async () => {
        if (!activeTable || currentOrder.length === 0) return;
        setIsSending(true);
        await POSService.sendOrderToKitchen(activeTable.id, currentOrder, orderNotes);
        setIsSending(false);
        setActiveTable(null); 
        setCurrentOrder([]);
        setOrderNotes('');
    };

    const handleBillTable = async () => {
        if (!activeTable) return;
        if (confirm(`Finalize bill for ${activeTable.name}? This will clear the table.`)) {
            await POSService.billTable(activeTable.id);
            setActiveTable(null);
        }
    };

    // --- Editor Logic ---
    const handleGridClick = async (x: number, y: number) => {
        if (!isEditMode) return;

        // Check if spot is occupied
        const existingTable = tables.find(t => t.x === x && t.y === y);

        if (selectedTableForEdit) {
            // Move Logic
            if (existingTable && existingTable.id !== selectedTableForEdit.id) {
                alert("Spot already occupied!");
                return;
            }
            
            const updatedTables = tables.map(t => 
                t.id === selectedTableForEdit.id ? { ...t, x, y } : t
            );
            await POSService.saveTables(updatedTables);
            setSelectedTableForEdit(null); // Deselect after move
        } else if (existingTable) {
            // Select existing
            setSelectedTableForEdit(existingTable);
        } else {
            // Add New Table logic could go here (e.g., prompt to create)
            if (confirm("Create new table here?")) {
                const name = prompt("Enter Table Name (e.g. T10):");
                if (name) {
                    const newTable: Table = {
                        id: `t_${Date.now()}`,
                        name,
                        capacity: 4,
                        status: 'available',
                        x, y,
                        type: 'square'
                    };
                    await POSService.saveTables([...tables, newTable]);
                }
            }
        }
    };

    const handleDeleteTable = async () => {
        if (selectedTableForEdit && confirm(`Delete ${selectedTableForEdit.name}?`)) {
            const updatedTables = tables.filter(t => t.id !== selectedTableForEdit.id);
            await POSService.saveTables(updatedTables);
            setSelectedTableForEdit(null);
        }
    };

    const toggleEditMode = () => {
        setIsEditMode(!isEditMode);
        setSelectedTableForEdit(null);
    };

    // --- Helpers ---
    const getTableReservation = (tableId: string) => {
        // Simplified: check if reservation exists within current hour window
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const currentHour = now.getHours();

        return reservations.find(r => 
            r.tableId === tableId && 
            r.date === dateStr && 
            Math.abs(parseInt(r.time.split(':')[0]) - currentHour) < 1 &&
            r.status !== 'cancelled'
        );
    };

    const total = currentOrder.reduce((acc, item) => acc + item.price, 0);
    const displayProducts = selectedCategory === 'All' ? products : products.filter(p => p.category === selectedCategory);

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* Left Sidebar / Floor Plan */}
            <div className={`flex flex-col border-r border-gray-200 bg-white transition-all duration-300 ${activeTable ? 'w-1/4 hidden lg:flex' : 'w-full'}`}>
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-900 text-white">
                    <h1 className="font-bold text-xl flex items-center gap-2"><LayoutGrid /> Floor Plan</h1>
                    <div className="flex gap-2">
                         <button onClick={() => setShowReservations(!showReservations)} className={`p-2 rounded hover:bg-gray-700 ${showReservations ? 'bg-gray-700' : ''}`} title="Reservations">
                            <CalendarClock size={20} />
                        </button>
                        <button onClick={toggleEditMode} className={`p-2 rounded hover:bg-gray-700 ${isEditMode ? 'bg-brand-600' : ''}`} title="Edit Layout">
                            {isEditMode ? <Check size={20} /> : <Edit3 size={20} />}
                        </button>
                        <Link to="/admin" className="text-sm bg-gray-800 px-3 py-1 rounded hover:bg-gray-700 flex items-center">Exit</Link>
                    </div>
                </div>
                
                <div className="flex-1 flex overflow-hidden">
                    {/* Reservations Sidebar */}
                    {showReservations && (
                        <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto p-4 animate-fade-in">
                            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><CalendarClock size={16}/> Today's Bookings</h3>
                            <div className="space-y-3">
                                {reservations.filter(r => r.date === new Date().toISOString().split('T')[0]).length === 0 && <p className="text-sm text-gray-400 italic">No bookings for today.</p>}
                                {reservations.filter(r => r.date === new Date().toISOString().split('T')[0]).map(res => (
                                    <div key={res.id} className="bg-white p-3 rounded shadow-sm border border-gray-200">
                                        <div className="flex justify-between items-start">
                                            <span className="font-bold text-gray-900">{res.time}</span>
                                            <span className="text-xs bg-brand-100 text-brand-800 px-2 py-0.5 rounded-full">{res.tableName}</span>
                                        </div>
                                        <div className="text-sm font-medium mt-1">{res.customerName}</div>
                                        <div className="text-xs text-gray-500 flex items-center gap-1"><Users size={12}/> {res.partySize} guests</div>
                                        {res.customerPhone && <div className="text-xs text-gray-500 flex items-center gap-1 mt-1"><Phone size={12}/> {res.customerPhone}</div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Floor Plan Grid */}
                    <div className="flex-1 p-6 overflow-auto bg-gray-100 relative">
                        {isEditMode && <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-bold shadow-md z-10 animate-bounce">Design Mode Active: Click table to select, then click empty spot to move.</div>}
                        
                        <div 
                            className="grid gap-4 mx-auto" 
                            style={{ 
                                gridTemplateColumns: `repeat(${GRID_COLS}, minmax(80px, 1fr))`, 
                                gridTemplateRows: `repeat(${GRID_ROWS}, minmax(80px, 1fr))`,
                                width: 'fit-content'
                            }}
                        >
                            {Array.from({ length: GRID_ROWS * GRID_COLS }).map((_, idx) => {
                                const x = idx % GRID_COLS;
                                const y = Math.floor(idx / GRID_COLS);
                                const table = tables.find(t => t.x === x && t.y === y);
                                const isSelected = selectedTableForEdit?.id === table?.id;
                                const reservation = table ? getTableReservation(table.id) : null;

                                return (
                                    <div 
                                        key={`${x}-${y}`} 
                                        onClick={() => handleGridClick(x, y)}
                                        className={`
                                            relative rounded-xl flex flex-col items-center justify-center p-2 transition-all duration-300
                                            ${!table && isEditMode ? 'border-2 border-dashed border-gray-300 hover:bg-gray-200 cursor-pointer' : ''}
                                            ${table ? 'shadow-md cursor-pointer hover:scale-105' : ''}
                                            ${table && isEditMode ? 'cursor-move' : ''}
                                            ${isSelected ? 'ring-4 ring-brand-500 scale-110 z-10' : ''}
                                            ${table?.status === 'occupied' ? 'bg-red-100 border-2 border-red-500 text-red-800' : 
                                              table?.status === 'billed' ? 'bg-blue-100 border-2 border-blue-500 text-blue-800' : 
                                              table ? 'bg-white border-2 border-green-500 text-green-800' : ''}
                                        `}
                                        style={{ aspectRatio: '1/1', minHeight: '80px' }}
                                    >
                                        {table ? (
                                            <>
                                                <div onClick={(e) => { if(!isEditMode) { e.stopPropagation(); handleTableSelect(table); } }} className="w-full h-full flex flex-col items-center justify-center">
                                                    <span className="text-lg font-bold">{table.name}</span>
                                                    <div className="flex items-center gap-1 text-[10px] uppercase opacity-75 font-bold">
                                                        <Users size={10} /> {table.capacity}
                                                    </div>
                                                    {reservation && (
                                                        <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 z-20">
                                                            <Clock size={8} /> {reservation.time}
                                                        </span>
                                                    )}
                                                </div>
                                                {isEditMode && isSelected && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteTable(); }} 
                                                        className="absolute -bottom-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow hover:bg-red-600"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side / Terminal (Same as before) */}
            {activeTable ? (
                <div className="flex-1 flex flex-col h-full bg-white w-full">
                    {/* Terminal Header */}
                    <div className="h-16 border-b border-gray-200 flex justify-between items-center px-6 bg-white shadow-sm z-10">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setActiveTable(null)} className="lg:hidden p-2 bg-gray-100 rounded-full"><ArrowLeft /></button>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">{activeTable.name}</h2>
                                <span className="text-xs text-gray-500">Order Taking Mode</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             <div className="text-right mr-4">
                                 <p className="text-xs text-gray-500">Current Total</p>
                                 <p className="text-xl font-bold text-brand-600">₹{total.toFixed(2)}</p>
                             </div>
                             <button onClick={handleBillTable} className="bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-900">
                                 <CreditCard size={18} /> Bill
                             </button>
                             <button 
                                onClick={sendToKitchen} 
                                disabled={currentOrder.length === 0 || isSending}
                                className="bg-brand-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                             >
                                 {isSending ? <RefreshCw className="animate-spin" /> : <ChefHat size={18} />}
                                 Send to Kitchen
                             </button>
                        </div>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        {/* Product Selection Area */}
                        <div className="flex-1 flex flex-col border-r border-gray-200 bg-gray-50">
                            {/* Categories */}
                            <div className="p-2 bg-white shadow-sm overflow-x-auto whitespace-nowrap">
                                <button
                                    onClick={() => setSelectedCategory('All')}
                                    className={`px-4 py-2 rounded-full text-sm font-bold mr-2 transition-colors ${selectedCategory === 'All' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    All
                                </button>
                                {categories.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => setSelectedCategory(c.name)}
                                        className={`px-4 py-2 rounded-full text-sm font-bold mr-2 transition-colors ${selectedCategory === c.name ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        {c.name}
                                    </button>
                                ))}
                            </div>

                            {/* Grid */}
                            <div className="flex-1 p-4 overflow-y-auto">
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {displayProducts.map(product => (
                                        <button
                                            key={product.id}
                                            onClick={() => { setItemToCustomize(product); setSelectedCourse('Main'); }}
                                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-brand-500 hover:shadow-md transition-all text-left flex flex-col h-32"
                                        >
                                            <span className="font-bold text-gray-900 line-clamp-2 leading-tight">{product.name}</span>
                                            <span className="text-xs text-gray-500 mt-1">{product.category}</span>
                                            <span className="mt-auto font-bold text-brand-600">₹{product.price}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Current Ticket Preview */}
                        <div className="w-96 bg-white flex flex-col shadow-xl z-20">
                            <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700">
                                Current Ticket
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {currentOrder.length === 0 ? (
                                    <div className="text-center text-gray-400 mt-10">
                                        <Utensils className="mx-auto mb-2 opacity-50" size={48} />
                                        <p>No items added yet</p>
                                    </div>
                                ) : (
                                    ['Starter', 'Main', 'Dessert', 'Beverage'].map(course => {
                                        const itemsInCourse = currentOrder.filter(i => i.course === course);
                                        if (itemsInCourse.length === 0) return null;
                                        return (
                                            <div key={course} className="mb-4">
                                                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2 border-b border-gray-100 pb-1">{course}</h3>
                                                {itemsInCourse.map(item => (
                                                    <div key={item.cartItemId} className="flex justify-between items-start mb-2 group">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                                            <p className="text-xs text-gray-500">₹{item.price}</p>
                                                        </div>
                                                        <button 
                                                            onClick={() => removeFromOrder(item.cartItemId)}
                                                            className="text-gray-400 hover:text-red-500 p-1"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            <div className="p-4 border-t border-gray-200 bg-gray-50">
                                <input 
                                    type="text" 
                                    placeholder="Kitchen Notes / Allergies..." 
                                    className="w-full text-sm p-2 border border-gray-300 rounded mb-2"
                                    value={orderNotes}
                                    onChange={e => setOrderNotes(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="hidden lg:flex flex-1 items-center justify-center bg-gray-50 text-gray-400 flex-col gap-4">
                    <LayoutGrid size={64} opacity={0.2} />
                    <p className="text-lg font-medium">Select a table to start an order</p>
                    <p className="text-sm">or use Design Mode to edit layout</p>
                </div>
            )}

            {/* Course Selection Modal */}
            {itemToCustomize && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-96 animate-scale-in">
                        <h3 className="text-lg font-bold mb-4">Add {itemToCustomize.name}</h3>
                        <p className="text-sm text-gray-600 mb-4">Select Course:</p>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {['Starter', 'Main', 'Dessert', 'Beverage'].map((c: any) => (
                                <button
                                    key={c}
                                    onClick={() => setSelectedCourse(c)}
                                    className={`py-3 rounded-lg border font-medium ${selectedCourse === c ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-200 hover:border-brand-300'}`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setItemToCustomize(null)} className="flex-1 py-3 rounded-lg border border-gray-300 font-medium hover:bg-gray-50">Cancel</button>
                            <button onClick={() => addToOrder(itemToCustomize, selectedCourse)} className="flex-1 py-3 rounded-lg bg-brand-600 text-white font-bold hover:bg-brand-700">Add Item</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
