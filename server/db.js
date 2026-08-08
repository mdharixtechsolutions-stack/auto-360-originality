import fs from "fs";
import path from "path";
import { seedDatabase } from "./seeder.js";
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const defaultSchema = {
  business_profile: {
    companyName: "Auto360 ERP",
    companyLogo: "",
    address: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
    mobileNumber: "",
    whatsAppNumber: "",
    email: "",
    website: "",
    gstNumber: "",
    socialMedia: "",
    termsAndConditions: "",
    bankName: "",
    accountNumber: "",
    branchName: "",
    ifscCode: "",
    upiId: "",
    upiQr: ""
  },
  cities: [],
  areas: [],
  sub_areas: [],
  companies: [
    { id: "CO001", name: "Auto360 ERP Client", status: "Active", createdAt: new Date().toISOString() }
  ],
  license_info: {
    status: "Active",
    licenseKey: "A360-X97Y-K28J-9921",
    activatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  },
  suppliers: [],
  customers: [],
  purchases: [],
  loans: [],
  branches: [
    {
      id: "BR001",
      name: "Coimbatore",
      mobile: "9876500001",
      email: "coimbatore@auto360.com",
      address: "123 Avinashi Road, Gandhipuram",
      city: "Coimbatore",
      area: "Gandhipuram",
      subArea: "Cross Cut Road",
      status: "Active",
      isDeleted: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "BR002",
      name: "Erode",
      mobile: "9876500002",
      email: "erode@auto360.com",
      address: "45 Brough Road near Bus Stand",
      city: "Erode",
      area: "Erode Central",
      subArea: "Sathy Road",
      status: "Active",
      isDeleted: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "BR003",
      name: "Salem",
      mobile: "9876500003",
      email: "salem@auto360.com",
      address: "78 Junction Road, Opp Train Station",
      city: "Salem",
      area: "Salem Junction",
      subArea: "Meyyanur",
      status: "Active",
      isDeleted: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  ],
  login_audit: [],
  users: [
    {
      id: "S-1",
      name: "John Super Admin",
      username: "admin",
      email: "john@auto360.com",
      mobile: "9876543210",
      role: "Super Admin",
      branch: "Coimbatore",
      branch_id: "BR001",
      isActive: true,
      loginTimeFrom: "00:00",
      loginTimeTo: "23:59",
      permissions: ["dashboard", "customers", "purchase", "binding", "sales", "expenses", "accounts", "followups", "reports", "users", "settings", "masters"],
      createdBy: "system",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      isDeleted: false,
      password: "admin"
    },
    {
      id: "S-2",
      name: "Sarah Branch Admin",
      username: "branchadmin",
      email: "sarah@auto360.com",
      mobile: "9876543211",
      role: "Branch Admin",
      branch: "Salem",
      branch_id: "BR003",
      isActive: true,
      loginTimeFrom: "00:00",
      loginTimeTo: "23:59",
      permissions: ["dashboard", "customers", "purchase", "binding", "sales", "expenses", "accounts", "followups", "reports", "masters"],
      createdBy: "system",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      isDeleted: false,
      password: "admin"
    },
    {
      id: "S-3",
      name: "Mike Manager",
      username: "manager",
      email: "mike@auto360.com",
      mobile: "9876543212",
      role: "Manager",
      branch: "Erode",
      branch_id: "BR002",
      isActive: true,
      loginTimeFrom: "09:00",
      loginTimeTo: "18:00",
      permissions: ["dashboard", "customers", "purchase", "binding", "sales", "followups", "reports"],
      createdBy: "system",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      isDeleted: false,
      password: "admin"
    },
    {
      id: "S-4",
      name: "Ravi Staff-Sales",
      username: "sales",
      email: "ravi@auto360.com",
      mobile: "9876543213",
      role: "Staff",
      branch: "Coimbatore",
      branch_id: "BR001",
      isActive: true,
      loginTimeFrom: "09:00",
      loginTimeTo: "18:00",
      permissions: ["dashboard", "customers", "followups", "sales"],
      createdBy: "system",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      isDeleted: false,
      password: "admin"
    }
  ],
  user_permissions: [
    // John Super Admin (S-1)
    { id: "p-s1-1", user_id: "S-1", module_name: "dashboard", can_view: true, can_create: true, can_edit: true, can_delete: true },
    { id: "p-s1-2", user_id: "S-1", module_name: "customers", can_view: true, can_create: true, can_edit: true, can_delete: true },
    { id: "p-s1-3", user_id: "S-1", module_name: "followups", can_view: true, can_create: true, can_edit: true, can_delete: true },
    { id: "p-s1-4", user_id: "S-1", module_name: "purchase", can_view: true, can_create: true, can_edit: true, can_delete: true },
    { id: "p-s1-5", user_id: "S-1", module_name: "sales", can_view: true, can_create: true, can_edit: true, can_delete: true },
    { id: "p-s1-6", user_id: "S-1", module_name: "binding", can_view: true, can_create: true, can_edit: true, can_delete: true },
    { id: "p-s1-7", user_id: "S-1", module_name: "accounts", can_view: true, can_create: true, can_edit: true, can_delete: true },
    { id: "p-s1-8", user_id: "S-1", module_name: "reports", can_view: true, can_create: true, can_edit: true, can_delete: true },
    { id: "p-s1-9", user_id: "S-1", module_name: "users", can_view: true, can_create: true, can_edit: true, can_delete: true },
    { id: "p-s1-10", user_id: "S-1", module_name: "settings", can_view: true, can_create: true, can_edit: true, can_delete: true },
    { id: "p-s1-11", user_id: "S-1", module_name: "masters", can_view: true, can_create: true, can_edit: true, can_delete: true },
    { id: "p-s1-12", user_id: "S-1", module_name: "expenses", can_view: true, can_create: true, can_edit: true, can_delete: true },

    // Sarah Branch Admin (S-2)
    { id: "p-s2-1", user_id: "S-2", module_name: "dashboard", can_view: true, can_create: true, can_edit: true, can_delete: true },
    { id: "p-s2-2", user_id: "S-2", module_name: "customers", can_view: true, can_create: true, can_edit: true, can_delete: true },
    { id: "p-s2-3", user_id: "S-2", module_name: "followups", can_view: true, can_create: true, can_edit: true, can_delete: true },
    { id: "p-s2-4", user_id: "S-2", module_name: "purchase", can_view: true, can_create: true, can_edit: true, can_delete: true },
    { id: "p-s2-5", user_id: "S-2", module_name: "sales", can_view: true, can_create: true, can_edit: true, can_delete: true },
    { id: "p-s2-6", user_id: "S-2", module_name: "binding", can_view: true, can_create: true, can_edit: true, can_delete: true },
    { id: "p-s2-7", user_id: "S-2", module_name: "accounts", can_view: true, can_create: true, can_edit: true, can_delete: true },
    { id: "p-s2-8", user_id: "S-2", module_name: "reports", can_view: true, can_create: true, can_edit: true, can_delete: true },
    { id: "p-s2-9", user_id: "S-2", module_name: "users", can_view: false, can_create: false, can_edit: false, can_delete: false },
    { id: "p-s2-10", user_id: "S-2", module_name: "settings", can_view: false, can_create: false, can_edit: false, can_delete: false },
    { id: "p-s2-11", user_id: "S-2", module_name: "masters", can_view: true, can_create: true, can_edit: true, can_delete: true },
    { id: "p-s2-12", user_id: "S-2", module_name: "expenses", can_view: true, can_create: true, can_edit: true, can_delete: true },

    // Mike Manager (S-3)
    { id: "p-s3-1", user_id: "S-3", module_name: "dashboard", can_view: true, can_create: false, can_edit: false, can_delete: false },
    { id: "p-s3-2", user_id: "S-3", module_name: "customers", can_view: true, can_create: true, can_edit: true, can_delete: false },
    { id: "p-s3-3", user_id: "S-3", module_name: "followups", can_view: true, can_create: true, can_edit: true, can_delete: false },
    { id: "p-s3-4", user_id: "S-3", module_name: "purchase", can_view: true, can_create: true, can_edit: false, can_delete: false },
    { id: "p-s3-5", user_id: "S-3", module_name: "sales", can_view: true, can_create: true, can_edit: true, can_delete: false },
    { id: "p-s3-6", user_id: "S-3", module_name: "binding", can_view: true, can_create: true, can_edit: false, can_delete: false },
    { id: "p-s3-7", user_id: "S-3", module_name: "accounts", can_view: false, can_create: false, can_edit: false, can_delete: false },
    { id: "p-s3-8", user_id: "S-3", module_name: "reports", can_view: true, can_create: false, can_edit: false, can_delete: false },
    { id: "p-s3-9", user_id: "S-3", module_name: "users", can_view: false, can_create: false, can_edit: false, can_delete: false },
    { id: "p-s3-10", user_id: "S-3", module_name: "settings", can_view: false, can_create: false, can_edit: false, can_delete: false },
    { id: "p-s3-11", user_id: "S-3", module_name: "masters", can_view: false, can_create: false, can_edit: false, can_delete: false },
    { id: "p-s3-12", user_id: "S-3", module_name: "expenses", can_view: true, can_create: true, can_edit: false, can_delete: false },

    // Ravi Staff-Sales (S-4)
    { id: "p-s4-1", user_id: "S-4", module_name: "dashboard", can_view: true, can_create: false, can_edit: false, can_delete: false },
    { id: "p-s4-2", user_id: "S-4", module_name: "customers", can_view: true, can_create: true, can_edit: false, can_delete: false },
    { id: "p-s4-3", user_id: "S-4", module_name: "followups", can_view: true, can_create: true, can_edit: false, can_delete: false },
    { id: "p-s4-4", user_id: "S-4", module_name: "purchase", can_view: false, can_create: false, can_edit: false, can_delete: false },
    { id: "p-s4-5", user_id: "S-4", module_name: "sales", can_view: true, can_create: false, can_edit: false, can_delete: false },
    { id: "p-s4-6", user_id: "S-4", module_name: "binding", can_view: false, can_create: false, can_edit: false, can_delete: false },
    { id: "p-s4-7", user_id: "S-4", module_name: "accounts", can_view: false, can_create: false, can_edit: false, can_delete: false },
    { id: "p-s4-8", user_id: "S-4", module_name: "reports", can_view: false, can_create: false, can_edit: false, can_delete: false },
    { id: "p-s4-9", user_id: "S-4", module_name: "users", can_view: false, can_create: false, can_edit: false, can_delete: false },
    { id: "p-s4-10", user_id: "S-4", module_name: "settings", can_view: false, can_create: false, can_edit: false, can_delete: false },
    { id: "p-s4-11", user_id: "S-4", module_name: "masters", can_view: false, can_create: false, can_edit: false, can_delete: false },
    { id: "p-s4-12", user_id: "S-4", module_name: "expenses", can_view: false, can_create: false, can_edit: false, can_delete: false }
  ]
};
function initDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultSchema, null, 2), "utf-8");
  } else {
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      let modified = false;

      // Wipe demo/sample locations if present
      if (!data.cities || data.cities.some(c => ["c1", "c2", "c3", "c4"].includes(c.id))) {
        data.cities = [];
        modified = true;
      }
      if (!data.areas || data.areas.some(a => ["a1", "a2", "a3", "a4", "a5"].includes(a.id))) {
        data.areas = [];
        modified = true;
      }
      if (!data.sub_areas || data.sub_areas.some(sa => ["sa1", "sa2", "sa3", "sa4"].includes(sa.id))) {
        data.sub_areas = [];
        modified = true;
      }

      if (!data.companies) {
        data.companies = defaultSchema.companies;
        modified = true;
      }
      if (!data.license_info) {
        data.license_info = defaultSchema.license_info;
        modified = true;
      }

      if (!data.suppliers) {
        data.suppliers = defaultSchema.suppliers;
        modified = true;
      }
      if (!data.customers) {
        data.customers = defaultSchema.customers;
        modified = true;
      }
      if (!data.business_profile) {
        data.business_profile = { ...defaultSchema.business_profile };
        modified = true;
      }
      if (!data.purchases) {
        data.purchases = [];
        modified = true;
      }
      if (!data.expenses) {
        data.expenses = [];
        modified = true;
      }
      if (!data.deals) {
        data.deals = [];
        modified = true;
      }
      if (!data.ledgers) {
        data.ledgers = [];
        modified = true;
      }
      if (!data.vouchers) {
        data.vouchers = [];
        modified = true;
      }
      if (!data.loans) {
        data.loans = [];
        modified = true;
      }
      if (!data.login_reports) {
        data.login_reports = [];
        modified = true;
      }
      if (!data.login_audit) {
        data.login_audit = [];
        modified = true;
      }
      if (!data.branches) {
        data.branches = defaultSchema.branches;
        modified = true;
      }
      if (!data.users) {
        data.users = defaultSchema.users;
        modified = true;
      }
      if (!data.user_permissions) {
        data.user_permissions = defaultSchema.user_permissions;
        modified = true;
      }

      if (!data.is_seeded) {
        data.purchases = [];
        data.deals = [];
        data.loans = [];
        data.vouchers = [];
        data.expenses = [];
        data.login_reports = [];
        data.login_audit = [];
        data.customers = [];
        data.suppliers = [];
        data.is_seeded = true;
        data.ledgers = [
          { id: "L1", name: "Capital Account", group: "Capital Account", balance: 0, type: "Credit" },
          { id: "L2", name: "Purchase Accounts", group: "Direct Expenses", balance: 0, type: "Debit" },
          { id: "L3", name: "Sales Account", group: "Sales Accounts", balance: 0, type: "Credit" },
          { id: "L4", name: "Vehicle Maintenance", group: "Indirect Expenses", balance: 0, type: "Debit" },
          { id: "L5", name: "Direct Expenses", group: "Direct Expenses", balance: 0, type: "Debit" },
          { id: "L6", name: "Indirect Expenses", group: "Indirect Expenses", balance: 0, type: "Debit" },
          { id: "L7", name: "Salaries Account", group: "Indirect Expenses", balance: 0, type: "Debit" },
          { id: "L8", name: "Office Rent Account", group: "Indirect Expenses", balance: 0, type: "Debit" },
          { id: "L9", name: "Marketing Expense", group: "Indirect Expenses", balance: 0, type: "Debit" },
          { id: "L10", name: "Cash in Hand", group: "Cash-in-hand", balance: 0, type: "Debit" },
          { id: "L11", name: "Bank Accounts", group: "Bank Accounts", balance: 0, type: "Debit" },
          { id: "L12", name: "Sundry Debtors", group: "Current Assets", balance: 0, type: "Debit" },
          { id: "L13", name: "Sundry Creditors", group: "Current Liabilities", balance: 0, type: "Credit" },
          { id: "L14", name: "Loans (Liability)", group: "Loans (Liability)", balance: 0, type: "Credit" }
        ];
        modified = true;
      }

      // Live database migration / cleanup for standardized branch names without " Branch" suffix
      const sanitizeBranchName = (val) => {
        if (typeof val !== "string") return val;
        let clean = val.replace(/\s*branch\s*$/i, "").trim();
        if (clean.toLowerCase() === "coimbatore") return "Coimbatore";
        if (clean.toLowerCase() === "erode") return "Erode";
        if (clean.toLowerCase() === "salem") return "Salem";
        return clean;
      };

      if (data.branches && data.branches.length > 0) {
        const uniqueBranches = {};
        data.branches.forEach((b) => {
          if (!b.name || b.isDeleted) return;
          const cleanName = sanitizeBranchName(b.name);
          // Keep only first occurrence of the standardized name, or merge
          if (!uniqueBranches[cleanName] || b.id < uniqueBranches[cleanName].id) {
            uniqueBranches[cleanName] = { ...b, name: cleanName };
          }
        });
        
        // Let's ensure default branches Coimbatore, Erode, Salem are in branches
        const defaultBranchKeys = ["Coimbatore", "Erode", "Salem"];
        defaultBranchKeys.forEach(name => {
          if (!uniqueBranches[name]) {
            const defB = defaultSchema.branches.find(b => b.name === name);
            if (defB) {
              uniqueBranches[name] = defB;
            }
          }
        });

        const cleanedBranches = Object.values(uniqueBranches);
        if (JSON.stringify(data.branches) !== JSON.stringify(cleanedBranches)) {
          data.branches = cleanedBranches;
          modified = true;
        }
      }

      // Standardize branch strings in all other tables
      const collectionsToCheck = [
        "users", "deals", "purchases", "expenses", "loans", "vouchers", "login_reports", "login_audit"
      ];
      collectionsToCheck.forEach(colKey => {
        if (data[colKey] && Array.isArray(data[colKey])) {
          data[colKey].forEach(item => {
            if (item.branch) {
              const cleaned = sanitizeBranchName(item.branch);
              if (item.branch !== cleaned) {
                item.branch = cleaned;
                modified = true;
              }
            }
          });
        }
      });

      // Standardize Purchase records and loan statuses across entire database
      if (data.purchases && Array.isArray(data.purchases)) {
        data.purchases.forEach((p) => {
          const sp = Number(p.expected_selling_price || p.sales_price || p.selling_price || p.offerPrice || p.offer_price || p.purchase_price) || 0;
          if (p.expected_selling_price !== sp || p.selling_price !== sp || p.offerPrice !== sp || p.sales_price !== sp) {
            p.expected_selling_price = sp;
            p.selling_price = sp;
            p.offerPrice = sp;
            p.sales_price = sp;
            modified = true;
          }
          const purPrice = Number(p.purchase_price || p.purchasePrice) || 0;
          const advPrice = Number(
            p.advance_price !== undefined && p.advance_price !== null && p.advance_price !== ""
              ? p.advance_price
              : (p.advancePaid !== undefined && p.advancePaid !== null && p.advancePaid !== ""
                  ? p.advancePaid
                  : (p.advance_amount !== undefined && p.advance_amount !== null && p.advance_amount !== ""
                      ? p.advance_amount
                      : (p.advanceAmount !== undefined && p.advanceAmount !== null && p.advanceAmount !== ""
                          ? p.advanceAmount
                          : 0)))
          ) || 0;
          const bal = Math.max(0, purPrice - advPrice);
          if (p.advance_price !== advPrice || p.advancePaid !== advPrice || p.advance_amount !== advPrice || p.advanceAmount !== advPrice || p.paidAmount !== advPrice) {
            p.advance_price = advPrice;
            p.advancePaid = advPrice;
            p.advance_amount = advPrice;
            p.advanceAmount = advPrice;
            p.paidAmount = advPrice;
            modified = true;
          }
          if (p.balance_amount !== bal || p.balanceAmount !== bal) {
            p.balance_amount = bal;
            p.balanceAmount = bal;
            modified = true;
          }
        });
      }

      // Sync auto-created purchase vouchers to match advance price
      if (data.vouchers && Array.isArray(data.vouchers)) {
        data.vouchers.forEach((v) => {
          if (v.narration && v.narration.toLowerCase().includes("auto-created purchase")) {
            const matchP = (data.purchases || []).find((p) => p.purchase_id === v.vehicleId || p.id === v.vehicleId);
            if (matchP) {
              const adv = Number(matchP.advance_price !== undefined ? matchP.advance_price : matchP.advancePaid) || 0;
              if (v.amount !== adv) {
                v.amount = adv;
                modified = true;
              }
            }
          }
        });
      }

      if (modified) {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
      }
    } catch (e) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultSchema, null, 2), "utf-8");
    }
  }
}
initDb();
let dbCache = null;
export function readDb() {
  if (dbCache) {
    return dbCache;
  }
  try {
    if (fs.existsSync(DB_FILE)) {
      dbCache = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    } else {
      dbCache = JSON.parse(JSON.stringify(defaultSchema));
    }
  } catch (e) {
    dbCache = JSON.parse(JSON.stringify(defaultSchema));
  }
  return dbCache;
}
export function writeDb(data) {
  dbCache = data;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write db.json synchronously:", err);
  }
}
export function getNextSupplierId() {
  const db = readDb();
  let maxNum = 0;
  db.suppliers.forEach((s) => {
    const match = s.supplier_id.match(/^SUP(\d+)$/i);
    if (match) {
      const num = parseInt(match[1]);
      if (num > maxNum) maxNum = num;
    }
  });
  return `SUP${(maxNum + 1).toString().padStart(3, "0")}`;
}
export function getNextCustomerId() {
  const db = readDb();
  let maxNum = 0;
  db.customers.forEach((c) => {
    const match = c.customer_id.match(/^CUS(\d+)$/i);
    if (match) {
      const num = parseInt(match[1]);
      if (num > maxNum) maxNum = num;
    }
  });
  return `CUS${(maxNum + 1).toString().padStart(3, "0")}`;
}
export function getNextPurchaseId() {
  const db = readDb();
  let maxNum = 0;
  if (db.purchases) {
    db.purchases.forEach((p) => {
      const match = p.purchase_id.match(/^PUR(\d+)$/i);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNum) maxNum = num;
      }
    });
  }
  return `PUR${(maxNum + 1).toString().padStart(3, "0")}`;
}
export function getNextLoanId() {
  const db = readDb();
  let maxNum = 0;
  if (db.loans) {
    db.loans.forEach((l) => {
      const match = l.id.match(/^LN(\d+)$/i);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNum) maxNum = num;
      }
    });
  }
  return `LN${(maxNum + 1).toString().padStart(3, "0")}`;
}
export function getNextBranchId() {
  const db = readDb();
  let maxNum = 0;
  if (db.branches) {
    db.branches.forEach((b) => {
      const match = b.id.match(/^BR(\d+)$/i);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNum) maxNum = num;
      }
    });
  }
  return `BR${(maxNum + 1).toString().padStart(3, "0")}`;
}

export function getNextDealId() {
  const db = readDb();
  let maxNum = 1000;
  if (db.deals) {
    db.deals.forEach((d) => {
      const match = d.id.match(/^S-(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNum) maxNum = num;
      }
    });
  }
  return `S-${maxNum + 1}`;
}

export function getNextVoucherId() {
  const db = readDb();
  let maxNum = 100;
  if (db.vouchers) {
    db.vouchers.forEach((v) => {
      const match = v.id.match(/^V(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNum) maxNum = num;
      }
    });
  }
  return `V${maxNum + 1}`;
}

