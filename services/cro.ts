
import { SessionRecording, Experiment, HeatmapData } from '../types';
import { delay } from './storage';

// Mock generator for session movement
const generateSessionEvents = (durationSeconds: number) => {
    const events: any[] = [];
    let currentTime = 0;
    // Simulate mouse movements every 500ms
    while (currentTime < durationSeconds * 1000) {
        // Random movement
        events.push({
            timestamp: currentTime,
            type: 'mousemove',
            x: Math.random() * 100, // %
            y: Math.random() * 100  // %
        });
        
        // Random clicks
        if (Math.random() > 0.8) {
            events.push({
                timestamp: currentTime + 100,
                type: 'click',
                x: Math.random() * 100,
                y: Math.random() * 100,
                target: 'Add to Cart Button'
            });
        }
        
        currentTime += 500;
    }
    return events;
};

export const CROService = {
    getSessions: async (): Promise<SessionRecording[]> => {
        await delay(300);
        return [
            {
                id: 'sess_10293',
                visitorId: 'vis_8821',
                location: 'Mumbai, IN',
                duration: '2m 14s',
                startTime: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
                pageCount: 3,
                device: 'Desktop',
                frustrationScore: 2,
                events: generateSessionEvents(134)
            },
            {
                id: 'sess_10294',
                visitorId: 'vis_9932',
                location: 'Delhi, IN',
                duration: '45s',
                startTime: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
                pageCount: 1,
                device: 'Mobile',
                frustrationScore: 8, // Rage clicks
                events: generateSessionEvents(45)
            },
            {
                id: 'sess_10295',
                visitorId: 'vis_7743',
                location: 'Bangalore, IN',
                duration: '5m 30s',
                startTime: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
                pageCount: 6,
                device: 'Desktop',
                frustrationScore: 0,
                events: generateSessionEvents(330)
            }
        ];
    },

    getExperiments: async (): Promise<Experiment[]> => {
        await delay(200);
        return [
            {
                id: 'exp_001',
                name: 'Checkout CTA Color: Green vs Orange',
                status: 'running',
                type: 'AB',
                startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
                confidenceLevel: 85,
                variants: [
                    { name: 'Control (Green)', trafficSplit: 50, visitors: 1250, conversions: 120, conversionRate: 9.6 },
                    { name: 'Variant B (Orange)', trafficSplit: 50, visitors: 1280, conversions: 145, conversionRate: 11.3 }
                ]
            },
            {
                id: 'exp_002',
                name: 'Homepage Hero: Video vs Static',
                status: 'concluded',
                type: 'AB',
                startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
                confidenceLevel: 98,
                variants: [
                    { name: 'Control (Static)', trafficSplit: 50, visitors: 5000, conversions: 400, conversionRate: 8.0 },
                    { name: 'Variant B (Video)', trafficSplit: 50, visitors: 4950, conversions: 620, conversionRate: 12.5 }
                ]
            }
        ];
    },

    getHeatmapData: async (pageUrl: string): Promise<HeatmapData> => {
        await delay(400);
        // Generate pseudo-random heat points
        const points = Array.from({ length: 50 }).map(() => ({
            x: 20 + Math.random() * 60, // Focused mostly center
            y: Math.random() * 80,
            intensity: Math.random()
        }));

        return {
            page: pageUrl,
            desktopPoints: points,
            mobilePoints: points.map(p => ({ ...p, x: p.x + (Math.random() * 10 - 5) }))
        };
    }
};
