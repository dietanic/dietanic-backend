import React, { useState, useEffect, useRef } from 'react';
import { CatalogService, SalesService, IdentityService, EngagementService, DatabaseService, DiscountService, chatEvents } from '../services/storeService';
import { sendOrderStatusUpdateEmail, sendPasswordResetEmail } from '../services/emailService';
import { generateLLMContent, performSEOAudit, simulateImageOptimization, getBenchmarkData, AuditResult } from '../services/seoService';
import { Product, Order, User, SubscriptionPlan, ChatSession, ChatMessage, Visitor, ProductVariation, Discount } from '../types';
import { Trash2, Plus, Sparkles, Box, DollarSign, ShoppingCart, Filter, ArrowUpDown, Users, Shield, UserPlus, Ban, CheckCircle, Package, Upload, Calendar, X, AlertTriangle, ImageIcon, Lock, Database, Download, RefreshCw, Terminal, Play, KeyRound, Mail, Zap, FileText, Search, Activity, BarChart2, MessageSquare, Send, Monitor, Loader, Layers, Tag, Bell } from 'lucide-react';
import { generateProductDescription } from '../services/geminiService';
import { useAuth } from '../App';
import { Link } from 'react-router-dom';

export const Admin: React.FC = () => {
  const { user, isAdmin, canManageStore } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'subscriptions' | 'orders' | 'users' | 'database' | 'seo' | 'trackcomm' | 'discounts'>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  
  // Notification State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<{id: string, text: string, type: 'info' | 'alert' | 'success', time: string}[]>([
      { id: '1', text: 'New order #10293 received', type: 'success', time: '2 min ago' },
      { id: '2', text: 'Low stock warning: Green Goddess', type: 'alert', time: '15 min ago' },
      { id: '3', text: 'New support message from Guest', type: 'info', time: '1 hr ago' }
  ]);

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  
  // TrackComm State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [tcSubTab, setTcSubTab] = useState<'inbox' | 'visitors' | 'analytics'>('inbox');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // SEO & Optimization State
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [optimizingImages, setOptimizingImages] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [optimizationSaved, setOptimizationSaved] = useState('0');
  const [llmTxtContent, setLlmTxtContent] = useState('');
  
  // Database Query State
  const [queryCollection, setQueryCollection] = useState<'products' | 'orders' | 'users' | 'reviews'>('products');
  const [queryExpression, setQueryExpression] = useState<string>('return true;');
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [queryError, setQueryError] = useState<string | null>(null);
  
  // Product/Subscription Form State
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    category: 'Signature Salads',
    ingredients: [],
    image: 'https://picsum.photos/400/400?random=' + Math.floor(Math.random() * 100),
    isSubscription: false,
    description: '',
    stock: 20,
    subscriptionPlans: [] as SubscriptionPlan[],
    subscriptionFeatures: [],
    variations: []
  });
  
  // Variations State
  const [hasVariations, setHasVariations] = useState(false);
  const [tempVariation, setTempVariation] = useState<Partial<ProductVariation>>({ name: '', price: 0, stock: 10 });

  // Discount Form State
  const [isAddingDiscount, setIsAddingDiscount] = useState(false);
  const [newDiscount, setNewDiscount] = useState<Partial<Discount>>({ code: '', type: 'percentage', value: 0, isActive: true });

  // Temp state for adding a plan variant
  const [tempPlanDuration, setTempPlanDuration] = useState<'weekly' | 'bi-weekly' | 'monthly'>('weekly');
  const [tempPlanPrice, setTempPlanPrice] = useState<number>(0);

  const [ingredientInput, setIngredientInput] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // User Form State
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'customer',
    status: 'active'
  });

  // Delete Confirmation State
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  
  // Email Feedback State
  const [emailNotification, setEmailNotification] = useState<{message: string, visible: boolean}>({message: '', visible: false});

  // Order Filtering and Sorting State
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSortField, setOrderSortField] = useState<'date' | 'total'>('date');
  const [orderSortDirection, setOrderSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (canManageStore) {
        refreshData();
        refreshTrackComm();
    }
  }, [canManageStore]);

  useEffect(() => {
      // Initial run for DB tab
      if (activeTab === 'database') {
          handleRunQuery();
      }
      // Generate LLM content on SEO tab load
      if (activeTab === 'seo') {
          setLlmTxtContent(generateLLMContent());
      }
      // Load TrackComm Data
      if (activeTab === 'trackcomm') {
          refreshTrackComm();
          const timer = setInterval(refreshTrackComm, 5000); // Poll every 5s for visitor updates
          return () => clearInterval(timer);
      }
  }, [activeTab, queryCollection]);

  // TrackComm Realtime Listener
  useEffect(() => {
    const handleChatUpdate = async () => {
        const s = await EngagementService.getSessions();
        setSessions(s);
        if (activeSessionId) {
            const msgs = await EngagementService.getMessages(activeSessionId);
            setChatMessages(msgs);
            // Mark as read if viewing
            EngagementService.markSessionRead(activeSessionId);
        }
    };
    chatEvents.addEventListener('update', handleChatUpdate);
    return () => chatEvents.removeEventListener('update', handleChatUpdate);
  }, [activeSessionId]);

  useEffect(() => {
      chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const refreshData = async () => {
    setIsLoading(true);
    const [p, o, u, d] = await Promise.all([
        CatalogService.getProducts(),
        SalesService.getOrders(),
        IdentityService.getUsers(),
        DiscountService.getDiscounts()
    ]);
    setProducts(p);
    setOrders(o);
    setUsers(u);
    setDiscounts(d);
    setIsLoading(false);
  };

  const refreshTrackComm = async () => {
      const s = await EngagementService.getSessions();
      setSessions(s);
      const v = await EngagementService.getMockVisitors();
      setVisitors(v);
  };

  const showEmailNotification = (message: string) => {
      setEmailNotification({ message, visible: true });
      setTimeout(() => setEmailNotification(prev => ({ ...prev, visible: false })), 3000);
  };

  // --- TrackComm Handlers ---

  const handleSelectSession = async (id: string) => {
      setActiveSessionId(id);
      const msgs = await EngagementService.getMessages(id);
      setChatMessages(msgs);
      EngagementService.markSessionRead(id);
  };

  const handleSendAdminMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!chatInput.trim() || !activeSessionId) return;
      await EngagementService.sendMessage(activeSessionId, chatInput, 'agent');
      setChatInput('');
  };

  const handleProactiveChat = async (visitor: Visitor) => {
      // Create a session for this visitor (mapped to user id if logged in, or generated)
      const userId = visitor.id; // In real app, visitor.id maps to user.id
      const session = await EngagementService.createOrGetSession(userId, visitor.name);
      
      // Switch tab and open session
      setTcSubTab('inbox');
      setActiveSessionId(session.id);
      const msgs = await EngagementService.getMessages(session.id);
      setChatMessages(msgs);
      
      // Optional: Send initial greeting
      if (msgs.length === 0) {
          EngagementService.sendMessage(session.id, `Hi ${visitor.name.split(' ')[0]}, I noticed you're looking at the ${visitor.currentPage} page. Can I help?`, 'agent');
      }
  };

  // --- Helpers ---

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
  };

  const handleNewProductImageUpload = async (file?: File) => {
    if (!file) return;
    try {
        const base64 = await convertFileToBase64(file);
        setNewProduct({ ...newProduct, image: base64 });
    } catch (error) {
        console.error("Error uploading image", error);
        alert("Failed to upload image");
    }
  };

  const handleProductImageUpdate = async (product: Product, file?: File) => {
    if (!file) return;
    try {
        const base64 = await convertFileToBase64(file);
        await CatalogService.updateProduct({ ...product, image: base64 });
        refreshData();
    } catch (error) {
        console.error("Error updating image", error);
        alert("Failed to update image");
    }
  };

  const handleGenerateDescription = async () => {
    if (!newProduct.name || (newProduct.ingredients && newProduct.ingredients.length === 0 && !newProduct.isSubscription)) {
      alert("Please enter a product name and details first.");
      return;
    }
    setIsGeneratingAI(true);
    const contextStr = newProduct.isSubscription 
        ? `Subscription Plan: ${newProduct.subscriptionFeatures?.join(', ')}`
        : `Ingredients: ${newProduct.ingredients?.join(", ")}`;
        
    const description = await generateProductDescription(newProduct.name || "", contextStr);
    setNewProduct({ ...newProduct, description });
    setIsGeneratingAI(false);
  };

  const handleAddPlanVariant = () => {
      if (tempPlanPrice <= 0) return;
      
      const currentPlans = newProduct.subscriptionPlans || [];
      // Check for duplicate duration
      if (currentPlans.some(p => p.duration === tempPlanDuration)) {
          alert('A plan with this duration already exists.');
          return;
      }

      setNewProduct({
          ...newProduct,
          subscriptionPlans: [...currentPlans, { duration: tempPlanDuration, price: tempPlanPrice }]
      });
      setTempPlanPrice(0);
  };

  const handleRemovePlanVariant = (index: number) => {
      const currentPlans = [...(newProduct.subscriptionPlans || [])];
      currentPlans.splice(index, 1);
      setNewProduct({ ...newProduct, subscriptionPlans: currentPlans });
  };

  const handleAddVariation = () => {
    if (!tempVariation.name || !tempVariation.price || tempVariation.stock === undefined) return;
    const currentVariations = newProduct.variations || [];
    setNewProduct({
        ...newProduct,
        variations: [...currentVariations, { 
            id: Date.now().toString(), 
            name: tempVariation.name!, 
            price: Number(tempVariation.price), 
            stock: Number(tempVariation.stock) 
        }]
    });
    setTempVariation({ name: '', price: 0, stock: 10 });
  };

  const handleRemoveVariation = (index: number) => {
    const currentVariations = [...(newProduct.variations || [])];
    currentVariations.splice(index, 1);
    setNewProduct({ ...newProduct, variations: currentVariations });
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name) return;
    
    // Determine category based on subscription status if not set correctly
    let category = newProduct.category || 'Signature Salads';
    if (activeTab === 'subscriptions' || newProduct.isSubscription) {
        category = 'Weekly Subscriptions';
        if (!newProduct.subscriptionPlans || newProduct.subscriptionPlans.length === 0) {
            alert('Please add at least one subscription duration plan.');
            return;
        }
    } else {
        if (!hasVariations && !newProduct.price) {
           alert("Please enter a price.");
           return;
        }
        if (hasVariations && (!newProduct.variations || newProduct.variations.length === 0)) {
            alert("Please add at least one variation.");
            return;
        }
    }

    // Calculate base price and stock if variations exist
    let finalPrice = Number(newProduct.price) || 0;
    let finalStock = Number(newProduct.stock) || 0;

    if (newProduct.isSubscription && newProduct.subscriptionPlans?.length) {
        finalPrice = Math.min(...newProduct.subscriptionPlans.map(p => p.price));
    } else if (hasVariations && newProduct.variations?.length) {
        finalPrice = Math.min(...newProduct.variations.map(v => v.price));
        finalStock = newProduct.variations.reduce((acc, v) => acc + v.stock, 0);
    }

    const product: Product = {
      id: Date.now().toString(),
      name: newProduct.name!,
      price: finalPrice,
      category: category,
      description: newProduct.description || 'Fresh and healthy.',
      image: newProduct.image!,
      isSubscription: newProduct.isSubscription || activeTab === 'subscriptions',
      ingredients: newProduct.ingredients || [],
      stock: finalStock,
      subscriptionPlans: newProduct.subscriptionPlans,
      subscriptionFeatures: newProduct.subscriptionFeatures,
      variations: hasVariations ? newProduct.variations : []
    };

    await CatalogService.addProduct(product);
    setIsAddingProduct(false);
    // Reset form
    setNewProduct({
        name: '', price: 0, category: 'Signature Salads', ingredients: [], 
        image: 'https://picsum.photos/400/400?random=' + Math.floor(Math.random() * 100),
        isSubscription: false, description: '', stock: 20,
        subscriptionPlans: [], subscriptionFeatures: [], variations: []
    });
    setHasVariations(false);
    refreshData();
  };

  const handleDeleteProduct = async (id: string) => {
    if (!isAdmin) {
        alert("Only Administrators can delete products.");
        return;
    }
    if (confirm('Are you sure you want to delete this item?')) {
      await CatalogService.deleteProduct(id);
      refreshData();
    }
  };

  const handleUpdateStock = async (product: Product, newStock: number) => {
    if (newStock < 0 || isNaN(newStock)) return;
    await CatalogService.updateProduct({ ...product, stock: newStock });
    refreshData();
  };

  // --- Discount Handlers ---
  const handleAddDiscount = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newDiscount.code || !newDiscount.value) return;

      const discount: Discount = {
          id: 'disc_' + Date.now(),
          code: newDiscount.code.toUpperCase(),
          type: newDiscount.type || 'percentage',
          value: Number(newDiscount.value),
          isActive: true
      };

      await DiscountService.addDiscount(discount);
      setIsAddingDiscount(false);
      setNewDiscount({ code: '', type: 'percentage', value: 0, isActive: true });
      refreshData();
  };

  const handleDeleteDiscount = async (id: string) => {
      if(confirm('Are you sure?')) {
          await DiscountService.deleteDiscount(id);
          refreshData();
      }
  };

  const addIngredient = () => {
      if(ingredientInput.trim()){
          setNewProduct({
              ...newProduct, 
              ingredients: [...(newProduct.ingredients || []), ingredientInput.trim()]
          });
          setIngredientInput('');
      }
  };

  const addFeature = () => {
      if(featureInput.trim()){
          setNewProduct({
              ...newProduct,
              subscriptionFeatures: [...(newProduct.subscriptionFeatures || []), featureInput.trim()]
          });
          setFeatureInput('');
      }
  };

  const removeFeature = (index: number) => {
      const updatedFeatures = [...(newProduct.subscriptionFeatures || [])];
      updatedFeatures.splice(index, 1);
      setNewProduct({...newProduct, subscriptionFeatures: updatedFeatures});
  };

  // --- Order Handlers ---

  const handleUpdateOrderStatus = async (order: Order, newStatus: string) => {
      const updatedOrder = { ...order, status: newStatus as Order['status'] };
      await SalesService.updateOrder(updatedOrder);
      
      // Email Notification
      const customer = users.find(u => u.id === order.userId);
      if (customer) {
          showEmailNotification(`Sending update email to ${customer.email}...`);
          try {
             await sendOrderStatusUpdateEmail(updatedOrder, customer);
             showEmailNotification(`Email sent to ${customer.email}`);
          } catch (e) {
             console.error(e);
          }
      }

      refreshData();
  };

  // --- User Handlers ---

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;

    const user: User = {
        id: 'usr_' + Date.now().toString(),
        name: newUser.name!,
        email: newUser.email!,
        role: newUser.role || 'customer',
        status: newUser.status || 'active',
        addresses: [],
        wishlist: []
    };

    await IdentityService.addUser(user);
    setIsAddingUser(false);
    setNewUser({ name: '', email: '', role: 'customer', status: 'active' });
    refreshData();
  };

  const handleToggleUserStatus = async (user: User) => {
      const newStatus = user.status === 'active' ? 'suspended' : 'active';
      await IdentityService.updateUser({ ...user, status: newStatus });
      refreshData();
  };

  const handleToggleUserRole = async (user: User) => {
      const newRole = user.role === 'admin' ? 'customer' : 'admin';
      await IdentityService.updateUser({ ...user, role: newRole });
      refreshData();
  };

  const handleSendPasswordReset = async (user: User) => {
      showEmailNotification(`Sending reset link to ${user.email}...`);
      try {
          await sendPasswordResetEmail(user);
          showEmailNotification(`Reset link sent to ${user.email}`);
      } catch (e) {
          console.error(e);
      }
  };

  const initiateDeleteUser = (id: string) => {
    setUserToDelete(id);
  };

  const confirmDeleteUser = async () => {
      if (userToDelete) {
          await IdentityService.deleteUser(userToDelete);
          setUserToDelete(null);
          refreshData();
      }
  };

  // --- SEO & Optimization Handlers ---
  
  const handleRunAudit = () => {
      const result = performSEOAudit();
      setAuditResult(result);
  };

  const handleOptimizeImages = async () => {
      setOptimizingImages(true);
      setOptimizationProgress(0);
      setOptimizationSaved('0');
      
      await simulateImageOptimization((progress, saved) => {
          setOptimizationProgress(progress);
          setOptimizationSaved(saved);
      });
      
      setOptimizingImages(false);
  };

  const handleDownloadLLM = () => {
      const element = document.createElement("a");
      const file = new Blob([llmTxtContent], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = "llm.txt";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
  };

  // --- Database Management Handlers ---

  const handleRunQuery = async () => {
      setQueryError(null);
      let collectionData: any[] = [];
      
      // Async fetch based on selection
      switch(queryCollection) {
          case 'products': collectionData = await CatalogService.getProducts(); break;
          case 'orders': collectionData = await SalesService.getOrders(); break;
          case 'users': collectionData = await IdentityService.getUsers(); break;
          case 'reviews': collectionData = await EngagementService.getReviews(); break;
      }

      try {
          const filterFn = new Function('item', queryExpression.includes('return') ? queryExpression : `return ${queryExpression};`);
          const results = collectionData.filter(item => filterFn(item));
          setQueryResults(results);
      } catch (err: any) {
          setQueryResults([]);
          setQueryError(err.message || 'Invalid Query Syntax');
      }
  };

  const handleExportDatabase = async () => {
      const snapshot = await DatabaseService.getFullSnapshot();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(snapshot, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `dietanic_db_snapshot_${new Date().toISOString()}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleResetDatabase = async () => {
      if (confirm("WARNING: This will wipe all current data and restore factory defaults. This action cannot be undone. Are you sure?")) {
          await DatabaseService.resetDatabase();
          window.location.reload(); 
      }
  };


  // --- List Filtering ---

  const getProcessedOrders = () => {
    let result = [...orders];

    if (orderStatusFilter !== 'all') {
      result = result.filter(o => o.status === orderStatusFilter);
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (orderSortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (orderSortField === 'total') {
        comparison = a.total - b.total;
      }
      return orderSortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  };

  const processedOrders = getProcessedOrders();
  const totalSales = orders.reduce((acc, order) => acc + order.total, 0);
  const totalOrders = orders.length;

  if (!canManageStore) {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
              <div className="max-w-md w-full text-center p-8 bg-white shadow-lg rounded-lg border border-gray-200">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                      <Lock className="h-8 w-8 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                  <p className="text-gray-500 mb-6">You do not have permission to access the administration portal. Please log in with an administrator or editor account.</p>
                  <Link to="/" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700">
                      Return Home
                  </Link>
              </div>
          </div>
      );
  }

  if (isLoading && activeTab === 'dashboard') {
      return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin text-brand-600"/></div>
  }

  return (
    <div className="bg-gray-100 min-h-screen relative">
      {/* Email Toast Notification */}
      {emailNotification.visible && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-md shadow-lg flex items-center gap-3 animate-fade-in">
            <Mail size={20} className="text-brand-400" />
            <span className="text-sm font-medium">{emailNotification.message}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        
        {/* Header with Notifications */}
        <div className="md:flex md:items-center md:justify-between mb-8 px-4 sm:px-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight flex items-center gap-2">
              Admin Portal
              <span className={`text-xs px-2 py-1 rounded-full border ${isAdmin ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>
                  {isAdmin ? 'Administrator Access' : 'Editor Access'}
              </span>
            </h2>
          </div>
          
          {/* Notification Bell */}
          <div className="relative mt-4 md:mt-0">
              <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 bg-white rounded-full hover:bg-gray-50 text-gray-500 hover:text-brand-600 relative shadow-sm border border-gray-200"
              >
                  <Bell size={20} />
                  {notifications.length > 0 && (
                      <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
              </button>
              
              {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden animate-fade-in">
                      <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                          <span className="text-sm font-bold text-gray-700">Notifications</span>
                          <button onClick={() => setNotifications([])} className="text-xs text-brand-600 hover:underline">Clear all</button>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                          {notifications.length === 0 ? (
                              <div className="p-4 text-center text-gray-400 text-xs">No new notifications</div>
                          ) : (
                              notifications.map(n => (
                                  <div key={n.id} className="p-3 border-b border-gray-50 hover:bg-gray-50 flex gap-3">
                                      <div className={`h-2 w-2 mt-1.5 rounded-full flex-shrink-0 ${n.type === 'alert' ? 'bg-red-500' : n.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                      <div>
                                          <p className="text-sm text-gray-800">{n.text}</p>
                                          <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                                      </div>
                                  </div>
                              ))
                          )}
                      </div>
                  </div>
              )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 px-4 sm:px-0">
            <nav className="flex space-x-4 overflow-x-auto pb-2" aria-label="Tabs">
                {['dashboard', 'products', 'subscriptions', 'discounts', 'orders', 'users', 'database', 'seo', 'trackcomm'].map((tab) => {
                    if ((tab === 'users' || tab === 'database') && !isAdmin) return null;

                    return (
                        <button
                            key={tab}
                            onClick={() => {
                                setActiveTab(tab as any);
                                if (tab === 'subscriptions') {
                                    setNewProduct(prev => ({ ...prev, isSubscription: true, category: 'Weekly Subscriptions', subscriptionPlans: [], variations: [] }));
                                    setHasVariations(false);
                                } else if (tab === 'products') {
                                    setNewProduct(prev => ({ ...prev, isSubscription: false, category: 'Signature Salads', variations: [] }));
                                    setHasVariations(false);
                                }
                            }}
                            className={`
                                ${activeTab === tab ? 'bg-brand-600 text-white' : 'text-gray-500 hover:text-gray-700 bg-white'}
                                rounded-md px-3 py-2 text-sm font-medium capitalize shadow-sm transition-colors whitespace-nowrap flex items-center gap-2
                            `}
                        >
                            {tab === 'trackcomm' ? <><MessageSquare size={16}/> TrackComm</> : (tab === 'seo' ? 'SEO & Speed' : tab)}
                        </button>
                    );
                })}
            </nav>
        </div>

        <div className="px-4 sm:px-0">
            
            {/* Dashboard View */}
            {activeTab === 'dashboard' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="overflow-hidden rounded-lg bg-white shadow">
                            <div className="p-5 flex items-center">
                                <div className="flex-shrink-0 bg-brand-500 rounded-md p-3">
                                    <DollarSign className="h-6 w-6 text-white" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="truncate text-sm font-medium text-gray-500">Total Sales</dt>
                                        <dd className="text-2xl font-semibold text-gray-900">₹{totalSales.toFixed(2)}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                        <div className="overflow-hidden rounded-lg bg-white shadow">
                            <div className="p-5 flex items-center">
                                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                                    <ShoppingCart className="h-6 w-6 text-white" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="truncate text-sm font-medium text-gray-500">Total Orders</dt>
                                        <dd className="text-2xl font-semibold text-gray-900">{totalOrders}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                        <div className="overflow-hidden rounded-lg bg-white shadow">
                            <div className="p-5 flex items-center">
                                <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                                    <Box className="h-6 w-6 text-white" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="truncate text-sm font-medium text-gray-500">Active Products</dt>
                                        <dd className="text-2xl font-semibold text-gray-900">{products.length}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                        {isAdmin && (
                            <div className="overflow-hidden rounded-lg bg-white shadow">
                                <div className="p-5 flex items-center">
                                    <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                                        <Users className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="truncate text-sm font-medium text-gray-500">Total Users</dt>
                                            <dd className="text-2xl font-semibold text-gray-900">{users.length}</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                         {/* Recent Activity Mini-Feed */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                                <Activity size={20} className="text-brand-600" /> Real-time Activity
                            </h3>
                            <div className="flow-root">
                                <ul className="-mb-8">
                                    {orders.slice(0, 3).map((order, idx) => (
                                        <li key={order.id}>
                                            <div className="relative pb-8">
                                                {idx !== 2 ? <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span> : null}
                                                <div className="relative flex space-x-3">
                                                    <div>
                                                        <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                                                            <ShoppingCart className="h-4 w-4 text-white" aria-hidden="true" />
                                                        </span>
                                                    </div>
                                                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                                        <div>
                                                            <p className="text-sm text-gray-500">New order placed <a href="#" onClick={() => setActiveTab('orders')} className="font-medium text-gray-900">#{order.id.slice(-6)}</a></p>
                                                        </div>
                                                        <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                                            <time>{new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</time>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                    {sessions.slice(0, 1).map((s) => (
                                         <li key={s.id}>
                                            <div className="relative pb-8">
                                                <div className="relative flex space-x-3">
                                                    <div>
                                                        <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                                            <MessageSquare className="h-4 w-4 text-white" aria-hidden="true" />
                                                        </span>
                                                    </div>
                                                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                                        <div>
                                                            <p className="text-sm text-gray-500">Chat started with <span className="font-medium text-gray-900">{s.userName}</span></p>
                                                        </div>
                                                        <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                                            <time>Just now</time>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => { setActiveTab('products'); setIsAddingProduct(true); }}
                                    className="flex items-center justify-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-brand-50 hover:border-brand-200 transition-colors"
                                >
                                    <Plus className="text-brand-600" />
                                    <span className="font-medium text-gray-700">Add Product</span>
                                </button>
                                <button 
                                    onClick={() => { setActiveTab('trackcomm'); setTcSubTab('inbox'); }}
                                    className="flex items-center justify-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-brand-50 hover:border-brand-200 transition-colors"
                                >
                                    <MessageSquare className="text-brand-600" />
                                    <span className="font-medium text-gray-700">View Chats</span>
                                </button>
                                <button 
                                    onClick={() => setActiveTab('orders')}
                                    className="flex items-center justify-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-brand-50 hover:border-brand-200 transition-colors"
                                >
                                    <Package className="text-brand-600" />
                                    <span className="font-medium text-gray-700">Process Orders</span>
                                </button>
                                <button 
                                    onClick={() => setActiveTab('discounts')}
                                    className="flex items-center justify-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-brand-50 hover:border-brand-200 transition-colors"
                                >
                                    <Tag className="text-brand-600" />
                                    <span className="font-medium text-gray-700">Create Promo</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Discounts View */}
            {activeTab === 'discounts' && (
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex justify-between mb-4">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">
                            Manage Promo Codes
                        </h3>
                        <button 
                            onClick={() => setIsAddingDiscount(!isAddingDiscount)}
                            className="bg-brand-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-700 flex items-center gap-2"
                        >
                            {isAddingDiscount ? <X size={16}/> : <Plus size={16}/>}
                            {isAddingDiscount ? 'Cancel' : 'Add Code'}
                        </button>
                    </div>

                    {isAddingDiscount && (
                        <form onSubmit={handleAddDiscount} className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Code</label>
                                    <input type="text" required placeholder="e.g. SUMMER20" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border uppercase" 
                                        value={newDiscount.code} onChange={(e) => setNewDiscount({...newDiscount, code: e.target.value.toUpperCase()})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Type</label>
                                    <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border"
                                        value={newDiscount.type} onChange={(e) => setNewDiscount({...newDiscount, type: e.target.value as any})}>
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (₹)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Value</label>
                                    <input type="number" required min="0" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border" 
                                        value={newDiscount.value} onChange={(e) => setNewDiscount({...newDiscount, value: Number(e.target.value)})} />
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-brand-700 shadow-sm">
                                    Save Discount
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {discounts.map(discount => (
                                    <tr key={discount.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-brand-600 flex items-center gap-2">
                                            <Tag size={16} /> {discount.code}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {discount.type === 'percentage' ? `${discount.value}% Off` : `₹${discount.value} Off`}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${discount.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {discount.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleDeleteDiscount(discount.id)} className="text-red-600 hover:text-red-900">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {discounts.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 italic">No promo codes active.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TrackComm Engagement Platform */}
            {activeTab === 'trackcomm' && (
                <div className="h-[calc(100vh-200px)] flex flex-col bg-white shadow rounded-lg overflow-hidden">
                    <div className="border-b border-gray-200 p-4 bg-gray-50 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="text-brand-600" />
                            <h2 className="text-lg font-bold text-gray-800">TrackComm <span className="text-xs font-normal text-gray-500">Customer Engagement</span></h2>
                        </div>
                        <div className="flex bg-white rounded-md shadow-sm border border-gray-200">
                             <button 
                                onClick={() => setTcSubTab('inbox')} 
                                className={`px-4 py-1.5 text-sm font-medium rounded-l-md ${tcSubTab === 'inbox' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'}`}
                             >
                                 Inbox ({sessions.filter(s => s.unreadCount > 0).length})
                             </button>
                             <button 
                                onClick={() => setTcSubTab('visitors')} 
                                className={`px-4 py-1.5 text-sm font-medium border-l border-r border-gray-200 ${tcSubTab === 'visitors' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'}`}
                             >
                                 Visitors ({visitors.length})
                             </button>
                             <button 
                                onClick={() => setTcSubTab('analytics')} 
                                className={`px-4 py-1.5 text-sm font-medium rounded-r-md ${tcSubTab === 'analytics' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'}`}
                             >
                                 Analytics
                             </button>
                        </div>
                    </div>

                    {/* Inbox View */}
                    {tcSubTab === 'inbox' && (
                        <div className="flex-1 flex overflow-hidden">
                            {/* Session List */}
                            <div className="w-80 border-r border-gray-200 overflow-y-auto bg-gray-50">
                                {sessions.map(session => (
                                    <div 
                                        key={session.id}
                                        onClick={() => handleSelectSession(session.id)}
                                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-white transition-colors ${activeSessionId === session.id ? 'bg-white border-l-4 border-l-brand-600' : ''}`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`font-semibold text-sm ${session.unreadCount > 0 ? 'text-gray-900' : 'text-gray-600'}`}>{session.userName}</span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(session.lastActive).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">{session.lastMessage}</p>
                                        {session.unreadCount > 0 && (
                                            <span className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                {session.unreadCount} new
                                            </span>
                                        )}
                                    </div>
                                ))}
                                {sessions.length === 0 && (
                                    <div className="p-8 text-center text-gray-400 text-sm">
                                        No active chats.
                                    </div>
                                )}
                            </div>

                            {/* Chat Window */}
                            <div className="flex-1 flex flex-col bg-white">
                                {activeSessionId ? (
                                    <>
                                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                                            {chatMessages.map(msg => (
                                                <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm shadow-sm ${
                                                        msg.sender === 'agent' 
                                                        ? 'bg-brand-600 text-white rounded-br-none' 
                                                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                                                    }`}>
                                                        <p>{msg.text}</p>
                                                        <p className={`text-[10px] mt-1 text-right ${msg.sender === 'agent' ? 'text-brand-200' : 'text-gray-400'}`}>
                                                            {new Date(msg.timestamp).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                            <div ref={chatScrollRef} />
                                        </div>
                                        <form onSubmit={handleSendAdminMessage} className="p-4 border-t border-gray-200 bg-white">
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={chatInput}
                                                    onChange={(e) => setChatInput(e.target.value)}
                                                    placeholder="Type your reply..."
                                                    className="w-full border border-gray-300 rounded-full pl-4 pr-12 py-3 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                                                />
                                                <button type="submit" className="absolute right-2 top-1.5 p-1.5 bg-brand-600 text-white rounded-full hover:bg-brand-700 transition-colors">
                                                    <Send size={18} />
                                                </button>
                                            </div>
                                        </form>
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                        <MessageSquare size={48} className="mb-4 text-gray-300" />
                                        <p>Select a conversation to start messaging.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {tcSubTab === 'visitors' && (
                        <div className="flex-1 p-6 overflow-y-auto">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Active Site Visitors</h3>
                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitor</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Page</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time on Site</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {visitors.map(visitor => (
                                            <tr key={visitor.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600">
                                                        <Users size={16} />
                                                    </div>
                                                    {visitor.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{visitor.currentPage}</code>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{visitor.timeOnSite}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {visitor.device === 'Mobile' ? <Monitor size={16} className="text-gray-400" /> : <Monitor size={16} />}
                                                    <span className="ml-2">{visitor.device}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        visitor.status === 'chatting' ? 'bg-green-100 text-green-800' : 
                                                        visitor.status === 'browsing' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {visitor.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button 
                                                        onClick={() => handleProactiveChat(visitor)}
                                                        className="text-brand-600 hover:text-brand-900 bg-brand-50 px-3 py-1 rounded-md transition-colors"
                                                    >
                                                        Start Chat
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    
                    {tcSubTab === 'analytics' && (
                         <div className="flex-1 p-8 overflow-y-auto bg-gray-50">
                             <h3 className="text-xl font-bold text-gray-900 mb-6">Engagement Performance</h3>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                 <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                     <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-sm text-gray-500 font-medium">Avg. Response Time</p>
                                            <h4 className="text-3xl font-bold text-gray-900 mt-2">1m 42s</h4>
                                        </div>
                                        <div className="p-2 bg-green-100 rounded-md text-green-600">
                                            <Zap size={20} />
                                        </div>
                                     </div>
                                     <span className="text-xs text-green-600 flex items-center font-medium">
                                         <ArrowUpDown size={12} className="mr-1" /> 12% faster vs last week
                                     </span>
                                 </div>

                                 <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                     <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-sm text-gray-500 font-medium">Customer Satisfaction</p>
                                            <h4 className="text-3xl font-bold text-gray-900 mt-2">4.8/5.0</h4>
                                        </div>
                                        <div className="p-2 bg-blue-100 rounded-md text-blue-600">
                                            <Activity size={20} />
                                        </div>
                                     </div>
                                     <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                        <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '96%' }}></div>
                                     </div>
                                 </div>

                                 <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                     <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-sm text-gray-500 font-medium">Total Conversations</p>
                                            <h4 className="text-3xl font-bold text-gray-900 mt-2">{sessions.length + 142}</h4>
                                        </div>
                                        <div className="p-2 bg-purple-100 rounded-md text-purple-600">
                                            <MessageSquare size={20} />
                                        </div>
                                     </div>
                                     <span className="text-xs text-gray-500">Across Sales, Support, and Marketing</span>
                                 </div>
                             </div>

                             <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                 <h4 className="font-bold text-gray-800 mb-4">Weekly Engagement Volume</h4>
                                 <div className="h-64 flex items-end gap-2">
                                     {[35, 50, 45, 70, 60, 85, 95].map((h, i) => (
                                         <div key={i} className="flex-1 flex flex-col justify-end items-center gap-2">
                                             <div 
                                                className="w-full bg-brand-500 rounded-t-sm hover:bg-brand-600 transition-colors" 
                                                style={{ height: `${h}%` }}
                                             ></div>
                                             <span className="text-xs text-gray-500">Day {i+1}</span>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                         </div>
                    )}
                </div>
            )}

            {/* Products & Subscriptions Common Layout (Simplified) */}
            {(activeTab === 'products' || activeTab === 'subscriptions') && (
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex justify-between mb-4">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">
                            {activeTab === 'subscriptions' ? 'Subscription Plans' : 'Product Inventory'}
                        </h3>
                        <button 
                            onClick={() => setIsAddingProduct(!isAddingProduct)}
                            className="bg-brand-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-700 flex items-center gap-2"
                        >
                            {isAddingProduct ? <X size={16}/> : <Plus size={16}/>}
                            {isAddingProduct ? 'Cancel' : (activeTab === 'subscriptions' ? 'Add Plan' : 'Add Product')}
                        </button>
                    </div>

                    {isAddingProduct && (
                        <form onSubmit={handleAddProduct} className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border" 
                                        value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} />
                                </div>
                                
                                {activeTab === 'products' && !hasVariations && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
                                        <input type="number" step="0.01" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border" 
                                            value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})} />
                                    </div>
                                )}
                                
                                {activeTab === 'products' && (
                                    <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Category</label>
                                        <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border"
                                            value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}>
                                            <option>Signature Salads</option>
                                            <option>Warm Bowls</option>
                                            <option>Cold Pressed Juices</option>
                                        </select>
                                    </div>
                                    {!hasVariations && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Stock Qty</label>
                                            <input type="number" min="0" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border" 
                                                value={newProduct.stock} onChange={(e) => setNewProduct({...newProduct, stock: parseInt(e.target.value)})} />
                                        </div>
                                    )}

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Ingredients</label>
                                        <div className="flex gap-2 mt-1">
                                            <input
                                                type="text"
                                                placeholder="Add ingredient (e.g. Kale)"
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border"
                                                value={ingredientInput}
                                                onChange={(e) => setIngredientInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
                                            />
                                            <button
                                                type="button"
                                                onClick={addIngredient}
                                                className="bg-brand-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-brand-700"
                                            >
                                                Add
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {newProduct.ingredients?.map((ing, idx) => (
                                                <span key={idx} className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                                                    {ing}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newIngs = [...(newProduct.ingredients || [])];
                                                            newIngs.splice(idx, 1);
                                                            setNewProduct({ ...newProduct, ingredients: newIngs });
                                                        }}
                                                        className="ml-2 text-green-600 hover:text-green-900 focus:outline-none"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    </>
                                )}

                                {activeTab === 'products' && (
                                    <div className="md:col-span-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            <input 
                                                type="checkbox" 
                                                id="hasVariations" 
                                                checked={hasVariations} 
                                                onChange={(e) => {
                                                    setHasVariations(e.target.checked);
                                                    if(!e.target.checked) {
                                                        setNewProduct({...newProduct, variations: []});
                                                    }
                                                }}
                                                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                                            />
                                            <label htmlFor="hasVariations" className="text-sm font-medium text-gray-700 select-none flex items-center gap-1">
                                                <Layers size={14} className="text-gray-500" />
                                                Product has variations (Size, Color, etc.)
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'products' && hasVariations && (
                                    <div className="md:col-span-2 bg-gray-50 p-4 rounded-md border border-gray-200">
                                        <h4 className="text-sm font-bold text-gray-800 mb-3">Manage Variations</h4>
                                        {/* Variation Input Row */}
                                        <div className="flex flex-wrap gap-3 items-end mb-4 bg-white p-3 rounded shadow-sm border border-gray-200">
                                             <div className="flex-1 min-w-[120px]">
                                                 <label className="block text-xs font-medium text-gray-500 mb-1">Variation Name</label>
                                                 <input 
                                                    type="text" 
                                                    placeholder="e.g. Large, Spicy" 
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-1.5 border" 
                                                    value={tempVariation.name} 
                                                    onChange={(e) => setTempVariation({...tempVariation, name: e.target.value})} 
                                                 />
                                             </div>
                                             <div className="w-24">
                                                 <label className="block text-xs font-medium text-gray-500 mb-1">Price (₹)</label>
                                                 <input 
                                                    type="number" 
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-1.5 border" 
                                                    value={tempVariation.price} 
                                                    onChange={(e) => setTempVariation({...tempVariation, price: Number(e.target.value)})} 
                                                 />
                                             </div>
                                             <div className="w-24">
                                                 <label className="block text-xs font-medium text-gray-500 mb-1">Stock</label>
                                                 <input 
                                                    type="number" 
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-1.5 border" 
                                                    value={tempVariation.stock} 
                                                    onChange={(e) => setTempVariation({...tempVariation, stock: Number(e.target.value)})} 
                                                 />
                                             </div>
                                             <button 
                                                type="button" 
                                                onClick={handleAddVariation} 
                                                className="bg-brand-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-brand-700 h-[34px]"
                                             >
                                                Add
                                             </button>
                                        </div>
                                        
                                        {/* List */}
                                        <div className="space-y-2">
                                            {newProduct.variations?.map((v, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-white px-3 py-2 rounded shadow-sm border border-gray-100">
                                                    <span className="font-medium text-sm text-gray-900">{v.name}</span>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-sm text-gray-500">Stock: {v.stock}</span>
                                                        <span className="text-sm font-semibold text-gray-900">₹{v.price.toFixed(2)}</span>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => handleRemoveVariation(idx)} 
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!newProduct.variations || newProduct.variations.length === 0) && (
                                                <p className="text-xs text-gray-500 italic text-center py-2">No variations added yet.</p>
                                            )}
                                        </div>
                                        <div className="mt-2 text-xs text-gray-400">
                                            Note: Base price and total stock will be calculated automatically from variations.
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'subscriptions' && (
                                    <div className="md:col-span-2 bg-blue-50 p-4 rounded-md border border-blue-100">
                                        <label className="block text-sm font-bold text-gray-800 mb-2">Configure Plan Options</label>
                                        <div className="flex gap-2 items-end mb-3">
                                            <div className="flex-1">
                                                <label className="block text-xs font-medium text-gray-500">Duration</label>
                                                <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-1.5 border"
                                                    value={tempPlanDuration} onChange={(e) => setTempPlanDuration(e.target.value as any)}>
                                                    <option value="weekly">Weekly</option>
                                                    <option value="bi-weekly">Bi-Weekly</option>
                                                    <option value="monthly">Monthly</option>
                                                </select>
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-xs font-medium text-gray-500">Price (₹)</label>
                                                <input type="number" step="0.01" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-1.5 border"
                                                    value={tempPlanPrice} onChange={(e) => setTempPlanPrice(Number(e.target.value))} />
                                            </div>
                                            <button type="button" onClick={handleAddPlanVariant} className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700">
                                                Add Option
                                            </button>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            {newProduct.subscriptionPlans?.map((plan, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-white border px-3 py-2 rounded shadow-sm">
                                                    <span className="capitalize text-sm font-medium">{plan.duration}</span>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-sm text-gray-600">₹{plan.price.toFixed(2)}</span>
                                                        <button type="button" onClick={() => handleRemovePlanVariant(idx)} className="text-red-500 hover:text-red-700">
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!newProduct.subscriptionPlans || newProduct.subscriptionPlans.length === 0) && (
                                                <p className="text-xs text-gray-500 italic">No plan options added yet.</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Product Image</label>
                                    <div className="mt-2 flex items-center gap-4">
                                        <div className="relative h-20 w-20 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                                            {newProduct.image ? (
                                                <img src={newProduct.image} alt="Preview" className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                    <ImageIcon size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex gap-2 mb-2">
                                                <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-50 transition shadow-sm flex items-center gap-2">
                                                    <Upload size={16} />
                                                    Upload File
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleNewProductImageUpload(e.target.files?.[0])} />
                                                </label>
                                                <span className="text-gray-400 self-center text-sm">or</span>
                                            </div>
                                            <input 
                                                type="text" 
                                                placeholder="Enter Image URL"
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border"
                                                value={newProduct.image && newProduct.image.startsWith('data:') ? '' : newProduct.image} 
                                                onChange={(e) => setNewProduct({...newProduct, image: e.target.value})} 
                                            />
                                            {newProduct.image && newProduct.image.startsWith('data:') && (
                                                <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                                                    <CheckCircle size={10} /> Image converted to Base64
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border" rows={3}
                                        value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} />
                                    <button type="button" onClick={handleGenerateDescription} disabled={isGeneratingAI} className="mt-2 text-sm text-brand-600 hover:text-brand-800 flex items-center gap-1">
                                        <Sparkles size={16} /> {isGeneratingAI ? 'Generating...' : 'Generate with Gemini AI'}
                                    </button>
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-brand-700 shadow-sm">
                                    Save {activeTab === 'subscriptions' ? 'Plan' : 'Product'}
                                </button>
                            </div>
                        </form>
                    )}

                    <ul className="divide-y divide-gray-200">
                        {products
                          .filter(p => activeTab === 'subscriptions' ? p.isSubscription : !p.isSubscription)
                          .map((product) => (
                            <li key={product.id} className="py-4 flex items-center justify-between group">
                                <div className="flex items-center">
                                    <div className="relative group mr-4">
                                        <img className="h-12 w-12 rounded-lg object-cover bg-gray-100" src={product.image} alt="" />
                                        <label title="Change Image" className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white opacity-0 group-hover:opacity-100 rounded-lg cursor-pointer transition-opacity">
                                            <Upload size={16} />
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleProductImageUpdate(product, e.target.files?.[0])} />
                                        </label>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{product.name}</p>
                                        <p className="text-xs text-gray-500">{product.category}</p>
                                        {product.isSubscription && product.subscriptionPlans && (
                                            <div className="flex gap-1 mt-1 flex-wrap">
                                                {product.subscriptionPlans.map(plan => (
                                                    <span key={plan.duration} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800" title={`$${plan.price}`}>
                                                        {plan.duration}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {product.variations && product.variations.length > 0 && (
                                            <div className="flex gap-1 mt-1 flex-wrap">
                                                {product.variations.map(v => (
                                                    <span key={v.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200" title={`$${v.price} - Stock: ${v.stock}`}>
                                                        {v.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">
                                            {product.isSubscription ? 'From ' : ''}₹{product.price.toFixed(2)}
                                        </p>
                                        {!product.isSubscription && (
                                            <div className="flex items-center gap-2 mt-1">
                                                <button onClick={() => handleUpdateStock(product, product.stock - 1)} className="text-gray-400 hover:text-red-500"><X size={12}/></button>
                                                <span className={`text-xs ${product.stock < 10 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                                                    {product.stock} in stock
                                                </span>
                                                <button onClick={() => handleUpdateStock(product, product.stock + 1)} className="text-gray-400 hover:text-green-500"><Plus size={12}/></button>
                                            </div>
                                        )}
                                    </div>
                                    {isAdmin ? (
                                        <button onClick={() => handleDeleteProduct(product.id)} className="text-gray-400 hover:text-red-600 transition-colors p-2">
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    ) : (
                                        <div className="p-2" title="Delete requires Admin privileges">
                                            <Lock className="h-4 w-4 text-gray-300" />
                                        </div>
                                    )}
                                </div>
                            </li>
                        ))}
                        {products.filter(p => activeTab === 'subscriptions' ? p.isSubscription : !p.isSubscription).length === 0 && (
                            <li className="py-8 text-center text-gray-500 text-sm">
                                No {activeTab} found. Add one to get started.
                            </li>
                        )}
                    </ul>
                </div>
            )}
            
            {/* Orders View */}
            {activeTab === 'orders' && (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-gray-400" />
                            <select 
                                value={orderStatusFilter} 
                                onChange={(e) => setOrderStatusFilter(e.target.value)}
                                className="block rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-brand-500 focus:outline-none focus:ring-brand-500 sm:text-sm border"
                            >
                                <option value="all">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Sort by:</span>
                            <div className="flex rounded-md shadow-sm">
                                <button
                                    onClick={() => setOrderSortField('date')}
                                    className={`relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 focus:z-10 ${orderSortField === 'date' ? 'bg-brand-600 text-white' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
                                >
                                    Date
                                </button>
                                <button
                                    onClick={() => setOrderSortField('total')}
                                    className={`relative -ml-px inline-flex items-center rounded-r-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 focus:z-10 ${orderSortField === 'total' ? 'bg-brand-600 text-white' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
                                >
                                    Total
                                </button>
                            </div>
                            <button 
                                onClick={() => setOrderSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                                className="p-2 text-gray-400 hover:text-gray-600 border rounded-md"
                            >
                                <ArrowUpDown className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {processedOrders.map((order) => (
                            <li key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">Order #{order.id.slice(-6)}</h3>
                                        <div className="flex items-center text-sm text-gray-500 mt-1">
                                            <Calendar className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                                            {new Date(order.date).toLocaleDateString()} at {new Date(order.date).toLocaleTimeString()}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-gray-900">₹{order.total.toFixed(2)}</p>
                                        <p className="text-sm text-gray-500">{order.items.length} Items</p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-md p-4 mb-4">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Items</h4>
                                    <ul className="space-y-2">
                                        {order.items.map((item, idx) => (
                                            <li key={idx} className="flex justify-between text-sm">
                                                <span className="text-gray-700">{item.quantity}x {item.name}</span>
                                                <span className="text-gray-900 font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="flex items-center justify-between bg-white border border-gray-200 rounded-md p-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-700">Status:</span>
                                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                            order.status === 'delivered' ? 'bg-green-50 text-green-700 ring-green-600/20' : 
                                            order.status === 'cancelled' ? 'bg-red-50 text-red-700 ring-red-600/20' : 
                                            'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                                        }`}>
                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        {['pending', 'processing', 'delivered', 'cancelled'].map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => handleUpdateOrderStatus(order, status)}
                                                disabled={order.status === status}
                                                className={`text-xs px-2 py-1 rounded border ${
                                                    order.status === status 
                                                    ? 'bg-gray-100 text-gray-400 cursor-default' 
                                                    : 'bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-400'
                                                }`}
                                            >
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </li>
                        ))}
                        {processedOrders.length === 0 && (
                            <li className="p-8 text-center text-gray-500">No orders found matching criteria.</li>
                        )}
                    </ul>
                </div>
            )}

            {/* Users View (Restricted to Admins) */}
            {activeTab === 'users' && isAdmin && (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">User Management</h3>
                        <button 
                            onClick={() => setIsAddingUser(!isAddingUser)}
                            className="bg-brand-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-brand-700 flex items-center gap-2"
                        >
                            {isAddingUser ? 'Cancel' : <><UserPlus size={16}/> Add User</>}
                        </button>
                    </div>

                    {isAddingUser && (
                        <div className="p-6 bg-gray-50 border-b border-gray-200 animate-fade-in">
                            <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border" 
                                        value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input type="email" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border" 
                                        value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Role</label>
                                    <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border"
                                        value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}>
                                        <option value="customer">Customer</option>
                                        <option value="admin">Admin</option>
                                        <option value="editor">Editor</option>
                                    </select>
                                </div>
                                <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-700 h-10">
                                    Create User
                                </button>
                            </form>
                        </div>
                    )}

                    <ul className="divide-y divide-gray-200">
                        {users.map((user) => (
                            <li key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center gap-4">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                        user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 
                                        user.role === 'editor' ? 'bg-blue-100 text-blue-600' :
                                        'bg-gray-100 text-gray-600'
                                    }`}>
                                        {user.role === 'admin' ? <Shield size={20} /> : 
                                         user.role === 'editor' ? <Package size={20} /> : 
                                         <Users size={20} />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                        <p className="text-xs text-gray-500">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                        user.status === 'active' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-red-50 text-red-700 ring-red-600/20'
                                    }`}>
                                        {user.status}
                                    </span>
                                    
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleSendPasswordReset(user)}
                                            className="p-1 text-gray-400 hover:text-blue-600"
                                            title="Send Password Reset Email"
                                        >
                                            <KeyRound size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleToggleUserStatus(user)}
                                            className="p-1 text-gray-400 hover:text-gray-600"
                                            title={user.status === 'active' ? "Suspend User" : "Activate User"}
                                        >
                                            {user.status === 'active' ? <Ban size={18} /> : <CheckCircle size={18} />}
                                        </button>
                                        <button 
                                            onClick={() => handleToggleUserRole(user)}
                                            className="p-1 text-gray-400 hover:text-purple-600"
                                            title="Toggle Admin Role"
                                        >
                                            <Shield size={18} />
                                        </button>
                                        <button 
                                            onClick={() => initiateDeleteUser(user.id)}
                                            className="p-1 text-gray-400 hover:text-red-600"
                                            title="Delete User"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            {/* SEO & Performance Optimization View */}
            {activeTab === 'seo' && (
                <div className="space-y-6">
                    {/* Top Row: Speed Optimizer & LLM Gen */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Speed Optimizer */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center gap-2">
                                <Zap className="text-yellow-500" /> Site Speed & Images
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">Compress product images to improve load time and boost ranking.</p>
                            
                            {optimizingImages ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-semibold text-gray-600">
                                        <span>Optimizing...</span>
                                        <span>{Math.round(optimizationProgress)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div className="bg-brand-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${optimizationProgress}%` }}></div>
                                    </div>
                                    <p className="text-xs text-green-600 mt-2 text-center">Saved {optimizationSaved} MB so far</p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <div className="inline-flex items-center justify-center p-3 bg-brand-50 rounded-full mb-4">
                                        <ImageIcon className="h-8 w-8 text-brand-600" />
                                    </div>
                                    <button 
                                        onClick={handleOptimizeImages}
                                        className="w-full bg-brand-600 text-white px-4 py-2 rounded-md font-medium hover:bg-brand-700 transition-colors"
                                    >
                                        One-Click Image Optimize
                                    </button>
                                    <p className="text-xs text-gray-400 mt-2">Analyzes 50+ images</p>
                                </div>
                            )}
                        </div>

                        {/* LLM.txt Generator */}
                        <div className="bg-white shadow rounded-lg p-6">
                             <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center gap-2">
                                <FileText className="text-blue-500" /> AI Discovery (llm.txt)
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">Generate a file to help ChatGPT & Gemini index your products.</p>
                            
                            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 h-32 overflow-y-auto mb-4 font-mono text-xs text-gray-600">
                                {llmTxtContent || "Loading..."}
                            </div>
                            
                            <button 
                                onClick={handleDownloadLLM}
                                className="w-full border border-blue-600 text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <Download size={16} /> Download llm.txt
                            </button>
                        </div>
                    </div>

                    {/* SEO Audit & Benchmarks */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Audit Tool */}
                        <div className="lg:col-span-2 bg-white shadow rounded-lg p-6">
                             <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                                    <Search className="text-purple-500" /> SEO & Content Audit
                                </h3>
                                <button onClick={handleRunAudit} className="text-sm text-brand-600 font-medium hover:underline">
                                    Re-run Audit
                                </button>
                             </div>

                             {!auditResult ? (
                                 <div className="text-center py-10">
                                     <button onClick={handleRunAudit} className="bg-purple-600 text-white px-6 py-2 rounded-md">Start Audit</button>
                                 </div>
                             ) : (
                                 <div className="flex flex-col md:flex-row gap-8">
                                     <div className="flex flex-col items-center justify-center">
                                         <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white border-4 border-white shadow-lg ${
                                             auditResult.grade === 'A' ? 'bg-green-500' : 
                                             auditResult.grade === 'B' ? 'bg-blue-500' : 
                                             'bg-red-500'
                                         }`}>
                                             {auditResult.grade}
                                         </div>
                                         <span className="text-sm font-medium text-gray-500 mt-2">Overall Score: {auditResult.score}/100</span>
                                     </div>
                                     
                                     <div className="flex-1 space-y-4">
                                         {/* Score breakdown */}
                                         <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                             <div className="bg-gray-50 p-2 rounded">
                                                 <span className="block font-bold text-gray-900">{auditResult.details.seoScore}</span>
                                                 <span className="text-gray-500">SEO</span>
                                             </div>
                                             <div className="bg-gray-50 p-2 rounded">
                                                 <span className="block font-bold text-gray-900">{auditResult.details.performanceScore}</span>
                                                 <span className="text-gray-500">Tech</span>
                                             </div>
                                             <div className="bg-gray-50 p-2 rounded">
                                                 <span className="block font-bold text-gray-900">{auditResult.details.marketingScore}</span>
                                                 <span className="text-gray-500">Marketing</span>
                                             </div>
                                         </div>

                                         <div className="space-y-2 max-h-48 overflow-y-auto">
                                             {auditResult.issues.length === 0 ? (
                                                 <p className="text-green-600 text-sm flex items-center gap-2"><CheckCircle size={16}/> No issues found!</p>
                                             ) : (
                                                 auditResult.issues.map((issue, idx) => (
                                                     <div key={idx} className="flex gap-2 items-start text-sm border-l-4 border-red-400 bg-red-50 p-2">
                                                         <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={14} />
                                                         <div>
                                                             <span className="font-bold text-gray-900 text-xs uppercase mr-1">{issue.category}:</span>
                                                             <span className="text-gray-700">{issue.message}</span>
                                                         </div>
                                                     </div>
                                                 ))
                                             )}
                                         </div>
                                     </div>
                                 </div>
                             )}
                        </div>

                        {/* Benchmark */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                                <BarChart2 className="text-indigo-500" /> Industry Benchmark
                            </h3>
                            <div className="space-y-5">
                                {getBenchmarkData().map((item, idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-600">{item.metric}</span>
                                            <span className={`font-bold ${
                                                (item.better === 'higher' && item.yourStore > item.industry) || (item.better === 'lower' && item.yourStore < item.industry)
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                            }`}>
                                                {item.yourStore}{item.unit}
                                            </span>
                                        </div>
                                        <div className="relative pt-1">
                                            <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                                                <div 
                                                    style={{ width: '60%' }} 
                                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
                                                ></div>
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                <span>You</span>
                                                <span>Industry Avg: {item.industry}{item.unit}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Database View (Restricted to Admins) */}
            {activeTab === 'database' && isAdmin && (
                 <div className="space-y-6">
                     
                     {/* System Actions */}
                     <div className="bg-white shadow rounded-lg p-6">
                         <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                             <Database className="text-brand-600" size={20} /> Database Management
                         </h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <button onClick={handleExportDatabase} className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500">
                                 <Download size={18} className="text-gray-500" /> Export Full Database JSON
                             </button>
                             <button onClick={handleResetDatabase} className="flex items-center justify-center gap-2 px-4 py-3 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                 <RefreshCw size={18} className="text-red-500" /> Factory Reset Database
                             </button>
                         </div>
                     </div>

                     {/* Query Console */}
                     <div className="bg-white shadow rounded-lg overflow-hidden">
                         <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                <Terminal size={18} />
                                <span className="font-mono font-bold">Query Console</span>
                             </div>
                             <select 
                                value={queryCollection}
                                onChange={(e) => setQueryCollection(e.target.value as any)}
                                className="bg-gray-800 border-gray-700 text-white text-sm rounded px-3 py-1 focus:ring-brand-500 focus:border-brand-500"
                            >
                                 <option value="products">Collection: Products</option>
                                 <option value="orders">Collection: Orders</option>
                                 <option value="users">Collection: Users</option>
                                 <option value="reviews">Collection: Reviews</option>
                             </select>
                         </div>
                         <div className="p-4 bg-gray-800 border-t border-gray-700">
                             <div className="mb-2 flex justify-between items-end">
                                <label className="text-gray-400 text-xs font-mono uppercase">Javascript Filter Expression</label>
                                <div className="text-xs text-gray-500 font-mono">
                                    Available: <span className="text-yellow-400">item</span> object
                                </div>
                             </div>
                             <div className="relative">
                                 <textarea 
                                    className="w-full h-32 bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-md border border-gray-700 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                                    value={queryExpression}
                                    onChange={(e) => setQueryExpression(e.target.value)}
                                    spellCheck={false}
                                 />
                                 <button 
                                    onClick={handleRunQuery}
                                    className="absolute bottom-4 right-4 bg-brand-600 hover:bg-brand-500 text-white px-4 py-1.5 rounded text-sm font-medium flex items-center gap-2 transition-colors"
                                 >
                                     <Play size={14} fill="currentColor" /> Run Query
                                 </button>
                             </div>
                             <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
                                 <span className="text-xs text-gray-500">Examples:</span>
                                 <button onClick={() => setQueryExpression('return true;')} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded hover:bg-gray-600">All</button>
                                 {queryCollection === 'products' && (
                                     <>
                                        <button onClick={() => setQueryExpression('return item.price < 500;')} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded hover:bg-gray-600">Price &lt; 500</button>
                                        <button onClick={() => setQueryExpression('return item.stock < 10;')} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded hover:bg-gray-600">Low Stock</button>
                                     </>
                                 )}
                                 {queryCollection === 'orders' && (
                                     <>
                                        <button onClick={() => setQueryExpression('return item.total > 1000;')} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded hover:bg-gray-600">High Value</button>
                                        <button onClick={() => setQueryExpression('return item.status === "pending";')} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded hover:bg-gray-600">Pending</button>
                                     </>
                                 )}
                             </div>
                         </div>
                         
                         {/* Query Results */}
                         <div className="border-t border-gray-200">
                             {queryError ? (
                                 <div className="p-8 text-center text-red-600 bg-red-50">
                                     <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
                                     <p className="font-medium">Query Error</p>
                                     <p className="text-sm font-mono mt-1">{queryError}</p>
                                 </div>
                             ) : (
                                 <div className="overflow-x-auto">
                                     <div className="p-3 bg-gray-50 border-b border-gray-200 text-xs text-gray-500 font-medium flex justify-between">
                                         <span>{queryResults.length} records found</span>
                                         <span>JSON Preview</span>
                                     </div>
                                     <pre className="p-4 text-xs font-mono text-gray-700 bg-white max-h-96 overflow-y-auto">
                                         {JSON.stringify(queryResults, null, 2)}
                                     </pre>
                                 </div>
                             )}
                         </div>
                     </div>
                 </div>
            )}
        </div>
      </div>
    </div>
  );
};