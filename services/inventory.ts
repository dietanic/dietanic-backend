
import { InventoryRecord, Product, Warehouse, Order } from '../types';
import { STORAGE_KEYS, DB, delay, getLocalStorage, setLocalStorage } from './storage';
import { INITIAL_WAREHOUSES, INITIAL_PRODUCTS } from '../constants';

const KEY = 'dietanic_inventory';

export const InventoryService = {
    // --- Core Data Access ---
    
    // Initialize standard stock if empty
    ensureInitialized: async () => {
        const records = getLocalStorage<InventoryRecord[]>(KEY, []);
        if (records.length === 0) {
            console.log('🏭 Inventory Service: Seeding initial stock data...');
            const newRecords: InventoryRecord[] = [];
            
            // Seed warehouses
            INITIAL_PRODUCTS.forEach(prod => {
                INITIAL_WAREHOUSES.forEach(wh => {
                    // Distribute random stock across locations
                    const baseStock = Math.floor(prod.stock / INITIAL_WAREHOUSES.length);
                    
                    // Map Warehouse Type to Inventory Location Type
                    let locType: 'Warehouse' | 'Store' | '3PL' = 'Warehouse';
                    if (wh.type === 'Retail Outlet') locType = 'Store';

                    newRecords.push({
                        id: `inv_${prod.id}_${wh.id}`,
                        productId: prod.id,
                        locationId: wh.id,
                        locationName: wh.name,
                        locationType: locType,
                        onHand: baseStock,
                        allocated: 0,
                        available: baseStock,
                        inTransit: 0,
                        returned: 0,
                        quarantined: 0,
                        lastSynced: new Date().toISOString(),
                        sourceSystem: 'Internal'
                    });
                });
            });
            setLocalStorage(KEY, newRecords);
        }
    },

    getInventory: async (): Promise<InventoryRecord[]> => {
        await InventoryService.ensureInitialized();
        await delay(100);
        return DB.getAll<InventoryRecord>(KEY, []);
    },

    getProductInventory: async (productId: string): Promise<InventoryRecord[]> => {
        const all = await InventoryService.getInventory();
        return all.filter(r => r.productId === productId);
    },

    // --- ATP Calculation ---
    // ATP = On Hand - Allocated - Quarantined
    
    getGlobalATP: async (productId: string): Promise<number> => {
        const records = await InventoryService.getProductInventory(productId);
        return records.reduce((sum, r) => sum + r.available, 0);
    },

    getLocationATP: async (productId: string, locationId: string): Promise<number> => {
        const records = await InventoryService.getProductInventory(productId);
        const loc = records.find(r => r.locationId === locationId);
        return loc ? loc.available : 0;
    },

    // --- External Sync Simulation ---
    
    syncExternalSource: async (source: 'ERP' | 'WMS' | 'POS'): Promise<number> => {
        await delay(800);
        const records = await InventoryService.getInventory();
        let updatedCount = 0;

        const updatedRecords = records.map(rec => {
            // Randomly update 30% of records to simulate live changes
            if (Math.random() > 0.7) {
                const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
                const newOnHand = Math.max(0, rec.onHand + change);
                updatedCount++;
                return {
                    ...rec,
                    onHand: newOnHand,
                    available: newOnHand - rec.allocated - rec.quarantined,
                    lastSynced: new Date().toISOString(),
                    sourceSystem: source
                };
            }
            return rec;
        });

        if (updatedCount > 0) {
            await DB.upsert(KEY, updatedRecords[0], []); // Just triggering save logic
            setLocalStorage(KEY, updatedRecords); // Bulk save
        }
        
        return updatedCount;
    },

    // --- Order Allocation Logic ---
    
    allocateStock: async (order: Order): Promise<void> => {
        const records = await InventoryService.getInventory();
        const updatedRecords = [...records];

        for (const item of order.items) {
            // Determine fulfillment location
            const targetLocId = order.pickupLocationId || 'wh_main'; // Default to main warehouse if shipping
            
            const recIndex = updatedRecords.findIndex(r => r.productId === item.id && r.locationId === targetLocId);
            
            if (recIndex !== -1) {
                const rec = updatedRecords[recIndex];
                // Update allocation
                rec.allocated += item.quantity;
                rec.available = rec.onHand - rec.allocated - rec.quarantined;
                rec.lastSynced = new Date().toISOString();
                updatedRecords[recIndex] = rec;
            } else {
                console.warn(`Inventory record missing for ${item.name} at ${targetLocId}`);
            }
        }
        
        setLocalStorage(KEY, updatedRecords);
    }
};