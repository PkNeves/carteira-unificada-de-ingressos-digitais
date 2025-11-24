import { z } from "zod";

/**
 * Schema para um ticket individual
 */
const ticketItemSchema = z.object({
  email: z.string().email("Email deve ser um endereço de email válido"),
  name: z.string().min(1, "Nome do ticket é obrigatório"),
  description: z.string().optional(),
  rarity: z
    .enum(["common", "rare", "epic", "legendary"], {
      errorMap: () => ({
        message: "Raridade deve ser: common, rare, epic ou legendary",
      }),
    })
    .optional()
    .default("common"),
  bannerUrl: z.string().url("bannerUrl deve ser uma URL válida").nullable(),
  amount: z
    .number()
    .int()
    .positive("Quantidade deve ser um número positivo")
    .optional()
    .default(1),
  seat: z.string().optional().nullable(),
  sector: z.string().optional().nullable(),
  startDate: z
    .string()
    .min(1, "startDate é obrigatório")
    .refine(
      (date) => !isNaN(Date.parse(date)),
      "startDate deve ser uma data válida (formato ISO 8601)"
    ),
});

/**
 * Schema para criação de tickets
 */
export const createTicketsSchema = z.object({
  eventId: z.string().uuid("eventId deve ser um UUID válido"),
  tickets: z
    .array(ticketItemSchema)
    .min(1, "É necessário fornecer pelo menos um ticket"),
});

/**
 * Schema para atualização de ticket
 */
export const updateTicketSchema = z.object({
  name: z.string().min(1, "Nome não pode ser vazio").optional(),
  description: z.string().optional().nullable(),
  rarity: z
    .enum(["common", "rare", "epic", "legendary"], {
      errorMap: () => ({
        message: "Raridade deve ser: common, rare, epic ou legendary",
      }),
    })
    .optional(),
  bannerUrl: z
    .union([
      z.string().url("bannerUrl deve ser uma URL válida"),
      z.literal(""),
      z.null(),
    ])
    .optional()
    .transform((val) => (val === "" ? null : val)),
  amount: z
    .number()
    .int()
    .positive("Quantidade deve ser um número positivo")
    .optional(),
  seat: z.string().optional().nullable(),
  sector: z.string().optional().nullable(),
  startDate: z
    .string()
    .optional()
    .nullable()
    .refine(
      (date) => !date || !isNaN(Date.parse(date)),
      "startDate deve ser uma data válida (formato ISO 8601)"
    ),
  status: z
    .enum(["valid", "canceled", "minted"], {
      errorMap: () => ({
        message: "Status deve ser: valid, canceled ou minted",
      }),
    })
    .optional(),
});
