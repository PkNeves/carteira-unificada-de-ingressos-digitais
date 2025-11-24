import { z } from "zod";

/**
 * Schema para validação de query parameters
 */
export const eventIdQuerySchema = z.object({
  eventId: z.string().uuid("eventId deve ser um UUID válido"),
});

