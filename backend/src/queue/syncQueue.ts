import Queue from "bull";
import {
  processPendingTickets,
  syncTicketToBlockchain,
} from "../services/sync";

function getRedisHost(): string {
  const redisHost = process.env.REDIS_HOST || 
    (process.env.NODE_ENV === 'development' ? 'localhost' : undefined);
  
  if (!redisHost) {
    throw new Error("REDIS_HOST não configurado. Configure a variável de ambiente REDIS_HOST.");
  }
  
  return redisHost;
}

const REDIS_HOST = getRedisHost();
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379");

// Cria fila para sincronização geral
export const syncQueue = new Queue("ticket-sync", {
  redis: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
});

// Cria fila para sincronização individual de tickets
export const ticketSyncQueue = new Queue("individual-ticket-sync", {
  redis: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
});

// Processa jobs da fila geral
syncQueue.process(async (job) => {
  console.log(`Processando sincronização geral: ${job.id}`);
  await processPendingTickets();
  return { success: true };
});

// Processa jobs individuais de tickets
ticketSyncQueue.process(async (job) => {
  const { ticketId } = job.data;
  console.log(`Processando sincronização individual do ticket: ${ticketId}`);

  try {
    await syncTicketToBlockchain(ticketId);
    return { success: true, ticketId };
  } catch (error: any) {
    // Se ainda não pode ser mintado, não marca como falha
    // O job periódico vai tentar novamente depois
    if (error.message?.includes("não pode ser mintado ainda")) {
      console.log(
        `Ticket ${ticketId} ainda não pode ser mintado: ${error.message}`
      );
      // Retorna sucesso mas não processa - será tentado novamente pelo job periódico
      return { success: false, reason: "not_ready", ticketId };
    }
    // Para outros erros, propaga a exceção para que o Bull possa fazer retry
    throw error;
  }
});

// Adiciona job à fila periodicamente (a cada 1 minuto para verificar tickets prontos)
export function startSyncScheduler(): void {
  // Job periódico para processar tickets pendentes
  setInterval(() => {
    syncQueue.add({}, { repeat: { every: 1 * 60 * 1000 } }); // 1 minuto
  }, 1 * 60 * 1000);

  console.log("Agendador de sincronização iniciado (verifica a cada 1 minuto)");
}

/**
 * Agenda a mintagem de um ticket individual (DEPRECATED - não é mais usada)
 * A mintagem agora é feita apenas pelo job periódico que verifica canMintTicket
 */
export async function scheduleTicketMinting(
  ticketId: string,
  eventEndDate: Date | null
): Promise<void> {
  if (!eventEndDate) {
    // Se não houver end_date, agenda para agora (mintagem imediata)
    await ticketSyncQueue.add({ ticketId }, { delay: 0 });
    return;
  }

  const now = new Date();
  const endDate = new Date(eventEndDate);
  const mintDate = new Date(endDate.getTime() + 3 * 60 * 1000); // 3 minutos após end_date
  const delay = Math.max(0, mintDate.getTime() - now.getTime());

  await ticketSyncQueue.add(
    { ticketId },
    {
      delay,
      attempts: 3, // Tenta 3 vezes em caso de falha
      backoff: {
        type: "exponential",
        delay: 60000, // 1 minuto entre tentativas
      },
    }
  );

  console.log(
    `Ticket ${ticketId} agendado para mintagem em ${new Date(
      now.getTime() + delay
    ).toISOString()}`
  );
}
