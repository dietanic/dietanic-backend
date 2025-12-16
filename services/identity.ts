
import { User } from '../types';
import { MOCK_USER } from '../constants';
import { STORAGE_KEYS, DB, delay, getLocalStorage } from './storage';
import { GlobalEventBus, EVENTS } from './eventBus';

// Microservice: Identity & Access Management
export const IdentityService = {
  getCurrentUser: async (): Promise<User> => {
    await delay(100);
    const users = getLocalStorage<User[]>(STORAGE_KEYS.USERS, []);
    const id = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    return users.find(u => u.id === id) || users.find(u => u.id === MOCK_USER.id) || MOCK_USER;
  },
  getCurrentUserSync: (): User => {
    const users = getLocalStorage<User[]>(STORAGE_KEYS.USERS, []);
    return users.find(u => u.id === localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) || MOCK_USER;
  },
  getUserById: (id: string) => DB.getById<User>(STORAGE_KEYS.USERS, id, []),
  switchUserSession: async (id: string) => { await delay(200); localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id); return IdentityService.getCurrentUser(); },
  getUsers: () => DB.getAll<User>(STORAGE_KEYS.USERS, []),
  addUser: async (u: User) => { await DB.add(STORAGE_KEYS.USERS, u, []); GlobalEventBus.emit(EVENTS.USER_REGISTERED, u); },
  updateUser: (u: User) => DB.update(STORAGE_KEYS.USERS, u, []),
  deleteUser: (id: string) => DB.delete(STORAGE_KEYS.USERS, id, [])
};
