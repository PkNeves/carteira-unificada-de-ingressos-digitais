import { Router } from "express";
import {
  registerCompanyHandler,
  loginCompanyHandler,
  registerUserHandler,
  loginUserHandler,
  getMeHandler,
} from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validation";
import {
  registerUserSchema,
  loginUserSchema,
  registerCompanySchema,
  loginCompanySchema,
} from "../validators/authValidators";

const router = Router();

// Rotas públicas
router.post(
  "/company/register",
  validate(registerCompanySchema),
  registerCompanyHandler
);
router.post(
  "/company/login",
  validate(loginCompanySchema),
  loginCompanyHandler
);
router.post(
  "/user/register",
  validate(registerUserSchema),
  registerUserHandler
);
router.post("/user/login", validate(loginUserSchema), loginUserHandler);

// Rotas protegidas
router.get("/me", authenticate, getMeHandler);

export default router;
