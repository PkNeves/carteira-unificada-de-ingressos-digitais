import { Request, Response } from "express";
import {
  registerCompany,
  loginCompany,
  registerUser,
  loginUser,
} from "../services/auth";
import { AuthRequest } from "../middleware/auth";
import prisma from "../utils/prisma";

export async function registerCompanyHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { name, email, password } = req.body;

    const company = await registerCompany(name, email, password);

    res.status(201).json({
      message: "Company registrada com sucesso",
      company: {
        id: company.id,
        email: company.email,
      },
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function loginCompanyHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Validação já foi feita pelo middleware
    const { email, password } = req.body;

    const result = await loginCompany(email, password);

    res.json({
      message: "Login realizado com sucesso",
      token: result.token,
      company: {
        id: result.id,
        email: result.email,
      },
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
}

export async function registerUserHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { email, password, confirmPassword } = req.body;

    const result = await registerUser(email, password, confirmPassword);

    res.status(201).json({
      message: "Usuário registrado com sucesso",
      token: result.token,
      user: {
        id: result.id,
        email: result.email,
      },
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function loginUserHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Validação já foi feita pelo middleware
    const { email, password } = req.body;

    const result = await loginUser(email, password);

    res.json({
      message: "Login realizado com sucesso",
      token: result.token,
      user: {
        id: result.id,
        email: result.email,
      },
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
}

export async function getMeHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (req.userType === "user") {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: {
          id: true,
          email: true,
          walletAddress: true,
          createdAt: true,
        },
      });

      if (!user) {
        res.status(404).json({ error: "Usuário não encontrado" });
        return;
      }

      res.json({ user });
    } else {
      const company = await prisma.company.findUnique({
        where: { id: req.userId },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

      if (!company) {
        res.status(404).json({ error: "Company não encontrada" });
        return;
      }

      res.json({ company });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
