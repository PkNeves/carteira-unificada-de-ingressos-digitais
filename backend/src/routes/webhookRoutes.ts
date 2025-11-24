import { Router } from "express";
import { receiveConfirmation } from "../controllers/webhookController";

const router = Router();

// Rota de webhook não requer autenticação (é chamada externamente)
router.post("/confirmation", receiveConfirmation);

export default router;

