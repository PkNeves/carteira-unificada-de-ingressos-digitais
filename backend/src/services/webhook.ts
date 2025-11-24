import axios from "axios";
import prisma from "../utils/prisma";

// Envia notificação de confirmação de cunhagem para o webhook do evento
export async function sendConfirmationWebhook(ticketId: string): Promise<void> {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            description: true,
            startDate: true,
            endDate: true,
            postbackUrl: true,
            company: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            walletAddress: true,
          },
        },
      },
    });

    if (!ticket) {
      console.error(`Ticket ${ticketId} não encontrado para webhook`);
      return;
    }

    // Verifica se o evento tem postbackUrl configurado
    if (!ticket.event?.postbackUrl) {
      console.log(
        `Evento ${ticket.eventId} não possui postbackUrl configurado, pulando webhook`
      );
      return;
    }

    // Prepara dados completos do ticket para enviar
    const webhookData = {
      ticket: {
        id: ticket.id,
        externalId: ticket.externalId,
        name: ticket.name,
        description: ticket.description,
        rarity: ticket.rarity,
        bannerUrl: ticket.bannerUrl,
        amount: ticket.amount,
        seat: ticket.seat,
        sector: ticket.sector,
        status: ticket.status,
        tokenId: ticket.tokenId,
        txHash: ticket.txHash,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
      },
      event: ticket.event
        ? {
            id: ticket.event.id,
            name: ticket.event.name,
            description: ticket.event.description,
            startDate: ticket.event.startDate,
            endDate: ticket.event.endDate,
            company: ticket.event.company,
          }
        : null,
      user: {
        id: ticket.user.id,
        email: ticket.user.email,
        walletAddress: ticket.user.walletAddress,
      },
    };

    // Envia POST para o webhook
    const response = await axios.post(ticket.event.postbackUrl, webhookData, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000, // 10 segundos de timeout
    });

    console.log(
      `Webhook enviado com sucesso para ${ticket.event.postbackUrl} (ticket ${ticketId}):`,
      response.status
    );
  } catch (error: any) {
    // Não falha a cunhagem se o webhook falhar
    console.error(
      `Erro ao enviar webhook para ticket ${ticketId}:`,
      error.message
    );
    // Log mais detalhado em desenvolvimento
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
}
