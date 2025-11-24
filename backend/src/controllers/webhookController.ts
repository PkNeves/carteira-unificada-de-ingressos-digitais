import { Request, Response } from "express";

/**
 * Recebe notificação de confirmação de cunhagem
 * Esta rota é chamada externamente quando um ticket é cunhado
 */
export async function receiveConfirmation(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Log da notificação recebida
    console.log("Webhook de confirmação recebido:", {
      body: req.body,
      headers: req.headers,
      timestamp: new Date().toISOString(),
    });

    // Retorna sucesso
    res.status(200).json({
      message: "Notificação recebida com sucesso",
      receivedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Erro ao processar webhook de confirmação:", error);
    res.status(500).json({ error: error.message });
  }
}

