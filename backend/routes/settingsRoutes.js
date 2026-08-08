import express from "express";
import { getGeneral, updateGeneral, getProfile, updateProfile } from "../controllers/settingsController.js";

const router = express.Router();

router.get("/general", getGeneral);
router.post("/general", updateGeneral);
router.get("/profile", getProfile);
router.post("/profile", updateProfile);

export default router;
