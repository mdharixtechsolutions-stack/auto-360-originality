import fs from "fs";
import path from "path";

// Standard categories, branches, and lists
const BRANCHES = ["Tiruppur", "Coimbatore"];
const BR_IDS = { "Tiruppur": "BR001", "Coimbatore": "BR002" };

const CAR_BRANDS = ["Maruti Suzuki", "Hyundai", "Tata", "Honda", "Mahindra", "Toyota", "Kia", "Renault", "TVS"];
const BRAND_MODELS = {
  "Maruti Suzuki": ["Swift", "Baleno", "Brezza", "Ertiga", "Dzire"],
  "Hyundai": ["i20", "Creta", "Verna", "Venue", "Grand i10"],
  "Tata": ["Nexon", "Punch", "Harrier", "Altroz", "Tiago"],
  "Honda": ["Activa", "City", "Amaze", "Civic", "WR-V"],
  "Mahindra": ["Scorpio", "XUV700", "Thar", "Bolero"],
  "Toyota": ["Innova Crysta", "Fortuner", "Glanza", "Urban Cruiser"],
  "Kia": ["Seltos", "Sonet", "Carens"],
  "Renault": ["Kwid", "Triber", "Kiger"],
  "TVS": ["Jupiter", "Apache RTR", "iQube", "XL100"]
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

  db.branches = [
    {
      id: "BR001",
      name: "Tiruppur",
      mobile: "9876500001",
      email: "tiruppur@auto360.com",
      address: "Tiruppur Main Road",
      city: "Tiruppur",
      area: "Tiruppur Centre",
      subArea: "Main Road",
      status: "Active",
      isDeleted: false,
      createdAt: new Date().toISOString()
    },
    {
      id: "BR002",
      name: "Coimbatore",
      mobile: "9876500002",
      email: "coimbatore@auto360.com",
      address: "Gandhipuram, Coimbatore",
      city: "Coimbatore",
      area: "Gandhipuram",
      subArea: "Cross Cut Road",
      status: "Active",
      isDeleted: false,
      createdAt: new Date().toISOString()
    }
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

  // Deterministic core customers for test flows
  const deterministicCustomers = [
    {
      customer_id: "CUS001",
      customer_type: "Sell",
      customer_name: "Vignesh Kumar",
      customer_mobile: "9876543210",
      source: "Walk In",
      aadhaar_number: "987612345678",
      pan_number: "ABCDE1234F",
      city_id: "c2",
      area_id: "a1",
      sub_area_id: "sa1",
      address: "123 Main St, Coimbatore",
      customer_photo: "",
      aadhaar_photo: "",
      pan_photo: "",
      customer_status: "New Lead",
      preferred_vehicle: "Honda Activa",
      remarks_notes: "Looking for used scooter or car",
      created_at: "2026-10-15T09:00:00.000Z",
      updated_at: "2026-10-15T09:00:00.000Z",
      branch: "Coimbatore"
    },
    {
      customer_id: "CUS002",
      customer_type: "Buy",
      customer_name: "Ramesh S",
      customer_mobile: "9876543211",
      source: "Walk In",
      aadhaar_number: "876512345678",
      pan_number: "BCDEF2345G",
      city_id: "c2",
      area_id: "a2",
      sub_area_id: "sa2",
      address: "45 Cross Cut Rd, Coimbatore",
      customer_photo: "",
      aadhaar_photo: "",
      pan_photo: "",
      customer_status: "Follow Up",
      preferred_vehicle: "Maruti Suzuki Swift",
      remarks_notes: "Requested quotation",
      created_at: "2026-10-18T10:00:00.000Z",
      updated_at: "2026-10-18T10:00:00.000Z",
      branch: "Coimbatore"
    },
    {
      customer_id: "CUS003",
      customer_type: "Buy",
      customer_name: "Priya Sharma",
      customer_mobile: "9876543212",
      source: "Online",
      aadhaar_number: "765412345678",
      pan_number: "CDEFG3456H",
      city_id: "c1",
      area_id: "a3",
      sub_area_id: "sa3",
      address: "12 Bazaar St, Tiruppur",
      customer_photo: "",
      aadhaar_photo: "",
      pan_photo: "",
      customer_status: "New Lead",
      preferred_vehicle: "Hyundai i20",
      remarks_notes: "Test drive scheduled",
      created_at: "2026-10-19T11:00:00.000Z",
      updated_at: "2026-10-19T11:00:00.000Z",
      branch: "Tiruppur"
    },
    {
      customer_id: "CUS004",
      customer_type: "Buy",
      customer_name: "Suresh Raina",
      customer_mobile: "9876543210",
      source: "Reference",
      aadhaar_number: "654312345678",
      pan_number: "DEFGH4567J",
      city_id: "c2",
      area_id: "a1",
      sub_area_id: "sa1",
      address: "78 Gandhipuram, Coimbatore",
      customer_photo: "",
      aadhaar_photo: "",
      pan_photo: "",
      customer_status: "Converted",
      preferred_vehicle: "Maruti Suzuki Swift",
      remarks_notes: "Bought Swift in Coimbatore",
      created_at: "2026-10-20T10:00:00.000Z",
      updated_at: "2026-10-20T10:00:00.000Z",
      branch: "Coimbatore"
    },
    {
      customer_id: "CUS005",
      customer_type: "Buy",
      customer_name: "Amit Kumar",
      customer_mobile: "9876543211",
      source: "Walk In",
      aadhaar_number: "543212345678",
      pan_number: "EFGHI5678K",
      city_id: "c2",
      area_id: "a2",
      sub_area_id: "sa2",
      address: "10 Avinashi Rd, Coimbatore",
      customer_photo: "",
      aadhaar_photo: "",
      pan_photo: "",
      customer_status: "New Lead",
      preferred_vehicle: "Toyota Innova Crysta",
      remarks_notes: "Interested in premium 7-seater",
      created_at: "2026-10-25T10:00:00.000Z",
      updated_at: "2026-10-25T10:00:00.000Z",
      branch: "Coimbatore"
    }
  ];
  db.customers.push(...deterministicCustomers);

  // 1. Generate remaining Customers to make 100
  console.log("Generating remaining Customers...");
  const customerDates = generateDates(95);
  for (let i = 6; i <= 100; i++) {
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
      created_at: new Date(customerDates[i - 6]).toISOString(),
      updated_at: new Date(customerDates[i - 6]).toISOString(),
      branch: branch
    });
  }

  // 2. Generate 50 Vehicle Owners (Suppliers)
  console.log("Generating 50 Vehicle Owners / Suppliers...");
  // Deterministic supplier for test flows
  db.suppliers.push({
    supplier_id: "SUP001",
    supplier_name: "Sakthi show room",
    supplier_mobile: "1234567890",
    city_id: "c2",
    area_id: "a1",
    sub_area_id: "sa1",
    address: "Bazaar Road, Coimbatore",
    created_at: "2026-08-08T11:01:12.853Z",
    updated_at: "2026-08-08T11:01:12.853Z",
    branch: "Coimbatore"
  });

  const supplierDates = generateDates(49);
  for (let i = 2; i <= 50; i++) {
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
      created_at: new Date(supplierDates[i - 2]).toISOString(),
      updated_at: new Date(supplierDates[i - 2]).toISOString(),
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

    // Determine vehicle type and prices
    let vehicleType = getRandomItem(VEHICLE_TYPES);
    if (brand === "TVS" || model === "Activa" || model === "Jupiter" || model === "Apache RTR" || model === "iQube" || model === "XL100") {
      vehicleType = "Two Wheeler";
    }

    let purchasePrice = getRandomInt(250000, 850000);
    if (vehicleType === "Two Wheeler") {
      purchasePrice = getRandomInt(28000, 48000);
    }
    const advancePrice = getRandomItem([purchasePrice, Math.round(purchasePrice * 0.5)]);
    const balancePrice = purchasePrice - advancePrice;
    
    // Expenses
    const fuelExp = getRandomItem([0, 0, 500, 1000]);
    const repairExp = getRandomItem([0, 0, 1500, 4000]);
    const serviceExp = getRandomItem([0, 1000, 2500]);
    const insExp = getRandomItem([0, 0, 2000, 4000]);
    const rtoExp = getRandomItem([0, 0, 1000, 1500]);
    const otherExp = getRandomItem([0, 0, 500, 1500]);
    const totalRefurbExpenses = fuelExp + repairExp + serviceExp + insExp + rtoExp + otherExp;

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
      rc_available: getRandomItem(["Yes", "Yes", "Yes", "No"]),
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

  // Deterministic vehicles for test suite flows
  const deterministicPurchases = [
    {
      purchase_id: "PUR-HA01",
      purchase_date: "2026-10-15",
      purchase_type: "Customer",
      seller_id: "CUS001",
      seller_name: "Vignesh Kumar",
      seller_mobile: "9876543210",
      seller_city_id: "c2",
      seller_area_id: "a1",
      seller_sub_area_id: "sa1",
      seller_address: "123 Main St, Coimbatore",
      vehicle_type: "Two Wheeler",
      brand_id: "Honda",
      vehicle_name_id: "Activa",
      reg_no: "TN-38-HA-1234",
      model_details: "6G Deluxe",
      year: 2022,
      fuel_type: "Petrol",
      tyre_status: "Good (80%)",
      rc_type: "Original RC",
      owner_details: "1st Owner",
      engine_number: "ENG892110",
      chassis_number: "CHA892110",
      rc_available: "Yes",
      challan_pending: "No",
      noc_available: "Yes",
      insurance_active: "Yes",
      vehicle_image: "",
      rc_upload: "",
      noc_upload: "",
      insurance_doc: "",
      purchase_price: 35000,
      advance_price: 35000,
      balance_amount: 0,
      consultancy_fees: 2000,
      expected_selling_price: 45000,
      payment_mode: "Cash",
      status: "Available",
      created_at: "2026-10-15T10:00:00.000Z",
      updated_at: "2026-10-15T10:00:00.000Z",
      isDeleted: false,
      fuel_expense: 500,
      repair_expense: 0,
      service_expense: 1000,
      insurance_expense: 0,
      rto_expense: 0,
      other_expense: 0,
      sold_to_customer_id: "",
      sold_date: "",
      selling_price: 0,
      sold_advance_amount: 0,
      sold_consultancy_fees: 0,
      sold_aadhaar_number: "",
      sold_pan_number: "",
      sold_status: "Pending",
      branch: "Coimbatore"
    },
    {
      purchase_id: "PUR-TJ01",
      purchase_date: "2026-10-16",
      purchase_type: "Supplier",
      seller_id: "SUP001",
      seller_name: "Sakthi show room",
      seller_mobile: "1234567890",
      seller_city_id: "c2",
      seller_area_id: "a1",
      seller_sub_area_id: "sa1",
      seller_address: "Bazaar Road, Coimbatore",
      vehicle_type: "Two Wheeler",
      brand_id: "TVS",
      vehicle_name_id: "Jupiter",
      reg_no: "TN-38-TJ-5678",
      model_details: "ZX SmartXonnect",
      year: 2023,
      fuel_type: "Petrol",
      tyre_status: "Brand New",
      rc_type: "Original RC",
      owner_details: "1st Owner",
      engine_number: "ENG892111",
      chassis_number: "CHA892111",
      rc_available: "Yes",
      challan_pending: "No",
      noc_available: "Yes",
      insurance_active: "Yes",
      vehicle_image: "",
      rc_upload: "",
      noc_upload: "",
      insurance_doc: "",
      purchase_price: 32000,
      advance_price: 32000,
      balance_amount: 0,
      consultancy_fees: 2000,
      expected_selling_price: 42000,
      payment_mode: "UPI",
      status: "Available",
      created_at: "2026-10-16T10:00:00.000Z",
      updated_at: "2026-10-16T10:00:00.000Z",
      isDeleted: false,
      fuel_expense: 500,
      repair_expense: 0,
      service_expense: 500,
      insurance_expense: 0,
      rto_expense: 0,
      other_expense: 0,
      sold_to_customer_id: "",
      sold_date: "",
      selling_price: 0,
      sold_advance_amount: 0,
      sold_consultancy_fees: 0,
      sold_aadhaar_number: "",
      sold_pan_number: "",
      sold_status: "Pending",
      branch: "Coimbatore"
    },
    {
      purchase_id: "PUR-MS01",
      purchase_date: "2026-10-18",
      purchase_type: "Customer",
      seller_id: "CUS001",
      seller_name: "Vignesh Kumar",
      seller_mobile: "9876543210",
      seller_city_id: "c2",
      seller_area_id: "a1",
      seller_sub_area_id: "sa1",
      seller_address: "123 Main St, Coimbatore",
      vehicle_type: "Four Wheeler",
      brand_id: "Maruti Suzuki",
      vehicle_name_id: "Swift",
      reg_no: "TN-38-MS-9012",
      model_details: "VXI",
      year: 2021,
      fuel_type: "Petrol",
      tyre_status: "Good (80%)",
      rc_type: "Original RC",
      owner_details: "1st Owner",
      engine_number: "ENG892112",
      chassis_number: "CHA892112",
      rc_available: "Yes",
      challan_pending: "No",
      noc_available: "Yes",
      insurance_active: "Yes",
      vehicle_image: "",
      rc_upload: "",
      noc_upload: "",
      insurance_doc: "",
      purchase_price: 380000,
      advance_price: 380000,
      balance_amount: 0,
      consultancy_fees: 5000,
      expected_selling_price: 430000,
      payment_mode: "Bank Transfer",
      status: "Available",
      created_at: "2026-10-18T10:00:00.000Z",
      updated_at: "2026-10-18T10:00:00.000Z",
      isDeleted: false,
      fuel_expense: 1000,
      repair_expense: 2000,
      service_expense: 3000,
      insurance_expense: 4000,
      rto_expense: 0,
      other_expense: 0,
      sold_to_customer_id: "",
      sold_date: "",
      selling_price: 0,
      sold_advance_amount: 0,
      sold_consultancy_fees: 0,
      sold_aadhaar_number: "",
      sold_pan_number: "",
      sold_status: "Pending",
      branch: "Coimbatore"
    },
    {
      purchase_id: "PUR-TI01",
      purchase_date: "2026-10-20",
      purchase_type: "Supplier",
      seller_id: "SUP001",
      seller_name: "Sakthi show room",
      seller_mobile: "1234567890",
      seller_city_id: "c2",
      seller_area_id: "a1",
      seller_sub_area_id: "sa1",
      seller_address: "Bazaar Road, Coimbatore",
      vehicle_type: "Four Wheeler",
      brand_id: "Toyota",
      vehicle_name_id: "Innova Crysta",
      reg_no: "TN-38-TI-3456",
      model_details: "2.4 GX 7 STR",
      year: 2022,
      fuel_type: "Diesel",
      tyre_status: "Good (80%)",
      rc_type: "Original RC",
      owner_details: "1st Owner",
      engine_number: "ENG892113",
      chassis_number: "CHA892113",
      rc_available: "Yes",
      challan_pending: "No",
      noc_available: "Yes",
      insurance_active: "Yes",
      vehicle_image: "",
      rc_upload: "",
      noc_upload: "",
      insurance_doc: "",
      purchase_price: 850000,
      advance_price: 850000,
      balance_amount: 0,
      consultancy_fees: 8000,
      expected_selling_price: 950000,
      payment_mode: "Bank Transfer",
      status: "Available",
      created_at: "2026-10-20T10:00:00.000Z",
      updated_at: "2026-10-20T10:00:00.000Z",
      isDeleted: false,
      fuel_expense: 1500,
      repair_expense: 3000,
      service_expense: 5000,
      insurance_expense: 6000,
      rto_expense: 0,
      other_expense: 0,
      sold_to_customer_id: "",
      sold_date: "",
      selling_price: 0,
      sold_advance_amount: 0,
      sold_consultancy_fees: 0,
      sold_aadhaar_number: "",
      sold_pan_number: "",
      sold_status: "Pending",
      branch: "Coimbatore"
    },
    {
      purchase_id: "PUR-SUP01",
      purchase_date: "2026-10-21",
      purchase_type: "Supplier",
      seller_id: "SUP001",
      seller_name: "Sakthi show room",
      seller_mobile: "1234567890",
      seller_city_id: "c2",
      seller_area_id: "a1",
      seller_sub_area_id: "sa1",
      seller_address: "Bazaar Road, Coimbatore",
      vehicle_type: "Four Wheeler",
      brand_id: "Hyundai",
      vehicle_name_id: "Creta",
      reg_no: "TN-38-CR-7788",
      model_details: "SX 1.5 Petrol",
      year: 2022,
      fuel_type: "Petrol",
      tyre_status: "Good (80%)",
      rc_type: "Original RC",
      owner_details: "1st Owner",
      engine_number: "ENG892114",
      chassis_number: "CHA892114",
      rc_available: "Yes",
      challan_pending: "No",
      noc_available: "Yes",
      insurance_active: "Yes",
      vehicle_image: "",
      rc_upload: "",
      noc_upload: "",
      insurance_doc: "",
      purchase_price: 200000,
      advance_price: 150000,
      balance_amount: 50000,
      consultancy_fees: 5000,
      expected_selling_price: 240000,
      payment_mode: "Bank Transfer",
      status: "Available",
      created_at: "2026-10-21T10:00:00.000Z",
      updated_at: "2026-10-21T10:00:00.000Z",
      isDeleted: false,
      fuel_expense: 0,
      repair_expense: 0,
      service_expense: 0,
      insurance_expense: 0,
      rto_expense: 0,
      other_expense: 0,
      sold_to_customer_id: "",
      sold_date: "",
      selling_price: 0,
      sold_advance_amount: 0,
      sold_consultancy_fees: 0,
      sold_aadhaar_number: "",
      sold_pan_number: "",
      sold_status: "Pending",
      branch: "Coimbatore"
    },
    {
      purchase_id: "PUR-CUS01",
      purchase_date: "2026-10-22",
      purchase_type: "Customer",
      seller_id: "CUS001",
      seller_name: "Vignesh Kumar",
      seller_mobile: "9876543210",
      seller_city_id: "c2",
      seller_area_id: "a1",
      seller_sub_area_id: "sa1",
      seller_address: "123 Main St, Coimbatore",
      vehicle_type: "Four Wheeler",
      brand_id: "Tata",
      vehicle_name_id: "Nexon",
      reg_no: "TN-38-NX-9900",
      model_details: "XZ+",
      year: 2021,
      fuel_type: "Diesel",
      tyre_status: "Good (80%)",
      rc_type: "Original RC",
      owner_details: "1st Owner",
      engine_number: "ENG892115",
      chassis_number: "CHA892115",
      rc_available: "Yes",
      challan_pending: "No",
      noc_available: "Yes",
      insurance_active: "Yes",
      vehicle_image: "",
      rc_upload: "",
      noc_upload: "",
      insurance_doc: "",
      purchase_price: 180000,
      advance_price: 140000,
      balance_amount: 40000,
      consultancy_fees: 4000,
      expected_selling_price: 215000,
      payment_mode: "Cash",
      status: "Available",
      created_at: "2026-10-22T10:00:00.000Z",
      updated_at: "2026-10-22T10:00:00.000Z",
      isDeleted: false,
      fuel_expense: 0,
      repair_expense: 0,
      service_expense: 0,
      insurance_expense: 0,
      rto_expense: 0,
      other_expense: 0,
      sold_to_customer_id: "",
      sold_date: "",
      selling_price: 0,
      sold_advance_amount: 0,
      sold_consultancy_fees: 0,
      sold_aadhaar_number: "",
      sold_pan_number: "",
      sold_status: "Pending",
      branch: "Coimbatore"
    }
  ];

  db.purchases.push(...deterministicPurchases);

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
    const consultancy = getRandomInt(3000, 10000);
    const totalPrice = sellingPrice + consultancy;
    const balanceAmount = totalPrice - advanceAmount;
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
      totalPrice: totalPrice,
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

  // Deterministic deals for test suite flows
  db.deals.push(
    {
      id: "S-1001",
      customerId: "CUS005",
      customerName: "Amit Kumar",
      vehicleId: "PUR-TI01",
      vehicleName: "Toyota Innova Crysta",
      type: "Sell",
      purchasePrice: 850000,
      expenses: 15500,
      sellingPrice: 950000,
      totalPrice: 958000,
      advanceAmount: 883000,
      balanceAmount: 75000,
      pendingBalance: 75000,
      consultancyFees: 8000,
      commission: 19000,
      assignedAgentId: "S-1",
      agent: "John Super Admin",
      status: "Pending",
      date: "2026-10-22",
      createdBy: "S-1",
      createdAt: "2026-10-22T10:00:00.000Z",
      isDeleted: false,
      aadhaarNumber: "543212345678",
      panNumber: "EFGHI5678K",
      uploads: { photo: null, aadhaar: null, pan: null },
      branch: "Coimbatore"
    },
    {
      id: "S-1002",
      customerId: "CUS004",
      customerName: "Suresh Raina",
      vehicleId: "PUR-MS01",
      vehicleName: "Maruti Suzuki Swift",
      type: "Sell",
      purchasePrice: 380000,
      expenses: 10000,
      sellingPrice: 430000,
      totalPrice: 435000,
      advanceAmount: 435000,
      balanceAmount: 0,
      pendingBalance: 0,
      consultancyFees: 5000,
      commission: 8600,
      assignedAgentId: "S-1",
      agent: "John Super Admin",
      status: "Completed",
      date: "2026-10-24",
      createdBy: "S-1",
      createdAt: "2026-10-24T10:00:00.000Z",
      isDeleted: false,
      aadhaarNumber: "654312345678",
      panNumber: "DEFGH4567J",
      uploads: { photo: null, aadhaar: null, pan: null },
      branch: "Coimbatore"
    }
  );

  // Deterministic loan for test suite flows
  db.loans.push({
    id: "LN001",
    loanType: "Binding",
    purchaseId: "PUR-TI01",
    vehicleDetails: "Toyota Innova Crysta (TN-38-TI-3456)",
    regNo: "TN-38-TI-3456",
    customerName: "Amit Kumar",
    borrower_name: "Amit Kumar",
    mobileNumber: "9876543211",
    loanDate: "2026-10-22",
    financeName: "HDFC Bank",
    loan_amount: 150000,
    bindingAmount: 150000,
    takenAmount: 140000,
    status: "Active",
    isDeleted: false,
    branch: "Coimbatore",
    createdBy: "S-1",
    createdAt: "2026-10-22T10:00:00.000Z"
  });

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
