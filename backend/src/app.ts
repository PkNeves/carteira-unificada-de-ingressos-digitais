import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import eventRoutes from "./routes/eventRoutes";
import userRoutes from "./routes/userRoutes";
import syncRoutes from "./routes/syncRoutes";
import ticketRoutes from "./routes/ticketRoutes";
import sharedTicketRoutes from "./routes/sharedTicketRoutes";
import webhookRoutes from "./routes/webhookRoutes";
import { startSyncScheduler } from "./queue/syncQueue";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas - IMPORTANTE: rotas mais específicas primeiro
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/tickets", ticketRoutes); // POST e GET (rota legada)
app.use("/api/tickets", sharedTicketRoutes); // GET, PATCH, DELETE para companies e users (rota legada)
// userRoutes deve vir por último para não capturar rotas de tickets
app.use("/api", userRoutes);

// Rotas API v1
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/tickets", ticketRoutes); // POST apenas para companies
app.use("/api/v1/tickets", sharedTicketRoutes); // GET, PATCH, DELETE para companies e users
app.use("/api/v1/webhooks", webhookRoutes);

// Rota de health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Tratamento de erros
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Erro:", err);
    res.status(err.status || 500).json({
      error: err.message || "Erro interno do servidor",
    });
  }
);

// Inicia agendador de sincronização
// Usa localhost como padrão se REDIS_HOST não estiver configurado
try {
  startSyncScheduler();
  console.log("✅ Agendador de sincronização iniciado");
} catch (error: any) {
  console.warn(
    "⚠️  Agendador de sincronização não pôde ser iniciado:",
    error.message
  );
  console.warn("   Certifique-se de que o Redis está rodando");
}

// Inicia servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

export default app;
