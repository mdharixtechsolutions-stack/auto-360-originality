import jwt from "jsonwebtoken";

export const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET || "auto360_secret_key_jwt_2026";
  return jwt.sign(payload, secret, { expiresIn: "30d" });
};
