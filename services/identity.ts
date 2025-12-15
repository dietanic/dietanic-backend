import { User } from '../types';
import { MOCK_USER } from '../constants';
import { STORAGE_KEYS, delay, getLocalStorage, setLocalStorage } from './storage';

export const IdentityService = {
  getCurrentUser: async (): Promise<User> => {
    await delay(100); // Fast response for auth check
    const users = getLocalStorage<User[]>(STORAGE_KEYS.USERS, []);
    const storedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    
    if (storedId) {
        const found = users.find(u => u.id === storedId);
        if (found) return found;
    }
    return users.find(u => u.id === MOCK_USER.id) || MOCK_USER;
  },

  // Sync version specifically for initial app load state to prevent flicker
  getCurrentUserSync: (): User => {
    const users = getLocalStorage<User[]>(STORAGE_KEYS.USERS, []);
    const storedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    return users.find(u => u.id === storedId) || users.find(u => u.id === MOCK_USER.id) || MOCK_USER;
  },

  switchUserSession: async (userId: string): Promise<User> => {
    await delay(300);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
    return IdentityService.getCurrentUser();
  },

  getUsers: async (): Promise<User[]> => {
    await delay();
    return getLocalStorage<User[]>(STORAGE_KEYS.USERS, []);
  },

  addUser: async (user: User): Promise<void> => {
    await delay();
    const users = getLocalStorage<User[]>(STORAGE_KEYS.USERS, []);
    users.push(user);
    setLocalStorage(STORAGE_KEYS.USERS, users);
  },

  updateUser: async (updatedUser: User): Promise<void> => {
    await delay();
    const users = getLocalStorage<User[]>(STORAGE_KEYS.USERS, []);
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      setLocalStorage(STORAGE_KEYS.USERS, users);
    }
  },

  deleteUser: async (userId: string): Promise<void> => {
    await delay();
    let users = getLocalStorage<User[]>(STORAGE_KEYS.USERS, []);
    users = users.filter(u => u.id !== userId);
    setLocalStorage(STORAGE_KEYS.USERS, users);
  }
};
