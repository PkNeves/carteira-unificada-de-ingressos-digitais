import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import prisma from "../utils/prisma";
import { getOrCreateUserWallet } from "./wallet";

const JWT_SECRET: string =
  process.env.JWT_SECRET || "default-secret-change-in-production";
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Gera token JWT para autenticação
 */
export function generateToken(payload: {
  userId: string;
  email: string;
  type: "user" | "company";
}): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

/**
 * Verifica e decodifica token JWT
 */
export function verifyToken(token: string): {
  userId: string;
  email: string;
  type: "user" | "company";
} {
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as any;
    return {
      userId: decoded.userId,
      email: decoded.email,
      type: decoded.type,
    };
  } catch (error) {
    throw new Error("Token inválido ou expirado");
  }
}

/**
 * Hash de senha usando bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compara senha com hash
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Registra uma nova company
 */
export async function registerCompany(
  name: string,
  email: string,
  password: string
): Promise<{ id: string; email: string }> {
  const existing = await prisma.company.findUnique({
    where: { email },
  });

  if (existing) {
    throw new Error("Company já existe com este email");
  }

  const hashedPassword = await hashPassword(password);

  const company = await prisma.company.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  return {
    id: company.id,
    email: company.email,
  };
}

/**
 * Login de company
 */
export async function loginCompany(
  email: string,
  password: string
): Promise<{ id: string; email: string; token: string }> {
  const company = await prisma.company.findUnique({
    where: { email },
  });

  if (!company) {
    throw new Error("Credenciais inválidas");
  }

  const isValid = await comparePassword(password, company.password);

  if (!isValid) {
    throw new Error("Credenciais inválidas");
  }

  const token = generateToken({
    userId: company.id,
    email: company.email,
    type: "company",
  });

  return {
    id: company.id,
    email: company.email,
    token,
  };
}

/**
 * Registra um novo usuário
 */
export async function registerUser(
  email: string,
  password: string,
  confirmPassword: string
): Promise<{ id: string; email: string; token: string }> {
  // Valida confirmação de senha
  if (password !== confirmPassword) {
    throw new Error("Senha e confirmação de senha não coincidem");
  }

  // Valida tamanho mínimo da senha
  if (password.length < 6) {
    throw new Error("Senha deve ter no mínimo 6 caracteres");
  }

  // Verifica se usuário já existe
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    throw new Error("Usuário já existe com este email");
  }

  // Hash da senha
  const hashedPassword = await hashPassword(password);

  // Cria usuário com carteira blockchain
  // Passa senha em texto para criptografar chave privada
  const { userId, address } = await getOrCreateUserWallet(
    email,
    password
  );

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("Erro ao criar usuário");
  }

  // Gera token JWT
  const token = generateToken({
    userId: user.id,
    email: user.email,
    type: "user",
  });

  return {
    id: user.id,
    email: user.email,
    token,
  };
}

/**
 * Login de usuário
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ id: string; email: string; token: string }> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("Credenciais inválidas");
  }

  // Verifica senha
  const isValid = await comparePassword(password, user.password);

  if (!isValid) {
    throw new Error("Credenciais inválidas");
  }

  // Gera token JWT
  const token = generateToken({
    userId: user.id,
    email: user.email,
    type: "user",
  });

  return {
    id: user.id,
    email: user.email,
    token,
  };
}
