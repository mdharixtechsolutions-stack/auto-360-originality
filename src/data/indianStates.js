export const INDIAN_STATES = [
  { name: "Andhra Pradesh", code: "AP", label: "Andhra Pradesh (AP)" },
  { name: "Arunachal Pradesh", code: "AR", label: "Arunachal Pradesh (AR)" },
  { name: "Assam", code: "AS", label: "Assam (AS)" },
  { name: "Bihar", code: "BR", label: "Bihar (BR)" },
  { name: "Chhattisgarh", code: "CG", label: "Chhattisgarh (CG)" },
  { name: "Goa", code: "GA", label: "Goa (GA)" },
  { name: "Gujarat", code: "GJ", label: "Gujarat (GJ)" },
  { name: "Haryana", code: "HR", label: "Haryana (HR)" },
  { name: "Himachal Pradesh", code: "HP", label: "Himachal Pradesh (HP)" },
  { name: "Jharkhand", code: "JH", label: "Jharkhand (JH)" },
  { name: "Karnataka", code: "KA", label: "Karnataka (KA)" },
  { name: "Kerala", code: "KL", label: "Kerala (KL)" },
  { name: "Madhya Pradesh", code: "MP", label: "Madhya Pradesh (MP)" },
  { name: "Maharashtra", code: "MH", label: "Maharashtra (MH)" },
  { name: "Manipur", code: "MN", label: "Manipur (MN)" },
  { name: "Meghalaya", code: "ML", label: "Meghalaya (ML)" },
  { name: "Mizoram", code: "MZ", label: "Mizoram (MZ)" },
  { name: "Nagaland", code: "NL", label: "Nagaland (NL)" },
  { name: "Odisha", code: "OD", label: "Odisha (OD)" },
  { name: "Punjab", code: "PB", label: "Punjab (PB)" },
  { name: "Rajasthan", code: "RJ", label: "Rajasthan (RJ)" },
  { name: "Sikkim", code: "SK", label: "Sikkim (SK)" },
  { name: "Tamil Nadu", code: "TN", label: "Tamil Nadu (TN)" },
  { name: "Telangana", code: "TS", label: "Telangana (TS)" },
  { name: "Tripura", code: "TR", label: "Tripura (TR)" },
  { name: "Uttar Pradesh", code: "UP", label: "Uttar Pradesh (UP)" },
  { name: "Uttarakhand", code: "UK", label: "Uttarakhand (UK)" },
  { name: "West Bengal", code: "WB", label: "West Bengal (WB)" },
  { name: "Delhi", code: "DL", label: "Delhi (DL)" },
  { name: "Puducherry", code: "PY", label: "Puducherry (PY)" },
  { name: "Chandigarh", code: "CH", label: "Chandigarh (CH)" },
  { name: "Jammu and Kashmir", code: "JK", label: "Jammu and Kashmir (JK)" }
];

export function getStateCode(stateInput) {
  if (!stateInput) return "TN";
  const str = String(stateInput).trim();
  // Check if string contains code in parens like "Tamil Nadu (TN)" or "(TN)"
  const parenMatch = str.match(/\(([A-Z]{2})\)/i);
  if (parenMatch) return parenMatch[1].toUpperCase();

  // Match directly by code
  const codeMatch = INDIAN_STATES.find(s => s.code.toLowerCase() === str.toLowerCase());
  if (codeMatch) return codeMatch.code;

  // Match by name
  const nameMatch = INDIAN_STATES.find(s => 
    s.name.toLowerCase() === str.toLowerCase() || 
    str.toLowerCase().includes(s.name.toLowerCase()) ||
    s.name.toLowerCase().includes(str.toLowerCase())
  );
  if (nameMatch) return nameMatch.code;

  // Fallback to 2 chars uppercase if length 2
  if (str.length === 2) return str.toUpperCase();

  return "TN";
}
