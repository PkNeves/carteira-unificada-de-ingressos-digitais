import { Router } from "express";
import {
  createTickets,
  listEventTickets,
} from "../controllers/ticketController";
import { authenticate, requireCompany } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { createTicketsSchema } from "../validators/ticketValidators";

const router = Router();

// Todas as rotas requerem autenticação (mas não necessariamente company)
router.use(authenticate);

// GET /api/tickets - Lista tickets
// Companies: ?eventId=xxx obrigatório (lista todos tickets do evento)
// Users: ?eventId=xxx opcional (lista tickets do usuário, opcionalmente filtrados por evento)
router.get("/", listEventTickets);

// POST /api/tickets - Criar tickets (apenas companies)
router.post("/", requireCompany, validate(createTicketsSchema), createTickets);

export default router;
