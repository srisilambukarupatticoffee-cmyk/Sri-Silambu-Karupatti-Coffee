// LocalStorage-based data layer
const get = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
};

const set = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const db = {
  getAll: (collection) => get(collection) || [],
  getById: (collection, id) => (get(collection) || []).find(item => item.id === id),
  save: (collection, items) => set(collection, items),
  add: (collection, item) => {
    const items = get(collection) || [];
    items.push(item);
    set(collection, items);
    return item;
  },
  update: (collection, id, updates) => {
    const items = get(collection) || [];
    const idx = items.findIndex(item => item.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...updates };
      set(collection, items);
      return items[idx];
    }
    return null;
  },
  remove: (collection, id) => {
    const items = (get(collection) || []).filter(item => item.id !== id);
    set(collection, items);
  },
  clear: (collection) => localStorage.removeItem(collection),
  clearTransactions: () => {
    localStorage.setItem('sales', JSON.stringify([]));
    localStorage.setItem('tokens', JSON.stringify([]));
    localStorage.setItem('expenses', JSON.stringify([]));
  },
};

// Seed data
export const CATEGORIES = ['Biscuits', 'Beverages', 'Snacks', 'Milk', 'Tea', 'Coffee', 'Meals', 'Tiffen', 'Juice', 'Ice Cream'];
export const UNITS = ['kg', 'packets', 'litre', 'cups', 'pieces'];
export const EXPENSE_CATEGORIES = ['Rent', 'Salary', 'Utilities', 'Purchase', 'Other'];
export const PAYMENT_MODES = ['Cash', 'UPI', 'Card'];
export const TOKEN_CATEGORIES = ['Tea', 'Coffee', 'Milk', 'Meals', 'Tiffen', 'Juice', 'Ice Cream'];

export function seedData() {
  // Seed users
  if (!get('users') || get('users').length === 0) {
    set('users', [
      { id: 'admin-1', username: 'admin', password: 'admin123', role: 'admin', name: 'Admin User' },
      { id: 'bm-1', username: 'billing', password: 'billing123', role: 'billing', name: 'Billing Manager' },
    ]);
  }

  // Seed products
  const currentProducts = get('products') || [];
  if (currentProducts.length === 0) {
    const products = [
      { id: 'p1', name: 'Marie Gold Biscuits', category: 'Biscuits', unit: 'packets', costPrice: 20, sellingPrice: 25, stock: 50 },
      { id: 'p2', name: 'Bourbon Chocolate', category: 'Biscuits', unit: 'packets', costPrice: 25, sellingPrice: 35, stock: 40 },
      { id: 'p3', name: 'Good Day Butter', category: 'Biscuits', unit: 'packets', costPrice: 22, sellingPrice: 30, stock: 35 },
      { id: 'p4', name: 'Pepsi 500ml', category: 'Beverages', unit: 'pieces', costPrice: 28, sellingPrice: 40, stock: 100 },
      { id: 'p5', name: 'Coca Cola 500ml', category: 'Beverages', unit: 'pieces', costPrice: 28, sellingPrice: 40, stock: 80 },
      { id: 'p6', name: 'Thumbs Up 500ml', category: 'Beverages', unit: 'pieces', costPrice: 28, sellingPrice: 40, stock: 60 },
      { id: 'p7', name: 'Lays Classic', category: 'Snacks', unit: 'packets', costPrice: 15, sellingPrice: 20, stock: 120 },
      { id: 'p8', name: 'Kurkure Masala', category: 'Snacks', unit: 'packets', costPrice: 15, sellingPrice: 20, stock: 90 },
      { id: 'p9', name: 'Banana Chips', category: 'Snacks', unit: 'packets', costPrice: 30, sellingPrice: 45, stock: 45 },
      { id: 'p21', name: 'Special Mixture', category: 'Snacks', unit: 'kg', costPrice: 150, sellingPrice: 200, stock: 20 },
      { id: 'p22', name: 'Assorted Sweets', category: 'Snacks', unit: 'kg', costPrice: 300, sellingPrice: 450, stock: 15 },
      { id: 'p10', name: 'Full Cream Milk', category: 'Milk', unit: 'litre', costPrice: 50, sellingPrice: 60, stock: 30 },
      { id: 'p11', name: 'Toned Milk', category: 'Milk', unit: 'litre', costPrice: 42, sellingPrice: 52, stock: 25 },
      { id: 'p12', name: 'Masala Tea', category: 'Tea', unit: 'cups', costPrice: 5, sellingPrice: 15, stock: 500 },
      { id: 'p13', name: 'Ginger Tea', category: 'Tea', unit: 'cups', costPrice: 6, sellingPrice: 15, stock: 500 },
      { id: 'p14', name: 'Green Tea', category: 'Tea', unit: 'cups', costPrice: 8, sellingPrice: 20, stock: 300 },
      { id: 'p15', name: 'Filter Coffee', category: 'Coffee', unit: 'cups', costPrice: 8, sellingPrice: 20, stock: 400 },
      { id: 'p16', name: 'Cappuccino', category: 'Coffee', unit: 'cups', costPrice: 15, sellingPrice: 35, stock: 200 },
      { id: 'p17', name: 'Espresso', category: 'Coffee', unit: 'cups', costPrice: 12, sellingPrice: 30, stock: 200 },
      { id: 'p18', name: 'Veg Meals', category: 'Meals', unit: 'pieces', costPrice: 40, sellingPrice: 70, stock: 50 },
      { id: 'p19', name: 'Non-Veg Meals', category: 'Meals', unit: 'pieces', costPrice: 60, sellingPrice: 100, stock: 40 },
      { id: 'p20', name: 'Egg Biryani', category: 'Meals', unit: 'pieces', costPrice: 45, sellingPrice: 80, stock: 30 },
    ];
    set('products', products);
  }

  // Add new items (Tiffen, Juice, Ice Cream, Jaggery options) if not present
  const newItems = [
    // Tiffen
    { id: 't-1', name: 'Idli', category: 'Tiffen', unit: 'pieces', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 't-2', name: 'Dosa', category: 'Tiffen', unit: 'pieces', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 't-3', name: 'Poori', category: 'Tiffen', unit: 'pieces', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 't-4', name: 'Pongal', category: 'Tiffen', unit: 'pieces', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 't-5', name: 'Vada', category: 'Tiffen', unit: 'pieces', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 't-6', name: 'Parotta', category: 'Tiffen', unit: 'pieces', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 't-7', name: 'Chapathi', category: 'Tiffen', unit: 'pieces', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 't-8', name: 'Plain Dosa', category: 'Tiffen', unit: 'pieces', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 't-9', name: 'Podi Dosa', category: 'Tiffen', unit: 'pieces', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 't-10', name: 'Onion Dosa', category: 'Tiffen', unit: 'pieces', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 't-11', name: 'Masala Dosa', category: 'Tiffen', unit: 'pieces', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 't-12', name: 'Onion Uttappam', category: 'Tiffen', unit: 'pieces', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 't-13', name: 'Ghee Roast', category: 'Tiffen', unit: 'pieces', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 't-14', name: 'Veg Kothu Parotta', category: 'Tiffen', unit: 'pieces', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 't-15', name: 'Egg Kothu Parotta', category: 'Tiffen', unit: 'pieces', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 't-16', name: 'Chicken Kothu Parotta', category: 'Tiffen', unit: 'pieces', costPrice: 10, sellingPrice: 15, stock: 500 },
    
    // Juice
    { id: 'j-1', name: 'Orange Juice', category: 'Juice', unit: 'cups', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'j-2', name: 'Apple Juice', category: 'Juice', unit: 'cups', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'j-3', name: 'Pomegranate Juice', category: 'Juice', unit: 'cups', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'j-4', name: 'Sathukudi Juice', category: 'Juice', unit: 'cups', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'j-5', name: 'Mulampazham Juice', category: 'Juice', unit: 'cups', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'j-6', name: 'Grapes Juice', category: 'Juice', unit: 'cups', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'j-7', name: 'Pineapple Juice', category: 'Juice', unit: 'cups', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'j-8', name: 'Lemon Juice', category: 'Juice', unit: 'cups', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'j-9', name: 'Lemon Soda', category: 'Juice', unit: 'cups', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'j-10', name: 'Watermelon Juice', category: 'Juice', unit: 'cups', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'j-11', name: 'Sugarcane Juice', category: 'Juice', unit: 'cups', costPrice: 10, sellingPrice: 15, stock: 500 },
    
    // Ice Cream
    { id: 'ic-1', name: 'Vanilla Ice Cream', category: 'Ice Cream', unit: 'pieces', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'ic-2', name: 'Chocolate Ice Cream', category: 'Ice Cream', unit: 'pieces', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'ic-3', name: 'Strawberry Ice Cream', category: 'Ice Cream', unit: 'pieces', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'ic-4', name: 'Butterscotch Ice Cream', category: 'Ice Cream', unit: 'pieces', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'ic-5', name: 'Mango Ice Cream', category: 'Ice Cream', unit: 'pieces', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'ic-6', name: 'Pista Ice Cream', category: 'Ice Cream', unit: 'pieces', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'ic-7', name: 'Cone Ice Cream', category: 'Ice Cream', unit: 'pieces', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'ic-8', name: 'Cup Ice Cream', category: 'Ice Cream', unit: 'pieces', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'ic-9', name: 'Sundae Ice Cream', category: 'Ice Cream', unit: 'pieces', costPrice: 10, sellingPrice: 15, stock: 500 },
    
    // Milk Varieties
    { id: 'm-j-1', name: 'Jaggery Tea (Karupatti Tea)', category: 'Tea', unit: 'cups', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'm-j-2', name: 'Jaggery Coffee (Karupatti Coffee)', category: 'Coffee', unit: 'cups', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'm-j-3', name: 'Jaggery Milk (Karupatti Milk)', category: 'Milk', unit: 'cups', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'm-j-4', name: 'Black Tea', category: 'Tea', unit: 'cups', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'm-j-5', name: 'Jaggery Black Tea', category: 'Tea', unit: 'cups', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'm-j-6', name: 'Black Coffee', category: 'Coffee', unit: 'cups', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'm-j-7', name: 'Jaggery Black Coffee', category: 'Coffee', unit: 'cups', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'm-j-8', name: 'Sukku Malli Coffee', category: 'Coffee', unit: 'cups', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'm-j-9', name: 'Jaggery Sukku Malli Coffee', category: 'Coffee', unit: 'cups', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'm-j-10', name: 'Sukku Malli Milk', category: 'Milk', unit: 'cups', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'm-j-11', name: 'Jaggery Sukku Malli Milk', category: 'Milk', unit: 'cups', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'm-j-12', name: 'Jaggery Ginger Tea', category: 'Tea', unit: 'cups', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'm-j-13', name: 'Badam Milk', category: 'Milk', unit: 'cups', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'm-j-14', name: 'Jaggery Badam Milk', category: 'Milk', unit: 'cups', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'm-j-15', name: 'Rose Milk', category: 'Milk', unit: 'cups', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'm-j-16', name: 'Jaggery Rose Milk', category: 'Milk', unit: 'cups', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'm-j-17', name: 'Pista Milk', category: 'Milk', unit: 'cups', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'm-j-18', name: 'Jaggery Pista Milk', category: 'Milk', unit: 'cups', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'm-j-19', name: 'Lemon Tea', category: 'Tea', unit: 'cups', costPrice: 10, sellingPrice: 15, stock: 500 },
    { id: 'm-j-20', name: 'Jaggery Lemon Tea', category: 'Tea', unit: 'cups', costPrice: 10, sellingPrice: 15, stock: 500 },
  ];

  const updatedProducts = get('products') || [];
  let changed = false;
  newItems.forEach(item => {
    if (!updatedProducts.find(p => p.name === item.name)) {
      updatedProducts.push(item);
      changed = true;
    }
  });

  if (changed) {
    set('products', updatedProducts);
  }

  // Seed settings
  if (!get('settings')) {
    set('settings', {
      shopName: 'Sri Silambu Karupatti Coffee',
      address: 'No: 15, Puthupalayam, Bengaluru Main Road, Chengam, Tiruvannamalai - 606709\n📞 97866 98585, +91 99941 15599',
      gst: '',
      fontSize: 'medium',
      alignment: 'center',
      autoPrint: false,
    });
  }

  // Initialize empty collections
  if (!get('sales')) set('sales', []);
  if (!get('expenses')) set('expenses', []);
  if (!get('tokens')) set('tokens', []);
  if (!get('customers')) set('customers', []);
}

