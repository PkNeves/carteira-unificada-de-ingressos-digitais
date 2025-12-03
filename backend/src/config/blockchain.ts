export type BlockchainNetwork =
  | "sepolia"
  | "polygon"
  | "polygon-mumbai"
  | "localhost";

export interface BlockchainConfig {
  network: BlockchainNetwork;
  rpcUrl: string;
}

export function getBlockchainConfig(): BlockchainConfig {
  const network = (
    process.env.BLOCKCHAIN_NETWORK || "sepolia"
  ).toLowerCase() as BlockchainNetwork;

  const validNetworks: BlockchainNetwork[] = [
    "sepolia",
    "polygon",
    "polygon-mumbai",
    "localhost",
  ];
  if (!validNetworks.includes(network)) {
    throw new Error(`Rede não suportada: ${network}`);
  }

  const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
  if (!rpcUrl) {
    throw new Error("BLOCKCHAIN_RPC_URL não configurada");
  }

  return { network, rpcUrl };
}
