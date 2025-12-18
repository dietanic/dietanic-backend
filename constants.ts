import { Product, Category, User, Review, Discount, CustomerProfile } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'Signature Salads' },
  { id: '2', name: 'Warm Bowls' },
  { id: '3', name: 'Weekly Subscriptions' },
  { id: '4', name: 'Cold Pressed Juices' },
  { id: '10', name: 'Gift Cards' }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'The Green Goddess',
    description: 'A vibrant mix of kale, spinach, avocado, green apple, and our signature herby dressing. Packed with antioxidants.',
    price: 349,
    wholesalePrice: 279,
    cost: 140,
    category: 'Signature Salads',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    isSubscription: false,
    ingredients: ['Kale', 'Spinach', 'Avocado', 'Green Apple', 'Cucumber', 'Herb Dressing'],
    stock: 45,
    sku: 'SLD-GRN-001',
    lowStockThreshold: 10,
    nutritionalInfo: { calories: 320, protein: 8, carbs: 24, fat: 22 }
  },
  {
    id: '2',
    name: 'Quinoa Power Bowl',
    description: 'Protein-packed quinoa base with roasted sweet potatoes, chickpeas, and tahini drizzle. A complete meal.',
    price: 399,
    cost: 160,
    category: 'Warm Bowls',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    isSubscription: false,
    ingredients: ['Quinoa', 'Sweet Potato', 'Chickpeas', 'Tahini', 'Parsley', 'Lemon'],
    stock: 30,
    sku: 'BWL-QNA-001',
    lowStockThreshold: 5,
    nutritionalInfo: { calories: 450, protein: 18, carbs: 55, fat: 16 }
  },
  {
    id: '3',
    name: 'Lunch Plan',
    description: 'Fresh salads delivered to your door. Choose the frequency that fits your lifestyle. Become a fan of freshness.',
    price: 1500,
    cost: 800,
    category: 'Weekly Subscriptions',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    isSubscription: true,
    ingredients: ['Mixed Salads'],
    stock: 100,
    sku: 'SUB-LUN-001',
    lowStockThreshold: 20,
    subscriptionFeatures: ['Free Delivery', 'Menu Rotation', 'Cancel Anytime'],
    subscriptionPlans: [
      { duration: 'weekly', price: 1500 },
      { duration: 'bi-weekly', price: 2900 },
      { duration: 'monthly', price: 5500 }
    ]
  },
  {
    id: '4',
    name: 'Dietanic Gift Card',
    description: 'Give the gift of health. Delivered instantly via email and redeemable for any item or subscription.',
    price: 500,
    cost: 0,
    category: 'Gift Cards',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    isSubscription: false,
    isGiftCard: true,
    ingredients: [],
    stock: 9999,
    sku: 'GC-DIGITAL',
    variations: [
        { id: 'gc_500', name: '₹500', price: 500, stock: 9999, cost: 0 },
        { id: 'gc_1000', name: '₹1000', price: 1000, stock: 9999, cost: 0 },
        { id: 'gc_2000', name: '₹2000', price: 2000, stock: 9999, cost: 0 },
        { id: 'gc_5000', name: '₹5000', price: 5000, stock: 9999, cost: 0 }
    ]
  },
  {
    id: '5',
    name: 'Citrus Detox Juice',
    description: 'Cold pressed orange, carrot, and ginger. The perfect immunity booster.',
    price: 199,
    wholesalePrice: 159,
    cost: 80,
    category: 'Cold Pressed Juices',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    isSubscription: false,
    ingredients: ['Orange', 'Carrot', 'Ginger', 'Turmeric'],
    stock: 50,
    sku: 'JCE-CIT-001',
    nutritionalInfo: { calories: 120, protein: 2, carbs: 28, fat: 0 }
  }
];

export const INITIAL_DISCOUNTS: Discount[] = [
  { id: 'd1', code: 'DIETANIC10', type: 'percentage', value: 10, isActive: true },
  { id: 'd2', code: 'FRESH100', type: 'fixed', value: 100, isActive: true },
  { id: 'd3', code: 'WELCOME20', type: 'percentage', value: 20, isActive: true }
];

export const MOCK_USER: User = {
  id: 'user_123',
  name: 'Alex Healthnut',
  email: 'alex@example.com',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  role: 'customer',
  status: 'active',
  addresses: [
    { street: '1600 Amphitheatre Parkway', city: 'Mountain View', state: 'CA', zip: '94043' }
  ],
  wishlist: []
};

export const INITIAL_USERS: User[] = [
  MOCK_USER,
  {
    id: 'admin_001',
    name: 'System Admin',
    email: 'admin@dietanic.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    role: 'admin',
    status: 'active',
    addresses: [],
    wishlist: []
  },
  {
    id: 'editor_001',
    name: 'Content Editor',
    email: 'editor@dietanic.com',
    role: 'editor',
    status: 'active',
    addresses: [],
    wishlist: []
  },
  {
    id: 'driver_001',
    name: 'Mike Deliveries',
    email: 'driver@dietanic.com',
    role: 'driver',
    status: 'active',
    addresses: [],
    wishlist: []
  }
];

export const INITIAL_CUSTOMERS: CustomerProfile[] = [
    {
        id: 'cust_prof_001',
        userId: 'cust_002',
        phone: '+91 98765 43210',
        shippingAddress: { street: '45 Park Avenue', city: 'Mumbai', state: 'MH', zip: '400001' },
        walletBalance: 0,
        walletHistory: [],
        subscription: {
            planName: 'Monthly Lunch Plan',
            startDate: '2023-10-01',
            endDate: '2023-11-01',
            status: 'active',
            deliverySlot: 'Morning (6-8 AM)',
            pauseHistory: [
                { startDate: '2023-10-10', endDate: '2023-10-12', reason: 'Traveling' }
            ]
        },
        billing: {
            currentMonthAmount: 5500,
            invoices: [
                { 
                    id: 'inv_001', 
                    date: '2023-10-01', 
                    dueDate: '2023-10-08', 
                    amount: 5500, 
                    status: 'paid', 
                    customerName: 'Jane Smith', 
                    items: [], 
                    currency: 'INR', 
                    taxAmount: 250,
                    payments: [],
                    balanceDue: 0
                }
            ]
        },
        consentToProcessPHI: true
    }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev_1',
    productId: '1',
    userId: 'user_123',
    userName: 'Alex Healthnut',
    rating: 5,
    comment: 'Absolutely delicious! The dressing is to die for.',
    date: '2023-10-15T10:00:00Z'
  }
];