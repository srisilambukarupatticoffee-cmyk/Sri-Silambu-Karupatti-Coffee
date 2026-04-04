import { useState, useMemo, useRef } from 'react';
import { db, CATEGORIES, PAYMENT_MODES } from '../utils/db';
import { v4 as uuid } from 'uuid';
import {
  LuSearch, LuPlus, LuMinus, LuTrash2, LuShoppingCart,
  LuCreditCard, LuBanknote, LuSmartphone, LuPrinter, LuCheck, LuX
} from 'react-icons/lu';
import './Billing.css';

export default function Billing() {
  const [products] = useState(() => db.getAll('products'));
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [showReceipt, setShowReceipt] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [weightModal, setWeightModal] = useState(null); // { product, weight, unitType: 'g'|'kg' }
  const receiptRef = useRef(null);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
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

  const subtotal = cart.reduce((sum, c) => sum + c.sellingPrice * c.qty, 0);
  const discountAmt = (subtotal * discount) / 100;
  const total = subtotal - discountAmt;
  const totalCost = cart.reduce((sum, c) => sum + c.costPrice * c.qty, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;

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

    db.add('sales', sale);

    // Update stock
    cart.forEach(c => {
      const product = db.getById('products', c.id);
      if (product) {
        db.update('products', c.id, { stock: Math.max(0, product.stock - c.qty) });
      }
    });

    // Save customer if named
    if (customerName) {
      const customers = db.getAll('customers');
      const existing = customers.find(c => c.name.toLowerCase() === customerName.toLowerCase());
      if (existing) {
        db.update('customers', existing.id, {
          purchases: [...(existing.purchases || []), sale.id],
          totalSpent: (existing.totalSpent || 0) + total,
        });
      } else {
        db.add('customers', {
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
  };

  const handlePrint = () => {
    const settings = db.getAll('settings') || {};
    const printWindow = window.open('', '_blank', 'width=320,height=600');
    const shopName = typeof settings === 'object' && !Array.isArray(settings) ? settings.shopName : 'Hotel Silambu';
    const address = typeof settings === 'object' && !Array.isArray(settings) ? settings.address : '';
    const gst = typeof settings === 'object' && !Array.isArray(settings) ? settings.gst : '';

    printWindow.document.write(`
      <html>
      <head><title>Receipt</title>
      <style>
        body { font-family: 'Courier New', monospace; width: 280px; margin: 0 auto; padding: 10px; font-size: 12px; }
        .center { text-align: center; }
        .logo-row { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 5px; }
        .logo-img { width: 30px; height: 30px; object-fit: contain; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 6px 0; }
        .row { display: flex; justify-content: space-between; gap: 10px; }
        h2 { margin: 0; font-size: 16px; }
        p { margin: 2px 0; }
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
        <div class="row bold"><span>Item</span><span>Qty</span><span>Amt</span></div>
        <div class="line"></div>
        ${showReceipt.items.map(i => `<div class="row"><span>${i.name}</span><span>${i.qty}</span><span>₹${(i.sellingPrice * i.qty).toFixed(2)}</span></div>`).join('')}
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

  const todaySales = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return db.getAll('sales').filter(s => s.date?.startsWith(today));
  }, [showReceipt]);

  const todayTotal = todaySales.reduce((s, i) => s + (i.total || 0), 0);

  if (showReceipt) {
    return (
      <div className="page">
        <div className="receipt-view">
          <div className="receipt-card" ref={receiptRef}>
            <div className="receipt-header">
              <span className="receipt-icon">✅</span>
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
    <div className="billing-page">
      {/* Products Panel */}
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
          {filtered.map(p => (
            <button key={p.id} className="product-card" onClick={() => addToCart(p)} disabled={p.stock <= 0}>
              <div className="product-emoji">
                {p.category === 'Tea' ? '🍵' : p.category === 'Coffee' ? '☕' : p.category === 'Milk' ? '🥛' :
                 p.category === 'Meals' ? '🍛' : p.category === 'Snacks' ? '🍿' : p.category === 'Beverages' ? '🥤' : '🍪'}
              </div>
              <span className="product-name">{p.name}</span>
              <span className="product-price">₹{p.sellingPrice}</span>
              {p.stock <= 10 && <span className="product-stock-low">{p.stock} left</span>}
            </button>
          ))}
          {filtered.length === 0 && <div className="empty-grid">No products found</div>}
        </div>

        {/* Daily Summary Bar */}
        <div className="daily-summary-bar">
          <span>📊 Today: <strong>{todaySales.length}</strong> sales</span>
          <span>💰 Revenue: <strong>₹{todayTotal.toLocaleString()}</strong></span>
        </div>
      </div>

      {/* Cart Panel */}
      <div className="cart-panel">
        <div className="cart-header">
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

            <button className="checkout-btn" onClick={handleCheckout}>
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
