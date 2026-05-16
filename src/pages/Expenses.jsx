import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { db, EXPENSE_CATEGORIES } from '../utils/db';
import { v4 as uuid } from 'uuid';
import { LuPlus, LuPencil, LuTrash2, LuCalendar, LuFilter } from 'react-icons/lu';
import { useAuth } from '../contexts/AuthContext';
import './Pages.css';

const emptyExpense = { name: '', amount: '', category: 'Purchase', date: new Date().toISOString().split('T')[0] };

export default function Expenses() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyExpense);
  const [editId, setEditId] = useState(null);
  const [catFilter, setCatFilter] = useState('All');

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const data = await db.getAll('expenses');
      setExpenses(data);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return expenses.filter(e => catFilter === 'All' || e.category === catFilter)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [expenses, catFilter]);

  const todayStr = new Date().toISOString().split('T')[0];
  const monthStr = new Date().toISOString().slice(0, 7);
  const todayTotal = expenses.filter(e => e.date?.startsWith(todayStr)).reduce((s, e) => s + (e.amount || 0), 0);
  const monthTotal = expenses.filter(e => e.date?.startsWith(monthStr)).reduce((s, e) => s + (e.amount || 0), 0);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    const expense = { ...form, amount: parseFloat(form.amount) };
    if (editId) {
      await db.update('expenses', editId, expense);
    } else {
      await db.add('expenses', { ...expense, id: uuid() });
    }
    setModal(false);
    setForm(emptyExpense);
    setEditId(null);
    await loadExpenses();
  };

  const handleDelete = async (id) => {
    if (confirm(t('expenses.confirm_delete'))) {
      setLoading(true);
      await db.remove('expenses', id);
      await loadExpenses();
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('expenses.title')}</h1>
          <p className="page-subtitle">{t('expenses.stats', { today: todayTotal.toLocaleString(), month: monthTotal.toLocaleString() })}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(emptyExpense); setEditId(null); setModal(true); }}>
          <LuPlus /> {t('expenses.add_expense')}
        </button>
      </div>

      <div className="filters">
        <div className="cat-tabs">
          {[t('billing.all_categories'), ...EXPENSE_CATEGORIES].map(cat => (
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
              <th>{t('expenses.expense_name')}</th>
              <th>{t('inventory.category')}</th>
              <th>{t('expenses.amount')}</th>
              <th>{t('common.date')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e.id}>
                <td className="td-bold">{e.name}</td>
                <td><span className="badge">{e.category}</span></td>
                <td className="td-amount">\u20B9{e.amount?.toLocaleString()}</td>
                <td>{new Date(e.date).toLocaleDateString()}</td>
                <td>
                  <div className="action-btns">
                    <button className="icon-btn edit" title={t('common.edit')} onClick={() => { setForm(e); setEditId(e.id); setModal(true); }}><LuPencil /></button>
                    <button className="icon-btn delete" title={t('common.delete')} onClick={() => handleDelete(e.id)}><LuTrash2 /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="5" className="empty-row">{t('expenses.no_expenses')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editId ? t('expenses.edit_expense') : t('expenses.add_expense')}</h2>
            <form onSubmit={handleSave} className="modal-form">
              <div className="form-group">
                <label>{t('expenses.expense_name')}</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('expenses.amount')} (\u20B9)</label>
                  <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required min="0" step="0.01" />
                </div>
                <div className="form-group">
                  <label>{t('inventory.category')}</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>{t('common.date')}</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>{t('common.cancel')}</button>
                <button type="submit" className="btn btn-primary">{editId ? t('inventory.update') : t('expenses.add_expense')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
