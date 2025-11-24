import { Router } from "express";
import {
  createEvent,
  listEvents,
  getEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController";
import { authenticate, requireCompany } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { createEventSchema, updateEventSchema } from "../validators/eventValidators";

const router = Router();

// Todas as rotas requerem autenticação de company
router.use(authenticate);
router.use(requireCompany);

router.post("/", validate(createEventSchema), createEvent);
router.get("/", listEvents);
router.get("/:id", getEvent);
router.patch("/:id", validate(updateEventSchema), updateEvent);
router.delete("/:id", deleteEvent);

export default router;
