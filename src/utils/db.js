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
};

// Seed data
export const CATEGORIES = ['Biscuits', 'Beverages', 'Snacks', 'Milk', 'Tea', 'Coffee', 'Meals'];
export const UNITS = ['kg', 'packets', 'litre', 'cups', 'pieces'];
export const EXPENSE_CATEGORIES = ['Rent', 'Salary', 'Utilities', 'Purchase', 'Other'];
export const PAYMENT_MODES = ['Cash', 'UPI', 'Card'];
export const TOKEN_CATEGORIES = ['Tea', 'Coffee', 'Milk', 'Meals'];

export function seedData() {
  // Seed users
  if (!get('users') || get('users').length === 0) {
    set('users', [
      { id: 'admin-1', username: 'admin', password: 'admin123', role: 'admin', name: 'Admin User' },
      { id: 'bm-1', username: 'billing', password: 'billing123', role: 'billing', name: 'Billing Manager' },
    ]);
  }

  // Seed products
  if (!get('products') || get('products').length === 0) {
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

  // Seed settings
  if (!get('settings')) {
    set('settings', {
      shopName: 'Hotel Silambu',
      address: '123 Main Street, Chennai - 600001',
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
