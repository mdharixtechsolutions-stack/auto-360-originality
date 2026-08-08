import { readDb, writeDb } from "../../server/db.js";

export const getGeneralSettings = () => {
  const db = readDb();
  if (!db.general_settings) {
    db.general_settings = {
      appName: db.business_profile?.companyName || "AUTO360 ERP",
      defaultState: db.business_profile?.defaultState || db.business_profile?.state || "Tamil Nadu",
      currency: "INR (₹)",
      timezone: "Asia/Kolkata",
      language: "en"
    };
    writeDb(db);
  }
  return db.general_settings;
};

export const updateGeneralSettings = (data) => {
  const db = readDb();
  const { appName, defaultState, currency, timezone, language } = data;

  if (!db.general_settings) db.general_settings = {};
  if (appName !== undefined) db.general_settings.appName = appName;
  if (defaultState !== undefined) db.general_settings.defaultState = defaultState;
  if (currency !== undefined) db.general_settings.currency = currency;
  if (timezone !== undefined) db.general_settings.timezone = timezone;
  if (language !== undefined) db.general_settings.language = language;

  if (!db.business_profile) db.business_profile = {};
  if (appName) db.business_profile.companyName = appName;
  if (defaultState) {
    db.business_profile.defaultState = defaultState;
    db.business_profile.state = defaultState;
  }

  writeDb(db);
  return db.general_settings;
};
