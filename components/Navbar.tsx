
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, X, ChevronDown, Search, Globe, Leaf, Truck, User, Settings, LogOut, ChevronRight } from 'lucide-react';
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

  // Close drawer when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Shop', path: '/shop' },
    { name: 'Book Table', path: '/book-table' },
    { name: 'About', path: '/about' },
    { name: 'Portal', path: '/account' },
  ];

  if (canManageStore) {
    navLinks.push({ name: 'Admin', path: '/admin' });
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  if (['/chain-command', '/delivery', '/vendor-portal', '/admin'].includes(location.pathname)) return null;

  return (
    <>
      <nav className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-5xl bg-white/75 backdrop-blur-md border border-white/40 shadow-xl rounded-full px-6 h-16 flex items-center justify-between transition-all duration-300">
          
          {/* LEFT: Mobile Menu Button */}
          <div className="md:hidden flex flex-1 justify-start">
             <button
                onClick={() => setIsOpen(true)}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100/50 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>
          </div>

          {/* LEFT: Navigation Links (Desktop) */}
          <div className="hidden md:flex flex-1 items-center justify-start space-x-6">
            {navLinks.filter(l => l.name !== 'Portal').map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'text-brand-700 font-bold'
                    : 'text-gray-600 hover:text-brand-600'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* CENTER: Logo */}
          <div className="flex-shrink-0 flex items-center justify-center">
            <Link to="/" className="flex items-center gap-2 group">
               <div className="bg-brand-600 p-1.5 rounded-full shadow-sm transform group-hover:rotate-12 transition-transform">
                   <Leaf className="text-white h-5 w-5" fill="currentColor" />
               </div>
               <span className="font-bold text-xl tracking-tight text-brand-900 group-hover:text-brand-700 transition-colors hidden sm:block">Dietanic</span>
            </Link>
          </div>

          {/* RIGHT: Actions */}
          <div className="flex flex-1 items-center justify-end gap-3">
            <div className="relative">
              {isSearchOpen ? (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-48 sm:w-64 transform transition-all">
                  <form onSubmit={handleSearchSubmit} className="relative">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Search..."
                      className="w-full pl-4 pr-8 py-1.5 text-sm border border-gray-200 rounded-full focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 shadow-lg bg-white/90 backdrop-blur-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onBlur={() => !searchQuery && setIsSearchOpen(false)}
                    />
                    <button type="button" onClick={() => setIsSearchOpen(false)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X size={14} />
                    </button>
                  </form>
                </div>
              ) : (
                <button onClick={() => setIsSearchOpen(true)} className="p-2 text-gray-500 hover:text-brand-600 hover:bg-gray-100/50 rounded-full transition-colors">
                  <Search className="h-5 w-5" />
                </button>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-2">
                {isDriver && (
                    <Link to="/delivery" className="p-2 text-slate-600 hover:bg-slate-100 rounded-full" title="Delivery App">
                        <Truck size={20} />
                    </Link>
                )}
                {isAdmin && (
                    <Link to="/chain-command" className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full" title="HQ View">
                        <Globe size={20} />
                    </Link>
                )}
            </div>

            <div className={`hidden md:flex items-center gap-2 ${isSearchOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity`}>
                <div className="relative group">
                    <button className="flex items-center gap-2 p-1 pr-2 rounded-full border border-gray-200 bg-white/50 hover:bg-white hover:shadow-sm transition-all">
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                        ) : (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                user.role === 'admin' ? 'bg-purple-500' : 
                                user.role === 'customer' ? 'bg-brand-500' : 'bg-blue-500'
                            }`}>
                                {user.name.charAt(0)}
                            </div>
                        )}
                        <ChevronDown size={14} className="text-gray-400" />
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-2 hidden group-hover:block animate-fade-in z-50">
                        <div className="px-3 py-3 border-b border-gray-100 mb-1">
                            <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <Link to="/account" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg font-medium">
                            Account Settings
                        </Link>
                        {canManageStore && (
                            <Link to="/admin" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg font-medium">
                                Admin Dashboard
                            </Link>
                        )}
                        
                        <div className="my-2 border-t border-gray-100"></div>
                        <p className="text-[10px] font-bold text-gray-400 px-3 py-1 uppercase">Switch Role (Demo)</p>
                        <div className="max-h-48 overflow-y-auto">
                            {usersList.map(u => (
                                <button 
                                    key={u.id}
                                    onClick={() => login(u.id)}
                                    className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between ${user.id === u.id ? 'bg-brand-50 text-brand-700' : 'hover:bg-gray-50'}`}
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        {u.avatar ? (
                                            <img src={u.avatar} className="w-5 h-5 rounded-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-500">{u.name.charAt(0)}</div>
                                        )}
                                        <span className="truncate">{u.name}</span>
                                    </div>
                                    <span className="text-[10px] uppercase bg-gray-100 px-1.5 py-0.5 rounded ml-2">{u.role}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <Link to="/cart" className="p-2 text-gray-500 hover:text-brand-600 hover:bg-gray-100/50 rounded-full relative transition-colors">
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-brand-600 rounded-full shadow-sm">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </nav>

      {/* MOBILE DRAWER OVERLAY */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* MOBILE SLIDE-OUT DRAWER */}
      <aside 
        className={`fixed top-0 left-0 bottom-0 z-[70] w-[280px] bg-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Drawer Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
               <div className="bg-brand-600 p-1.5 rounded-full text-white">
                   <Leaf size={18} fill="currentColor" />
               </div>
               <span className="font-bold text-lg tracking-tight text-brand-900">Dietanic</span>
            </Link>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* User Section in Drawer */}
          <div className="p-6 bg-gray-50 border-b border-gray-100">
             <div className="flex items-center gap-3">
                {user.avatar ? (
                  <img src={user.avatar} className="w-10 h-10 rounded-full object-cover shadow-sm border border-white" alt=""/>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold">{user.name.charAt(0)}</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
             </div>
          </div>

          {/* Links */}
          <div className="flex-1 overflow-y-auto py-4">
            <div className="px-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    location.pathname === link.path
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {link.name}
                  <ChevronRight size={14} className={location.pathname === link.path ? 'text-brand-400' : 'text-gray-300'} />
                </Link>
              ))}
            </div>
            
            <div className="mt-8 px-8">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Switch User (Demo)</p>
               <div className="space-y-2">
                  {usersList.slice(0, 4).map(u => (
                    <button 
                      key={u.id}
                      onClick={() => { login(u.id); setIsOpen(false); }}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg border text-left transition-all ${user.id === u.id ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                    >
                      <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                        {u.avatar && <img src={u.avatar} className="w-full h-full object-cover" alt=""/>}
                      </div>
                      <span className="text-xs font-medium text-gray-700 truncate">{u.name}</span>
                    </button>
                  ))}
               </div>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-6 border-t border-gray-100 flex gap-4">
              <button onClick={() => navigate('/account')} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50">
                <Settings size={14}/> Settings
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gray-100 text-xs font-bold text-red-600 hover:bg-red-50">
                <LogOut size={14}/> Logout
              </button>
          </div>
        </div>
      </aside>
    </>
  );
};
