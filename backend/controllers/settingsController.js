import { getGeneralSettings, updateGeneralSettings } from "../services/settingsService.js";
import { readDb, writeDb } from "../../server/db.js";

export const getGeneral = (req, res) => {
  const settings = getGeneralSettings();
  res.json(settings);
};

export const updateGeneral = (req, res) => {
  const updated = updateGeneralSettings(req.body);
  res.json({ success: true, general_settings: updated });
};

export const getProfile = (req, res) => {
  const db = readDb();
  if (!db.business_profile) {
    db.business_profile = {
      companyName: "AUTO360 ERP",
      companyLogo: "",
      address: "",
      city: "",
      state: "Tamil Nadu",
      defaultState: "Tamil Nadu",
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
    };
    writeDb(db);
  }
  res.json(db.business_profile);
};

export const updateProfile = (req, res) => {
  const db = readDb();
  const {
    companyName,
    companyLogo,
    address,
    city,
    state,
    defaultState,
    country,
    pincode,
    mobileNumber,
    whatsAppNumber,
    email,
    website,
    gstNumber,
    socialMedia,
    termsAndConditions,
    bankName,
    accountNumber,
    branchName,
    ifscCode,
    upiId,
    upiQr
  } = req.body;

  const activeDefaultState = defaultState || state || db.business_profile?.defaultState || "Tamil Nadu";

  db.business_profile = {
    companyName: companyName || "",
    companyLogo: companyLogo || "",
    address: address || "",
    city: city || "",
    state: state || activeDefaultState,
    defaultState: activeDefaultState,
    country: country || "",
    pincode: pincode || "",
    mobileNumber: mobileNumber || "",
    whatsAppNumber: whatsAppNumber || "",
    email: email || "",
    website: website || "",
    gstNumber: gstNumber || "",
    socialMedia: socialMedia || "",
    termsAndConditions: termsAndConditions || "",
    bankName: bankName || "",
    accountNumber: accountNumber || "",
    branchName: branchName || "",
    ifscCode: ifscCode || "",
    upiId: upiId || "",
    upiQr: upiQr || ""
  };

  if (!db.general_settings) db.general_settings = {};
  db.general_settings.defaultState = activeDefaultState;
  if (companyName) db.general_settings.appName = companyName;

  writeDb(db);
  res.json({ success: true, business_profile: db.business_profile, general_settings: db.general_settings });
};
