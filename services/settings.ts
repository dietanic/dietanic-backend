
import { TaxSettings } from '../types';
import { STORAGE_KEYS, delay, getLocalStorage, setLocalStorage } from './storage';

const DEFAULT_TAX_SETTINGS: TaxSettings = {
    isRegistered: false,
    gstin: '',
    state: 'Maharashtra',
    lockDate: undefined
};

export const SettingsService = {
    getTaxSettings: async (): Promise<TaxSettings> => {
        await delay(100);
        return getLocalStorage<TaxSettings>(STORAGE_KEYS.TAX_SETTINGS, DEFAULT_TAX_SETTINGS);
    },
    
    // Sync version for initialization contexts
    getTaxSettingsSync: (): TaxSettings => {
        return getLocalStorage<TaxSettings>(STORAGE_KEYS.TAX_SETTINGS, DEFAULT_TAX_SETTINGS);
    },

    saveTaxSettings: async (settings: TaxSettings): Promise<void> => {
        await delay(200);
        setLocalStorage(STORAGE_KEYS.TAX_SETTINGS, settings);
    }
};
