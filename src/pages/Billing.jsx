import { useState, useMemo, useRef, useEffect } from 'react';
import { db, CATEGORIES, PAYMENT_MODES } from '../utils/db';
import { v4 as uuid } from 'uuid';
import {
  LuSearch, LuPlus, LuMinus, LuTrash2, LuShoppingCart,
  LuCreditCard, LuBanknote, LuSmartphone, LuPrinter, LuCheck, LuX
} from 'react-icons/lu';
import './Billing.css';

export default function Billing() {
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({});
  const [todaySales, setTodaySales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [showReceipt, setShowReceipt] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [weightModal, setWeightModal] = useState(null); // { product, weight, unitType: 'g'|'kg' }
  const [isCartOpen, setIsCartOpen] = useState(false);
  const receiptRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [p, setts, allSales] = await Promise.all([
        db.getAll('products'),
        db.getAll('settings').then(res => res[0] || {}),
        db.getAll('sales')
      ]);
      setProducts(p);
      setSettings(setts);
      setTodaySales(allSales.filter(s => s.date?.startsWith(today)));
    } catch (err) {
      console.error('Failed to load billing data:', err);
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

  const addToCart = (product, weightVal = null) => {
    if (product.unit === 'kg' && weightVal === null) {
      setWeightModal({ product, weight: '', unitType: 'g' });
      return;
    }

    const qty = weightVal !== null ? weightVal : 1;

    setCart(prev => {
      const existing = prev.find(c => c.id === product.id);
      if (existing) {
        return prev.map(c => c.id === product.id ? { ...c, qty: c.qty + qty } : c);
      }
      return [...prev, { ...product, qty }];
    });
    setWeightModal(null);
  };

  const confirmWeight = () => {
    if (!weightModal || !weightModal.weight) return;
    const w = parseFloat(weightModal.weight);
    const finalizedWeight = weightModal.unitType === 'g' ? w / 1000 : w;
    addToCart(weightModal.product, finalizedWeight);
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(c => {
      if (c.id === id) {
        const newQty = c.qty + delta;
        return newQty > 0 ? { ...c, qty: newQty } : c;
      }
      return c;
    }).filter(c => c.qty > 0));
  };

  const removeItem = (id) => setCart(prev => prev.filter(c => c.id !== id));
  const clearCart = () => { setCart([]); setDiscount(0); setCustomerName(''); };

  const subtotal = cart.reduce((sum, c) => sum + (c.sellingPrice || 0) * c.qty, 0);
  const discountAmt = (subtotal * discount) / 100;
  const total = subtotal - discountAmt;
  const totalCost = cart.reduce((sum, c) => sum + (c.costPrice || 0) * c.qty, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);

    try {
      const sale = {
        id: uuid(),
        date: new Date().toISOString(),
        items: cart.map(c => ({ id: c.id, name: c.name, category: c.category, qty: c.qty, sellingPrice: c.sellingPrice, costPrice: c.costPrice, unit: c.unit })),
        subtotal,
        discount,
        discountAmt,
        total,
        totalCost,
        paymentMode,
        customerName: customerName || 'Walk-in',
      };

      await db.add('sales', sale);

      // Update stock async
      for (const c of cart) {
        const product = products.find(p => p.id === c.id);
        if (product) {
          await db.update('products', c.id, { stock: Math.max(0, (product.stock || 0) - c.qty) });
        }
      }

      // Save customer if named
      if (customerName) {
        const customers = await db.getAll('customers');
        const existing = customers.find(c => c.name?.toLowerCase() === customerName.toLowerCase());
        if (existing) {
          await db.update('customers', existing.id, {
            purchases: [...(existing.purchases || []), sale.id],
            totalSpent: (existing.totalSpent || 0) + total,
          });
        } else {
          await db.add('customers', {
            id: uuid(),
            name: customerName,
            phone: '',
            purchases: [sale.id],
            totalSpent: total,
            createdAt: new Date().toISOString(),
          });
        }
      }

      setShowReceipt(sale);
      await loadData(); // Reload for stats
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=320,height=600');
    const shopName = settings.shopName || 'Sri Silambu Karupatti Coffee';
    const address = settings.address || '';
    const gst = settings.gst || '';

    printWindow.document.write(`
      <html>
      <head><title>Receipt</title>
      <style>
        @page { margin: 0; }
        body { font-family: 'Courier New', monospace; width: 260px; margin: 0 auto; padding: 10mm 5mm; font-size: 11px; }
        .center { text-align: center; }
        .logo-row { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 5px; }
        .logo-img { width: 35px; height: 35px; object-fit: contain; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 6px 0; }
        .grid { display: grid; grid-template-columns: 1fr 40px 70px; gap: 5px; align-items: start; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        h2 { margin: 0; font-size: 15px; }
        p { margin: 2px 0; white-space: pre-line; line-height: 1.2; }
      </style>
      </head>
      <body>
        <div class="center">
          <div class="logo-row">
            <img src="/silambu_logo.png" class="logo-img" />
            <h2>${shopName}</h2>
          </div>
          <p>${address}</p>
          ${gst ? `<p>GST: ${gst}</p>` : ''}
        </div>
        <div class="line"></div>
        <div class="row"><span>Date: ${new Date(showReceipt.date).toLocaleDateString()}</span><span>${new Date(showReceipt.date).toLocaleTimeString()}</span></div>
        <p>Customer: ${showReceipt.customerName}</p>
        <div class="line"></div>
        <div class="grid bold"><span>Item</span><span class="text-center">Qty</span><span class="text-right">Amt</span></div>
        <div class="line"></div>
        ${showReceipt.items.map(i => `<div class="grid"><span>${i.name}</span><span class="text-center">${i.qty}</span><span class="text-right">₹${((i.sellingPrice || 0) * i.qty).toFixed(2)}</span></div>`).join('')}
        <div class="line"></div>
        <div class="row"><span>Subtotal</span><span>₹${showReceipt.subtotal.toFixed(2)}</span></div>
        ${showReceipt.discountAmt > 0 ? `<div class="row"><span>Discount (${showReceipt.discount}%)</span><span>-₹${showReceipt.discountAmt.toFixed(2)}</span></div>` : ''}
        <div class="row bold"><span>TOTAL</span><span>₹${showReceipt.total.toFixed(2)}</span></div>
        <div class="line"></div>
        <div class="center">
          <p>Payment: ${showReceipt.paymentMode}</p>
          <p>Thank you! Visit again!</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const todayTotal = todaySales.reduce((s, i) => s + (i.total || 0), 0);

  if (showReceipt) {
    return (
      <div className="page">
        <div className="receipt-view">
          <div className="receipt-card" ref={receiptRef}>
            <div className="receipt-header">
              <img src="/silambu_logo.png" alt="Logo" style={{ width: '60px', height: '60px', objectFit: 'contain', marginBottom: '10px' }} />
              <div className="receipt-icon">✅</div>
              <h2>Payment Successful!</h2>
              <p className="receipt-total">₹{showReceipt.total.toFixed(2)}</p>
            </div>
            <div className="receipt-details">
              <div className="receipt-row">
                <span>Invoice</span>
                <span>#{showReceipt.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="receipt-row">
                <span>Date</span>
                <span>{new Date(showReceipt.date).toLocaleDateString()}</span>
              </div>
              <div className="receipt-row">
                <span>Customer</span>
                <span>{showReceipt.customerName}</span>
              </div>
              <div className="receipt-row">
                <span>Payment</span>
                <span>{showReceipt.paymentMode}</span>
              </div>
              <div className="receipt-divider" />
              {showReceipt.items.map((item, i) => (
                <div key={i} className="receipt-row">
                  <span>{item.name} × {item.qty}</span>
                  <span>₹{(item.sellingPrice * item.qty).toFixed(2)}</span>
                </div>
              ))}
              <div className="receipt-divider" />
              <div className="receipt-row">
                <span>Subtotal</span>
                <span>₹{showReceipt.subtotal.toFixed(2)}</span>
              </div>
              {showReceipt.discountAmt > 0 && (
                <div className="receipt-row discount">
                  <span>Discount ({showReceipt.discount}%)</span>
                  <span>-₹{showReceipt.discountAmt.toFixed(2)}</span>
                </div>
              )}
              <div className="receipt-row total">
                <span>Total</span>
                <span>₹{showReceipt.total.toFixed(2)}</span>
              </div>
            </div>
            <div className="receipt-actions">
              <button className="btn btn-outline" onClick={handlePrint}>
                <LuPrinter /> Print Receipt
              </button>
              <button className="btn btn-primary" onClick={() => { setShowReceipt(null); clearCart(); }}>
                <LuCheck /> New Sale
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`billing-page ${isCartOpen ? 'cart-open' : ''}`}>
      {/* Mobile Cart Overlay */}
      {isCartOpen && <div className="cart-overlay mobile-only" onClick={() => setIsCartOpen(false)} />}

      {/* Floating Cart Button (Mobile Only) */}
      <button 
        className={`mobile-cart-fab mobile-only ${cart.length > 0 ? 'has-items' : ''}`}
        onClick={() => setIsCartOpen(!isCartOpen)}
      >
        <LuShoppingCart />
        {cart.length > 0 && <span className="fab-badge">{cart.length}</span>}
      </button>
      <div className="products-panel">
        <div className="panel-header">
          <div className="search-box">
            <LuSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="cat-tabs-scroll">
          <div className="cat-tabs">
            {['All', ...CATEGORIES].map(cat => (
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
        <div className="products-grid">
          {filtered.map(p => {
            const getIcon = (item) => {
              const name = item.name.toLowerCase();
              const cat = item.category.toLowerCase();
              
              if (name.includes('idli')) return '🍙';
              if (name.includes('dosa')) return '🫓';
              if (name.includes('poori')) return '🥟';
              if (name.includes('parotta')) return '🫓';
              if (name.includes('vada')) return '🍩';
              if (name.includes('pongal')) return '🥘';
              if (name.includes('chapathi')) return '🫓';
              if (name.includes('biryani')) return '🍗';
              if (name.includes('meals')) return '🍛';
              
              if (name.includes('orange')) return '🍊';
              if (name.includes('apple')) return '🍎';
              if (name.includes('pomegranate')) return '🏮';
              if (name.includes('grapes')) return '🍇';
              if (name.includes('pineapple')) return '🍍';
              if (name.includes('watermelon')) return '🍉';
              if (name.includes('lemon')) return '🍋';
              if (name.includes('soda')) return '🥤';
              if (name.includes('juice')) return '🍹';
              
              if (name.includes('ice cream')) return '🍦';
              
              if (name.includes('tea')) return '🍵';
              if (name.includes('coffee')) return '☕';
              if (name.includes('milk')) return '🥛';
              
              if (cat === 'biscuits') return '🍪';
              if (cat === 'snacks') return '🍿';
              if (cat === 'beverages') return '🥤';
              
              return '🍱';
            };

            return (
              <button key={p.id} className="product-card" onClick={() => addToCart(p)} disabled={p.stock <= 0}>
                <div className="product-emoji">{getIcon(p)}</div>
                <span className="product-name">{p.name}</span>
                <span className="product-price">₹{p.sellingPrice}</span>
                {p.stock <= 10 && <span className="product-stock-low">{p.stock} left</span>}
              </button>
            );
          })}
          {filtered.length === 0 && <div className="empty-grid">No products found</div>}
        </div>

        {/* Daily Summary Bar */}
        <div className="daily-summary-bar">
          <span>📊 Today: <strong>{todaySales.length}</strong> sales</span>
          <span>💰 Revenue: <strong>₹{todayTotal.toLocaleString()}</strong></span>
        </div>
      </div>

      {/* Cart Panel */}
      <div className={`cart-panel ${isCartOpen ? 'mobile-show' : ''}`}>
        <div className="cart-header">
          <button className="btn-close-cart mobile-only" onClick={() => setIsCartOpen(false)}>
            <LuX />
          </button>
          <div className="cart-title-row">
            <LuShoppingCart />
            <h2>Cart</h2>
            <span className="cart-count">{cart.length}</span>
          </div>
          {cart.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={clearCart}>
              <LuX /> Clear
            </button>
          )}
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <LuShoppingCart />
              <p>Cart is empty</p>
              <p className="cart-empty-sub">Tap products to add</p>
            </div>
          ) : (
            cart.map(c => (
              <div key={c.id} className="cart-item">
                <div className="cart-item-info">
                  <span className="cart-item-name">{c.name}</span>
                  <span className="cart-item-price">₹{c.sellingPrice} per {c.unit}</span>
                </div>
                <div className="cart-item-controls">
                  <button className="qty-btn" onClick={() => updateQty(c.id, c.unit === 'kg' ? -0.1 : -1)}><LuMinus /></button>
                  {c.unit === 'kg' ? (
                    <input
                      type="number"
                      className="qty-input"
                      value={c.qty}
                      step="0.001"
                      min="0.001"
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setCart(prev => prev.map(item => item.id === c.id ? { ...item, qty: val } : item));
                      }}
                    />
                  ) : (
                    <span className="qty-display">{c.qty}</span>
                  )}
                  <button className="qty-btn" onClick={() => updateQty(c.id, c.unit === 'kg' ? 0.1 : 1)}><LuPlus /></button>
                  <button className="qty-btn delete" onClick={() => removeItem(c.id)}><LuTrash2 /></button>
                </div>
                <span className="cart-item-total">₹{(c.sellingPrice * c.qty).toFixed(2)}</span>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-footer">
            {/* Customer Name */}
            <div className="form-group compact">
              <input
                placeholder="Customer name (optional)"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
              />
            </div>

            {/* Discount */}
            <div className="discount-row">
              <label>Discount %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={discount}
                onChange={e => setDiscount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
              />
            </div>

            {/* Payment Mode */}
            <div className="payment-modes">
              {PAYMENT_MODES.map(mode => (
                <button
                  key={mode}
                  className={`payment-btn ${paymentMode === mode ? 'active' : ''}`}
                  onClick={() => setPaymentMode(mode)}
                >
                  {mode === 'Cash' ? <LuBanknote /> : mode === 'UPI' ? <LuSmartphone /> : <LuCreditCard />}
                  {mode}
                </button>
              ))}
            </div>

            {/* Totals */}
            <div className="cart-totals">
              <div className="total-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {discountAmt > 0 && (
                <div className="total-row discount">
                  <span>Discount ({discount}%)</span>
                  <span>-₹{discountAmt.toFixed(2)}</span>
                </div>
              )}
              <div className="total-row grand">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>

            <button className="checkout-btn" onClick={() => { handleCheckout(); setIsCartOpen(false); }}>
              <LuCheck /> Checkout — ₹{total.toFixed(2)}
            </button>
          </div>
        )}
      </div>

      {/* Weight Prompt Modal */}
      {weightModal && (
        <div className="modal-overlay">
          <div className="modal modal-sm animate-slide-up">
            <h3 className="modal-title">Enter Weight</h3>
            <p className="modal-subtitle">{weightModal.product.name} (₹{weightModal.product.sellingPrice}/kg)</p>
            
            <div className="modal-form">
              <div className="form-group">
                <label>Weight in {weightModal.unitType === 'g' ? 'Grams (g)' : 'Kilograms (kg)'}</label>
                <div className="weight-input-wrapper">
                  <input
                    type="number"
                    autoFocus
                    placeholder={`Enter weight in ${weightModal.unitType}`}
                    value={weightModal.weight}
                    onChange={e => setWeightModal({ ...weightModal, weight: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && confirmWeight()}
                  />
                  <div className="weight-unit-toggle">
                    <button 
                      className={weightModal.unitType === 'g' ? 'active' : ''} 
                      onClick={() => setWeightModal({ ...weightModal, unitType: 'g' })}
                    >g</button>
                    <button 
                      className={weightModal.unitType === 'kg' ? 'active' : ''} 
                      onClick={() => setWeightModal({ ...weightModal, unitType: 'kg' })}
                    >kg</button>
                  </div>
                </div>
              </div>
              
              <div className="modal-actions">
                <button className="btn btn-ghost" onClick={() => setWeightModal(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={confirmWeight} disabled={!weightModal.weight}>
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
