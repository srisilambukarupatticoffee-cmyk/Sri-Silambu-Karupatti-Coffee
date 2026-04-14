import { useState, useMemo, useEffect } from 'react';
import { db, EXPENSE_CATEGORIES } from '../utils/db';
import { v4 as uuid } from 'uuid';
import { LuPlus, LuPencil, LuTrash2, LuCalendar, LuFilter } from 'react-icons/lu';
import { useAuth } from '../contexts/AuthContext';
import './Pages.css';

const emptyExpense = { name: '', amount: '', category: 'Purchase', date: new Date().toISOString().split('T')[0] };

export default function Expenses() {
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
    if (confirm('Delete this expense?')) {
      setLoading(true);
      await db.remove('expenses', id);
      await loadExpenses();
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">Today: ₹{todayTotal.toLocaleString()} • This Month: ₹{monthTotal.toLocaleString()}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(emptyExpense); setEditId(null); setModal(true); }}>
          <LuPlus /> Add Expense
        </button>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="cat-tabs">
          {['All', ...EXPENSE_CATEGORIES].map(cat => (
            <button
              key={cat}
              className={`cat-tab ${catFilter === cat ? 'active' : ''}`}
              onClick={() => setCatFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Expense Name</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e.id}>
                <td className="td-bold">{e.name}</td>
                <td><span className="badge">{e.category}</span></td>
                <td className="td-amount">₹{e.amount?.toLocaleString()}</td>
                <td>{new Date(e.date).toLocaleDateString()}</td>
                <td>
                  <div className="action-btns">
                    <button className="icon-btn edit" onClick={() => { setForm(e); setEditId(e.id); setModal(true); }}><LuPencil /></button>
                    <button className="icon-btn delete" onClick={() => handleDelete(e.id)}><LuTrash2 /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="5" className="empty-row">No expenses found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editId ? 'Edit Expense' : 'Add Expense'}</h2>
            <form onSubmit={handleSave} className="modal-form">
              <div className="form-group">
                <label>Expense Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Amount (₹)</label>
                  <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required min="0" step="0.01" />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Add Expense'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
