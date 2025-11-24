import { Response } from "express";
import { processPendingTickets } from "../services/sync";

export async function processSync(req: any, res: Response): Promise<void> {
  try {
    await processPendingTickets();

    res.json({
      message: "Sincronização processada",
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
