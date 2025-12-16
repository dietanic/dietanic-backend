
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, X, ChevronDown, Search, Globe, Leaf, Truck } from 'lucide-react';
import { useCart, useAuth } from '../App';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const { user, login, usersList, canManageStore, isAdmin, isDriver } = useAuth();

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const navLinks = [
    { name: 'Shop', path: '/shop' },
    { name: 'Book Table', path: '/book-table' },
    { name: 'About', path: '/about' },
    { name: 'Customer Portal', path: '/account' },
    // Admin link is conditionally added below
  ];

  if (canManageStore) {
    navLinks.push({ name: 'Admin', path: '/admin' });
  }

  const handleUserSwitch = (e: React.ChangeEvent<HTMLSelectElement>) => {
      login(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  // Hide main navbar on ChainCommand page for immersion
  // Also hide for Field Agent app to feel native
  if (location.pathname === '/chain-command' || location.pathname === '/delivery') return null;

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-brand-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
               <div className="bg-brand-600 p-1.5 rounded-lg transform group-hover:rotate-12 transition-transform">
                   <Leaf className="text-white h-5 w-5" fill="currentColor" />
               </div>
               <span className="font-bold text-xl tracking-tight text-brand-900 group-hover:text-brand-700 transition-colors">Dietanic</span>
            </Link>
          </div>

          <div className="hidden sm:flex sm:items-center sm:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'text-brand-600 border-b-2 border-brand-600'
                    : 'text-gray-500 hover:text-brand-600'
                }`}
              >
                {link.name}
              </Link>
            ))}
            
            {/* Field Agent Link */}
            {isDriver && (
                <Link
                    to="/delivery"
                    className="flex items-center gap-1 px-3 py-1 bg-slate-800 text-white rounded-md text-xs font-bold uppercase tracking-wide hover:bg-slate-700 transition-colors"
                >
                    <Truck size={12} /> Delivery App
                </Link>
            )}

            {/* Special Chain Command Link */}
            {isAdmin && (
                <Link 
                    to="/chain-command" 
                    className="flex items-center gap-1 px-3 py-1 bg-slate-900 text-emerald-400 rounded-md text-xs font-bold uppercase tracking-wide hover:bg-slate-800 transition-colors"
                >
                    <Globe size={12} /> HQ View
                </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            
            {/* Search Bar */}
            <div className="relative">
              {isSearchOpen ? (
                <form onSubmit={handleSearchSubmit} className="absolute right-0 top-1/2 -translate-y-1/2 w-64">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search salads..."
                    className="w-full pl-4 pr-10 py-1.5 text-sm border border-gray-300 rounded-full focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => !searchQuery && setIsSearchOpen(false)}
                  />
                  <button type="button" onClick={() => setIsSearchOpen(false)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                </form>
              ) : (
                <button onClick={() => setIsSearchOpen(true)} className="p-2 text-gray-400 hover:text-brand-600 transition-colors">
                  <Search className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* User Switcher for Demo */}
            <div className={`hidden sm:flex items-center gap-2 border-r border-gray-200 pr-4 ${isSearchOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity`}>
                <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-gray-900">{user.name}</span>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 
                        user.role === 'editor' ? 'bg-blue-100 text-blue-700' :
                        user.role === 'driver' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-600'
                    }`}>
                        {user.role}
                    </span>
                </div>
                <div className="relative">
                    <select 
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" 
                        onChange={handleUserSwitch}
                        value={user.id}
                        title="Switch User Role"
                    >
                        {usersList.map(u => (
                            <option key={u.id} value={u.id}>
                                {u.name} ({u.role})
                            </option>
                        ))}
                    </select>
                    <div className="bg-gray-100 p-1.5 rounded-full hover:bg-gray-200 cursor-pointer">
                        <ChevronDown size={14} className="text-gray-600" />
                    </div>
                </div>
            </div>

            <Link to="/cart" className="p-2 text-gray-400 hover:text-brand-600 relative">
              <ShoppingBag className="h-6 w-6" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-brand-600 rounded-full shadow-sm">
                  {totalItems}
                </span>
              )}
            </Link>
            
            <div className="sm:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="sm:hidden bg-white border-t border-gray-200">
          <div className="pt-4 pb-3 border-b border-gray-100 px-4">
               <label className="block text-xs text-gray-500 mb-1">Switch User (Demo)</label>
               <select 
                    className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-brand-500 focus:outline-none focus:ring-brand-500 sm:text-sm border"
                    onChange={handleUserSwitch}
                    value={user.id}
                >
                    {usersList.map(u => (
                        <option key={u.id} value={u.id}>
                            {u.name} ({u.role})
                        </option>
                    ))}
                </select>
          </div>
          <div className="pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  location.pathname === link.path
                    ? 'bg-brand-50 border-brand-500 text-brand-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {link.name}
              </Link>
            ))}
            {isDriver && (
                <Link
                    to="/delivery"
                    onClick={() => setIsOpen(false)}
                    className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-slate-700 bg-slate-100 hover:bg-slate-200"
                >
                    Launch Delivery App
                </Link>
            )}
            {isAdmin && (
                <Link
                    to="/chain-command"
                    onClick={() => setIsOpen(false)}
                    className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-emerald-600 bg-slate-900 hover:bg-slate-800"
                >
                    HQ View
                </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
