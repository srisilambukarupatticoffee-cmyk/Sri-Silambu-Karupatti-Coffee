import { useState, useEffect } from 'react';
import { db } from '../utils/db';
import { LuSave, LuPrinter, LuSettings2, LuDatabase } from 'react-icons/lu';
import { SEED_PRODUCTS } from '../data/inventory_seeds';
import './Pages.css';

export default function Settings() {
  const [settings, setSettings] = useState({
    shopName: 'Sri Silambu Karupatti Coffee',
    address: 'No: 15, Puthupalayam, Bengaluru Main Road, Chengam, Tiruvannamalai - 606709\n📞 97866 98585, +91 99941 15599',
    gst: '',
    fontSize: 'medium',
    alignment: 'center',
    autoPrint: false,
  });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [migrating, setMigrating] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await db.getAll('settings');
      if (data && data.length > 0) {
        setSettings(data[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const data = await db.getAll('settings');
      if (data && data.length > 0) {
        await db.update('settings', data[0].id, settings);
      } else {
        await db.add('settings', { ...settings, id: 'main-settings' });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleMigrate = async () => {
    if (!confirm('This will copy all your local products and data to MongoDB. Continue?')) return;
    setMigrating(true);
    try {
      await db.migrateFromLocalStorage();
      alert('Migration successful! Your data is now in the cloud.');
      window.location.reload();
    } catch (err) {
      alert('Migration failed: ' + err.message);
    } finally {
      setMigrating(false);
    }
  };

  const handleSeedProducts = async () => {
    if (!confirm(`This will add ${SEED_PRODUCTS.length} products to your inventory. Existing products with the same names may be duplicated. Continue?`)) return;
    setMigrating(true);
    try {
      for (const product of SEED_PRODUCTS) {
        await db.add('products', {
          ...product,
          id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString()
        });
      }
      alert('Product list seeded successfully!');
      window.location.reload();
    } catch (err) {
      alert('Seeding failed: ' + err.message);
    } finally {
      setMigrating(false);
    }
  };

  const update = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure receipt & printer settings</p>
        </div>
        <button className={`btn ${saved ? 'btn-success' : 'btn-primary'}`} onClick={handleSave}>
          <LuSave /> {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      <div className="settings-grid">
        {/* Cloud Migration */}
        <div className="section-card">
          <h3 className="section-title">☁️ Cloud Migration</h3>
          <div className="settings-form">
            <p className="setting-help">Transfer local products/sales to MongoDB.</p>
            <button 
              className="btn btn-outline" 
              onClick={handleMigrate}
              disabled={migrating}
              style={{ width: '100%', marginTop: '5px' }}
            >
              Push Local Data to Cloud
            </button>
            <p className="setting-help" style={{ marginTop: '15px' }}>Initialize database with standard product list.</p>
            <button 
              className="btn btn-primary" 
              onClick={handleSeedProducts}
              disabled={migrating}
              style={{ width: '100%', marginTop: '5px' }}
            >
              <LuDatabase /> Seed Product List
            </button>
          </div>
        </div>

        {/* Receipt Header */}
        <div className="section-card">
          <h3 className="section-title"><LuPrinter /> Receipt Header</h3>
          <div className="settings-form">
            <div className="form-group">
              <label>Shop Name</label>
              <input value={settings.shopName} onChange={e => update('shopName', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Address</label>
              <textarea value={settings.address} onChange={e => update('address', e.target.value)} rows="2" />
            </div>
            <div className="form-group">
              <label>GST Number (optional)</label>
              <input value={settings.gst} onChange={e => update('gst', e.target.value)} placeholder="Enter GST number" />
            </div>
          </div>
        </div>

        {/* Receipt Customization */}
        <div className="section-card">
          <h3 className="section-title"><LuSettings2 /> Receipt Customization</h3>
          <div className="settings-form">
            <div className="form-group">
              <label>Font Size</label>
              <select value={settings.fontSize} onChange={e => update('fontSize', e.target.value)}>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            <div className="form-group">
              <label>Alignment</label>
              <select value={settings.alignment} onChange={e => update('alignment', e.target.value)}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div className="form-group">
              <label className="toggle-label">
                <span>Auto Print After Billing</span>
                <label className="toggle">
                  <input type="checkbox" checked={settings.autoPrint} onChange={e => update('autoPrint', e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </label>
            </div>
          </div>
        </div>

        {/* Receipt Preview */}
        <div className="section-card span-2">
          <h3 className="section-title">📄 Receipt Preview</h3>
          <div className="receipt-preview" style={{ fontSize: settings.fontSize === 'small' ? '11px' : settings.fontSize === 'large' ? '15px' : '13px', textAlign: settings.alignment }}>
            <div className="receipt-preview-inner">
              <div className="receipt-preview-logo">
                <img src="/silambu_logo.png" alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
              </div>
              <h3>{settings.shopName}</h3>
              <p>{settings.address}</p>
              {settings.gst && <p>GST: {settings.gst}</p>}
              <div className="receipt-sep">- - - - - - - - - - - - - - - -</div>
              <div style={{ textAlign: 'left' }}>
                <div className="receipt-line"><span>Date: {new Date().toLocaleDateString()}</span><span>{new Date().toLocaleTimeString()}</span></div>
                <div className="receipt-line"><span>Customer: Walk-in</span></div>
              </div>
              <div className="receipt-sep">- - - - - - - - - - - - - - - -</div>
              <div style={{ textAlign: 'left' }}>
                <div className="receipt-line"><span>Masala Tea ×2</span><span>₹30.00</span></div>
                <div className="receipt-line"><span>Filter Coffee ×1</span><span>₹20.00</span></div>
              </div>
              <div className="receipt-sep">- - - - - - - - - - - - - - - -</div>
              <div style={{ textAlign: 'left' }}>
                <div className="receipt-line"><strong>TOTAL</strong><strong>₹50.00</strong></div>
              </div>
              <div className="receipt-sep">- - - - - - - - - - - - - - - -</div>
              <p>Payment: Cash</p>
              <p>Thank you! Visit again!</p>
            </div>
          </div>
        </div>
      </div>
      {(loading || migrating) && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="spinner-large" />
          <p style={{ color: 'white', marginTop: '20px' }}>
            {migrating ? 'Migrating your data to MongoDB...' : 'Loading settings...'}
          </p>
        </div>
      )}
    </div>
  );
}
