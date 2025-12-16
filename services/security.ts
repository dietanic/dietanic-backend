
import { AuditLogEntry, SecurityAlert, User, Order, Permission } from '../types';
import { STORAGE_KEYS, getLocalStorage, setLocalStorage, delay } from './storage';
import { GlobalEventBus, EVENTS } from './eventBus';
import { IdentityService } from './identity';

const STORAGE_KEY_AUDIT = 'dietanic_audit_logs';
const STORAGE_KEY_ALERTS = 'dietanic_security_alerts';

// --- Automated Surveillance Listeners ---

GlobalEventBus.on(EVENTS.ORDER_CREATED, async (order: Order) => {
    const user = await IdentityService.getUserById(order.userId);
    SecurityService.logAction(
        user || { id: 'system', name: 'System', role: 'admin' } as User,
        'PROCESS_ORDER',
        `Order #${order.id}`,
        `Processed transaction value: ₹${order.total}`,
        'info'
    );

    if (order.total > 5000) {
        SecurityService.createAlert(
            'operational_risk',
            `High Value Order Detected: #${order.id} (₹${order.total}). Verify payment authenticity.`
        );
    }
});

// Role to Permission Mapping Configuration
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
    admin: ['view_financials', 'manage_inventory', 'manage_users', 'view_phi', 'access_audit_trail', 'process_refunds', 'access_pos'],
    editor: ['manage_inventory', 'access_pos'],
    driver: [],
    customer: []
};

// Simple Hash Function for Tamper Proofing (Simulation)
// In production, use crypto.subtle.digest('SHA-256', ...)
const generateHash = (data: string): string => {
    let hash = 0, i, chr;
    if (data.length === 0) return hash.toString(16);
    for (i = 0; i < data.length; i++) {
        chr = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
};

export const SecurityService = {
    getLogs: async (): Promise<AuditLogEntry[]> => {
        await delay(200);
        return getLocalStorage<AuditLogEntry[]>(STORAGE_KEY_AUDIT, []);
    },

    getAlerts: async (): Promise<SecurityAlert[]> => {
        await delay(200);
        return getLocalStorage<SecurityAlert[]>(STORAGE_KEY_ALERTS, []);
    },

    /**
     * RBAC Check
     */
    hasPermission: (user: User, permission: Permission): boolean => {
        const rolePerms = ROLE_PERMISSIONS[user.role] || [];
        const customPerms = user.customPermissions || [];
        return rolePerms.includes(permission) || customPerms.includes(permission);
    },

    /**
     * Tamper-Proof Audit Logger
     * Links the previous record's hash to the current one.
     */
    logAction: async (
        actor: User, 
        action: string, 
        target: string, 
        details: string, 
        severity: AuditLogEntry['severity'] = 'info'
    ): Promise<void> => {
        const logs = getLocalStorage<AuditLogEntry[]>(STORAGE_KEY_AUDIT, []);
        
        // Get the hash of the last entry (the head of the chain)
        const lastEntry = logs.length > 0 ? logs[0] : null;
        const previousHash = lastEntry ? lastEntry.hash : '00000000'; // Genesis hash

        const entryId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const timestamp = new Date().toISOString();
        
        // Data payload to be hashed
        const payload = `${entryId}${timestamp}${actor.id}${action}${target}${details}${previousHash}`;
        const currentHash = generateHash(payload);

        const newLog: AuditLogEntry = {
            id: entryId,
            timestamp,
            actorId: actor.id,
            actorName: actor.name,
            action,
            target,
            details,
            severity,
            ipAddress: '192.168.1.10', // Mock IP
            previousHash: previousHash,
            hash: currentHash
        };
        
        logs.unshift(newLog); // Add to top
        setLocalStorage(STORAGE_KEY_AUDIT, logs);
    },

    /**
     * Verifies the integrity of the audit chain.
     * Returns true if valid, false if tampered.
     */
    verifyChainIntegrity: async (): Promise<{valid: boolean, brokenIndex: number}> => {
        const logs = getLocalStorage<AuditLogEntry[]>(STORAGE_KEY_AUDIT, []);
        // Iterate from newest to oldest (reverse of storage order for verification logic or logic match)
        // Storage: [Newest, ..., Oldest]
        
        for (let i = 0; i < logs.length; i++) {
            const entry = logs[i];
            
            // 1. Re-calculate hash
            const payload = `${entry.id}${entry.timestamp}${entry.actorId}${entry.action}${entry.target}${entry.details}${entry.previousHash}`;
            const calculatedHash = generateHash(payload);

            if (calculatedHash !== entry.hash) {
                console.error(`Integrity Failure at ID: ${entry.id}. Content tampered.`);
                return { valid: false, brokenIndex: i };
            }

            // 2. Check Chain Link (Previous Hash matches the Hash of the next item in array)
            const nextEntryInArray = logs[i + 1]; // Older entry
            if (nextEntryInArray) {
                if (entry.previousHash !== nextEntryInArray.hash) {
                    console.error(`Chain Broken between ${entry.id} and ${nextEntryInArray.id}`);
                    return { valid: false, brokenIndex: i };
                }
            } else {
                // Genesis check
                if (entry.previousHash !== '00000000') {
                    return { valid: false, brokenIndex: i };
                }
            }
        }
        return { valid: true, brokenIndex: -1 };
    },

    createAlert: async (type: SecurityAlert['type'], message: string): Promise<void> => {
        const alerts = getLocalStorage<SecurityAlert[]>(STORAGE_KEY_ALERTS, []);
        const newAlert: SecurityAlert = {
            id: `alert_${Date.now()}`,
            timestamp: new Date().toISOString(),
            type,
            message,
            status: 'active'
        };
        alerts.unshift(newAlert);
        setLocalStorage(STORAGE_KEY_ALERTS, alerts);
    },

    resolveAlert: async (alertId: string): Promise<void> => {
        await delay(200);
        const alerts = getLocalStorage<SecurityAlert[]>(STORAGE_KEY_ALERTS, []);
        const idx = alerts.findIndex(a => a.id === alertId);
        if (idx !== -1) {
            alerts[idx].status = 'resolved';
            setLocalStorage(STORAGE_KEY_ALERTS, alerts);
        }
    },

    // Utilities
    maskPHI: (text: string): string => {
        if (!text || text.length < 4) return '***';
        return text.substring(0, 1) + '***' + text.substring(text.length - 2);
    }
};
