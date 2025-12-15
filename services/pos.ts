
import { Table, KitchenTicket, CartItem, Reservation } from '../types';
import { STORAGE_KEYS, delay, getLocalStorage, setLocalStorage } from './storage';

export const posEvents = new EventTarget();

// Mock Initial Tables
const INITIAL_TABLES: Table[] = [
    { id: 't1', name: 'T1', capacity: 2, status: 'available', x: 1, y: 1, type: 'round' },
    { id: 't2', name: 'T2', capacity: 2, status: 'available', x: 3, y: 1, type: 'round' },
    { id: 't3', name: 'T3', capacity: 4, status: 'available', x: 1, y: 3, type: 'square' },
    { id: 't4', name: 'T4', capacity: 4, status: 'available', x: 3, y: 3, type: 'square' },
    { id: 't5', name: 'Booth A', capacity: 6, status: 'available', x: 5, y: 1, type: 'booth' },
    { id: 't6', name: 'Booth B', capacity: 6, status: 'available', x: 5, y: 3, type: 'booth' },
];

export const POSService = {
    getTables: async (): Promise<Table[]> => {
        await delay(100);
        const tables = getLocalStorage<Table[]>('dietanic_pos_tables', []);
        if (tables.length === 0) {
            setLocalStorage('dietanic_pos_tables', INITIAL_TABLES);
            return INITIAL_TABLES;
        }
        return tables;
    },

    saveTables: async (tables: Table[]): Promise<void> => {
        await delay(200);
        setLocalStorage('dietanic_pos_tables', tables);
        posEvents.dispatchEvent(new Event('tables_updated'));
    },

    updateTableStatus: async (tableId: string, status: Table['status'], ticketId?: string): Promise<void> => {
        const tables = getLocalStorage<Table[]>('dietanic_pos_tables', INITIAL_TABLES);
        const idx = tables.findIndex(t => t.id === tableId);
        if (idx !== -1) {
            tables[idx].status = status;
            if (status === 'available') {
                tables[idx].currentTicketId = undefined;
            } else if (ticketId) {
                tables[idx].currentTicketId = ticketId;
            }
            setLocalStorage('dietanic_pos_tables', tables);
            posEvents.dispatchEvent(new Event('tables_updated'));
        }
    },

    // Reservation Operations
    getReservations: async (): Promise<Reservation[]> => {
        await delay(100);
        return getLocalStorage<Reservation[]>('dietanic_reservations', []);
    },

    createReservation: async (reservation: Reservation): Promise<void> => {
        await delay(500);
        const reservations = getLocalStorage<Reservation[]>('dietanic_reservations', []);
        
        // Simple conflict check
        const conflict = reservations.find(r => 
            r.tableId === reservation.tableId && 
            r.date === reservation.date && 
            r.time === reservation.time &&
            r.status !== 'cancelled'
        );

        if (conflict) {
            throw new Error("This table is already booked for this time.");
        }

        reservations.push(reservation);
        setLocalStorage('dietanic_reservations', reservations);
        posEvents.dispatchEvent(new Event('reservations_updated'));
    },

    findAvailableTables: async (date: string, time: string, partySize: number): Promise<Table[]> => {
        await delay(300);
        const tables = getLocalStorage<Table[]>('dietanic_pos_tables', INITIAL_TABLES);
        const reservations = getLocalStorage<Reservation[]>('dietanic_reservations', []);

        // Filter tables by capacity
        const eligibleTables = tables.filter(t => t.capacity >= partySize);

        // Filter out booked tables
        // We assume a reservation blocks the table for 1 hour for simplicity
        const availableTables = eligibleTables.filter(table => {
            const isBooked = reservations.some(res => {
                if (res.tableId !== table.id) return false;
                if (res.date !== date) return false;
                if (res.status === 'cancelled') return false;

                // Simple exact match check for the demo
                // In production, check overlapping time ranges
                return res.time === time; 
            });
            return !isBooked;
        });

        return availableTables;
    },

    // Kitchen Operations
    getTickets: async (): Promise<KitchenTicket[]> => {
        await delay(100);
        return getLocalStorage<KitchenTicket[]>('dietanic_kitchen_tickets', []);
    },

    sendOrderToKitchen: async (tableId: string, items: CartItem[], notes?: string): Promise<void> => {
        await delay(200);
        const tickets = getLocalStorage<KitchenTicket[]>('dietanic_kitchen_tickets', []);
        const tables = getLocalStorage<Table[]>('dietanic_pos_tables', INITIAL_TABLES);
        const table = tables.find(t => t.id === tableId);

        if (!table) throw new Error("Table not found");

        const newTicket: KitchenTicket = {
            id: `kt_${Date.now()}`,
            tableId,
            tableName: table.name,
            items,
            status: 'pending',
            timestamp: new Date().toISOString(),
            notes
        };

        tickets.push(newTicket);
        setLocalStorage('dietanic_kitchen_tickets', tickets);

        // Update table to occupied
        await POSService.updateTableStatus(tableId, 'occupied', newTicket.id);
        posEvents.dispatchEvent(new Event('kitchen_updated'));
    },

    updateTicketStatus: async (ticketId: string, status: KitchenTicket['status']): Promise<void> => {
        const tickets = getLocalStorage<KitchenTicket[]>('dietanic_kitchen_tickets', []);
        const idx = tickets.findIndex(t => t.id === ticketId);
        if (idx !== -1) {
            tickets[idx].status = status;
            setLocalStorage('dietanic_kitchen_tickets', tickets);
            posEvents.dispatchEvent(new Event('kitchen_updated'));
        }
    },

    billTable: async (tableId: string): Promise<void> => {
        // Clear the table
        await POSService.updateTableStatus(tableId, 'available');
    }
};
