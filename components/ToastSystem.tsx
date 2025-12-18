
import React, { useState, useEffect } from 'react';
import { GlobalEventBus, EVENTS } from '../services/storeService';
import { CheckCircle, AlertTriangle, Info, X, ShoppingBag, RefreshCw } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

export const ToastSystem: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => removeToast(id), 5000); // Auto dismiss
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    // 1. Order Events
    const handleOrderCreated = (order: any) => {
      // Differentiate message based on context (simulated via simple check, or generic message)
      addToast({
        type: 'success',
        title: 'Order Processed',
        message: `Order #${order.id.slice(-6)} confirmed. Finance & Inventory updated.`
      });
    };

    // 2. Product/Inventory Events
    const handleProductUpdated = (product: any) => {
      addToast({
        type: 'info',
        title: 'Catalog Updated',
        message: `${product.name} details have been synchronized.`
      });
    };

    // 3. User Events
    const handleUserRegistered = (user: any) => {
      addToast({
        type: 'success',
        title: 'New Customer',
        message: `${user.name} has joined Dietanic.`
      });
    };

    // 4. Saga Failures
    const handleSagaFailed = (error: any) => {
        addToast({
            type: 'error',
            title: 'Transaction Failed',
            message: 'System rolled back changes. Please try again.'
        });
    };

    // Subscribe
    GlobalEventBus.on(EVENTS.ORDER_CREATED, handleOrderCreated);
    GlobalEventBus.on(EVENTS.PRODUCT_UPDATED, handleProductUpdated);
    GlobalEventBus.on(EVENTS.USER_REGISTERED, handleUserRegistered);
    GlobalEventBus.on(EVENTS.SAGA_FAILED, handleSagaFailed);

    return () => {
      // Unsubscribe (EventBus class needs off method logic or we just leave them as it's a singleton app)
      GlobalEventBus.off(EVENTS.ORDER_CREATED, handleOrderCreated);
      GlobalEventBus.off(EVENTS.PRODUCT_UPDATED, handleProductUpdated);
      GlobalEventBus.off(EVENTS.USER_REGISTERED, handleUserRegistered);
      GlobalEventBus.off(EVENTS.SAGA_FAILED, handleSagaFailed);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[60] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto w-80 bg-white/90 backdrop-blur-md rounded-xl shadow-2xl border-l-4 p-4 flex items-start gap-3 transform transition-all duration-300 animate-slide-in-left ${
            toast.type === 'success' ? 'border-green-500' :
            toast.type === 'error' ? 'border-red-500' :
            toast.type === 'warning' ? 'border-orange-500' :
            'border-blue-500'
          }`}
        >
          <div className="mt-0.5">
            {toast.type === 'success' && <CheckCircle size={18} className="text-green-600" />}
            {toast.type === 'error' && <AlertTriangle size={18} className="text-red-600" />}
            {toast.type === 'warning' && <AlertTriangle size={18} className="text-orange-600" />}
            {toast.type === 'info' && <Info size={18} className="text-blue-600" />}
          </div>
          <div className="flex-1">
            <h4 className={`text-sm font-bold ${
                toast.type === 'success' ? 'text-green-900' :
                toast.type === 'error' ? 'text-red-900' :
                'text-gray-900'
            }`}>{toast.title}</h4>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">{toast.message}</p>
          </div>
          <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
