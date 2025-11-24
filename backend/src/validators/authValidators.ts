import { z } from "zod";

/**
 * Schema para registro de usuário
 */
export const registerUserSchema = z.object({
  email: z.string().email("Email deve ser um endereço de email válido"),
  password: z
    .string()
    .min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

/**
 * Schema para login de usuário
 */
export const loginUserSchema = z.object({
  email: z.string().email("Email deve ser um endereço de email válido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

/**
 * Schema para registro de company
 */
export const registerCompanySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email deve ser um endereço de email válido"),
  password: z
    .string()
    .min(6, "Senha deve ter no mínimo 6 caracteres"),
});

/**
 * Schema para login de company
 */
export const loginCompanySchema = z.object({
  email: z.string().email("Email deve ser um endereço de email válido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

