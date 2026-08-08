export const INDIAN_STATES = [
  { name: "Andhra Pradesh", code: "AP" },
  { name: "Arunachal Pradesh", code: "AR" },
  { name: "Assam", code: "AS" },
  { name: "Bihar", code: "BR" },
  { name: "Chhattisgarh", code: "CG" },
  { name: "Goa", code: "GA" },
  { name: "Gujarat", code: "GJ" },
  { name: "Haryana", code: "HR" },
  { name: "Himachal Pradesh", code: "HP" },
  { name: "Jharkhand", code: "JH" },
  { name: "Karnataka", code: "KA" },
  { name: "Kerala", code: "KL" },
  { name: "Madhya Pradesh", code: "MP" },
  { name: "Maharashtra", code: "MH" },
  { name: "Manipur", code: "MN" },
  { name: "Meghalaya", code: "ML" },
  { name: "Mizoram", code: "MZ" },
  { name: "Nagaland", code: "NL" },
  { name: "Odisha", code: "OD" },
  { name: "Punjab", code: "PB" },
  { name: "Rajasthan", code: "RJ" },
  { name: "Sikkim", code: "SK" },
  { name: "Tamil Nadu", code: "TN" },
  { name: "Telangana", code: "TS" },
  { name: "Tripura", code: "TR" },
  { name: "Uttar Pradesh", code: "UP" },
  { name: "Uttarakhand", code: "UK" },
  { name: "West Bengal", code: "WB" },
  { name: "Delhi", code: "DL" },
  { name: "Puducherry", code: "PY" },
  { name: "Chandigarh", code: "CH" },
  { name: "Jammu and Kashmir", code: "JK" }
];

export function getStateCode(stateInput) {
  if (!stateInput) return "TN";
  const str = String(stateInput).trim();
  if (!str) return "TN";

  const codeMatch = INDIAN_STATES.find(s => s.code.toLowerCase() === str.toLowerCase());
  if (codeMatch) return codeMatch.code;

  const nameMatch = INDIAN_STATES.find(s => 
    s.name.toLowerCase() === str.toLowerCase() || 
    str.toLowerCase().includes(s.name.toLowerCase()) ||
    s.name.toLowerCase().includes(str.toLowerCase())
  );
  if (nameMatch) return nameMatch.code;

  if (str.length === 2) return str.toUpperCase();

  return "TN";
}
