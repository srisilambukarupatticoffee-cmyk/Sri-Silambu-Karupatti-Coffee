import { useState, useMemo, useEffect } from 'react';
import { db } from '../utils/db';
import { LuUsers, LuSearch, LuShoppingCart } from 'react-icons/lu';
import './Pages.css';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([
        db.getAll('customers'),
        db.getAll('sales')
      ]);
      setCustomers(c);
      setSales(s);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() =>
    customers.filter(c => c.name?.toLowerCase().includes(search.toLowerCase())),
    [customers, search]
  );

  const getHistory = (purchaseIds) => {
    return sales.filter(s => (purchaseIds || []).includes(s.id));
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">{customers.length} registered customers</p>
        </div>
      </div>

      <div className="filters">
        <div className="search-box">
          <LuSearch className="search-icon" />
          <input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Purchases</th>
              <th>Total Spent</th>
              <th>Since</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id}>
                <td className="td-bold">{c.name}</td>
                <td>{(c.purchases || []).length}</td>
                <td>₹{(c.totalSpent || 0).toLocaleString()}</td>
                <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</td>
                <td>
                  <button className="icon-btn edit" onClick={() => setSelected(selected === c.id ? null : c.id)}>
                    <LuShoppingCart />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="5" className="empty-row">No customers found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Purchase History */}
      {selected && (() => {
        const customer = customers.find(c => c.id === selected);
        const history = getHistory(customer?.purchases);
        return (
          <div className="section-card" style={{ marginTop: 20 }}>
            <h3 className="section-title">Purchase History — {customer?.name}</h3>
            {history.length > 0 ? (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(s => (
                      <tr key={s.id}>
                        <td>{new Date(s.date).toLocaleDateString()}</td>
                        <td>{(s.items || []).map(i => `${i.name}×${i.qty}`).join(', ')}</td>
                        <td>₹{s.total?.toLocaleString()}</td>
                        <td><span className="badge">{s.paymentMode}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">No purchase history</div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
