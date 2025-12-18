
import { useState, useEffect } from 'react';
import { POSService, CatalogService, posEvents, IdentityService, WalletService, SalesService, CustomerService } from '../services/storeService';
import { Table, Product, Category, CartItem, Reservation, User, CustomerProfile, Order } from '../types';

export const usePOS = () => {
    // --- State ---
    const [isEditMode, setIsEditMode] = useState(false);
    const [showReservations, setShowReservations] = useState(false);
    
    // Core Data
    const [tables, setTables] = useState<Table[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [activeTable, setActiveTable] = useState<Table | null>(null);
    const [selectedTableForEdit, setSelectedTableForEdit] = useState<Table | null>(null);
    
    // Catalog
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    
    // Active Order
    const [currentOrder, setCurrentOrder] = useState<CartItem[]>([]);
    const [orderNotes, setOrderNotes] = useState('');
    const [isSending, setIsSending] = useState(false);
    
    // Payment
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Wallet'>('Cash');
    const [cashReceived, setCashReceived] = useState<string>('');
    const [customerSearch, setCustomerSearch] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
    const [allCustomers, setAllCustomers] = useState<CustomerProfile[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [processingPayment, setProcessingPayment] = useState(false);

    // Modals
    const [itemToCustomize, setItemToCustomize] = useState<Product | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<'Starter' | 'Main' | 'Dessert' | 'Beverage'>('Main');

    // --- Initialization ---
    useEffect(() => {
        loadData();
        const handleUpdate = () => POSService.getTables().then(setTables);
        const handleResUpdate = () => POSService.getReservations().then(setReservations);
        
        posEvents.addEventListener('tables_updated', handleUpdate);
        posEvents.addEventListener('reservations_updated', handleResUpdate);
        
        return () => {
            posEvents.removeEventListener('tables_updated', handleUpdate);
            posEvents.removeEventListener('reservations_updated', handleResUpdate);
        };
    }, []);

    // Lazy load customers for payments
    useEffect(() => {
        if(isPaymentModalOpen) {
            Promise.all([CustomerService.getCustomers(), IdentityService.getUsers()])
                .then(([c, u]) => { setAllCustomers(c); setAllUsers(u); });
        } else {
            setCashReceived(''); setSelectedCustomer(null); setCustomerSearch('');
        }
    }, [isPaymentModalOpen]);

    const loadData = async () => {
        const [t, r, p, c] = await Promise.all([
            POSService.getTables(),
            POSService.getReservations(),
            CatalogService.getProducts(),
            CatalogService.getCategories()
        ]);
        setTables(t); setReservations(r); setProducts(p); setCategories(c);
    };

    // --- Logic ---

    const total = currentOrder.reduce((acc, item) => acc + item.price, 0);

    const handleTableSelect = (table: Table) => {
        if (isEditMode) {
            setSelectedTableForEdit(table);
        } else {
            setActiveTable(table);
            setCurrentOrder([]); // Reset for new/current active order (Mock)
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

    const sendToKitchen = async () => {
        if (!activeTable || currentOrder.length === 0) return;
        setIsSending(true);
        await POSService.sendOrderToKitchen(activeTable.id, currentOrder, orderNotes);
        setIsSending(false);
    };

    const handlePaymentComplete = async (currentUserId: string) => {
        if (!activeTable) return;
        setProcessingPayment(true);
        try {
            const order: Order = {
                id: `pos_${Date.now()}`,
                userId: selectedCustomer ? selectedCustomer.userId : 'guest',
                items: currentOrder,
                total: total,
                subtotal: total,
                status: 'delivered',
                date: new Date().toISOString(),
                shippingAddress: { street: 'Dine-In', city: '', state: '', zip: '' },
                paidWithWallet: paymentMethod === 'Wallet' ? total : 0
            };

            if (paymentMethod === 'Wallet') {
                if (!selectedCustomer) throw new Error("No customer selected");
                await WalletService.charge(selectedCustomer.userId, total, order.id);
            }

            await SalesService.createOrder(order);
            await POSService.billTable(activeTable.id);
            
            setIsPaymentModalOpen(false);
            setActiveTable(null);
            setCurrentOrder([]);
            setOrderNotes('');
        } catch (error: any) {
            alert(`Payment Failed: ${error.message}`);
        } finally {
            setProcessingPayment(false);
        }
    };

    // Grid Editor Logic
    const handleGridClick = async (x: number, y: number) => {
        if (!isEditMode) return;
        const existingTable = tables.find(t => t.x === x && t.y === y);

        if (selectedTableForEdit) {
            if (existingTable && existingTable.id !== selectedTableForEdit.id) {
                alert("Spot occupied!");
                return;
            }
            const updated = tables.map(t => t.id === selectedTableForEdit.id ? { ...t, x, y } : t);
            await POSService.saveTables(updated);
            setSelectedTableForEdit(null);
        } else if (existingTable) {
            setSelectedTableForEdit(existingTable);
        } else {
            if (confirm("Create new table here?")) {
                const name = prompt("Table Name (e.g. T10):");
                if (name) {
                    await POSService.saveTables([...tables, { 
                        id: `t_${Date.now()}`, name, capacity: 4, status: 'available', x, y, type: 'square' 
                    }]);
                }
            }
        }
    };

    const handleDeleteTable = async () => {
        if (selectedTableForEdit && confirm(`Delete ${selectedTableForEdit.name}?`)) {
            await POSService.saveTables(tables.filter(t => t.id !== selectedTableForEdit.id));
            setSelectedTableForEdit(null);
        }
    };

    // Helpers
    const displayProducts = selectedCategory === 'All' ? products : products.filter(p => p.category === selectedCategory);
    
    const filteredCustomers = customerSearch ? allCustomers.filter(c => {
        const u = allUsers.find(user => user.id === c.userId);
        return c.phone.includes(customerSearch) || (u?.name.toLowerCase() || '').includes(customerSearch.toLowerCase());
    }) : [];

    const getCustomerName = (id: string) => allUsers.find(u => u.id === id)?.name || 'Unknown';

    return {
        // State
        tables, reservations, activeTable, selectedTableForEdit, isEditMode, showReservations,
        products, categories, selectedCategory, displayProducts,
        currentOrder, orderNotes, total, isSending,
        isPaymentModalOpen, paymentMethod, cashReceived, customerSearch, selectedCustomer, processingPayment, filteredCustomers,
        itemToCustomize, selectedCourse,
        
        // Actions
        toggleEditMode: () => { setIsEditMode(!isEditMode); setSelectedTableForEdit(null); },
        toggleReservations: () => setShowReservations(!showReservations),
        setActiveTable, setSelectedCategory, setOrderNotes,
        setPaymentMethod, setCashReceived, setCustomerSearch, setSelectedCustomer, setIsPaymentModalOpen,
        setItemToCustomize, setSelectedCourse,
        
        // Methods
        handleTableSelect, handleGridClick, handleDeleteTable,
        addToOrder, removeFromOrder: (id: string) => setCurrentOrder(p => p.filter(i => i.cartItemId !== id)),
        sendToKitchen, handlePaymentComplete, getCustomerName
    };
};
