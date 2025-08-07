import express from "express";
import authRoute from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import postRoutes from "./postRoutes.js";

const router = express.Router();

router.use(`/auth`, authRoute);
router.use(`/users`,userRoutes );
router.use(`/posts`,postRoutes );

export default router;
