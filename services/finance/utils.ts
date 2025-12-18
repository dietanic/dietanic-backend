import { SettingsService } from '../settings';

export const checkLock = async (date: string) => {
    const s = await SettingsService.getTaxSettings();
    if (s.lockDate && new Date(date) <= new Date(s.lockDate)) throw new Error(`Period Locked: ${s.lockDate}`);
};