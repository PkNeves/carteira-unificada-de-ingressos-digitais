export type BlockchainNetwork =
  | "sepolia"
  | "polygon"
  | "polygon-mumbai"
  | "localhost";

export interface BlockchainConfig {
  network: BlockchainNetwork;
  rpcUrl: string;
}

function getBlockchainNetwork(): BlockchainNetwork {
  const networkEnv = process.env.BLOCKCHAIN_NETWORK || "sepolia";
  const network = networkEnv.toLowerCase() as BlockchainNetwork;

  const validNetworks: BlockchainNetwork[] = [
    "sepolia",
    "polygon",
    "polygon-mumbai",
    "localhost",
  ];

  if (!validNetworks.includes(network)) {
    throw new Error(
      `Rede blockchain não suportada: ${network}. ` +
        `Redes válidas: ${validNetworks.join(", ")}`
    );
  }

  return network;
}

function getBlockchainRpcUrl(): string {
  const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;

  if (!rpcUrl) {
    throw new Error(
      "BLOCKCHAIN_RPC_URL não configurada. Configure a variável de ambiente BLOCKCHAIN_RPC_URL."
    );
  }

  return rpcUrl;
}

export function getBlockchainConfig(): BlockchainConfig {
  const network = getBlockchainNetwork();
  const rpcUrl = getBlockchainRpcUrl();

  return { network, rpcUrl };
}
