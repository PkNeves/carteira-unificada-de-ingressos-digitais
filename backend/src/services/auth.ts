import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import prisma from "../utils/prisma";
import { getOrCreateUserWallet } from "./wallet";
import { sendWelcomeEmailNewUser, isEmailConfigured } from "./email";

function getJwtSecret(): string {
  if (!process.env.JWT_SECRET) {
    throw new Error(
      "JWT_SECRET não configurado. Configure a variável de ambiente JWT_SECRET."
    );
  }
  return process.env.JWT_SECRET;
}

const JWT_SECRET: string = getJwtSecret();
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
 * Gera uma senha aleatória segura
 * Retorna uma string com 12 caracteres contendo letras maiúsculas, minúsculas e números
 */
export function generateRandomPassword(): string {
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const allChars = uppercaseChars + lowercaseChars + numberChars;
  
  let password = '';
  
  // Garante pelo menos uma letra maiúscula, uma minúscula e um número
  password += uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)];
  password += lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)];
  password += numberChars[Math.floor(Math.random() * numberChars.length)];
  
  // Completa com caracteres aleatórios até 12 caracteres
  for (let i = password.length; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Embaralha a senha para não ter padrão previsível
  return password.split('').sort(() => Math.random() - 0.5).join('');
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
  // Valida formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Formato de email inválido");
  }

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
  const { userId, address } = await getOrCreateUserWallet(email, password);

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

  // Envia email de boas-vindas para usuário auto-cadastrado
  try {
    if (isEmailConfigured()) {
      await sendWelcomeEmailNewUser(email);
      console.log(`Email de boas-vindas enviado para ${email}`);
    } else {
      console.log(`SMTP não configurado. Email de boas-vindas não enviado para ${email}`);
    }
  } catch (emailError: any) {
    console.error(`Erro ao enviar email de boas-vindas para ${email}:`, emailError.message);
    // Não falha o registro se o email falhar
  }

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
