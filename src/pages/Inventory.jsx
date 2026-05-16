import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { db, CATEGORIES, UNITS } from '../utils/db';
import { useAuth } from '../contexts/AuthContext';
import { LuPlus, LuSearch, LuPencil, LuTrash2, LuPackagePlus, LuPackageMinus, LuTriangleAlert } from 'react-icons/lu';
import { v4 as uuid } from 'uuid';
import './Pages.css';

const emptyProduct = { name: '', category: 'Biscuits', unit: 'packets', costPrice: '', sellingPrice: '', stock: '' };

export default function Inventory() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [modal, setModal] = useState(null); 
  const [form, setForm] = useState(emptyProduct);
  const [editId, setEditId] = useState(null);
  const [stockAdj, setStockAdj] = useState({ id: '', name: '', qty: '', type: 'add' });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await db.getAll('products');
      setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === 'All' || p.category === catFilter;
      return matchSearch && matchCat;
    });
  }, [products, search, catFilter]);

  const lowStockItems = products.filter(p => p.stock <= 10);

  const handleSave = async (e) => {
    e.preventDefault();
    const product = {
      ...form,
      costPrice: parseFloat(form.costPrice),
      sellingPrice: parseFloat(form.sellingPrice),
      stock: parseInt(form.stock),
    };
    if (editId) {
      await db.update('products', editId, product);
    } else {
      await db.add('products', { ...product, id: uuid() });
    }
    setModal(null);
    setForm(emptyProduct);
    setEditId(null);
    await loadProducts();
  };

  const handleDelete = async (id) => {
    if (confirm(t('inventory.confirm_delete'))) {
      await db.remove('products', id);
      await loadProducts();
    }
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    const product = products.find(p => p.id === stockAdj.id);
    if (!product) return;
    const qty = parseInt(stockAdj.qty);
    const newStock = stockAdj.type === 'add' ? (product.stock || 0) + qty : Math.max(0, (product.stock || 0) - qty);
    await db.update('products', stockAdj.id, { stock: newStock });
    setModal(null);
    await loadProducts();
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('inventory.title')}</h1>
          <p className="page-subtitle">{t('inventory.stats', { total: products.length, low: lowStockItems.length })}</p>
        </div>
        {isAdmin() && (
          <button className="btn btn-primary" onClick={() => { setForm(emptyProduct); setEditId(null); setModal('add'); }}>
            <LuPlus /> {t('inventory.add_product')}
          </button>
        )}
      </div>

      {lowStockItems.length > 0 && (
        <div className="alert alert-warning">
          <LuTriangleAlert />
          <span><strong>{t('inventory.low_stock_alert')}</strong> {lowStockItems.map(p => p.name).join(', ')}</span>
        </div>
      )}

      <div className="filters">
        <div className="search-box">
          <LuSearch className="search-icon" />
          <input
            type="text"
            placeholder={t('billing.search_placeholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="cat-tabs">
          {[t('billing.all_categories'), ...CATEGORIES].map(cat => (
            <button
              key={cat}
              className={`cat-tab ${catFilter === (cat === t('billing.all_categories') ? 'All' : cat) ? 'active' : ''}`}
              onClick={() => setCatFilter(cat === t('billing.all_categories') ? 'All' : cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('inventory.product_name')}</th>
              <th>{t('inventory.category')}</th>
              <th>{t('inventory.unit')}</th>
              <th>{t('inventory.cost_price')} \u20B9</th>
              <th>{t('inventory.selling_price')} \u20B9</th>
              <th>{t('dashboard.tokens')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td className="td-bold">{p.name}</td>
                <td><span className="badge">{p.category}</span></td>
                <td>{p.unit}</td>
                <td>\u20B9{p.costPrice}</td>
                <td>\u20B9{p.sellingPrice}</td>
                <td>
                  <span className={`stock-badge ${p.stock <= 10 ? 'low' : p.stock <= 30 ? 'medium' : 'high'}`}>
                    {p.stock}
                  </span>
                </td>
                <td>
                  <div className="action-btns">
                    <button
                      className="icon-btn add"
                      title={t('inventory.add_stock')}
                      onClick={() => { setStockAdj({ id: p.id, name: p.name, qty: '', type: 'add' }); setModal('stock'); }}
                    >
                      <LuPackagePlus />
                    </button>
                    <button
                      className="icon-btn remove"
                      title={t('inventory.remove_stock')}
                      onClick={() => { setStockAdj({ id: p.id, name: p.name, qty: '', type: 'remove' }); setModal('stock'); }}
                    >
                      <LuPackageMinus />
                    </button>
                    {isAdmin() && (
                      <>
                        <button
                          className="icon-btn edit"
                          title={t('common.edit')}
                          onClick={() => { setForm(p); setEditId(p.id); setModal('edit'); }}
                        >
                          <LuPencil />
                        </button>
                        <button className="icon-btn delete" title={t('common.delete')} onClick={() => handleDelete(p.id)}>
                          <LuTrash2 />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="7" className="empty-row">{t('billing.no_products')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editId ? t('inventory.edit_product') : t('inventory.add_product')}</h2>
            <form onSubmit={handleSave} className="modal-form">
              <div className="form-group">
                <label>{t('inventory.product_name')}</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('inventory.category')}</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('inventory.unit')}</label>
                  <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('inventory.cost_price')} (\u20B9)</label>
                  <input type="number" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })} required min="0" step="0.01" />
                </div>
                <div className="form-group">
                  <label>{t('inventory.selling_price')} (\u20B9)</label>
                  <input type="number" value={form.sellingPrice} onChange={e => setForm({ ...form, sellingPrice: e.target.value })} required min="0" step="0.01" />
                </div>
              </div>
              <div className="form-group">
                <label>{t('inventory.stock_qty')}</label>
                <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} required min="0" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>{t('common.cancel')}</button>
                <button type="submit" className="btn btn-primary">{editId ? t('inventory.update') : t('inventory.add_product')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === 'stock' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{stockAdj.type === 'add' ? t('inventory.add_stock') : t('inventory.remove_stock')}</h2>
            <p className="modal-subtitle">{stockAdj.name}</p>
            <form onSubmit={handleStockUpdate} className="modal-form">
              <div className="form-group">
                <label>{t('inventory.stock_qty')}</label>
                <input type="number" value={stockAdj.qty} onChange={e => setStockAdj({ ...stockAdj, qty: e.target.value })} required min="1" autoFocus />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>{t('common.cancel')}</button>
                <button type="submit" className={`btn ${stockAdj.type === 'add' ? 'btn-success' : 'btn-danger'}`}>
                  {stockAdj.type === 'add' ? t('inventory.add_stock') : t('inventory.remove_stock')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
