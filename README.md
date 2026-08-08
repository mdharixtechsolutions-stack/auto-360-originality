# AUTO360 ERP - Full Stack Production Architecture

AUTO360 ERP is a high-performance Automobile Dealership & Fleet Management Enterprise Resource Planning system built with React.js, Node.js, Express.js, and MongoDB.

---

## 📁 Repository Directory Structure

```
auto360/
├── frontend/                  # React.js SPA (Vite + Tailwind CSS)
│   ├── src/                   # React Components & Views
│   ├── public/                # Static Branding Assets
│   ├── package.json           # Frontend Dependencies
│   └── vite.config.js         # Vite Configuration
│
├── backend/                   # Node.js + Express.js REST API
│   ├── server.js              # Express Application Entry Point
│   ├── package.json           # Backend Dependencies
│   ├── .env                   # Environment Variables
│   ├── config/                # Database Configuration
│   │   └── database.js        # Mongoose MongoDB Connection
│   ├── routes/                # Express REST API Endpoints
│   │   ├── authRoutes.js      # Authentication & Login Routes
│   │   └── settingsRoutes.js  # General & Business Profile Settings
│   ├── controllers/           # API Request Controllers
│   │   ├── authController.js
│   │   └── settingsController.js
│   ├── models/                # Mongoose Database Models
│   │   ├── User.js            # Staff & Role Schema
│   │   ├── Branch.js          # Multi-branch Schema
│   │   ├── Customer.js        # Customer Master Schema
│   │   ├── Supplier.js        # Supplier Master Schema
│   │   ├── Purchase.js        # Vehicle Purchase Inventory Schema
│   │   ├── Sale.js            # Vehicle Sales Schema
│   │   ├── Expense.js         # Expense Entries Schema
│   │   ├── Payment.js         # Payment Voucher Schema
│   │   ├── Receipt.js         # Money Receipts Schema
│   │   ├── Master.js          # Vehicle / City / Area Masters
│   │   ├── Settings.js        # System Configuration Schema
│   │   └── Ledger.js          # Financial Ledgers Schema
│   ├── middleware/            # Custom Express Middlewares
│   │   ├── authMiddleware.js  # JWT Token Validator
│   │   ├── roleMiddleware.js  # RBAC Module Authorization
│   │   ├── uploadMiddleware.js# Multer Document Storage
│   │   └── errorHandler.js    # Global Exception Handler
│   ├── services/              # Business Logic Services
│   │   ├── authService.js
│   │   └── settingsService.js
│   ├── utils/                 # Helper Functions & Constants
│   │   ├── generateToken.js   # JWT Token Generation
│   │   ├── logger.js          # File & Console Logger
│   │   └── stateCodes.js      # Indian State Code Mappings
│   ├── uploads/               # Vehicle Photos & Invoice Uploads
│   └── logs/                  # Application Logs
│
└── README.md                  # System Documentation & VPS Deployment Guide
```

---

## 🛠️ Technology Stack

- **Frontend**: React.js (v19), Vite, Tailwind CSS v4, Lucide React Icons, Motion Animation, ReCharts, Axios
- **Backend**: Node.js, Express.js (v4), Multer, BcryptJS, JSONWebToken (JWT), CORS
- **Database**: MongoDB & Mongoose ORM

---

## 🚀 Environment Variables (`backend/.env`)

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/auto360
JWT_SECRET=auto360_secret_key_jwt_2026
ADMIN_SECRET_CODE=HarixTechAdmin2026
NODE_ENV=production
```

---

## 🔑 Authentication & RBAC

1. **Authentication**: JWT Bearer Tokens issued on `/api/auth/login`.
2. **Role-Based Access Control**:
   - **Super Admin**: Full unrestricted access across all branches.
   - **Branch Manager / Staff**: Filtered access according to branch assignment and module-level granular permissions (`can_view`, `can_create`, `can_edit`, `can_delete`).

---

## 🖥️ VPS Server Deployment Guide (Ubuntu / Linux)

### 1. Install Node.js, PM2, and MongoDB
```bash
# Install Node.js v20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs mongodb

# Install PM2 Process Manager globally
sudo npm install -g pm2
```

### 2. Clone and Setup Dependencies
```bash
git clone https://github.com/your-org/auto360.git
cd auto360

# Install dependencies
npm install
cd backend && npm install && cd ..
```

### 3. Build & Run Production Application
```bash
# Build Vite React bundle
npm run build

# Start using PM2 Process Manager
pm2 start server.js --name "auto360-erp"
pm2 save
pm2 startup
```

### 4. Nginx Reverse Proxy Configuration (`/etc/nginx/sites-available/default`)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🛡️ License & Support
AUTO360 ERP System © 2026. Production Ready for Client Deployment.
