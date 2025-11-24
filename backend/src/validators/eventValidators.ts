import { z } from "zod";

/**
 * Schema para criação de evento
 */
export const createEventSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  startDate: z
    .string()
    .min(1, "Data de início é obrigatória")
    .refine(
      (date) => !isNaN(Date.parse(date)),
      "Data de início deve ser uma data válida (formato ISO 8601)"
    ),
  endDate: z
    .string()
    .optional()
    .nullable()
    .refine(
      (date) => !date || !isNaN(Date.parse(date)),
      "Data de fim deve ser uma data válida (formato ISO 8601)"
    ),
  bannerUrl: z
    .union([
      z.string().url("bannerUrl deve ser uma URL válida"),
      z.literal(""),
      z.null(),
    ])
    .optional()
    .transform((val) => (val === "" ? null : val)),
  postbackUrl: z
    .union([
      z.string().url("postbackUrl deve ser uma URL válida"),
      z.literal(""),
      z.null(),
    ])
    .optional()
    .transform((val) => (val === "" ? null : val)),
  externalId: z.string().min(1, "External ID é obrigatório"),
  active: z.boolean().optional().default(true),
});

/**
 * Schema para atualização de evento (todos os campos opcionais)
 */
export const updateEventSchema = z.object({
  name: z.string().min(1, "Nome não pode ser vazio").optional(),
  description: z.string().optional().nullable(),
  startDate: z
    .string()
    .refine(
      (date) => !isNaN(Date.parse(date)),
      "Data de início deve ser uma data válida (formato ISO 8601)"
    )
    .optional(),
  endDate: z
    .string()
    .optional()
    .nullable()
    .refine(
      (date) => !date || !isNaN(Date.parse(date)),
      "Data de fim deve ser uma data válida (formato ISO 8601)"
    ),
  bannerUrl: z
    .union([
      z.string().url("bannerUrl deve ser uma URL válida"),
      z.literal(""),
      z.null(),
    ])
    .optional()
    .transform((val) => (val === "" ? null : val)),
  postbackUrl: z
    .union([
      z.string().url("postbackUrl deve ser uma URL válida"),
      z.literal(""),
      z.null(),
    ])
    .optional()
    .transform((val) => (val === "" ? null : val)),
  active: z.boolean().optional(),
});
