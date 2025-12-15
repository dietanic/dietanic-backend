
import { Product, Category, User, Review, Discount } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'Signature Salads' },
  { id: '2', name: 'Warm Bowls' },
  { id: '3', name: 'Weekly Subscriptions' },
  { id: '4', name: 'Cold Pressed Juices' },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'The Green Goddess',
    description: 'A vibrant mix of kale, spinach, avocado, green apple, and our signature herby dressing.',
    price: 349,
    category: 'Signature Salads',
    image: 'https://picsum.photos/400/400?random=1',
    isSubscription: false,
    ingredients: ['Kale', 'Spinach', 'Avocado', 'Green Apple', 'Cucumber'],
    stock: 45,
  },
  {
    id: '2',
    name: 'Quinoa Power Bowl',
    description: 'Protein-packed quinoa base with roasted sweet potatoes, chickpeas, and tahini drizzle.',
    price: 399,
    category: 'Warm Bowls',
    image: 'https://picsum.photos/400/400?random=2',
    isSubscription: false,
    ingredients: ['Quinoa', 'Sweet Potato', 'Chickpeas', 'Tahini', 'Parsley'],
    stock: 30,
  },
  {
    id: '3',
    name: 'Lunch Plan',
    description: 'Fresh salads delivered to your door. Choose the frequency that fits your lifestyle.',
    price: 1500,
    category: 'Weekly Subscriptions',
    image: 'https://picsum.photos/400/400?random=3',
    isSubscription: true,
    ingredients: ['Mixed Salads'],
    stock: 100,
    subscriptionFeatures: ['Free Delivery', 'Menu Rotation', 'Cancel Anytime'],
    subscriptionPlans: [
      { duration: 'weekly', price: 1500 },
      { duration: 'bi-weekly', price: 2900 },
      { duration: 'monthly', price: 5500 }
    ]
  },
];

export const INITIAL_DISCOUNTS: Discount[] = [
  { id: 'd1', code: 'DIETANIC10', type: 'percentage', value: 10, isActive: true },
  { id: 'd2', code: 'FRESH100', type: 'fixed', value: 100, isActive: true },
  { id: 'd3', code: 'WELCOME20', type: 'percentage', value: 20, isActive: true },
];

export const MOCK_USER: User = {
  id: 'user_123',
  name: 'Alex Healthnut',
  email: 'alex@example.com',
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
    id: 'emp_001',
    name: 'John Doe',
    email: 'john@dietanic.com',
    role: 'admin',
    status: 'suspended',
    addresses: [],
    wishlist: []
  },
   {
    id: 'cust_002',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'customer',
    status: 'active',
    addresses: [],
    wishlist: []
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev_1',
    productId: '1',
    userId: 'cust_002',
    userName: 'Jane Smith',
    rating: 5,
    comment: 'Absolutely delicious! The dressing is to die for.',
    date: '2023-10-15T10:00:00Z'
  },
  {
    id: 'rev_2',
    productId: '1',
    userId: 'user_123',
    userName: 'Alex Healthnut',
    rating: 4,
    comment: 'Very fresh, but I wish it had a bit more avocado.',
    date: '2023-10-20T14:30:00Z'
  }
];
