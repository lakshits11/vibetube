import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
const router = Router();

router.route("/register").post(registerUser);
// in above case, now the url wil look like this: http://localhost:8000/api/v1/user/register

export default router;
