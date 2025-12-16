
import { ChainStore, RegionStats } from '../types';
import { delay } from './storage';

const MOCK_STORES: ChainStore[] = [
    {
        id: 'store_001',
        name: 'Downtown Flagship',
        location: 'Mumbai, MH',
        coordinates: { x: 45, y: 40 },
        status: 'operational',
        manager: 'Ravi Kumar',
        liveStats: { hourlyRevenue: 12500, laborCostPercent: 18, activeOrders: 24, staffOnClock: 12, efficiencyScore: 94 },
        alerts: []
    },
    {
        id: 'store_002',
        name: 'Westside Express',
        location: 'Pune, MH',
        coordinates: { x: 30, y: 60 },
        status: 'warning',
        manager: 'Sarah Jenkins',
        liveStats: { hourlyRevenue: 4200, laborCostPercent: 32, activeOrders: 8, staffOnClock: 5, efficiencyScore: 76 },
        alerts: [{ id: 'a1', severity: 'medium', message: 'High Wait Times (>15m)', timestamp: new Date().toISOString(), type: 'operational_risk', status: 'active' }]
    },
    {
        id: 'store_003',
        name: 'Tech Park Kiosk',
        location: 'Bangalore, KA',
        coordinates: { x: 60, y: 80 },
        status: 'operational',
        manager: 'Arjun Singh',
        liveStats: { hourlyRevenue: 8900, laborCostPercent: 22, activeOrders: 45, staffOnClock: 8, efficiencyScore: 88 },
        alerts: []
    },
    {
        id: 'store_004',
        name: 'Airport Terminal 2',
        location: 'Delhi, DL',
        coordinates: { x: 20, y: 20 },
        status: 'critical',
        manager: 'Priya Sharma',
        liveStats: { hourlyRevenue: 1500, laborCostPercent: 65, activeOrders: 2, staffOnClock: 6, efficiencyScore: 45 },
        alerts: [
            { id: 'a2', severity: 'high', message: 'POS Connection Failure', timestamp: new Date().toISOString(), type: 'operational_risk', status: 'active' },
            { id: 'a3', severity: 'medium', message: 'Inventory Outage: Avocados', timestamp: new Date().toISOString(), type: 'stock', status: 'active' }
        ]
    },
    {
        id: 'store_005',
        name: 'Lakeside Mall',
        location: 'Thane, MH',
        coordinates: { x: 55, y: 50 },
        status: 'operational',
        manager: 'Vikram Malhotra',
        liveStats: { hourlyRevenue: 6700, laborCostPercent: 25, activeOrders: 12, staffOnClock: 7, efficiencyScore: 82 },
        alerts: []
    }
];

export const ChainService = {
    getStores: async (): Promise<ChainStore[]> => {
        await delay(300);
        return MOCK_STORES;
    },

    getAggregatedStats: async (): Promise<RegionStats> => {
        await delay(300);
        return {
            totalRevenue: MOCK_STORES.reduce((acc, s) => acc + s.liveStats.hourlyRevenue, 0),
            totalOrders: MOCK_STORES.reduce((acc, s) => acc + s.liveStats.activeOrders, 0),
            avgEfficiency: Math.round(MOCK_STORES.reduce((acc, s) => acc + s.liveStats.efficiencyScore, 0) / MOCK_STORES.length),
            openLocations: MOCK_STORES.filter(s => s.status !== 'closed').length
        };
    },

    // Simulate real-time updates for the dashboard ticker
    subscribeToUpdates: (callback: (stores: ChainStore[]) => void) => {
        const interval = setInterval(() => {
            // Randomly fluctuate numbers to simulate live business
            const updated = MOCK_STORES.map(store => ({
                ...store,
                liveStats: {
                    ...store.liveStats,
                    hourlyRevenue: store.liveStats.hourlyRevenue + (Math.random() > 0.5 ? 150 : -50),
                    activeOrders: Math.max(0, store.liveStats.activeOrders + (Math.random() > 0.5 ? 1 : -1)),
                    efficiencyScore: Math.min(100, Math.max(0, store.liveStats.efficiencyScore + (Math.random() > 0.7 ? 1 : -1)))
                }
            }));
            callback(updated);
        }, 3000);
        return () => clearInterval(interval);
    }
};