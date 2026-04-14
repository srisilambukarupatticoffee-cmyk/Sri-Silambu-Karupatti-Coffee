// MongoDB-based async data layer
const API_BASE = '/api/data';

const fetchAPI = async (collection, options = {}) => {
  const { id, ...fetchOptions } = options;
  let url = `${API_BASE}?collection=${collection}`;
  if (id) url += `&id=${id}`;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'API Error');
    }

    return await response.json();
  } catch (error) {
    console.error(`DB Error (${collection}):`, error);
    throw error;
  }
};

export const db = {
  getAll: async (collection) => {
    return await fetchAPI(collection);
  },
  
  getById: async (collection, id) => {
    return await fetchAPI(collection, { id });
  },
  
  save: async (collection, items) => {
    // Used for bulk overwrite/migration
    return await fetchAPI(collection, {
      method: 'POST',
      body: JSON.stringify(items)
    });
  },
  
  add: async (collection, item) => {
    return await fetchAPI(collection, {
      method: 'POST',
      body: JSON.stringify(item)
    });
  },
  
  update: async (collection, id, updates) => {
    return await fetchAPI(collection, {
      id,
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },
  
  remove: async (collection, id) => {
    return await fetchAPI(collection, {
      id,
      method: 'DELETE'
    });
  },
  
  clear: async (collection) => {
    return await fetchAPI(collection, {
      id: 'ALL',
      method: 'DELETE'
    });
  },
  
  clearTransactions: async () => {
    await fetchAPI('sales', { id: 'ALL', method: 'DELETE' });
    await fetchAPI('tokens', { id: 'ALL', method: 'DELETE' });
    await fetchAPI('expenses', { id: 'ALL', method: 'DELETE' });
  },

  // Helper for batch data migration from LocalStorage
  migrateFromLocalStorage: async () => {
    const collections = ['users', 'products', 'settings', 'sales', 'expenses', 'tokens', 'customers'];
    for (const coll of collections) {
      const localData = localStorage.getItem(coll);
      if (localData) {
        const data = JSON.parse(localData);
        if (Array.isArray(data) && data.length > 0) {
          console.log(`Migrating ${coll}...`);
          await fetchAPI(coll, {
            method: 'POST',
            body: JSON.stringify(data)
          });
        } else if (!Array.isArray(data) && data) {
          // Object (like settings)
          await fetchAPI(coll, {
            method: 'POST',
            body: JSON.stringify(data)
          });
        }
      }
    }
  }
};

// Constant data remains static
export const CATEGORIES = ['Biscuits', 'Beverages', 'Snacks', 'Milk', 'Tea', 'Coffee', 'Meals', 'Tiffen', 'Juice', 'Ice Cream'];
export const UNITS = ['kg', 'packets', 'litre', 'cups', 'pieces'];
export const EXPENSE_CATEGORIES = ['Rent', 'Salary', 'Utilities', 'Purchase', 'Other'];
export const PAYMENT_MODES = ['Cash', 'UPI', 'Card'];
export const TOKEN_CATEGORIES = ['Tea', 'Coffee', 'Milk', 'Meals', 'Tiffen', 'Juice', 'Ice Cream'];

// seedData is no longer needed in the same way, but kept for migration ref
export function seedData() {
  console.log('Database now cloud-based. Use Migration Tool to move local data.');
}
