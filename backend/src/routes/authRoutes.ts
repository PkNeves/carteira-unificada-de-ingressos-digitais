import { Router } from "express";
import {
  registerCompanyHandler,
  loginCompanyHandler,
  registerUserHandler,
  loginUserHandler,
  getMeHandler,
} from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import { requireAdminKey } from "../middleware/adminAuth";
import { validate } from "../middleware/validation";
import {
  registerUserSchema,
  loginUserSchema,
  registerCompanySchema,
  loginCompanySchema,
} from "../validators/authValidators";

const router = Router();

// Rotas públicas (usuários)
router.post(
  "/user/register",
  validate(registerUserSchema),
  registerUserHandler
);
router.post("/user/login", validate(loginUserSchema), loginUserHandler);

router.post(
  "/company/login",
  validate(loginCompanySchema),
  loginCompanyHandler
);

router.post(
  "/company/register",
  requireAdminKey,
  validate(registerCompanySchema),
  registerCompanyHandler
);
// Rotas protegidas
router.get("/me", authenticate, getMeHandler);

export default router;
