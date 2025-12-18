
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Home } from './pages/Home';
import { Products } from './pages/Products';
import { Admin } from './pages/Admin';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { POS } from './pages/POS';
import { Login } from './pages/Login';
import { User, onAuthStateChanged, getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from './firebase-config';
import { Toaster } from 'react-hot-toast';
import { VendorPortal } from './pages/VendorPortal';
import { Terms } from './pages/Terms';
import { Account } from './pages/Account';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const AuthContext = createContext<{ user: any, loading: boolean }>({ user: null, loading: true });
export const useAuth = () => useContext(AuthContext);

const AppContent: React.FC = () => {
  const location = useLocation();
  const { loading } = useAuth();

  const currentPath = location.hash.substring(1); // e.g., #/account -> /account
  const portalLayoutPaths = ['/admin', '/pos', '/login', '/vendor-portal', '/account'];
  const isPortalLayout = portalLayoutPaths.some(path => currentPath.startsWith(path));

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center"><p>Loading...</p></div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div style={{
        backgroundColor: 'yellow',
        color: 'black',
        padding: '10px',
        position: 'fixed',
        top: '10px',
        left: '10px',
        zIndex: 9999,
        border: '2px solid black',
        borderRadius: '5px',
        fontFamily: 'monospace',
        fontSize: '14px'
      }}>
        <p style={{ fontWeight: 'bold' }}>[FOR DEBUGGING] Please tell me what this box says on the /account page:</p>
        <p>Path from Hash: <strong>{currentPath}</strong></p>
        <p>Should hide footer? <strong>{isPortalLayout.toString()}</strong></p>
      </div>
      
      {!isPortalLayout && <Header />}
      <main className="flex-grow pt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/login" element={<Login />} />
          <Route path="/vendor-portal" element={<VendorPortal />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/account" element={<Account />} />
        </Routes>
      </main>
      {!isPortalLayout && <Footer />}
    </div>
  );
};

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      <Router>
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 5000,
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
        <AppContent />
      </Router>
    </AuthContext.Provider>
  );
};
