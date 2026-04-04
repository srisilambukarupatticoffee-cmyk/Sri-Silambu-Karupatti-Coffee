import { useState, useMemo } from 'react';
import { db } from '../utils/db';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { LuTrendingUp, LuTrendingDown, LuDollarSign, LuShoppingCart, LuTicket, LuWallet } from 'react-icons/lu';
import './Pages.css';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function Dashboard() {
  const [period, setPeriod] = useState('today');

  const data = useMemo(() => {
    const sales = db.getAll('sales');
    const expenses = db.getAll('expenses');
    const tokens = db.getAll('tokens');
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const monthStr = now.toISOString().slice(0, 7);

    const todaySales = sales.filter(s => s.date?.startsWith(todayStr));
    const monthSales = sales.filter(s => s.date?.startsWith(monthStr));
    const todayExpenses = expenses.filter(e => e.date?.startsWith(todayStr));
    const monthExpenses = expenses.filter(e => e.date?.startsWith(monthStr));
    const todayTokens = tokens.filter(t => t.date?.startsWith(todayStr));
    const monthTokens = tokens.filter(t => t.date?.startsWith(monthStr));

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

    // Category-wise sales
    const categorySales = {};
    const currentSales = period === 'today' ? todaySales : monthSales;
    currentSales.forEach(s => {
      (s.items || []).forEach(item => {
        const cat = item.category || 'Other';
        categorySales[cat] = (categorySales[cat] || 0) + (item.sellingPrice * item.qty);
      });
    });
    const categoryData = Object.entries(categorySales).map(([name, value]) => ({ name, value }));

    // Daily sales for the current month (for line chart)
    const dailySales = {};
    monthSales.forEach(s => {
      const day = s.date?.split('T')[0]?.split('-')[2];
      if (day) dailySales[day] = (dailySales[day] || 0) + (s.total || 0);
    });
    const dailyData = Object.entries(dailySales)
      .map(([day, total]) => ({ day: `Day ${parseInt(day)}`, total }))
      .sort((a, b) => parseInt(a.day.split(' ')[1]) - parseInt(b.day.split(' ')[1]));

    // Top products
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

    // Token summary by category
    const currentTokens = period === 'today' ? todayTokens : monthTokens;
    const tokenByCategory = {};
    currentTokens.forEach(t => {
      const cat = t.category || 'Other';
      if (!tokenByCategory[cat]) tokenByCategory[cat] = { count: 0, revenue: 0 };
      tokenByCategory[cat].count += (t.qty || 1);
      tokenByCategory[cat].revenue += (t.total || 0);
    });
    const tokenData = Object.entries(tokenByCategory).map(([name, d]) => ({
      name, count: d.count, revenue: d.revenue
    }));

    return {
      todayRevenue, monthRevenue,
      todayExpenseTotal, monthExpenseTotal,
      todayProfit, monthProfit,
      todayTokenRevenue, monthTokenRevenue,
      todayTokenCount: todayTokens.reduce((s, t) => s + (t.qty || 1), 0),
      monthTokenCount: monthTokens.reduce((s, t) => s + (t.qty || 1), 0),
      todaySalesCount: todaySales.length,
      monthSalesCount: monthSales.length,
      categoryData, dailyData, topProducts, tokenData
    };
  }, [period]);

  const kpis = [
    {
      label: period === 'today' ? "Today's Sales" : 'Monthly Sales',
      value: `₹${(period === 'today' ? data.todayRevenue : data.monthRevenue).toLocaleString()}`,
      sub: `${period === 'today' ? data.todaySalesCount : data.monthSalesCount} orders`,
      icon: <LuShoppingCart />,
      color: '#6366f1',
    },
    {
      label: period === 'today' ? "Today's Expenses" : 'Monthly Expenses',
      value: `₹${(period === 'today' ? data.todayExpenseTotal : data.monthExpenseTotal).toLocaleString()}`,
      icon: <LuWallet />,
      color: '#ef4444',
    },
    {
      label: period === 'today' ? "Today's Profit" : 'Monthly Profit',
      value: `₹${(period === 'today' ? data.todayProfit : data.monthProfit).toLocaleString()}`,
      icon: (period === 'today' ? data.todayProfit : data.monthProfit) >= 0 ? <LuTrendingUp /> : <LuTrendingDown />,
      color: (period === 'today' ? data.todayProfit : data.monthProfit) >= 0 ? '#10b981' : '#ef4444',
    },
    {
      label: 'Token Revenue',
      value: `₹${(period === 'today' ? data.todayTokenRevenue : data.monthTokenRevenue).toLocaleString()}`,
      sub: `${period === 'today' ? data.todayTokenCount : data.monthTokenCount} tokens`,
      icon: <LuTicket />,
      color: '#f59e0b',
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Financial overview & analytics</p>
        </div>
        <div className="period-toggle">
          <button className={period === 'today' ? 'active' : ''} onClick={() => setPeriod('today')}>Today</button>
          <button className={period === 'month' ? 'active' : ''} onClick={() => setPeriod('month')}>This Month</button>
        </div>
      </div>

      {/* KPI Cards */}
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

      {/* Charts Row */}
      <div className="charts-grid">
        {/* Daily Sales Trend */}
        <div className="chart-card span-2">
          <h3 className="chart-title">Monthly Sales Trend</h3>
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
            <div className="chart-empty">No sales data available</div>
          )}
        </div>

        {/* Category Pie */}
        <div className="chart-card">
          <h3 className="chart-title">Sales by Category</h3>
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
                  formatter={(value) => `₹${value.toLocaleString()}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">No category data available</div>
          )}
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="charts-grid">
        {/* Top Products */}
        <div className="chart-card">
          <h3 className="chart-title">Top Products</h3>
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
            <div className="chart-empty">No product data available</div>
          )}
        </div>

        {/* Token Summary */}
        <div className="chart-card">
          <h3 className="chart-title">Token Summary</h3>
          {data.tokenData.length > 0 ? (
            <div className="token-summary-grid">
              {data.tokenData.map((t, i) => (
                <div key={i} className="token-summary-card" style={{ '--tk-color': COLORS[i % COLORS.length] }}>
                  <div className="token-summary-icon">🎟️</div>
                  <div className="token-summary-name">{t.name}</div>
                  <div className="token-summary-count">{t.count} tokens</div>
                  <div className="token-summary-rev">₹{t.revenue.toLocaleString()}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="chart-empty">No token data available</div>
          )}
        </div>
      </div>
    </div>
  );
}
