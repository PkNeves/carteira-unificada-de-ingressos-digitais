import { ethers } from "ethers";
import crypto from "crypto";
import prisma from "../utils/prisma";
import { sendConfirmationWebhook } from "./webhook";
import { getBlockchainConfig } from "../config/blockchain";

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";

const SYSTEM_WALLET_PRIVATE_KEY =
  process.env.SYSTEM_WALLET_PRIVATE_KEY ||
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

// Converte UUID para uint256 usando hash SHA-256
function uuidToBigInt(uuid: string): bigint {
  const hash = crypto.createHash("sha256").update(uuid).digest("hex");
  return BigInt("0x" + hash.substring(0, 16));
}

export async function syncTicketToBlockchain(ticketId: string): Promise<void> {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      event: true,
      user: true,
    },
  });

  if (!ticket) {
    throw new Error("Ticket não encontrado");
  }

  if (ticket.status === "minted") {
    return;
  }

  if (ticket.status !== "valid") {
    throw new Error(
      `Ticket não está válido para mintagem. Status: ${ticket.status}`
    );
  }

  const now = new Date();
  const startDate = new Date(ticket.startDate);
  if (now < startDate) {
    throw new Error(
      `Ticket não pode ser mintado ainda. Mintagem permitida após ${startDate.toISOString()}`
    );
  }

  if (!ticket.user.walletAddress) {
    throw new Error("Usuário não possui endereço de carteira");
  }

  if (!CONTRACT_ADDRESS) {
    throw new Error(
      "Endereço do contrato não configurado. Configure CONTRACT_ADDRESS no .env após fazer deploy."
    );
  }

  if (!SYSTEM_WALLET_PRIVATE_KEY) {
    throw new Error("Chave privada da carteira do sistema não configurada");
  }

  try {
    const config = getBlockchainConfig();
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const code = await provider.getCode(CONTRACT_ADDRESS);
    if (code === "0x") {
      throw new Error(
        `Contrato não encontrado no endereço ${CONTRACT_ADDRESS} na rede ${config.network}`
      );
    }

    const systemWallet = new ethers.Wallet(SYSTEM_WALLET_PRIVATE_KEY, provider);
    const contractABI = [
      "function owner() public view returns (address)",
      "function mintTicket(address to, uint256 id, string memory externalId, string memory name, string memory description, string memory bannerUrl, uint256 startDate, uint256 amount, string memory seat, string memory sector, uint256 eventId, string memory eventName, uint256 createdAt, string memory metadataURI) public returns (uint256)",
      "function getTicketInfo(uint256 tokenId) public view returns (tuple(uint256 id, string externalId, string name, string description, uint8 rarity, string bannerUrl, uint256 startDate, uint256 amount, string seat, string sector, uint256 eventId, string eventName, uint256 createdAt))",
    ];

    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      contractABI,
      provider
    );

    // Verifica se a carteira do sistema é owner do contrato
    const contractOwner = await contract.owner();
    if (contractOwner.toLowerCase() !== systemWallet.address.toLowerCase()) {
      throw new Error(
        `Carteira do sistema (${systemWallet.address}) não é owner do contrato. ` +
        `Owner atual: ${contractOwner}. ` +
        `Configure SYSTEM_WALLET_PRIVATE_KEY com a chave da carteira que fez o deploy do contrato.`
      );
    }

    // Reconecta o contrato com a carteira assinante para poder fazer transações
    const contractWithSigner = new ethers.Contract(
      CONTRACT_ADDRESS,
      contractABI,
      systemWallet
    );

    const metadataURI = `https://api.ticketwallet.com/metadata/${ticket.externalId}`;

    const ticketIdBigInt = uuidToBigInt(ticket.id);
    const eventIdBigInt = ticket.eventId
      ? uuidToBigInt(ticket.eventId)
      : BigInt(0);

    // Converte datas para timestamps Unix (em segundos)
    const startDateTimestamp = BigInt(
      Math.floor(new Date(ticket.startDate).getTime() / 1000)
    );
    const createdAtTimestamp = BigInt(
      Math.floor(new Date(ticket.createdAt).getTime() / 1000)
    );

    const description = ticket.description || "";
    const bannerUrl = ticket.bannerUrl || "";
    const seat = ticket.seat || "";
    const sector = ticket.sector || "";
    const eventName = ticket.event?.name || "";

    const tx = await contractWithSigner.mintTicket(
      ticket.user.walletAddress,
      ticketIdBigInt, // id (hash do UUID do ticket)
      ticket.externalId, // externalId
      ticket.name, // name
      description, // description
      bannerUrl, // bannerUrl
      startDateTimestamp, // startDate (timestamp Unix)
      BigInt(ticket.amount || 1), // amount
      seat, // seat
      sector, // sector
      eventIdBigInt, // eventId (hash do UUID do evento)
      eventName, // eventName
      createdAtTimestamp, // createdAt (timestamp Unix)
      metadataURI
    );

    const receipt = await tx.wait();

    // Extrai tokenId do evento TicketMinted
    const eventSignature = ethers.id(
      "TicketMinted(uint256,address,uint256,string,uint8)"
    );
    const ticketMintedEvent = receipt.logs.find(
      (log: any) => log.topics[0] === eventSignature
    );

    let tokenId: string | null = null;
    let rarityFromEvent: number | null = null;

    if (ticketMintedEvent) {
      try {
        const decoded = contractWithSigner.interface.decodeEventLog(
          "TicketMinted",
          ticketMintedEvent.data,
          ticketMintedEvent.topics
        );
        tokenId = decoded.tokenId.toString();
        rarityFromEvent = decoded.rarity;
      } catch (error) {
        // Se falhar, tenta extrair do primeiro topic (tokenId)
        tokenId = BigInt(ticketMintedEvent.topics[1]).toString();
      }
    } else {
      throw new Error("Evento TicketMinted não encontrado na transação");
    }

    // Se não conseguiu obter raridade do evento, lê do contrato
    let calculatedRarity: string = "common";
    if (tokenId && rarityFromEvent !== null) {
      const rarityMap: { [key: number]: string } = {
        0: "common",
        1: "rare",
        2: "epic",
        3: "legendary",
      };
      calculatedRarity = rarityMap[rarityFromEvent] || "common";
    } else if (tokenId) {
      // Lê do contrato como fallback
      try {
        const ticketInfo = await contractWithSigner.getTicketInfo(tokenId);
        const rarityMap: { [key: number]: string } = {
          0: "common",
          1: "rare",
          2: "epic",
          3: "legendary",
        };
        calculatedRarity = rarityMap[ticketInfo.rarity] || "common";
      } catch (error) {
        console.warn(
          `Não foi possível ler raridade do contrato para token ${tokenId}, usando padrão "common"`
        );
      }
    }

    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: "minted",
        tokenId,
        txHash: receipt.hash,
        rarity: calculatedRarity,
      },
    });

    // Envia webhook de confirmação após cunhagem bem-sucedida
    try {
      await sendConfirmationWebhook(ticketId);
    } catch (webhookError: any) {
      // Não falha a cunhagem se o webhook falhar
      console.error(
        `Erro ao enviar webhook para ticket ${ticketId}:`,
        webhookError.message
      );
    }
  } catch (error: any) {
    console.error("Erro ao sincronizar ticket:", error);
    // Não altera o status do ticket em caso de erro para permitir nova tentativa
    throw error;
  }
}

// Processa todos os tickets pendentes (sem tokenId e com status valid)
export async function processPendingTickets(): Promise<void> {
  const now = new Date();

  const pendingTickets = await prisma.ticket.findMany({
    where: {
      status: "valid",
      tokenId: null,
      startDate: {
        lte: now, // startDate <= agora (já pode ser mintado)
      },
    },
    orderBy: {
      startDate: "asc", // Processa os mais antigos primeiro
    },
    take: 10, // Processa 10 por vez
  });

  for (const ticket of pendingTickets) {
    try {
      await syncTicketToBlockchain(ticket.id);
    } catch (error: any) {
      // Se o erro for sobre timing, apenas loga e continua
      if (error.message?.includes("não pode ser cunhado ainda")) {
        console.log(`Ticket ${ticket.id}: ${error.message}`);
        continue;
      }
      console.error(`Erro ao processar ticket ${ticket.id}:`, error);
    }
  }
}
