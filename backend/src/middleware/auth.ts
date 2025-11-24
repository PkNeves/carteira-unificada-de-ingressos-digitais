import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../services/auth";

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  userType?: "user" | "company";
}

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Token não fornecido" });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.userType = decoded.type;

    next();
  } catch (error: any) {
    res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

export function requireCompany(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.userType !== "company") {
    res.status(403).json({ error: "Acesso negado: apenas companies" });
    return;
  }
  next();
}

export function requireUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.userType !== "user") {
    res.status(403).json({ error: "Acesso negado: apenas usuários" });
    return;
  }
  next();
}
