import { Router } from "express";
import {
  getTicket,
  updateTicket,
  deleteTicket,
  convertImageToBase64,
} from "../controllers/ticketController";
import { authenticate, requireCompany } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { updateTicketSchema } from "../validators/ticketValidators";

const router = Router();

// Rotas compartilhadas - requerem apenas autenticação (companies ou users)
router.use(authenticate);

// GET: Converte imagem para base64 (resolve CORS) - DEVE VIR ANTES DE /:id
router.get("/image/convert", convertImageToBase64);

// GET: Companies podem ver tickets de seus eventos, Users podem ver seus tickets
router.get("/:id", getTicket);

// PATCH e DELETE: Apenas companies podem atualizar e deletar tickets
router.patch(
  "/:id",
  requireCompany,
  validate(updateTicketSchema),
  updateTicket
);
router.delete("/:id", requireCompany, deleteTicket);

export default router;
