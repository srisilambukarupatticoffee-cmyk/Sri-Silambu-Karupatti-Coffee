import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../utils/db';
import { LuSearch, LuCalendar, LuPrinter, LuTrash2, LuChevronRight, LuChevronLeft, LuFilter, LuX } from 'react-icons/lu';
import './Pages.css';

export default function Sales() {
  const { t } = useTranslation();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    setLoading(true);
    try {
      const data = await db.getAll('sales');
      // Sort by date descending
      setSales(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      console.error('Failed to load sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const matchSearch = s.customerName?.toLowerCase().includes(search.toLowerCase()) || 
                          s.id?.toLowerCase().includes(search.toLowerCase());
      const matchDate = !dateFilter || s.date?.startsWith(dateFilter);
      return matchSearch && matchDate;
    });
  }, [sales, search, dateFilter]);

  const paginatedSales = filteredSales.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

  const handlePrint = (sale) => {
    const printWindow = window.open('', '_blank', 'width=380,height=800');
    const shopName = t('settings.shop_name_val', { defaultValue: 'Sri Silambu Karupatti Coffee' });
    
    printWindow.document.write(`
      <html>
      <head><title>Receipt</title>
      <style>
        @page { margin: 0; }
        body { 
          font-family: 'Inter', -apple-system, sans-serif; 
          width: 285px; 
          margin: 0 auto; 
          padding: 5mm 2mm 15mm 2mm; 
          font-size: 13px; 
          line-height: 1.4;
          color: #000;
          font-weight: 500;
        }
        .center { text-align: center; }
        .bold { font-weight: 800; }
        .line { border-top: 2px solid #000; margin: 8px 0; }
        .dashed-line { border-top: 1px dashed #000; margin: 8px 0; }
        .grid { display: grid; grid-template-columns: 1fr 45px 75px; gap: 5px; align-items: start; }
        .row { display: flex; justify-content: space-between; margin: 2px 0; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        h2 { margin: 0; font-size: 18px; font-weight: 800; text-transform: uppercase; }
        p { margin: 3px 0; }
      </style>
      </head>
      <body>
        <div class="center">
          <h2>${shopName}</h2>
          <p class="bold">${t('sales.reprinted_receipt')}</p>
        </div>
        <div class="line"></div>
        <div class="row"><span class="bold">${t('common.date')}: ${new Date(sale.date).toLocaleDateString()}</span><span class="bold">${new Date(sale.date).toLocaleTimeString()}</span></div>
        <div class="row"><span class="bold">${t('sales.bill_id')}: #${sale.id.slice(0, 8).toUpperCase()}</span></div>
        <p>${t('sales.customer')}: <span class="bold">${sale.customerName}</span></p>
        <div class="line"></div>
        <div class="grid bold"><span>${t('customers.items')}</span><span class="text-center">Qty</span><span class="text-right">Amt</span></div>
        <div class="line"></div>
        ${sale.items?.map(i => `<div class="grid"><span>${i.name}</span><span class="text-center">${i.qty}</span><span class="text-right">\u20B9${((i.sellingPrice || 0) * i.qty).toFixed(2)}</span></div>`).join('')}
        <div class="dashed-line"></div>
        <div class="row"><span>${t('billing.subtotal')}</span><span>\u20B9${(sale.subtotal || 0).toFixed(2)}</span></div>
        ${sale.discountAmt > 0 ? `<div class="row"><span>${t('billing.discount')} (${sale.discount}%)</span><span>-\u20B9${sale.discountAmt.toFixed(2)}</span></div>` : ''}
        <div class="line"></div>
        <div class="row bold" style="font-size: 16px;"><span>${t('sales.grand_total')}</span><span>\u20B9${(sale.total || 0).toFixed(2)}</span></div>
        <div class="line"></div>
        <div class="center" style="margin-top: 10px;">
          <p class="bold">${t('sales.payment')}: ${sale.paymentMode}</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleDelete = async (id) => {
    if (!confirm(t('sales.confirm_delete'))) return;
    await db.remove('sales', id);
    loadSales();
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('sales.title')}</h1>
          <p className="page-subtitle">{t('sales.subtitle')}</p>
        </div>
        <div className="header-actions">
           <div className="search-box">
             <LuSearch className="search-icon" />
             <input 
               placeholder={t('sales.search_placeholder')} 
               value={search}
               onChange={e => { setSearch(e.target.value); setPage(1); }}
             />
           </div>
           <div className="search-box">
             <LuCalendar className="search-icon" />
             <input 
               type="date" 
               value={dateFilter}
               onChange={e => { setDateFilter(e.target.value); setPage(1); }}
             />
           </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('common.date')} & {t('common.status')}</th>
              <th>{t('sales.bill_id')}</th>
              <th>{t('sales.customer')}</th>
              <th>{t('customers.items')}</th>
              <th>{t('common.total')}</th>
              <th>{t('sales.payment')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center">{t('common.loading')}</td></tr>
            ) : paginatedSales.length === 0 ? (
              <tr><td colSpan="7" className="text-center">{t('sales.no_records')}</td></tr>
            ) : paginatedSales.map(s => (
              <tr key={s.id} onClick={() => setSelectedSale(s)} className="clickable">
                <td>
                  <div className="date-cell">
                    <strong>{new Date(s.date).toLocaleDateString()}</strong>
                    <span>{new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </td>
                <td><code style={{ fontSize: '11px' }}>{s.id.slice(0, 8).toUpperCase()}</code></td>
                <td>{s.customerName}</td>
                <td>{s.items?.length || 0} {t('dashboard.orders')}</td>
                <td><strong>\u20B9{(s.total || 0).toLocaleString()}</strong></td>
                <td><span className={`badge badge-${s.paymentMode?.toLowerCase()}`}>{s.paymentMode}</span></td>
                <td>
                  <div className="table-actions">
                    <button className="btn-icon" title={t('billing.print_receipt')} onClick={(e) => { e.stopPropagation(); handlePrint(s); }}><LuPrinter /></button>
                    <button className="btn-icon text-danger" title={t('common.delete')} onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}><LuTrash2 /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}><LuChevronLeft /> {t('common.previous')}</button>
            <span>{t('common.page_info', { page, total: totalPages })}</span>
            <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>{t('common.next')} <LuChevronRight /></button>
          </div>
        )}
      </div>

      {selectedSale && (
        <div className="modal-overlay" onClick={() => setSelectedSale(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{t('sales.bill_details')}</h2>
              <button className="btn-icon" onClick={() => setSelectedSale(null)}><LuX /></button>
            </div>
            <div className="sale-details">
               <div className="details-grid">
                  <div><strong>{t('sales.bill_id')}:</strong> {selectedSale.id}</div>
                  <div><strong>{t('common.date')}:</strong> {new Date(selectedSale.date).toLocaleString()}</div>
                  <div><strong>{t('sales.customer')}:</strong> {selectedSale.customerName}</div>
                  <div><strong>{t('sales.payment')}:</strong> {selectedSale.paymentMode}</div>
               </div>
               <div className="details-items">
                  <h4>{t('customers.items')}</h4>
                  {selectedSale.items?.map((item, i) => (
                    <div key={i} className="detail-item-row">
                      <span>{item.name} × {item.qty}</span>
                      <span>\u20B9{(item.sellingPrice * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
               </div>
               <div className="details-summary">
                  <div className="row"><span>{t('billing.subtotal')}</span><span>\u20B9{selectedSale.subtotal?.toFixed(2)}</span></div>
                  {selectedSale.discountAmt > 0 && <div className="row"><span>{t('billing.discount')}</span><span>-\u20B9{selectedSale.discountAmt?.toFixed(2)}</span></div>}
                  <div className="row total"><span>{t('sales.grand_total')}</span><span>\u20B9{selectedSale.total?.toFixed(2)}</span></div>
               </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => handlePrint(selectedSale)}>{t('billing.print_receipt')}</button>
              <button className="btn btn-primary" onClick={() => setSelectedSale(null)}>{t('common.close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
