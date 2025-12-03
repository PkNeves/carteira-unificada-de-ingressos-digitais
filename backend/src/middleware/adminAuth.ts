import { Request, Response, NextFunction } from "express";

export function requireAdminKey(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const adminKey = process.env.ADMIN_API_KEY;

  if (!adminKey) {
    console.error(
      "⚠️  AVISO: ADMIN_API_KEY não configurada. " +
        "Configure para proteger rotas administrativas."
    );
    res.status(500).json({
      error: "Servidor não configurado corretamente. Contate o administrador.",
    });
    return;
  }

  const providedKey = req.headers["x-admin-key"] as string;

  const ip = req.ip || req.socket.remoteAddress;
  const method = req.method;
  const path = req.path;

  if (!providedKey) {
    console.warn(
      `🔒 Tentativa de acesso admin sem chave - IP: ${ip}, ${method} ${path}`
    );
    res.status(401).json({
      error: "Chave de administrador não fornecida",
      message: "Forneça a chave no header X-Admin-Key",
    });
    return;
  }

  if (providedKey !== adminKey) {
    console.warn(
      `🚫 Tentativa de acesso admin com chave inválida - IP: ${ip}, ${method} ${path}`
    );
    res.status(403).json({
      error: "Chave de administrador inválida",
    });
    return;
  }

  console.log(`✅ Acesso admin autorizado - IP: ${ip}, ${method} ${path}`);
  next();
}
