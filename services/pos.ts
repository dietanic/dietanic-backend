
import { Table, KitchenTicket, CartItem, Reservation } from '../types';
import { DB, delay, setLocalStorage } from './storage';

export const posEvents = new EventTarget();
const TBL_KEY = 'dietanic_pos_tables';
const TKT_KEY = 'dietanic_kitchen_tickets';
const RES_KEY = 'dietanic_reservations';

const INIT_TBLS: Table[] = [ { id: 't1', name: 'T1', capacity: 2, status: 'available', x: 1, y: 1, type: 'round' } ];

export const POSService = {
    getTables: () => DB.getAll<Table>(TBL_KEY, INIT_TBLS),
    saveTables: async (t: Table[]) => { await delay(); setLocalStorage(TBL_KEY, t); posEvents.dispatchEvent(new Event('tables_updated')); },
    updateTableStatus: async (id: string, status: Table['status'], tid?: string) => {
        const tables = await DB.getAll<Table>(TBL_KEY, INIT_TBLS);
        const t = tables.find(x => x.id === id);
        if(t) { t.status = status; t.currentTicketId = status === 'available' ? undefined : tid; await POSService.saveTables(tables); }
    },
    getReservations: () => DB.getAll<Reservation>(RES_KEY, []),
    createReservation: async (r: Reservation) => {
        const existing = await DB.getAll<Reservation>(RES_KEY);
        if(existing.some(x => x.tableId===r.tableId && x.date===r.date && x.time===r.time)) throw new Error("Booked");
        await DB.add(RES_KEY, r); posEvents.dispatchEvent(new Event('reservations_updated'));
    },
    findAvailableTables: async (date: string, time: string, size: number) => {
        const [tables, res] = await Promise.all([DB.getAll<Table>(TBL_KEY, INIT_TBLS), DB.getAll<Reservation>(RES_KEY)]);
        return tables.filter(t => t.capacity >= size && !res.some(r => r.tableId===t.id && r.date===date && r.time===time && r.status!=='cancelled'));
    },
    getTickets: () => DB.getAll<KitchenTicket>(TKT_KEY, []),
    sendOrderToKitchen: async (tid: string, items: CartItem[], notes?: string) => {
        const t = (await DB.getAll<Table>(TBL_KEY)).find(x => x.id === tid);
        if(!t) throw new Error("No table");
        const ticket: KitchenTicket = { id: `kt_${Date.now()}`, tableId: tid, tableName: t.name, items, status: 'pending', timestamp: new Date().toISOString(), notes };
        await DB.add(TKT_KEY, ticket);
        await POSService.updateTableStatus(tid, 'occupied', ticket.id);
        posEvents.dispatchEvent(new Event('kitchen_updated'));
    },
    updateTicketStatus: async (id: string, s: KitchenTicket['status']) => {
        const t = (await DB.getAll<KitchenTicket>(TKT_KEY)).find(x => x.id === id);
        if(t) { t.status = s; await DB.update(TKT_KEY, t); posEvents.dispatchEvent(new Event('kitchen_updated')); }
    },
    billTable: (id: string) => POSService.updateTableStatus(id, 'available')
};
