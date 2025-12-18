
import React from 'react';
import { 
    LayoutGrid, Users, Utensils, Check, ChefHat, 
    CreditCard, Trash2, Edit3, CalendarClock, Phone, Clock, DollarSign, Wallet, Search, X 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePOS } from '../hooks/usePOS';
import { useAuth } from '../App';

export const POS: React.FC = () => {
    const { user } = useAuth();
    
    // Deconstruct ViewModel
    const {
        tables, reservations, activeTable, selectedTableForEdit, isEditMode, showReservations,
        categories, selectedCategory, displayProducts,
        currentOrder, orderNotes, total, isSending,
        isPaymentModalOpen, paymentMethod, cashReceived, customerSearch, selectedCustomer, processingPayment, filteredCustomers,
        itemToCustomize, selectedCourse,
        
        toggleEditMode, toggleReservations,
        setActiveTable, setSelectedCategory, setOrderNotes,
        setPaymentMethod, setCashReceived, setCustomerSearch, setSelectedCustomer, setIsPaymentModalOpen,
        setItemToCustomize, setSelectedCourse,
        
        handleTableSelect, handleGridClick, handleDeleteTable,
        addToOrder, removeFromOrder, sendToKitchen, handlePaymentComplete, getCustomerName
    } = usePOS();

    // Grid Configuration
    const GRID_COLS = 8;
    const GRID_ROWS = 6;

    // Helper to get Reservation for a table
    const getTableReservation = (tableId: string) => {
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

    // Calculate Change Due
    const cashAmount = parseFloat(cashReceived) || 0;
    const changeDue = Math.max(0, cashAmount - total);

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
            {/* Left Sidebar / Floor Plan */}
            <div className={`flex flex-col border-r border-gray-200 bg-white transition-all duration-300 ${activeTable ? 'w-1/4 hidden lg:flex' : 'w-full'}`}>
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-900 text-white shadow-md">
                    <h1 className="font-bold text-xl flex items-center gap-2"><LayoutGrid /> Floor Plan</h1>
                    <div className="flex gap-2">
                         <button onClick={toggleReservations} className={`p-2 rounded hover:bg-gray-700 ${showReservations ? 'bg-gray-700' : ''}`} title="Reservations">
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
                                            ${table?.status === 'occupied' ? 'bg-red-50 border-2 border-red-500 text-red-800' : 
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

            {/* Right Side / Terminal */}
            {activeTable ? (
                <div className="flex-1 flex flex-col h-full bg-white w-full animate-fade-in">
                    {/* Terminal Header */}
                    <div className="h-16 border-b border-gray-200 flex justify-between items-center px-6 bg-white shadow-sm z-10">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setActiveTable(null)} className="lg:hidden p-2 bg-gray-100 rounded-full"><X size={18} /></button>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">{activeTable.name}</h2>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Order Taking</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                             <div className="text-right mr-4 hidden sm:block">
                                 <p className="text-xs text-gray-500">Current Total</p>
                                 <p className="text-xl font-bold text-brand-600">₹{total.toFixed(2)}</p>
                             </div>
                             <button 
                                onClick={sendToKitchen} 
                                disabled={currentOrder.length === 0 || isSending}
                                className="bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                             >
                                 <ChefHat size={18} />
                                 <span className="hidden sm:inline">To Kitchen</span>
                             </button>
                             <button 
                                onClick={() => setIsPaymentModalOpen(true)} 
                                className="bg-brand-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-700 shadow-md font-bold transition-all transform hover:scale-105"
                             >
                                 <CreditCard size={18} /> Pay ₹{total.toFixed(0)}
                             </button>
                        </div>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        {/* Product Selection Area */}
                        <div className="flex-1 flex flex-col border-r border-gray-200 bg-gray-50/50">
                            {/* Categories */}
                            <div className="p-3 bg-white shadow-sm overflow-x-auto whitespace-nowrap scrollbar-hide">
                                <button
                                    onClick={() => setSelectedCategory('All')}
                                    className={`px-5 py-2 rounded-full text-sm font-bold mr-2 transition-all ${selectedCategory === 'All' ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
                                >
                                    All
                                </button>
                                {categories.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => setSelectedCategory(c.name)}
                                        className={`px-5 py-2 rounded-full text-sm font-bold mr-2 transition-all ${selectedCategory === c.name ? 'bg-brand-600 text-white shadow-md' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
                                    >
                                        {c.name}
                                    </button>
                                ))}
                            </div>

                            {/* Grid */}
                            <div className="flex-1 p-4 overflow-y-auto">
                                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {displayProducts.map(product => (
                                        <button
                                            key={product.id}
                                            onClick={() => { setItemToCustomize(product); setSelectedCourse('Main'); }}
                                            className="bg-white p-0 rounded-xl shadow-sm border border-gray-200 hover:border-brand-500 hover:shadow-lg transition-all text-left flex flex-col h-48 overflow-hidden group"
                                        >
                                            <div className="h-24 bg-gray-100 w-full relative overflow-hidden">
                                                <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                                <span className="absolute bottom-2 left-2 text-white font-bold text-lg drop-shadow-md">₹{product.price}</span>
                                            </div>
                                            <div className="p-3 flex flex-col flex-1 justify-between">
                                                <span className="font-bold text-gray-900 line-clamp-2 leading-tight">{product.name}</span>
                                                <span className="text-[10px] uppercase font-bold text-gray-400 mt-1">{product.category}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Current Ticket Preview */}
                        <div className="w-80 lg:w-96 bg-white flex flex-col shadow-xl z-20 border-l border-gray-200">
                            <div className="p-4 bg-white border-b border-gray-100 font-bold text-gray-800 flex justify-between items-center">
                                <span>Order Summary</span>
                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">{currentOrder.length} Items</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
                                {currentOrder.length === 0 ? (
                                    <div className="text-center text-gray-400 mt-20 flex flex-col items-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                            <Utensils className="opacity-30" size={32} />
                                        </div>
                                        <p>Start adding items</p>
                                    </div>
                                ) : (
                                    ['Starter', 'Main', 'Dessert', 'Beverage'].map(course => {
                                        const itemsInCourse = currentOrder.filter(i => i.course === course);
                                        if (itemsInCourse.length === 0) return null;
                                        return (
                                            <div key={course} className="mb-4 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                                <h3 className="text-[10px] font-bold text-brand-600 uppercase mb-2 tracking-wider">{course}</h3>
                                                {itemsInCourse.map(item => (
                                                    <div key={item.cartItemId} className="flex justify-between items-start mb-2 last:mb-0 group">
                                                        <div className="flex items-start gap-2">
                                                            <span className="font-mono text-gray-400 text-xs mt-0.5">1x</span>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900 leading-tight">{item.name}</p>
                                                                <p className="text-xs text-gray-500">₹{item.price}</p>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => removeFromOrder(item.cartItemId)}
                                                            className="text-gray-300 hover:text-red-500 p-1 transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            <div className="p-4 border-t border-gray-200 bg-white">
                                <input 
                                    type="text" 
                                    placeholder="Kitchen Notes / Allergies..." 
                                    className="w-full text-sm p-2 border border-gray-300 rounded mb-4 focus:ring-2 focus:ring-brand-500 outline-none"
                                    value={orderNotes}
                                    onChange={e => setOrderNotes(e.target.value)}
                                />
                                <div className="flex justify-between items-center text-lg font-bold">
                                    <span>Total</span>
                                    <span>₹{total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="hidden lg:flex flex-1 items-center justify-center bg-gray-50 text-gray-400 flex-col gap-4">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <LayoutGrid size={48} opacity={0.3} className="text-brand-600" />
                    </div>
                    <p className="text-lg font-medium text-gray-600">Select a table to start an order</p>
                    <p className="text-sm bg-gray-200 px-3 py-1 rounded-full">or use Edit Mode to design floor plan</p>
                </div>
            )}

            {/* Course Selection Modal */}
            {itemToCustomize && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-scale-in">
                        <h3 className="text-xl font-bold mb-1">{itemToCustomize.name}</h3>
                        <p className="text-gray-500 mb-6 text-sm">Assign to course for kitchen timing</p>
                        
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {['Starter', 'Main', 'Dessert', 'Beverage'].map((c: any) => (
                                <button
                                    key={c}
                                    onClick={() => setSelectedCourse(c)}
                                    className={`py-4 rounded-xl border-2 font-bold text-sm transition-all ${selectedCourse === c ? 'bg-brand-50 border-brand-500 text-brand-700' : 'border-gray-100 hover:border-gray-300 text-gray-600'}`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setItemToCustomize(null)} className="flex-1 py-3.5 rounded-xl border border-gray-300 font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
                            <button onClick={() => addToOrder(itemToCustomize, selectedCourse)} className="flex-1 py-3.5 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 shadow-lg shadow-brand-200">Add Item</button>
                        </div>
                    </div>
                </div>
            )}

            {/* PAYMENT MODAL */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[600px] animate-scale-in">
                        {/* Header */}
                        <div className="bg-gray-900 text-white p-6 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold">Payment</h2>
                                <p className="text-gray-400 text-sm">Table: {activeTable?.name} • Ticket #{Date.now().toString().slice(-4)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400 uppercase font-bold">Total Due</p>
                                <p className="text-3xl font-bold text-green-400">₹{total.toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="flex flex-1 overflow-hidden">
                            {/* Sidebar Methods */}
                            <div className="w-1/3 bg-gray-50 border-r border-gray-200 p-4 space-y-3">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Select Method</p>
                                <button onClick={() => setPaymentMethod('Cash')} className={`w-full text-left p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${paymentMethod === 'Cash' ? 'border-brand-500 bg-white shadow-md' : 'border-transparent hover:bg-gray-100'}`}>
                                    <DollarSign className={paymentMethod === 'Cash' ? 'text-brand-600' : 'text-gray-400'} />
                                    <span className="font-bold text-gray-700">Cash</span>
                                </button>
                                <button onClick={() => setPaymentMethod('Card')} className={`w-full text-left p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${paymentMethod === 'Card' ? 'border-blue-500 bg-white shadow-md' : 'border-transparent hover:bg-gray-100'}`}>
                                    <CreditCard className={paymentMethod === 'Card' ? 'text-blue-600' : 'text-gray-400'} />
                                    <span className="font-bold text-gray-700">Card / UPI</span>
                                </button>
                                <button onClick={() => setPaymentMethod('Wallet')} className={`w-full text-left p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${paymentMethod === 'Wallet' ? 'border-purple-500 bg-white shadow-md' : 'border-transparent hover:bg-gray-100'}`}>
                                    <Wallet className={paymentMethod === 'Wallet' ? 'text-purple-600' : 'text-gray-400'} />
                                    <span className="font-bold text-gray-700">Dietanic Wallet</span>
                                </button>
                            </div>

                            {/* Method Details */}
                            <div className="flex-1 p-6 flex flex-col">
                                {paymentMethod === 'Cash' && (
                                    <div className="flex-1 flex flex-col">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Cash Received</label>
                                        <div className="relative mb-6">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">₹</span>
                                            <input 
                                                type="number" 
                                                autoFocus
                                                value={cashReceived} 
                                                onChange={e => setCashReceived(e.target.value)} 
                                                className="w-full bg-gray-100 border-2 border-transparent focus:border-brand-500 rounded-xl py-4 pl-10 pr-4 text-3xl font-bold text-gray-800 outline-none transition-all"
                                                placeholder="0"
                                            />
                                        </div>
                                        
                                        <div className="grid grid-cols-3 gap-3 mb-6">
                                            {[100, 200, 500, 2000].map(amt => (
                                                <button key={amt} onClick={() => setCashReceived(amt.toString())} className="py-2 border border-gray-200 rounded-lg font-medium hover:bg-gray-50">₹{amt}</button>
                                            ))}
                                            <button onClick={() => setCashReceived(total.toString())} className="col-span-2 py-2 bg-brand-50 text-brand-700 border border-brand-200 rounded-lg font-bold">Exact Amount</button>
                                        </div>

                                        <div className="mt-auto bg-gray-50 p-4 rounded-xl border border-gray-200">
                                            <div className="flex justify-between items-center text-lg">
                                                <span className="text-gray-500">Change Due:</span>
                                                <span className={`font-bold text-2xl ${changeDue < 0 ? 'text-red-500' : 'text-gray-900'}`}>₹{changeDue.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {paymentMethod === 'Wallet' && (
                                    <div className="flex-1 flex flex-col">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Customer Search</label>
                                        <div className="relative mb-4">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                                            <input 
                                                type="text" 
                                                placeholder="Search by Name or Phone..." 
                                                className="w-full border border-gray-300 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-purple-500"
                                                value={customerSearch}
                                                onChange={e => setCustomerSearch(e.target.value)}
                                            />
                                        </div>

                                        <div className="flex-1 overflow-y-auto border rounded-xl mb-4">
                                            {filteredCustomers.length === 0 ? (
                                                <div className="p-8 text-center text-gray-400">Search for a registered customer</div>
                                            ) : (
                                                filteredCustomers.map(cust => (
                                                    <div 
                                                        key={cust.id} 
                                                        onClick={() => setSelectedCustomer(cust)}
                                                        className={`p-3 border-b cursor-pointer flex justify-between items-center ${selectedCustomer?.id === cust.id ? 'bg-purple-50' : 'hover:bg-gray-50'}`}
                                                    >
                                                        <div>
                                                            <div className="font-bold text-gray-800">{getCustomerName(cust.userId)}</div>
                                                            <div className="text-xs text-gray-500">{cust.phone}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xs text-gray-400 uppercase">Balance</div>
                                                            <div className={`font-bold ${cust.walletBalance < total ? 'text-red-500' : 'text-green-600'}`}>₹{cust.walletBalance.toFixed(2)}</div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        {selectedCustomer && selectedCustomer.walletBalance < total && (
                                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                                                <X size={16}/> Insufficient Funds. Balance: ₹{selectedCustomer.walletBalance}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {paymentMethod === 'Card' && (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4 animate-pulse">
                                            <CreditCard size={40} />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800">Ready to Scan</h3>
                                        <p className="text-gray-500 mt-2 mb-4">Swipe card or scan QR code on terminal.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-gray-200 bg-white flex justify-between items-center">
                            <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-500 font-bold hover:text-gray-800">Cancel</button>
                            <button 
                                onClick={() => handlePaymentComplete(user.id)}
                                disabled={processingPayment || (paymentMethod === 'Cash' && changeDue < 0) || (paymentMethod === 'Wallet' && (!selectedCustomer || selectedCustomer.walletBalance < total))}
                                className="bg-brand-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-brand-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {processingPayment ? <span className="animate-spin">...</span> : <Check size={24}/>}
                                Confirm Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
