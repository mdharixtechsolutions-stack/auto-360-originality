import fs from "fs";
import path from "path";

// Standard categories, branches, and lists
const BRANCHES = ["Coimbatore", "Erode", "Salem"];
const BR_IDS = { "Coimbatore": "BR001", "Erode": "BR002", "Salem": "BR003" };

const CAR_BRANDS = ["Maruti Suzuki", "Hyundai", "Tata", "Honda", "Mahindra", "Toyota", "Kia", "Renault"];
const BRAND_MODELS = {
  "Maruti Suzuki": ["Swift", "Baleno", "Brezza", "Ertiga", "Dzire"],
  "Hyundai": ["i20", "Creta", "Verna", "Venue", "Grand i10"],
  "Tata": ["Nexon", "Punch", "Harrier", "Altroz", "Tiago"],
  "Honda": ["City", "Amaze", "Civic", "WR-V"],
  "Mahindra": ["Scorpio", "XUV700", "Thar", "Bolero"],
  "Toyota": ["Innova Crysta", "Fortuner", "Glanza", "Urban Cruiser"],
  "Kia": ["Seltos", "Sonet", "Carens"],
  "Renault": ["Kwid", "Triber", "Kiger"]
};

const FUEL_TYPES = ["Petrol", "Diesel", "CNG", "Electric"];
const OWNER_TYPES = ["1st Owner", "2nd Owner", "3rd Owner"];
const TYRE_STATUSES = ["Brand New", "Good (80%)", "Medium (50%)", "Needs Replacement"];
const RC_TYPES = ["Smart Card", "Original RC", "Duplicate RC"];
const VEHICLE_TYPES = ["Four Wheeler", "Two Wheeler", "Commercial"];

// Generate realistic Indian Names
const FIRST_NAMES = ["Amit", "Rahul", "Priya", "Rajesh", "Meena", "Vijay", "Suresh", "Deepa", "Karthik", "Ravi", "Anjali", "Vikram", "Sanjay", "Neha", "Arun", "Kiran", "Ganesh", "Savitha", "Manoj", "Prabhu", "Harish", "Saritha", "Vinoth", "Keerthi", "Senthil", "Divya", "Balaji", "Shweta", "Ramesh", "Archana", "Nitin", "Pooja", "Dinesh", "Kavitha", "Sridhar", "Sandhya", "Prasad", "Swathi", "Kumar", "Preethi"];
const LAST_NAMES = ["Kumar", "Sharma", "Patel", "Ramakrishnan", "Raja", "Verma", "Sundaram", "Shankar", "Mani", "Krishnan", "Gupta", "Nair", "Reddy", "Choudhury", "Joshi", "Rao", "Shetty", "Deshmukh", "Pillai", "Gounder", "Naidu", "Sen", "Das", "Roy", "Bose", "Mehta", "Singh", "Yadav", "Iyer", "Iyengar"];

const SOURCES = ["Walk In", "Online", "Reference", "Social Media", "Newspaper Add"];
const LEAD_STATUSES = ["New Lead", "Follow Up", "Converted", "Closed"];
const ASSIGNED_STAFF = [
  { id: "S-1", name: "John Super Admin" },
  { id: "S-2", name: "Sarah Branch Admin" },
  { id: "S-3", name: "Mike Manager" },
  { id: "S-4", name: "Ravi Staff-Sales" }
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate realistic dates spread across the last 12 months
function generateDates(count) {
  const dates = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const daysAgo = getRandomInt(1, 365);
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    dates.push(date.toISOString().split("T")[0]);
  }
  return dates.sort();
}

function generatePhone() {
  return "" + getRandomInt(7000000000, 9999999999);
}

function generateAadhaar() {
  return "" + getRandomInt(100000000000, 999999999999);
}

function generatePAN() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let pan = "";
  for (let i = 0; i < 5; i++) pan += letters[getRandomInt(0, 25)];
  pan += getRandomInt(1000, 9999);
  pan += letters[getRandomInt(0, 25)];
  return pan;
}

export function seedDatabase(db, force = false) {
  // If we already have seeded or have plenty of purchases & deals, and not forced, bypass
  if (!force && db.purchases && db.purchases.length >= 100 && db.deals && db.deals.length >= 100) {
    console.log("Database already contains seeded records. Seeding bypassed.");
    return db;
  }

  console.log("Starting full Auto360 realistic database seeding (last 12 months)...");

  // Clean slate for core entities
  db.cities = [
    { id: "c1", name: "Chennai", isDeleted: false, createdBy: "Admin", createdAt: new Date().toISOString() },
    { id: "c2", name: "Coimbatore", isDeleted: false, createdBy: "Admin", createdAt: new Date().toISOString() },
    { id: "c3", name: "Madurai", isDeleted: false, createdBy: "Admin", createdAt: new Date().toISOString() },
    { id: "c4", name: "Trichy", isDeleted: false, createdBy: "Admin", createdAt: new Date().toISOString() }
  ];
  db.areas = [
    { id: "a1", cityId: "c2", name: "Gandhipuram", isDeleted: false, createdBy: "Admin", createdAt: new Date().toISOString() },
    { id: "a2", cityId: "c2", name: "Peelamedu", isDeleted: false, createdBy: "Admin", createdAt: new Date().toISOString() },
    { id: "a3", cityId: "c1", name: "T Nagar", isDeleted: false, createdBy: "Admin", createdAt: new Date().toISOString() },
    { id: "a4", cityId: "c3", name: "KK Nagar", isDeleted: false, createdBy: "Admin", createdAt: new Date().toISOString() }
  ];
  db.sub_areas = [
    { id: "sa1", areaId: "a1", name: "Cross Cut Road", isDeleted: false, createdBy: "Admin", createdAt: new Date().toISOString() },
    { id: "sa2", areaId: "a2", name: "Avinashi Road", isDeleted: false, createdBy: "Admin", createdAt: new Date().toISOString() },
    { id: "sa3", areaId: "a3", name: "G N Chetty Road", isDeleted: false, createdBy: "Admin", createdAt: new Date().toISOString() }
  ];

  db.customers = [];
  db.suppliers = [];
  db.purchases = [];
  db.deals = [];
  db.vouchers = [];
  db.expenses = [];
  db.loans = [];
  db.login_reports = [];
  db.login_audit = [];

  // 1. Generate 100 Customers
  console.log("Generating 100 Customers...");
  const customerDates = generateDates(100);
  for (let i = 1; i <= 100; i++) {
    const firstName = getRandomItem(FIRST_NAMES);
    const lastName = getRandomItem(LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;
    const branch = getRandomItem(BRANCHES);
    const type = getRandomItem(["Buy", "Sell"]);
    
    db.customers.push({
      customer_id: `CUS${String(i).padStart(3, "0")}`,
      customer_type: type,
      customer_name: fullName,
      customer_mobile: generatePhone(),
      source: getRandomItem(SOURCES),
      aadhaar_number: generateAadhaar(),
      pan_number: generatePAN(),
      city_id: "c2",
      area_id: getRandomItem(["a1", "a2"]),
      sub_area_id: getRandomItem(["sa1", "sa2"]),
      address: `${getRandomInt(1, 150)}, Residency Road, ${branch}`,
      customer_photo: "",
      aadhaar_photo: "",
      pan_photo: "",
      customer_status: getRandomItem(LEAD_STATUSES),
      preferred_vehicle: `${getRandomItem(CAR_BRANDS)} ${getRandomItem(BRAND_MODELS[CAR_BRANDS[0]])}`,
      remarks_notes: "Prefers well maintained model.",
      created_at: new Date(customerDates[i - 1]).toISOString(),
      updated_at: new Date(customerDates[i - 1]).toISOString(),
      branch: branch
    });
  }

  // 2. Generate 50 Vehicle Owners (Suppliers)
  console.log("Generating 50 Vehicle Owners / Suppliers...");
  const supplierDates = generateDates(50);
  for (let i = 1; i <= 50; i++) {
    const firstName = getRandomItem(FIRST_NAMES);
    const lastName = getRandomItem(LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;
    const branch = getRandomItem(BRANCHES);

    db.suppliers.push({
      supplier_id: `SUP${String(i).padStart(3, "0")}`,
      supplier_name: fullName,
      supplier_mobile: generatePhone(),
      city_id: "c2",
      area_id: getRandomItem(["a1", "a2"]),
      sub_area_id: getRandomItem(["sa1", "sa2"]),
      address: `${getRandomInt(10, 300)} Main Bazaar Road, ${branch}`,
      created_at: new Date(supplierDates[i - 1]).toISOString(),
      updated_at: new Date(supplierDates[i - 1]).toISOString(),
      branch: branch
    });
  }

  // 3. Generate 150 Vehicles / Purchases
  console.log("Generating 150 Vehicles...");
  const purchaseDates = generateDates(150);
  for (let i = 1; i <= 150; i++) {
    const brand = getRandomItem(CAR_BRANDS);
    const modelsList = BRAND_MODELS[brand];
    const model = getRandomItem(modelsList);
    const branch = getRandomItem(BRANCHES);
    const pDate = purchaseDates[i - 1];

    // Pick a supplier randomly
    const supplier = getRandomItem(db.suppliers);

    // Purchase attributes
    const purchasePrice = getRandomInt(250000, 850000);
    const advancePrice = getRandomItem([purchasePrice, getRandomInt(20000, 100000)]);
    const balancePrice = purchasePrice - advancePrice;
    
    // Expenses
    const fuelExp = getRandomItem([0, 0, 500, 1000, 1500]);
    const repairExp = getRandomItem([0, 0, 2000, 5000, 12000]);
    const serviceExp = getRandomItem([0, 1500, 3000, 6000]);
    const insExp = getRandomItem([0, 0, 4500, 8000]);
    const rtoExp = getRandomItem([0, 0, 1500, 2500]);
    const otherExp = getRandomItem([0, 0, 1000, 3000]);
    const totalRefurbExpenses = fuelExp + repairExp + serviceExp + insExp + rtoExp + otherExp;

    const vehicleType = getRandomItem(VEHICLE_TYPES);
    const regNo = `TN-${getRandomInt(30, 99)}-AB-${String(1000 + i)}`;

    // Set status. Half are available, half sold.
    const status = i <= 75 ? "Sold" : "Available";

    const newPurchase = {
      purchase_id: `PUR${String(i).padStart(3, "0")}`,
      purchase_date: pDate,
      purchase_type: getRandomItem(["Customer", "Supplier"]),
      seller_id: supplier.supplier_id,
      seller_name: supplier.supplier_name,
      seller_mobile: supplier.supplier_mobile,
      seller_city_id: supplier.city_id,
      seller_area_id: supplier.area_id,
      seller_sub_area_id: supplier.sub_area_id,
      seller_address: supplier.address,
      vehicle_type: vehicleType,
      brand_id: brand,
      vehicle_name_id: model,
      reg_no: regNo,
      model_details: getRandomItem(["VXI", "ZXI", "LXI", "Sportz", "Asta", "XZ+"]),
      year: getRandomInt(2017, 2025),
      fuel_type: getRandomItem(FUEL_TYPES),
      tyre_status: getRandomItem(TYRE_STATUSES),
      rc_type: getRandomItem(RC_TYPES),
      owner_details: getRandomItem(OWNER_TYPES),
      engine_number: `ENG${getRandomInt(100000, 999999)}`,
      chassis_number: `CHA${getRandomInt(100000, 999999)}`,
      challan_pending: getRandomItem(["No", "No", "No", "Yes"]),
      noc_available: getRandomItem(["Yes", "Yes", "No"]),
      insurance_active: getRandomItem(["Yes", "Yes", "No"]),
      vehicle_image: "",
      rc_upload: "",
      noc_upload: "",
      insurance_doc: "",
      purchase_price: purchasePrice,
      advance_price: advancePrice,
      balance_amount: balancePrice,
      consultancy_fees: getRandomInt(2000, 8000),
      expected_selling_price: Math.round((purchasePrice + totalRefurbExpenses) * 1.15 / 1000) * 1000,
      payment_mode: getRandomItem(["Cash", "Bank Transfer", "UPI"]),
      status: status,
      created_at: new Date(pDate).toISOString(),
      updated_at: new Date(pDate).toISOString(),
      isDeleted: false,
      // Expenses
      fuel_expense: fuelExp,
      repair_expense: repairExp,
      service_expense: serviceExp,
      insurance_expense: insExp,
      rto_expense: rtoExp,
      other_expense: otherExp,
      // Standard empty sales fields for unsold
      sold_to_customer_id: "",
      sold_date: "",
      selling_price: 0,
      sold_advance_amount: 0,
      sold_consultancy_fees: 0,
      sold_aadhaar_number: "",
      sold_pan_number: "",
      sold_status: "Pending",
      branch: branch
    };

    db.purchases.push(newPurchase);

    // DOUBLE ENTRY posting for purchase:
    // DR Purchase Accounts
    // CR Cash / Bank Accounts (based on mode)
    const pVouchId = `PUR-${String(i).padStart(4, "0")}`;
    db.vouchers.push({
      id: pVouchId,
      date: pDate,
      type: "Payment",
      ledger: "Purchase Accounts",
      amount: purchasePrice,
      mode: newPurchase.payment_mode === "Bank Transfer" ? "Bank" : newPurchase.payment_mode,
      narration: `Vehicle Purchased from ${supplier.supplier_name}. Brand: ${brand} ${model} Reg No: ${regNo} (Voucher Ref: ${pVouchId})`,
      vehicleId: newPurchase.purchase_id,
      vehicleName: `${brand} ${model}`,
      regNo: regNo,
      branch: branch
    });

    // If there is any refurb expense, post separate payment vouchers
    if (totalRefurbExpenses > 0) {
      const expenseVouchId = `EXP-P${String(i).padStart(3, "0")}`;
      db.vouchers.push({
        id: expenseVouchId,
        date: pDate,
        type: "Payment",
        ledger: "Vehicle Maintenance",
        amount: totalRefurbExpenses,
        mode: "Cash",
        narration: `Refurbishment expenses for vehicle ${brand} ${model} (${regNo})`,
        vehicleId: newPurchase.purchase_id,
        vehicleName: `${brand} ${model}`,
        regNo: regNo,
        branch: branch
      });
    }
  }

  // 4. Generate 75 Buying Deals & 75 Selling Deals
  console.log("Generating 75 Buying Deals & 75 Selling Deals...");
  
  // A. Generate 75 Selling Deals (for vehicles that are 'Sold')
  const soldVehicles = db.purchases.filter(v => v.status === "Sold");
  const salesDates = generateDates(75);
  for (let i = 0; i < soldVehicles.length; i++) {
    const veh = soldVehicles[i];
    const customer = db.customers[i % db.customers.length];
    const sDate = salesDates[i];
    const agent = getRandomItem(ASSIGNED_STAFF);

    const totalCost = veh.purchase_price + veh.fuel_expense + veh.repair_expense + veh.service_expense + veh.insurance_expense + veh.rto_expense + veh.other_expense;
    const sellingPrice = Math.round((totalCost * getRandomItem([1.08, 1.12, 1.15])) / 5000) * 5000;
    const advanceAmount = getRandomItem([sellingPrice, Math.round(sellingPrice * 0.2 / 5000) * 5000]);
    const balanceAmount = sellingPrice - advanceAmount;
    const consultancy = getRandomInt(3000, 10000);
    const comm = Math.round(sellingPrice * 0.02);

    const dealId = `S-1${String(i + 1).padStart(3, "0")}`;
    const newDeal = {
      id: dealId,
      customerId: customer.customer_id,
      customerName: customer.customer_name,
      vehicleId: veh.purchase_id,
      vehicleName: `${veh.brand_id} ${veh.vehicle_name_id}`,
      type: "Sell",
      purchasePrice: veh.purchase_price,
      expenses: totalCost - veh.purchase_price,
      sellingPrice: sellingPrice,
      totalPrice: sellingPrice,
      advanceAmount: advanceAmount,
      balanceAmount: balanceAmount,
      consultancyFees: consultancy,
      commission: comm,
      assignedAgentId: agent.id,
      agent: agent.name,
      status: balanceAmount === 0 ? "Completed" : "Pending Balance",
      date: sDate,
      createdBy: "S-1",
      createdAt: new Date(sDate).toISOString(),
      isDeleted: false,
      aadhaarNumber: customer.aadhaar_number,
      panNumber: customer.pan_number,
      uploads: { photo: null, aadhaar: null, pan: null },
      branch: veh.branch
    };

    db.deals.push(newDeal);

    // Update vehicle records with selling details
    veh.sold_to_customer_id = customer.customer_id;
    veh.sold_date = sDate;
    veh.selling_price = sellingPrice;
    veh.sold_advance_amount = advanceAmount;
    veh.sold_consultancy_fees = consultancy;
    veh.sold_aadhaar_number = customer.aadhaar_number;
    veh.sold_pan_number = customer.pan_number;
    veh.sold_status = balanceAmount === 0 ? "Completed" : "Pending";

    // DOUBLE ENTRY accounting for sales transaction:
    // Create sales voucher
    const sVouchId = `SAL-${String(i + 1).padStart(4, "0")}`;
    db.vouchers.push({
      id: sVouchId,
      date: sDate,
      type: "Receipt",
      ledger: "Sales Account",
      amount: sellingPrice,
      mode: getRandomItem(["Cash", "Bank"]),
      narration: `Auto-created sales invoice for ${veh.brand_id} ${veh.vehicle_name_id} (${veh.reg_no}) to ${customer.customer_name} (Deal: ${dealId})`,
      vehicleId: veh.purchase_id,
      vehicleName: `${veh.brand_id} ${veh.vehicle_name_id}`,
      regNo: veh.reg_no,
      branch: veh.branch
    });

    // If there is advance and balance payments, record receipt voucher entries to represent cash/bank inflow
    if (advanceAmount > 0) {
      db.vouchers.push({
        id: `REC-ADV${String(i + 1).padStart(3, "0")}`,
        date: sDate,
        type: "Receipt",
        ledger: `${customer.customer_name} (Customer)`,
        amount: advanceAmount,
        mode: getRandomItem(["Cash", "UPI", "Bank"]),
        narration: `Advance payment received from ${customer.customer_name} for vehicle ${veh.reg_no}`,
        vehicleId: veh.purchase_id,
        vehicleName: `${veh.brand_id} ${veh.vehicle_name_id}`,
        regNo: veh.reg_no,
        branch: veh.branch
      });
    }

    if (balanceAmount > 0) {
      // 70% of balance amounts are cleared in a separate day, 30% remains outstanding
      if (i % 3 !== 0) {
        const balanceDate = new Date(new Date(sDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        db.vouchers.push({
          id: `REC-BAL${String(i + 1).padStart(3, "0")}`,
          date: balanceDate,
          type: "Receipt",
          ledger: `${customer.customer_name} (Customer)`,
          amount: balanceAmount,
          mode: getRandomItem(["Bank", "UPI"]),
          narration: `Balance payment cleared by ${customer.customer_name} for vehicle ${veh.reg_no}`,
          vehicleId: veh.purchase_id,
          vehicleName: `${veh.brand_id} ${veh.vehicle_name_id}`,
          regNo: veh.reg_no,
          branch: veh.branch
        });
        // Coerce status to completed
        newDeal.status = "Completed";
        newDeal.balanceAmount = 0;
        veh.sold_status = "Completed";
      }
    }

    // Commission Income Voucher (2% commission or consultancy fees)
    if (consultancy > 0) {
      db.vouchers.push({
        id: `REC-COM${String(i + 1).padStart(3, "0")}`,
        date: sDate,
        type: "Receipt",
        ledger: "Direct Expenses", // maps to income or consulting direct ledgers
        amount: consultancy,
        mode: "UPI",
        narration: `Consultancy / Brokerage fees received from ${customer.customer_name} for Deal ${dealId}`,
        vehicleId: veh.purchase_id,
        vehicleName: `${veh.brand_id} ${veh.vehicle_name_id}`,
        regNo: veh.reg_no,
        branch: veh.branch
      });
    }
  }

  // B. Generate 75 Buying Deals (type === "Buy")
  // These represent trades or client vehicles we bought. Let's make them correspond to PUR001 to PUR075
  const boughtVehicles = db.purchases.slice(0, 75);
  for (let i = 0; i < boughtVehicles.length; i++) {
    const veh = boughtVehicles[i];
    const supplier = db.suppliers.find(s => s.supplier_id === veh.seller_id) || db.suppliers[0];
    const bDate = veh.purchase_date;
    const agent = getRandomItem(ASSIGNED_STAFF);

    const dealId = `B-2${String(i + 1).padStart(3, "0")}`;
    db.deals.push({
      id: dealId,
      customerId: supplier.supplier_id,
      customerName: supplier.supplier_name,
      vehicleId: veh.purchase_id,
      vehicleName: `${veh.brand_id} ${veh.vehicle_name_id}`,
      type: "Buy",
      purchasePrice: veh.purchase_price,
      expenses: 0,
      sellingPrice: 0,
      totalPrice: veh.purchase_price,
      advanceAmount: veh.advance_price,
      balanceAmount: veh.balance_amount,
      consultancyFees: veh.consultancy_fees,
      commission: 0,
      assignedAgentId: agent.id,
      agent: agent.name,
      status: veh.balance_amount === 0 ? "Completed" : "Pending Balance",
      date: bDate,
      createdBy: "S-1",
      createdAt: new Date(bDate).toISOString(),
      isDeleted: false,
      aadhaarNumber: "",
      panNumber: "",
      uploads: { photo: null, aadhaar: null, pan: null },
      branch: veh.branch
    });
  }

  // 5. Generate 30 Loans (Binding Loans)
  console.log("Generating 30 Loans...");
  const loanDates = generateDates(30);
  const finCompanies = ["HDFC Bank", "ICICI Bank", "SBI Finance", "Cholamandalam Finance", "Sundaram Finance", "TVS Credit"];
  for (let i = 1; i <= 30; i++) {
    const veh = db.purchases[i * 4 % db.purchases.length];
    const customerName = db.customers[i % db.customers.length].customer_name;
    const lDate = loanDates[i - 1];
    const finCompany = finCompanies[i % finCompanies.length];
    const loanAmt = getRandomInt(150000, 500000);
    const takenAmt = Math.round(loanAmt * getRandomItem([0.95, 0.98, 1.0]));

    db.loans.push({
      id: `LN${String(i).padStart(3, "0")}`,
      loanType: "Binding",
      purchaseId: veh.purchase_id,
      vehicleDetails: `${veh.brand_id} ${veh.vehicle_name_id} (${veh.reg_no})`,
      regNo: veh.reg_no,
      customerName: customerName,
      mobileNumber: generatePhone(),
      loanDate: lDate,
      financeName: finCompany,
      bindingAmount: loanAmt,
      takenAmount: takenAmt,
      status: getRandomItem(["Disbursed", "Disbursed", "Pending"]),
      isDeleted: false,
      branch: veh.branch,
      createdBy: "S-1",
      createdAt: new Date(lDate).toISOString()
    });

    // Double entry voucher for loan disbursement:
    // DR Bank Accounts
    // CR Loans (Liability)
    db.vouchers.push({
      id: `V-LN${String(i).padStart(3, "0")}`,
      date: lDate,
      type: "Receipt",
      ledger: "Loans (Liability)",
      amount: takenAmt,
      mode: "Bank",
      narration: `Loan Disbursed by ${finCompany} for Customer ${customerName} (Reg No: ${veh.reg_no})`,
      vehicleId: veh.purchase_id,
      vehicleName: `${veh.brand_id} ${veh.vehicle_name_id}`,
      regNo: veh.reg_no,
      branch: veh.branch
    });
  }

  // 6. Generate 12 Months of General Business Expenses
  console.log("Generating 12 months of general business expenses...");
  const expenseDates = generateDates(40);
  const expCategories = [
    { category: "Salary", ledger: "Salaries Account", desc: "Monthly Staff Salaries", amt: 45000, mode: "Bank" },
    { category: "Rent", ledger: "Office Rent Account", desc: "Monthly Showroom Rental", amt: 22000, mode: "Bank" },
    { category: "Marketing", ledger: "Marketing Expense", desc: "Local Banner and Digital ads", amt: 8500, mode: "Cash" },
    { category: "Fuel", ledger: "Vehicle Maintenance", desc: "General Fuel Allowance", amt: 2500, mode: "Cash" },
    { category: "Other", ledger: "Direct Expenses", desc: "Tea, Snacks, Water bills", amt: 1200, mode: "Cash" }
  ];

  // We loop for each month over the last 12 months
  const now = new Date();
  let expenseCounter = 1;
  for (let m = 0; m < 12; m++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 10);
    const monthStr = monthDate.toISOString().split("T")[0];

    BRANCHES.forEach(branch => {
      expCategories.forEach((catObj, index) => {
        const id = `E-${2000 + expenseCounter}`;
        const newExpense = {
          id: id,
          category: catObj.category,
          amount: catObj.amt + getRandomInt(-2000, 4000), // add small variation
          description: `${catObj.desc} - ${monthDate.toLocaleString('default', { month: 'long' })}`,
          date: monthStr,
          vehicleId: "",
          staff: "Admin",
          branch: branch
        };

        db.expenses.push(newExpense);

        // Voucher entry for business expense
        const expVouchId = `EXP-${String(expenseCounter).padStart(4, "0")}`;
        db.vouchers.push({
          id: expVouchId,
          date: monthStr,
          type: "Payment",
          ledger: catObj.ledger,
          amount: newExpense.amount,
          mode: catObj.mode,
          narration: `${newExpense.description} (Branch: ${branch})`,
          vehicleId: "",
          vehicleName: "General Business",
          regNo: "",
          branch: branch
        });

        expenseCounter++;
      });
    });
  }

  // 7. Seed Login reports to fill the tables
  console.log("Generating 25 Login History reports...");
  const loginDates = generateDates(25);
  for (let i = 1; i <= 25; i++) {
    const staffUser = getRandomItem(ASSIGNED_STAFF);
    const dateStr = loginDates[i - 1];
    db.login_reports.push({
      id: `LOG-${i}`,
      username: staffUser.name.split(" ")[0].toLowerCase(),
      name: staffUser.name,
      role: i % 4 === 0 ? "Super Admin" : "Staff",
      branch: getRandomItem(BRANCHES),
      ipAddress: `192.168.1.${getRandomInt(10, 254)}`,
      action: "Login Success",
      date: `${dateStr} ${getRandomInt(9, 18)}:${getRandomInt(10, 59)}:${getRandomInt(10, 59)}`
    });
  }

  console.log(`Seeding complete. Summary of generated data:`);
  console.log(`- Customers: ${db.customers.length}`);
  console.log(`- Vehicle Owners / Suppliers: ${db.suppliers.length}`);
  console.log(`- Vehicles / Purchases: ${db.purchases.length}`);
  console.log(`- Buying / Selling Deals: ${db.deals.length}`);
  console.log(`- Binding Loans: ${db.loans.length}`);
  console.log(`- Vouchers (Day Book / Ledger Posts): ${db.vouchers.length}`);
  console.log(`- General Expenses: ${db.expenses.length}`);

  return db;
}
