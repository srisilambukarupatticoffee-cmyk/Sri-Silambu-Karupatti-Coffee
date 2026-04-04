import { useState, useMemo } from 'react';
import { db, TOKEN_CATEGORIES } from '../utils/db';
import { v4 as uuid } from 'uuid';
import { LuTicket, LuPlus, LuHash, LuPrinter } from 'react-icons/lu';
import './Pages.css';

const TOKEN_EMOJIS = { Tea: '🍵', Coffee: '☕', Milk: '🥛', Meals: '🍛' };
const TOKEN_TYPES = {
  Tea: ['Regular', 'Masala', 'Ginger', 'Lemon', 'Green'],
  Coffee: ['Filter', 'Black', 'Cappuccino', 'Espresso'],
  Meals: ['Veg Meal', 'Non-Veg Meal', 'Special Meal'],
  Milk: ['Hot Milk', 'Badam Milk'],
};

export default function Tokens() {
  const [tokens, setTokens] = useState(() => db.getAll('tokens'));
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedType, setSelectedType] = useState('');
  const [qty, setQty] = useState(1);

  const todayStr = new Date().toISOString().split('T')[0];

  const todayTokens = useMemo(() =>
    tokens.filter(t => t.date?.startsWith(todayStr)),
    [tokens, todayStr]
  );

  const getNextToken = () => {
    const todayAll = db.getAll('tokens').filter(t => t.date?.startsWith(todayStr));
    // Since we consolidate, number of tokens is count of records + 1
    return todayAll.length + 1;
  };

  const handlePrint = (token) => {
    const settings = db.getAll('settings') || {};
    const printWindow = window.open('', '_blank', 'width=300,height=400');
    const shopName = typeof settings === 'object' && !Array.isArray(settings) ? settings.shopName : 'Hotel Silambu';
    
    printWindow.document.write(`
      <html>
      <head><title>Token</title>
      <style>
        body { font-family: 'Courier New', monospace; width: 200px; margin: 0 auto; padding: 10px; text-align: center; }
        .logo-row { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 5px; }
        .logo-img { width: 30px; height: 30px; object-fit: contain; }
        .token-num { font-size: 40px; font-weight: bold; margin: 10px 0; border: 2px solid #000; display: inline-block; padding: 10px 20px; }
        .details { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
        .qty { font-size: 20px; margin: 5px 0; }
        .info { font-size: 12px; margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; }
      </style>
      </head>
      <body>
        <div class="logo-row">
          <img src="/silambu_logo.png" class="logo-img" />
          <div style="font-size: 14px; font-weight: bold;">${shopName}</div>
        </div>
        <div style="font-size: 12px;">TOKEN RECEIPT</div>
        <div class="token-num">#${token.tokenNumber}</div>
        <div class="details">${token.type || token.category}</div>
        <div class="qty">QTY: ${token.qty}</div>
        <div class="info">
          ${new Date(token.date).toLocaleDateString()}<br>
          ${new Date(token.date).toLocaleTimeString()}<br>
          Price: ₹${token.total.toFixed(2)}
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const issueToken = () => {
    if (!selectedCat) return;
    const typeLabel = selectedType || selectedCat;
    
    // Find price (fallback to defaults if product not found)
    const product = db.getAll('products').find(p => p.category === selectedCat && p.name.includes(typeLabel));
    const price = product ? product.sellingPrice : selectedCat === 'Tea' ? 15 : selectedCat === 'Coffee' ? 20 : selectedCat === 'Milk' ? 60 : 70;
    const totalPrice = price * qty;

    const tokenNum = getNextToken();
    const newTask = {
      id: uuid(),
      tokenNumber: tokenNum,
      category: selectedCat,
      type: typeLabel,
      price,
      qty,
      total: totalPrice,
      date: new Date().toISOString(),
    };

    db.add('tokens', newTask);

    // Also add as a sale for dashboard
    db.add('sales', {
      id: uuid(),
      date: new Date().toISOString(),
      items: [{ name: `${typeLabel} Token`, category: selectedCat, qty, sellingPrice: price, costPrice: price * 0.3 }],
      subtotal: totalPrice,
      discount: 0,
      discountAmt: 0,
      total: totalPrice,
      totalCost: price * 0.3 * qty,
      paymentMode: 'Cash',
      customerName: 'Token Customer',
      isToken: true,
      tokenId: newTask.id
    });

    setTokens(db.getAll('tokens'));
    handlePrint(newTask);
    
    setQty(1);
    setSelectedCat(null);
    setSelectedType('');
  };

  const categorySummary = useMemo(() => {
    const summary = {};
    TOKEN_CATEGORIES.forEach(cat => {
      const catTokens = todayTokens.filter(t => t.category === cat);
      summary[cat] = {
        count: catTokens.reduce((s, t) => s + t.qty, 0),
        revenue: catTokens.reduce((s, t) => s + (t.total || 0), 0),
      };
    });
    return summary;
  }, [todayTokens]);

  const totalTokensQtyToday = todayTokens.reduce((s, t) => s + t.qty, 0);
  const totalRevenueToday = todayTokens.reduce((s, t) => s + (t.total || 0), 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Token System</h1>
          <p className="page-subtitle">Issue & track tokens for Tea, Coffee, Milk, Meals</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="kpi-grid">
        <div className="kpi-card" style={{ '--kpi-color': '#6366f1' }}>
          <div className="kpi-icon" style={{ background: '#6366f118', color: '#6366f1' }}>
            <LuTicket />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Today's Total Items</span>
            <span className="kpi-value">{totalTokensQtyToday}</span>
            <span className="kpi-sub">{todayTokens.length} tokens issued</span>
          </div>
        </div>
        <div className="kpi-card" style={{ '--kpi-color': '#10b981' }}>
          <div className="kpi-icon" style={{ background: '#10b98118', color: '#10b981' }}>
            <LuHash />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Today's Token Revenue</span>
            <span className="kpi-value">₹{totalRevenueToday.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Token Issue Cards */}
      <div className="token-grid">
        {TOKEN_CATEGORIES.map(cat => (
          <div
            key={cat}
            className={`token-card ${selectedCat === cat ? 'selected' : ''}`}
            onClick={() => {
              setSelectedCat(cat);
              setSelectedType(TOKEN_TYPES[cat][0]);
            }}
          >
            <span className="token-emoji">{TOKEN_EMOJIS[cat]}</span>
            <span className="token-cat-name">{cat}</span>
            <div className="token-stats">
              <span>{categorySummary[cat]?.count || 0} items</span>
              <span>₹{categorySummary[cat]?.revenue?.toLocaleString() || 0}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Issue Form */}
      {selectedCat && (
        <div className="token-issue-form animate-slide-up">
          <div className="token-form-top">
            <h3>Issue {TOKEN_EMOJIS[selectedCat]} {selectedCat} Token</h3>
            <button className="btn-close" onClick={() => setSelectedCat(null)}>&times;</button>
          </div>
          
          <div className="token-type-selector">
            <label>Select Type:</label>
            <div className="type-chips">
              {TOKEN_TYPES[selectedCat].map(type => (
                <button 
                  key={type} 
                  className={`type-chip ${selectedType === type ? 'active' : ''}`}
                  onClick={() => setSelectedType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="token-issue-row">
            <div className="qty-selector">
              <label>Quantity:</label>
              <div className="qty-control">
                <button className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                <span className="qty-display">{qty}</span>
                <button className="qty-btn" onClick={() => setQty(qty + 1)}>+</button>
              </div>
            </div>
            
            <button className="btn btn-primary btn-large" onClick={issueToken}>
              <LuPlus /> Issue & Print Token
            </button>
          </div>
        </div>
      )}

      {/* Today's Token Log */}
      <div className="section-card">
        <h3 className="section-title">Today's Token Log</h3>
        {todayTokens.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Token #</th>
                  <th>Item / Type</th>
                  <th>Qty</th>
                  <th>Total</th>
                  <th>Time</th>
                  <th>Print</th>
                </tr>
              </thead>
              <tbody>
                {[...todayTokens].reverse().map(t => (
                  <tr key={t.id}>
                    <td><span className="badge accent">#{t.tokenNumber}</span></td>
                    <td><span className="td-bold">{t.type}</span> <small>({t.category})</small></td>
                    <td>{t.qty}</td>
                    <td>₹{t.total}</td>
                    <td>{new Date(t.date).toLocaleTimeString()}</td>
                    <td>
                      <button className="icon-btn" onClick={() => handlePrint(t)}>
                        <LuPrinter />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">No tokens issued today</div>
        )}
      </div>
    </div>
  );
}
