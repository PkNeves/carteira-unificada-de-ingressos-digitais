import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import prisma from "../utils/prisma";
import { getOrCreateUserWallet } from "../services/wallet";
import { verifyTokenOnChain } from "../services/verifyToken";
import { generateRandomPassword } from "../services/auth";
import { sendWelcomeEmailWithTicket, isEmailConfigured } from "../services/email";
import crypto from "crypto";
import axios from "axios";

export async function createTickets(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { eventId, tickets } = req.body;

    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        companyId: req.userId!,
      },
    });

    if (!event) {
      res.status(404).json({ error: "Evento não encontrado" });
      return;
    }

    // Verifica se o evento está ativo
    if (!event.active) {
      res.status(400).json({
        error: "Evento não está ativo",
      });
      return;
    }

    const ticketsCriados = [];

    for (const ticketData of tickets) {
      const {
        email,
        name,
        description,
        rarity,
        bannerUrl,
        amount,
        seat,
        sector,
        startDate,
      } = ticketData;

      // Gera senha aleatória para novos usuários
      const randomPassword = generateRandomPassword();
      const { userId, isNewUser } = await getOrCreateUserWallet(email, randomPassword);
      const externalId = crypto.randomBytes(16).toString("hex");

      const ticket = await prisma.ticket.create({
        data: {
          eventId: eventId,
          userId: userId,
          externalId,
          name,
          description: description || null,
          rarity: "common",
          bannerUrl: bannerUrl || null,
          amount: amount || 1,
          seat: seat || null,
          sector: sector || null,
          startDate: new Date(startDate),
          status: "valid",
        },
        include: {
          user: {
            select: {
              email: true,
              walletAddress: true,
            },
          },
        },
      });

      // Envia email de boas-vindas se for usuário novo
      if (isNewUser) {
        try {
          if (isEmailConfigured()) {
            await sendWelcomeEmailWithTicket(email, randomPassword, event.name);
            console.log(`Email de boas-vindas enviado para ${email}`);
          } else {
            console.log(`SMTP não configurado. Email de boas-vindas não enviado para ${email}`);
            console.log(`Senha gerada para ${email}: ${randomPassword}`);
          }
        } catch (emailError: any) {
          console.error(`Erro ao enviar email para ${email}:`, emailError.message);
          // Não falha a criação do ticket se o email falhar
        }
      }

      ticketsCriados.push(ticket);
    }

    res.status(201).json({
      message: `${ticketsCriados.length} ticket(s) criado(s) com sucesso`,
      tickets: ticketsCriados,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function listEventTickets(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { eventId } = req.query;
    const userType = req.userType;
    const userId = req.userId!;

    if (eventId) {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (typeof eventId !== "string" || !uuidRegex.test(eventId)) {
        res.status(400).json({
          error: "Erro de validação",
          details: [
            {
              field: "eventId",
              message: "eventId deve ser um UUID válido",
            },
          ],
        });
        return;
      }
    }

    if (userType === "company") {
      if (!eventId || typeof eventId !== "string") {
        res.status(400).json({
          error: "eventId é obrigatório como query parameter para companies",
          details: [
            {
              field: "eventId",
              message:
                "eventId deve ser um UUID válido fornecido como query parameter",
            },
          ],
        });
        return;
      }

      const event = await prisma.event.findFirst({
        where: {
          id: eventId,
          companyId: userId,
        },
      });

      if (!event) {
        res.status(404).json({
          error: "Evento não encontrado ou não pertence à company",
        });
        return;
      }

      const tickets = await prisma.ticket.findMany({
        where: {
          eventId: eventId,
        },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              description: true,
              startDate: true,
              endDate: true,
              company: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          user: {
            select: {
              email: true,
              walletAddress: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.json({
        event: {
          id: event.id,
          name: event.name,
        },
        tickets,
      });
    } else {
      const whereClause: any = {
        userId: userId,
      };

      if (eventId) {
        whereClause.eventId = eventId;
      }

      const tickets = await prisma.ticket.findMany({
        where: whereClause,
        include: {
          event: {
            select: {
              id: true,
              name: true,
              description: true,
              startDate: true,
              endDate: true,
              company: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          user: {
            select: {
              email: true,
              walletAddress: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.json({ tickets });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getTicket(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    let ticket;

    if (req.userType === "company") {
      ticket = await prisma.ticket.findFirst({
        where: {
          id,
          event: {
            companyId: req.userId!,
          },
        },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              description: true,
              startDate: true,
              endDate: true,
              company: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          user: {
            select: {
              email: true,
              walletAddress: true,
            },
          },
        },
      });
    } else {
      ticket = await prisma.ticket.findFirst({
        where: {
          id,
          userId: req.userId!,
        },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              description: true,
              startDate: true,
              endDate: true,
              company: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          user: {
            select: {
              email: true,
              walletAddress: true,
            },
          },
        },
      });
    }

    if (!ticket) {
      res.status(404).json({ error: "Ticket não encontrado" });
      return;
    }

    res.json({ ticket });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getWalletAddress(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        walletAddress: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }

    res.json({
      address: user.walletAddress,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// Converte UUID para uint256 usando hash SHA-256
function uuidToBigInt(uuid: string): bigint {
  const hash = crypto.createHash("sha256").update(uuid).digest("hex");
  return BigInt("0x" + hash.substring(0, 16));
}

export async function verifyTicket(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.findFirst({
      where: {
        id,
        userId: req.userId!,
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            email: true,
            walletAddress: true,
          },
        },
      },
    });

    if (!ticket) {
      res.status(404).json({ error: "Ticket não encontrado" });
      return;
    }

    if (!ticket.tokenId) {
      res.json({
        verified: false,
        offChain: {
          id: ticket.id,
          tokenId: null,
          externalId: ticket.externalId,
          status: ticket.status,
          owner: {
            email: ticket.user.email,
            walletAddress: ticket.user.walletAddress,
          },
          event: ticket.event
            ? {
                id: ticket.event.id,
                name: ticket.event.name,
              }
            : null,
        },
        onChain: {
          exists: false,
          owner: null,
          tokenId: null,
          id: null,
          externalId: null,
          name: null,
          description: null,
          rarity: null,
          bannerUrl: null,
          startDate: null,
          amount: null,
          seat: null,
          sector: null,
          eventId: null,
          eventName: null,
          createdAt: null,
          tokenURI: null,
          error: "Ticket ainda não foi sincronizado com a blockchain",
        },
        comparison: {
          ownerMatches: false,
          ticketCodeMatches: false,
          eventIdMatches: false,
          differences: ["Ticket não possui tokenId - ainda não sincronizado"],
        },
      });
      return;
    }

    let onChainData;
    try {
      onChainData = await verifyTokenOnChain(ticket.tokenId);
    } catch (error: any) {
      res.status(500).json({
        error: `Erro ao consultar blockchain: ${error.message}`,
      });
      return;
    }

    const offChainData = {
      id: ticket.id,
      tokenId: ticket.tokenId,
      externalId: ticket.externalId,
      status: ticket.status,
      txHash: ticket.txHash,
      owner: {
        email: ticket.user.email,
        walletAddress: ticket.user.walletAddress?.toLowerCase() || null,
      },
      event: ticket.event
        ? {
            id: ticket.event.id,
            name: ticket.event.name,
          }
        : null,
    };

    const differences: string[] = [];
    let ownerMatches = false;
    let ticketCodeMatches = false;
    let eventIdMatches = false;

    if (!onChainData.exists) {
      differences.push("Token não existe na blockchain");
    } else {
      const offChainOwner = offChainData.owner.walletAddress;
      const onChainOwner = onChainData.owner;
      ownerMatches = offChainOwner === onChainOwner;
      if (!ownerMatches) {
        differences.push(
          `Owner não corresponde: banco=${offChainOwner}, blockchain=${onChainOwner}`
        );
      }

      ticketCodeMatches = offChainData.externalId === onChainData.externalId;
      if (!ticketCodeMatches) {
        differences.push(
          `Código do ticket não corresponde: banco=${offChainData.externalId}, blockchain=${onChainData.externalId}`
        );
      }

      // Compara eventId (convertendo UUID para BigInt)
      if (offChainData.event) {
        const offChainEventIdBigInt = uuidToBigInt(offChainData.event.id);
        const onChainEventIdBigInt = onChainData.eventId
          ? BigInt(onChainData.eventId)
          : null;
        eventIdMatches = offChainEventIdBigInt === onChainEventIdBigInt;
        if (!eventIdMatches) {
          differences.push(
            `EventId não corresponde: banco=${offChainEventIdBigInt.toString()}, blockchain=${
              onChainEventIdBigInt?.toString() || "null"
            }`
          );
        }
      }
    }

    const verified =
      onChainData.exists &&
      ownerMatches &&
      ticketCodeMatches &&
      eventIdMatches &&
      differences.length === 0;

    res.json({
      verified,
      offChain: offChainData,
      onChain: onChainData,
      comparison: {
        ownerMatches,
        ticketCodeMatches,
        eventIdMatches,
        differences,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateTicket(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      rarity,
      bannerUrl,
      amount,
      seat,
      sector,
      startDate,
      status,
    } = req.body;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            companyId: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    if (!ticket) {
      res.status(404).json({ error: "Ticket não encontrado" });
      return;
    }

    if (ticket.event?.companyId !== req.userId) {
      res.status(403).json({
        error: "Acesso negado: ticket não pertence a evento da company",
      });
      return;
    }

    if (ticket.event) {
      const now = new Date();
      const eventStartDate = new Date(ticket.event.startDate);

      if (eventStartDate < now) {
        res.status(403).json({
          error: "Não é possível alterar um ticket cujo evento já iniciou",
        });
        return;
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (rarity !== undefined) updateData.rarity = "common";
    if (bannerUrl !== undefined) updateData.bannerUrl = bannerUrl || null;
    if (amount !== undefined) updateData.amount = amount;
    if (seat !== undefined) updateData.seat = seat || null;
    if (sector !== undefined) updateData.sector = sector || null;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (status !== undefined) updateData.status = status;

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            description: true,
            startDate: true,
            endDate: true,
            company: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        user: {
          select: {
            email: true,
            walletAddress: true,
          },
        },
      },
    });

    res.json({
      message: "Ticket atualizado com sucesso",
      ticket: updatedTicket,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function deleteTicket(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            companyId: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    if (!ticket) {
      res.status(404).json({ error: "Ticket não encontrado" });
      return;
    }

    if (ticket.event?.companyId !== req.userId) {
      res.status(403).json({
        error: "Acesso negado: ticket não pertence a evento da company",
      });
      return;
    }

    if (ticket.event) {
      const now = new Date();
      const eventStartDate = new Date(ticket.event.startDate);

      if (eventStartDate < now) {
        res.status(403).json({
          error: "Não é possível deletar um ticket cujo evento já iniciou",
        });
        return;
      }
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: { status: "canceled" },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            description: true,
            startDate: true,
            endDate: true,
            company: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        user: {
          select: {
            email: true,
            walletAddress: true,
          },
        },
      },
    });

    res.json({
      message: "Ticket desabilitado com sucesso",
      ticket: updatedTicket,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function convertImageToBase64(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { url } = req.query;

    if (!url || typeof url !== "string") {
      res.status(400).json({ error: "URL da imagem é obrigatória" });
      return;
    }

    // Valida formato de URL
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      res.status(400).json({ error: "URL inválida" });
      return;
    }

    // Valida protocolo (apenas http/https)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      res.status(400).json({ error: "Apenas URLs HTTP/HTTPS são permitidas" });
      return;
    }

    // Valida extensão de imagem
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const hasValidExtension = validExtensions.some(ext => 
      parsedUrl.pathname.toLowerCase().endsWith(ext)
    );
    if (!hasValidExtension) {
      res.status(400).json({ 
        error: "URL deve apontar para uma imagem válida (jpg, jpeg, png, gif, webp, svg)" 
      });
      return;
    }

    const response = await axios.get(url, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000, // 10 segundos
      maxContentLength: 10 * 1024 * 1024, // 10MB máximo
      maxBodyLength: 10 * 1024 * 1024,
    });

    const buffer = Buffer.from(response.data);
    const base64 = buffer.toString("base64");
    const mimeType = response.headers["content-type"] || "image/png";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    res.json({ base64: dataUrl });
  } catch (error: any) {
    console.error("Erro ao converter imagem para base64:", error);
    res.status(500).json({
      error: `Erro ao converter imagem: ${error.message}`,
    });
  }
}
