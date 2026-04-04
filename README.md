# Token POS - Restaurant Billing System

A modern, fast, and responsive Point of Sale (POS) system for restaurants.

## ✨ Features
- **Dashboard**: Real-time sales analytics and summary.
- **Billing**: High-performance billing interface with category filtering.
- **Inventory**: Manage products, stock, and pricing.
- **Token System**: Quick token generation for specific categories (Tea, Coffee, etc.).
- **Expense Tracking**: Manage daily shop expenses.
- **Settings**: Shop branding and GST configuration.

## 🚀 Deployment to Vercel

This project is prepared for a one-click deployment to Vercel.

### 1. Simple Deployment (Recommended)
1. Push this code to a **GitHub/GitLab/Bitbucket** repository.
2. Go to [Vercel](https://vercel.com/new).
3. Import your repository.
4. Vercel will automatically detect the **Vite** framework.
5. Click **Deploy**.

### 2. Deployment Configuration
The project includes a `vercel.json` file which ensures:
- **SPA Routing**: All URLs (like `/dashboard`, `/inventory`) are correctly handled by the React app.
- **Build Output**: The `dist` folder is automatically served.

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 📝 Tech Stack
- React 19
- Vite 8
- Tailwind CSS (via index.css)
- React Router Dom (Routing)
- Recharts (Analytics)
- LocalStorage (Data Persistence)
