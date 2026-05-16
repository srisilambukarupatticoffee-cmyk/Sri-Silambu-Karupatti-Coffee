import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../utils/db';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  LuTrendingUp, LuTrendingDown, LuShoppingCart, LuTicket, 
  LuWallet, LuPackage, LuCheck, LuTriangleAlert, LuTrash2, LuPrinter
} from 'react-icons/lu';
import './Pages.css';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function Dashboard() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState('month'); 
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [s, e, t_data, p, setts] = await Promise.all([
        db.getAll('sales'),
        db.getAll('expenses'),
        db.getAll('tokens'),
        db.getAll('products'),
        db.getAll('settings').then(res => res[0] || {}),
      ]);
      setSales(s);
      setExpenses(e);
      setTokens(t_data);
      setProducts(p);
      setSettings(setts);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const dashboardStats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const monthStr = now.toISOString().slice(0, 7);

    const todaySales = sales.filter(s => s.date?.startsWith(todayStr));
    const monthSales = sales.filter(s => s.date?.startsWith(monthStr));
    const todayExpenses = expenses.filter(e => e.date?.startsWith(todayStr));
    const monthExpenses = expenses.filter(e => e.date?.startsWith(monthStr));
    const todayTokens = tokens.filter(tk => tk.date?.startsWith(todayStr));
    const monthTokens = tokens.filter(tk => tk.date?.startsWith(monthStr));

    const sumTotal = (arr) => arr.reduce((s, i) => s + (i.total || 0), 0);
    const sumAmount = (arr) => arr.reduce((s, i) => s + (i.amount || 0), 0);
    const sumCost = (arr) => arr.reduce((s, i) => s + (i.totalCost || 0), 0);

    const todayRevenue = sumTotal(todaySales);
    const monthRevenue = sumTotal(monthSales);
    const todayExpenseTotal = sumAmount(todayExpenses);
    const monthExpenseTotal = sumAmount(monthExpenses);
    const todayCost = sumCost(todaySales);
    const monthCost = sumCost(monthSales);
    const todayProfit = todayRevenue - todayExpenseTotal - todayCost;
    const monthProfit = monthRevenue - monthExpenseTotal - monthCost;
    const todayTokenRevenue = sumTotal(todayTokens);
    const monthTokenRevenue = sumTotal(monthTokens);

    const totalItems = products.length;
    const highStock = products.filter(p => p.stock > 30).length;
    const lowStock = products.filter(p => p.stock <= 10).length;

    const categorySales = {};
    const currentSales = period === 'all' ? sales : (period === 'today' ? todaySales : monthSales);
    currentSales.forEach(s => {
      (s.items || []).forEach(item => {
        const cat = item.category || 'Other';
        categorySales[cat] = (categorySales[cat] || 0) + (item.sellingPrice * item.qty);
      });
    });
    const categoryData = Object.entries(categorySales).map(([name, value]) => ({ name, value }));

    const dailySales = {};
    monthSales.forEach(s => {
      const day = s.date?.split('T')[0]?.split('-')[2];
      if (day) dailySales[day] = (dailySales[day] || 0) + (s.total || 0);
    });
    const dailyData = Object.entries(dailySales)
      .map(([day, total]) => ({ day: `${t('dashboard.today')} ${parseInt(day)}`, total }))
      .sort((a, b) => parseInt(a.day.split(' ')[1]) - parseInt(b.day.split(' ')[1]));

    const productSales = {};
    currentSales.forEach(s => {
      (s.items || []).forEach(item => {
        productSales[item.name] = (productSales[item.name] || 0) + item.qty;
      });
    });
    const topProducts = Object.entries(productSales)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const currentTokens = period === 'all' ? tokens : (period === 'today' ? todayTokens : monthTokens);
    const tokenByCategory = {};
    currentTokens.forEach(tk => {
      const cat = tk.category || 'Other';
      if (!tokenByCategory[cat]) tokenByCategory[cat] = { count: 0, revenue: 0 };
      tokenByCategory[cat].count += (tk.qty || 1);
      tokenByCategory[cat].revenue += (tk.total || 0);
    });
    const tokenData = Object.entries(tokenByCategory).map(([name, d]) => ({
      name, count: d.count, revenue: d.revenue
    }));

    return {
      todayRevenue, monthRevenue,
      todayExpenseTotal, monthExpenseTotal,
      todayProfit, monthProfit,
      todayTokenRevenue, monthTokenRevenue,
      todayTokenCount: todayTokens.reduce((s, tk) => s + (tk.qty || 1), 0),
      monthTokenCount: monthTokens.reduce((s, tk) => s + (tk.qty || 1), 0),
      todaySalesCount: todaySales.length,
      monthSalesCount: monthSales.length,
      totalItems, highStock, lowStock,
      categoryData, dailyData, topProducts, tokenData,
      todaySales, todayTokens
    };
  }, [period, sales, expenses, tokens, products, t]);

  const data = dashboardStats;

  const handlePrintDaySummary = () => {
    const shopName = settings.shopName || 'Sri Silambu Karupatti Coffee';
    const itemsSummary = {};
    data.todaySales.forEach(s => {
      s.items.forEach(item => {
        if (!itemsSummary[item.name]) itemsSummary[item.name] = { qty: 0, total: 0 };
        itemsSummary[item.name].qty += item.qty;
        itemsSummary[item.name].total += (item.sellingPrice * item.qty);
      });
    });

    data.todayTokens.forEach(tk => {
      const name = `${tk.type || tk.category} (Token)`;
      if (!itemsSummary[name]) itemsSummary[name] = { qty: 0, total: 0 };
      itemsSummary[name].qty += tk.qty;
      itemsSummary[name].total += (tk.total || 0);
    });

    const printWindow = window.open('', '_blank', 'width=380,height=800');
    const address = settings.address || '';

    printWindow.document.write(`
      <html>
      <head><title>${t('dashboard.day_close')}</title>
      <style>
        @page { margin: 0; }
        body { 
          font-family: 'Inter', -apple-system, sans-serif; 
          width: 285px; 
          margin: 0 auto; 
          padding: 8mm 2mm 15mm 2mm; 
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
        .row { display: flex; justify-content: space-between; margin: 4px 0; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        h2 { margin: 5px 0; font-size: 18px; font-weight: 800; text-transform: uppercase; }
        p { margin: 3px 0; white-space: pre-line; }
      </style>
      </head>
      <body>
        <div class="center">
          <h2 class="bold">${shopName}</h2>
          <div style="font-size: 11px; margin-bottom: 5px; white-space: pre-line; font-weight: 700;">${address}</div>
          <div class="line"></div>
          <h2 class="bold" style="text-decoration: underline; font-size: 16px;">${t('dashboard.day_close').toUpperCase()}</h2>
          <p class="bold">${t('common.date')}: ${new Date().toLocaleDateString()}</p>
          <p class="bold">Time: ${new Date().toLocaleTimeString()}</p>
        </div>
        <div class="line"></div>
        <div class="grid bold"><span>Item</span><span class="text-center">Qty</span><span class="text-right">Amt</span></div>
        <div class="line"></div>
        ${Object.entries(itemsSummary).map(([name, d]) => `
          <div class="grid">
            <span>${name}</span>
            <span class="text-center">${d.qty.toFixed(d.qty % 1 === 0 ? 0 : 2)}</span>
            <span class="text-right">\u20B9${d.total.toFixed(2)}</span>
          </div>
        `).join('')}
        <div class="dashed-line"></div>
        <div class="row bold"><span>SALES REVENUE</span><span>\u20B9${data.todayRevenue.toFixed(2)}</span></div>
        <div class="row bold"><span>TOKEN REVENUE</span><span>\u20B9${data.todayTokenRevenue.toFixed(2)}</span></div>
        <div class="line"></div>
        <div class="row bold" style="font-size: 16px; margin-top: 5px;">
          <span>GRAND TOTAL</span><span>\u20B9${(data.todayRevenue + data.todayTokenRevenue).toFixed(2)}</span>
        </div>
        <div class="line"></div>
        <div class="row"><span>Total Expenses</span><span>-\u20B9${data.todayExpenseTotal.toFixed(2)}</span></div>
        <div class="row bold" style="font-size: 15px; margin-top: 5px;">
          <span>NET CASH</span><span>\u20B9${(data.todayRevenue + data.todayTokenRevenue - data.todayExpenseTotal).toFixed(2)}</span>
        </div>
        <div class="line"></div>
        <div class="center" style="margin-top: 20px;"><p class="bold">-- End of Summary --</p></div>
        <div style="height: 30px;"></div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handlePrintMonthSummary = () => {
    const shopName = settings.shopName || 'Sri Silambu Karupatti Coffee';
    const monthStr = new Date().toISOString().slice(0, 7);
    const mSales = sales.filter(s => s.date?.startsWith(monthStr));
    const mTokens = tokens.filter(tk => tk.date?.startsWith(monthStr));
    
    const itemsSummary = {};
    mSales.forEach(s => {
      (s.items || []).forEach(item => {
        if (!itemsSummary[item.name]) itemsSummary[item.name] = { qty: 0, total: 0 };
        itemsSummary[item.name].qty += item.qty;
        itemsSummary[item.name].total += (item.sellingPrice * item.qty);
      });
    });

    mTokens.forEach(tk => {
      const name = `${tk.type || tk.category} (Token)`;
      if (!itemsSummary[name]) itemsSummary[name] = { qty: 0, total: 0 };
      itemsSummary[name].qty += tk.qty;
      itemsSummary[name].total += (tk.total || 0);
    });

    const mRevenue = mSales.reduce((s, i) => s + (i.total || 0), 0);
    const mTokenRevenue = mTokens.reduce((s, i) => s + (i.total || 0), 0);
    const mExpenseTotal = expenses.filter(e => e.date?.startsWith(monthStr)).reduce((s, i) => s + (i.amount || 0), 0);

    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    const address = settings.address || '';

    printWindow.document.write(`
      <html>
      <head><title>${t('dashboard.month_summary')} - ${monthStr}</title>
      <style>
        @page { size: A4; margin: 20mm; }
        body { 
          font-family: 'Inter', -apple-system, sans-serif; 
          margin: 0; 
          padding: 0; 
          font-size: 12px; 
          line-height: 1.5;
          color: #333;
        }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .header h1 { margin: 0; font-size: 24px; color: #000; }
        .report-info { display: flex; justify-content: space-between; margin-bottom: 20px; font-weight: 600; }
        
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #f4f4f4; border: 1px solid #ddd; padding: 8px; text-align: left; }
        td { border: 1px solid #ddd; padding: 8px; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        
        .section-title { font-size: 16px; font-weight: 800; margin: 20px 0 10px 0; border-bottom: 1px solid #eee; padding-bottom: 5px; color: #000; text-transform: uppercase; }
        
        .summary-box { display: flex; justify-content: flex-end; }
        .summary-table { width: 300px; }
        .summary-table td { border: none; padding: 4px 8px; }
        .summary-table .total-row { font-weight: 800; font-size: 14px; border-top: 2px solid #000; }
        
        .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #999; }
      </style>
      </head>
      <body>
        <div class="header">
          <h1>${shopName}</h1>
          <p>${address}</p>
        </div>
        
        <div class="report-info">
          <span>REPORT: ${t('dashboard.month_summary').toUpperCase()}</span>
          <span>MONTH: ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
          <span>DATE: ${new Date().toLocaleDateString()}</span>
        </div>

        <div class="section-title">Item-wise Sales Summary</div>
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th class="text-center">Quantity Sold</th>
              <th class="text-right">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(itemsSummary).map(([name, d]) => `
              <tr>
                <td>${name}</td>
                <td class="text-center">${d.qty.toFixed(d.qty % 1 === 0 ? 0 : 2)}</td>
                <td class="text-right">\u20B9${d.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="section-title">Detailed Sales Transactions</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Bill ID</th>
              <th>Customer</th>
              <th>Payment</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${mSales.sort((a,b) => new Date(a.date) - new Date(b.date)).map(s => `
              <tr>
                <td>${new Date(s.date).toLocaleDateString()} ${new Date(s.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                <td>${s.id.slice(0,8).toUpperCase()}</td>
                <td>${s.customerName}</td>
                <td>${s.paymentMode}</td>
                <td class="text-right">\u20B9${(s.total || 0).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary-box">
          <table class="summary-table">
            <tr><td>Total Sales Revenue</td><td class="text-right">\u20B9${mRevenue.toFixed(2)}</td></tr>
            <tr><td>Total Token Revenue</td><td class="text-right">\u20B9${mTokenRevenue.toFixed(2)}</td></tr>
            <tr><td>Total Expenses</td><td class="text-right">-\u20B9${mExpenseTotal.toFixed(2)}</td></tr>
            <tr class="total-row"><td>NET CASH</td><td class="text-right">\u20B9${(mRevenue + mTokenRevenue - mExpenseTotal).toFixed(2)}</td></tr>
          </table>
        </div>

        <div class="footer">
          <p>Generated by Sri Silambu POS System</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleWipeData = async () => {
    setLoading(true);
    await db.clearTransactions();
    setShowWipeModal(false);
    await loadAllData();
  };

  const sumTotal = (arr) => arr.reduce((s, i) => s + (i.total || 0), 0);
  const sumAmount = (arr) => arr.reduce((s, i) => s + (i.amount || 0), 0);
  const sumCost = (arr) => arr.reduce((s, i) => s + (i.totalCost || 0), 0);

  const kpis = [
    {
      label: t('dashboard.today_sales'),
      value: `\u20B9${(period === 'all' ? sumTotal(sales) : (period === 'today' ? data.todayRevenue : data.monthRevenue)).toLocaleString()}`,
      sub: `${period === 'all' ? sales.length : (period === 'today' ? data.todaySalesCount : data.monthSalesCount)} ${t('dashboard.orders')}`,
      icon: <LuShoppingCart />,
      color: '#6366f1',
    },
    {
      label: t('common.expenses'),
      value: `\u20B9${(period === 'all' ? sumAmount(expenses) : (period === 'today' ? data.todayExpenseTotal : data.monthExpenseTotal)).toLocaleString()}`,
      icon: <LuWallet />,
      color: '#ef4444',
    },
    {
      label: t('dashboard.net_profit'),
      value: `\u20B9${(period === 'all' ? (sumTotal(sales) - sumAmount(expenses) - sumCost(sales)) : (period === 'today' ? data.todayProfit : data.monthProfit)).toLocaleString()}`,
      icon: (period === 'today' ? data.todayProfit : data.monthProfit) >= 0 ? <LuTrendingUp /> : <LuTrendingDown />,
      color: (period === 'today' ? data.todayProfit : data.monthProfit) >= 0 ? '#10b981' : '#ef4444',
    },
    {
      label: t('dashboard.token_revenue'),
      value: `\u20B9${(period === 'all' ? sumTotal(tokens) : (period === 'today' ? data.todayTokenRevenue : data.monthTokenRevenue)).toLocaleString()}`,
      sub: `${period === 'all' ? tokens.reduce((s,tk) => s+(tk.qty||1), 0) : (period === 'today' ? data.todayTokenCount : data.monthTokenCount)} ${t('dashboard.tokens')}`,
      icon: <LuTicket />,
      color: '#f59e0b',
    },
    {
      label: t('dashboard.inventory_items'),
      value: data.totalItems,
      sub: t('dashboard.total_products'),
      icon: <LuPackage />,
      color: '#8b5cf6',
    },
    {
      label: t('dashboard.high_stock'),
      value: data.highStock,
      sub: t('dashboard.items_above_30'),
      icon: <LuCheck />,
      color: '#10b981',
    },
    {
      label: t('dashboard.low_stock'),
      value: data.lowStock,
      sub: t('dashboard.items_below_10'),
      icon: <LuTriangleAlert />,
      color: '#f59e0b',
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src="/silambu_logo.png" alt="Logo" style={{ width: '48px', height: '48px', objectFit: 'contain', background: 'white', padding: '4px', borderRadius: '10px', boxShadow: 'var(--shadow-sm)' }} />
          <div>
            <h1 className="page-title">{t('dashboard.title')}</h1>
            <p className="page-subtitle">{t('dashboard.subtitle')}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={handlePrintDaySummary}>
            <LuPrinter /> {t('dashboard.day_close')}
          </button>
          <button className="btn btn-outline" onClick={handlePrintMonthSummary}>
            <LuPrinter /> {t('dashboard.month_summary')}
          </button>
          <button className="btn btn-danger" onClick={() => setShowWipeModal(true)}>
            <LuTrash2 /> {t('dashboard.wipe_transactions')}
          </button>
          <div className="period-toggle">
            <button className={period === 'today' ? 'active' : ''} onClick={() => setPeriod('today')}>{t('dashboard.today')}</button>
            <button className={period === 'month' ? 'active' : ''} onClick={() => setPeriod('month')}>{t('dashboard.this_month')}</button>
            <button className={period === 'all' ? 'active' : ''} onClick={() => setPeriod('all')}>{t('dashboard.all_time')}</button>
          </div>
        </div>
      </div>

      <div className="kpi-grid">
        {kpis.map((kpi, i) => (
          <div key={i} className="kpi-card" style={{ '--kpi-color': kpi.color }}>
            <div className="kpi-icon" style={{ background: kpi.color + '18', color: kpi.color }}>
              {kpi.icon}
            </div>
            <div className="kpi-body">
              <span className="kpi-label">{kpi.label}</span>
              <span className="kpi-value">{kpi.value}</span>
              {kpi.sub && <span className="kpi-sub">{kpi.sub}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="chart-card span-2">
          <h3 className="chart-title">{t('dashboard.monthly_sales_trend')}</h3>
          {data.dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--text-tertiary)" fontSize={12} />
                <YAxis stroke="var(--text-tertiary)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    color: 'var(--text-primary)'
                  }}
                />
                <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">{t('dashboard.no_data')}</div>
          )}
        </div>

        <div className="chart-card">
          <h3 className="chart-title">{t('dashboard.sales_by_category')}</h3>
          {data.categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {data.categoryData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    color: 'var(--text-primary)'
                  }}
                  formatter={(value) => `\u20B9${value.toLocaleString()}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">{t('dashboard.no_data')}</div>
          )}
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3 className="chart-title">{t('dashboard.top_products')}</h3>
          {data.topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" stroke="var(--text-tertiary)" fontSize={12} />
                <YAxis dataKey="name" type="category" width={100} stroke="var(--text-tertiary)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    color: 'var(--text-primary)'
                  }}
                />
                <Bar dataKey="qty" fill="#6366f1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">{t('dashboard.no_data')}</div>
          )}
        </div>

        <div className="chart-card">
          <h3 className="chart-title">{t('dashboard.token_summary')}</h3>
          {data.tokenData.length > 0 ? (
            <div className="token-summary-grid">
              {data.tokenData.map((tk, i) => (
                <div key={i} className="token-summary-card" style={{ '--tk-color': COLORS[i % COLORS.length] }}>
                  <div className="token-summary-icon">🎟️</div>
                  <div className="token-summary-name">{tk.name}</div>
                  <div className="token-summary-count">{tk.count} {t('dashboard.tokens')}</div>
                  <div className="token-summary-rev">\u20B9{tk.revenue.toLocaleString()}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="chart-empty">{t('dashboard.no_data')}</div>
          )}
        </div>
      </div>

      {showWipeModal && (
        <div className="modal-overlay" onClick={() => setShowWipeModal(false)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ textAlign: 'center', display: 'block' }}>
              <div style={{ fontSize: '40px', color: '#ef4444', marginBottom: '10px' }}><LuTriangleAlert /></div>
              <h2 className="modal-title">{t('dashboard.wipe_confirm_title')}</h2>
              <p className="modal-subtitle">{t('dashboard.wipe_confirm_subtitle')}</p>
            </div>
            <div className="modal-actions" style={{ justifyContent: 'center', marginTop: '20px' }}>
              <button className="btn btn-ghost" onClick={() => setShowWipeModal(false)}>{t('common.cancel')}</button>
              <button className="btn btn-danger" onClick={handleWipeData}>
                <LuTrash2 /> {t('dashboard.wipe_all_records')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
