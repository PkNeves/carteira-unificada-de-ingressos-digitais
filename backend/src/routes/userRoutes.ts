import { Router } from "express";
import {
  getWalletAddress,
  verifyTicket,
} from "../controllers/ticketController";
import { authenticate, requireUser } from "../middleware/auth";

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Rotas específicas de usuário - requireUser aplicado apenas nas rotas específicas
// Nota: getTicket foi movido para sharedTicketRoutes para permitir acesso de companies também
router.get("/tickets/:id/verify", requireUser, verifyTicket);
router.get("/wallet/address", requireUser, getWalletAddress);

export default router;
