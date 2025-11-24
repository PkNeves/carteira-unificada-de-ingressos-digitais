import { ethers } from "ethers";

const RPC_URL = process.env.SEPOLIA_RPC_URL || "http://localhost:8545";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";

const CONTRACT_ABI = [
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function getTicketInfo(uint256 tokenId) public view returns (tuple(uint256 id, string externalId, string name, string description, uint8 rarity, string bannerUrl, uint256 startDate, uint256 amount, string seat, string sector, uint256 eventId, string eventName, uint256 createdAt))",
  "function tokenURI(uint256 tokenId) public view returns (string)",
];

export interface OnChainTicketData {
  exists: boolean;
  owner: string | null;
  tokenId: string;
  id: string | null;
  externalId: string | null;
  name: string | null;
  description: string | null;
  rarity: string | null;
  bannerUrl: string | null;
  startDate: string | null;
  amount: string | null;
  seat: string | null;
  sector: string | null;
  eventId: string | null;
  eventName: string | null;
  createdAt: string | null;
  tokenURI: string | null;
  error?: string;
}

export async function verifyTokenOnChain(
  tokenId: string
): Promise<OnChainTicketData> {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Endereço do contrato não configurado");
  }

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      provider
    );

    // Verifica se o token existe consultando o owner
    let owner: string;
    try {
      owner = await contract.ownerOf(tokenId);
    } catch (error: any) {
      // Se ownerOf falhar, o token não existe
      return {
        exists: false,
        owner: null,
        tokenId,
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
        error: error.message || "Token não encontrado na blockchain",
      };
    }

    // Se chegou aqui, o token existe - obtém informações do ticket
    let ticketInfo: any = null;
    let tokenURI: string | null = null;

    try {
      ticketInfo = await contract.getTicketInfo(tokenId);
      tokenURI = await contract.tokenURI(tokenId);
    } catch (error: any) {
      console.error("Erro ao obter informações do ticket:", error);
      // Continua mesmo se falhar, retornando pelo menos o owner
    }

    // Mapeia raridade numérica para string
    const rarityMap: { [key: number]: string } = {
      0: "common",
      1: "rare",
      2: "epic",
      3: "legendary",
    };

    return {
      exists: true,
      owner: owner.toLowerCase(),
      tokenId,
      id: ticketInfo ? ticketInfo.id.toString() : null,
      externalId: ticketInfo ? ticketInfo.externalId : null,
      name: ticketInfo ? ticketInfo.name : null,
      description: ticketInfo ? ticketInfo.description : null,
      rarity: ticketInfo ? rarityMap[ticketInfo.rarity] || "common" : null,
      bannerUrl: ticketInfo ? ticketInfo.bannerUrl : null,
      startDate: ticketInfo ? ticketInfo.startDate.toString() : null,
      amount: ticketInfo ? ticketInfo.amount.toString() : null,
      seat: ticketInfo ? ticketInfo.seat : null,
      sector: ticketInfo ? ticketInfo.sector : null,
      eventId: ticketInfo ? ticketInfo.eventId.toString() : null,
      eventName: ticketInfo ? ticketInfo.eventName : null,
      createdAt: ticketInfo ? ticketInfo.createdAt.toString() : null,
      tokenURI: tokenURI || null,
    };
  } catch (error: any) {
    throw new Error(`Erro ao verificar token na blockchain: ${error.message}`);
  }
}
