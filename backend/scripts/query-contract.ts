import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

// ABI completo do contrato TicketNFT (funções view e eventos)
const CONTRACT_ABI = [
  "function name() public view returns (string)",
  "function symbol() public view returns (string)",
  "function owner() public view returns (address)",
  "function getTicketInfo(uint256 tokenId) public view returns (tuple(uint256 eventId, string ticketCode, uint256 mintedAt))",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function balanceOf(address owner) public view returns (uint256)",
  "function tokenURI(uint256 tokenId) public view returns (string)",
  "event TicketMinted(uint256 indexed tokenId, address indexed to, uint256 indexed eventId, string ticketCode)",
  "event TicketTransferred(uint256 indexed tokenId, address indexed from, address indexed to)",
];

interface QueryOptions {
  tokenId?: number;
  address?: string;
  listEvents?: boolean;
  listAllTokens?: boolean;
  fromBlock?: number;
  toBlock?: number;
}

async function queryContract(options: QueryOptions = {}) {
  const RPC_URL = process.env.SEPOLIA_RPC_URL || "http://localhost:8545";
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";

  if (!CONTRACT_ADDRESS) {
    console.error("❌ CONTRACT_ADDRESS não configurado no .env");
    console.error("💡 Execute primeiro: npm run hardhat:deploy");
    process.exit(1);
  }

  console.log("🔍 Consultando dados do contrato TicketNFT\n");
  console.log("📍 Endereço do contrato:", CONTRACT_ADDRESS);
  console.log("🌐 RPC URL:", RPC_URL);
  console.log("─".repeat(60));

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    // Verifica se o contrato existe
    const code = await provider.getCode(CONTRACT_ADDRESS);
    if (code === "0x") {
      console.error("❌ Contrato não encontrado neste endereço!");
      console.error("💡 Certifique-se de que o contrato foi deployado corretamente.");
      process.exit(1);
    }

    // Informações básicas do contrato
    console.log("\n📋 Informações do Contrato");
    console.log("─".repeat(60));
    const [name, symbol, owner] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.owner(),
    ]);
    console.log("Nome:", name);
    console.log("Símbolo:", symbol);
    console.log("Proprietário do contrato:", owner);

    // Total de tokens mintados (aproximado)
    try {
      // Como não temos totalSupply implementado, vamos contar pelos eventos
      const currentBlock = await provider.getBlockNumber();
      const filter = contract.filters.TicketMinted();
      const events = await contract.queryFilter(filter, 0, currentBlock);
      console.log("Total de NFTs mintados:", events.length);
    } catch (error) {
      console.log("Total de NFTs: Não disponível");
    }

    // Consulta token específico
    if (options.tokenId !== undefined) {
      await queryToken(contract, provider, options.tokenId);
    }

    // Consulta saldo de um endereço
    if (options.address) {
      await queryBalance(contract, options.address);
    }

    // Lista todos os tokens de um endereço
    if (options.listAllTokens && options.address) {
      await listTokensByAddress(contract, provider, options.address);
    }

    // Lista eventos
    if (options.listEvents) {
      const fromBlock = options.fromBlock || 0;
      const toBlock = options.toBlock || "latest";
      await listEvents(contract, provider, fromBlock, toBlock);
    }

    // Se nenhuma opção específica foi fornecida, mostra resumo
    if (
      options.tokenId === undefined &&
      !options.address &&
      !options.listEvents &&
      !options.listAllTokens
    ) {
      console.log("\n💡 Dicas de uso:");
      console.log("   Consultar token específico: --token-id 1");
      console.log("   Consultar saldo: --address 0x...");
      console.log("   Listar eventos: --list-events");
      console.log("   Listar todos tokens de um endereço: --list-all --address 0x...");
      console.log("\n   Exemplo completo:");
      console.log("   npx tsx scripts/query-contract.ts --token-id 1 --list-events");
    }
  } catch (error: any) {
    console.error("\n❌ Erro ao consultar contrato:", error.message);
    if (error.message.includes("network")) {
      console.error("💡 Certifique-se de que a rede local está rodando:");
      console.error("   npm run chain");
    }
    process.exit(1);
  }
}

async function queryToken(
  contract: ethers.Contract,
  provider: ethers.JsonRpcProvider,
  tokenId: number
) {
  console.log(`\n🎫 Consultando Token ID: ${tokenId}`);
  console.log("─".repeat(60));

  try {
    const [owner, ticketInfo, tokenURI] = await Promise.all([
      contract.ownerOf(tokenId),
      contract.getTicketInfo(tokenId),
      contract.tokenURI(tokenId),
    ]);

    console.log("✅ Token encontrado!");
    console.log("Proprietário:", owner);
    console.log("Event ID:", ticketInfo.eventId.toString());
    console.log("Código do Ingresso:", ticketInfo.ticketCode);
    console.log(
      "Mintado em:",
      new Date(Number(ticketInfo.mintedAt) * 1000).toLocaleString("pt-BR")
    );
    console.log("Token URI:", tokenURI);

    // Verifica saldo do proprietário
    const balance = await contract.balanceOf(owner);
    console.log(`NFTs na carteira do proprietário: ${balance.toString()}`);
  } catch (error: any) {
    if (error.message.includes("nonexistent token") || error.message.includes("does not exist")) {
      console.log(`⚠️  Token ID ${tokenId} não existe`);
    } else {
      console.error("❌ Erro:", error.message);
    }
  }
}

async function queryBalance(contract: ethers.Contract, address: string) {
  console.log(`\n💰 Consultando Saldo`);
  console.log("─".repeat(60));
  console.log("Endereço:", address);

  try {
    const balance = await contract.balanceOf(address);
    console.log(`Total de NFTs: ${balance.toString()}`);
  } catch (error: any) {
    console.error("❌ Erro ao consultar saldo:", error.message);
  }
}

async function listTokensByAddress(
  contract: ethers.Contract,
  provider: ethers.JsonRpcProvider,
  address: string
) {
  console.log(`\n📜 Listando todos os tokens do endereço: ${address}`);
  console.log("─".repeat(60));

  try {
    const currentBlock = await provider.getBlockNumber();
    const filter = contract.filters.TicketMinted(address);
    const events = await contract.queryFilter(filter, 0, currentBlock);

    if (events.length === 0) {
      console.log("Nenhum token encontrado para este endereço");
      return;
    }

    console.log(`Encontrados ${events.length} token(s):\n`);

    for (const event of events) {
      try {
        // Decodifica o evento usando a interface do contrato
        const decoded = contract.interface.decodeEventLog(
          "TicketMinted",
          event.data,
          event.topics
        );
        const tokenId = decoded.tokenId.toString();
        
        const ticketInfo = await contract.getTicketInfo(tokenId);
        console.log(`Token ID: ${tokenId}`);
        console.log(`  Event ID: ${ticketInfo.eventId.toString()}`);
        console.log(`  Código: ${ticketInfo.ticketCode}`);
        console.log(`  Mintado em: ${new Date(Number(ticketInfo.mintedAt) * 1000).toLocaleString("pt-BR")}`);
        console.log(`  TX Hash: ${event.transactionHash}`);
        console.log("");
      } catch (error: any) {
        console.log(`Erro ao processar evento: ${error.message}`);
      }
    }
  } catch (error: any) {
    console.error("❌ Erro ao listar tokens:", error.message);
  }
}

async function listEvents(
  contract: ethers.Contract,
  provider: ethers.JsonRpcProvider,
  fromBlock: number,
  toBlock: number | string
) {
  console.log("\n📜 Eventos TicketMinted");
  console.log("─".repeat(60));

  try {
    const currentBlock = await provider.getBlockNumber();
    const actualFromBlock = fromBlock || Math.max(0, currentBlock - 1000);
    const actualToBlock = toBlock === "latest" ? currentBlock : toBlock;

    console.log(`Buscando eventos do bloco ${actualFromBlock} ao ${actualToBlock}...`);

    const filter = contract.filters.TicketMinted();
    const events = await contract.queryFilter(filter, actualFromBlock, actualToBlock);

    if (events.length === 0) {
      console.log("Nenhum evento encontrado neste intervalo");
      return;
    }

    console.log(`\nEncontrados ${events.length} evento(s):\n`);

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      
      try {
        // Decodifica o evento usando a interface do contrato
        const decoded = contract.interface.decodeEventLog(
          "TicketMinted",
          event.data,
          event.topics
        );
        
        const tokenId = decoded.tokenId.toString();
        const to = decoded.to;
        const eventId = decoded.eventId.toString();
        const ticketCode = decoded.ticketCode;

        console.log(`Evento ${i + 1}:`);
        console.log(`  Token ID: ${tokenId}`);
        console.log(`  Para: ${to}`);
        console.log(`  Event ID: ${eventId}`);
        console.log(`  Código do Ingresso: ${ticketCode}`);
        console.log(`  Bloco: ${event.blockNumber}`);
        console.log(`  TX Hash: ${event.transactionHash}`);

        // Obtém detalhes da transação
        try {
          const receipt = await provider.getTransactionReceipt(event.transactionHash);
          if (receipt) {
            console.log(`  Gas usado: ${receipt.gasUsed.toString()}`);
            console.log(`  Status: ${receipt.status === 1 ? "✅ Sucesso" : "❌ Falhou"}`);
          }
        } catch (error) {
          // Ignora erros ao buscar detalhes da transação
        }

        console.log("");
      } catch (error: any) {
        console.log(`Erro ao processar evento ${i + 1}: ${error.message}`);
      }
    }
  } catch (error: any) {
    console.error("❌ Erro ao listar eventos:", error.message);
  }
}

// Parse argumentos da linha de comando
function parseArgs(): QueryOptions {
  const args = process.argv.slice(2);
  const options: QueryOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--token-id":
        options.tokenId = parseInt(args[++i]);
        break;
      case "--address":
        options.address = args[++i];
        break;
      case "--list-events":
        options.listEvents = true;
        break;
      case "--list-all":
        options.listAllTokens = true;
        break;
      case "--from-block":
        options.fromBlock = parseInt(args[++i]);
        break;
      case "--to-block":
        options.toBlock = parseInt(args[++i]);
        break;
      case "--help":
        console.log(`
Uso: npx tsx scripts/query-contract.ts [opções]

Opções:
  --token-id <id>        Consulta um token específico pelo ID
  --address <addr>       Consulta saldo de NFTs de um endereço
  --list-events          Lista todos os eventos TicketMinted
  --list-all             Lista todos os tokens de um endereço (requer --address)
  --from-block <num>     Bloco inicial para buscar eventos (padrão: 0)
  --to-block <num>       Bloco final para buscar eventos (padrão: latest)
  --help                 Mostra esta ajuda

Exemplos:
  npx tsx scripts/query-contract.ts --token-id 1
  npx tsx scripts/query-contract.ts --address 0x123... --list-all
  npx tsx scripts/query-contract.ts --list-events --from-block 0 --to-block 100
  npx tsx scripts/query-contract.ts --token-id 1 --list-events
        `);
        process.exit(0);
    }
  }

  return options;
}

// Executa o script
const options = parseArgs();
queryContract(options)
  .then(() => {
    console.log("\n✅ Consulta concluída!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });

