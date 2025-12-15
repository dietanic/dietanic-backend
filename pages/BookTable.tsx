
import React, { useState } from 'react';
import { POSService } from '../services/storeService';
import { Table, Reservation } from '../types';
import { Calendar, Users, Clock, CheckCircle, Search, Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';

export const BookTable: React.FC = () => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        time: '19:00',
        partySize: 2,
        name: '',
        phone: ''
    });
    const [availableTables, setAvailableTables] = useState<Table[]>([]);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [loading, setLoading] = useState(false);
    const [bookingId, setBookingId] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const tables = await POSService.findAvailableTables(formData.date, formData.time, formData.partySize);
        setAvailableTables(tables);
        setLoading(false);
        setStep(2);
    };

    const confirmBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTable) return;
        setLoading(true);

        const newReservation: Reservation = {
            id: `res_${Date.now()}`,
            tableId: selectedTable.id,
            tableName: selectedTable.name,
            customerName: formData.name,
            customerPhone: formData.phone,
            date: formData.date,
            time: formData.time,
            partySize: formData.partySize,
            status: 'confirmed',
            createdAt: new Date().toISOString()
        };

        try {
            await POSService.createReservation(newReservation);
            setBookingId(newReservation.id);
            setStep(3);
        } catch (error) {
            alert("Booking failed. Table might have just been taken.");
            setStep(1);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
                <div className="md:flex">
                    <div className="md:flex-shrink-0 bg-brand-600 md:w-48 flex flex-col items-center justify-center text-white p-8">
                        <Utensils size={48} className="mb-4" />
                        <h2 className="text-xl font-bold text-center">Dietanic Dining</h2>
                        <p className="mt-2 text-brand-100 text-sm text-center">Book your table online instantly.</p>
                    </div>
                    <div className="p-8 w-full">
                        {step === 1 && (
                            <form onSubmit={handleSearch} className="space-y-6 animate-fade-in">
                                <div className="text-center mb-6">
                                    <h3 className="text-2xl font-bold text-gray-900">Find a Table</h3>
                                    <p className="text-gray-500">Select your preferences</p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Calendar size={16}/> Date</label>
                                    <input type="date" required className="w-full border border-gray-300 rounded-md p-2" 
                                        value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} min={new Date().toISOString().split('T')[0]}/>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Clock size={16}/> Time</label>
                                        <select className="w-full border border-gray-300 rounded-md p-2" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})}>
                                            {['11:00','12:00','13:00','14:00','18:00','19:00','20:00','21:00'].map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Users size={16}/> Guests</label>
                                        <select className="w-full border border-gray-300 rounded-md p-2" value={formData.partySize} onChange={e => setFormData({...formData, partySize: Number(e.target.value)})}>
                                            {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} People</option>)}
                                        </select>
                                    </div>
                                </div>

                                <button type="submit" disabled={loading} className="w-full bg-brand-600 text-white py-3 rounded-md font-bold hover:bg-brand-700 transition flex justify-center items-center gap-2">
                                    {loading ? 'Checking...' : <><Search size={18} /> Check Availability</>}
                                </button>
                            </form>
                        )}

                        {step === 2 && (
                            <div className="animate-fade-in">
                                <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-900 mb-4">&larr; Back</button>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Select a Table</h3>
                                
                                {availableTables.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-red-500 font-medium">No tables available for this time.</p>
                                        <p className="text-gray-500 text-sm mt-2">Please try a different time or date.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        {availableTables.map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => setSelectedTable(t)}
                                                className={`p-4 border-2 rounded-lg text-left transition-all ${
                                                    selectedTable?.id === t.id 
                                                    ? 'border-brand-600 bg-brand-50' 
                                                    : 'border-gray-200 hover:border-brand-300'
                                                }`}
                                            >
                                                <div className="font-bold">{t.name}</div>
                                                <div className="text-xs text-gray-500 capitalize">{t.type} • {t.capacity} Seats</div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {selectedTable && (
                                    <form onSubmit={confirmBooking} className="space-y-4 border-t border-gray-200 pt-4">
                                        <h4 className="font-medium text-gray-900">Contact Details</h4>
                                        <input 
                                            type="text" required placeholder="Your Name" 
                                            className="w-full border border-gray-300 rounded-md p-2"
                                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                        />
                                        <input 
                                            type="tel" required placeholder="Phone Number" 
                                            className="w-full border border-gray-300 rounded-md p-2"
                                            value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                                        />
                                        <button type="submit" disabled={loading} className="w-full bg-brand-600 text-white py-3 rounded-md font-bold hover:bg-brand-700 transition">
                                            {loading ? 'Confirming...' : 'Confirm Reservation'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}

                        {step === 3 && (
                            <div className="text-center animate-scale-in py-8">
                                <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle size={32} className="text-green-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
                                <p className="text-gray-500 mb-6">Your table is reserved. We look forward to seeing you.</p>
                                
                                <div className="bg-gray-50 p-4 rounded-lg text-left mb-6 text-sm">
                                    <p><span className="font-medium">Booking ID:</span> #{bookingId?.slice(-6)}</p>
                                    <p><span className="font-medium">Date:</span> {formData.date} at {formData.time}</p>
                                    <p><span className="font-medium">Table:</span> {selectedTable?.name}</p>
                                    <p><span className="font-medium">Guest:</span> {formData.name}</p>
                                </div>

                                <Link to="/" className="inline-block bg-gray-900 text-white px-6 py-2 rounded-md font-medium hover:bg-gray-800">
                                    Back to Home
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
