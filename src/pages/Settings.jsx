import { useState } from 'react';
import { db } from '../utils/db';
import { LuSave, LuPrinter, LuSettings2 } from 'react-icons/lu';
import './Pages.css';

export default function Settings() {
  const [settings, setSettings] = useState(() => {
    const s = localStorage.getItem('settings');
    return s ? JSON.parse(s) : {
      shopName: 'Hotel Silambu',
      address: '123 Main Street, Chennai - 600001',
      gst: '',
      fontSize: 'medium',
      alignment: 'center',
      autoPrint: false,
    };
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
                <img src="/src/assets/silambu_logo.png" alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
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
    </div>
  );
}
