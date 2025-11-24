/**
 * Script para verificar o status do processo de mintagem
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkMintingStatus() {
  console.log("\n🔍 Verificando status do processo de mintagem...\n");

  // 1. Verificar variáveis de ambiente
  console.log("1. 📋 Variáveis de Ambiente:");
  const rpcUrl = process.env.SEPOLIA_RPC_URL || "http://localhost:8545";
  const contractAddress = process.env.CONTRACT_ADDRESS || "";
  const systemWallet = process.env.SYSTEM_WALLET_PRIVATE_KEY || "";

  console.log(
    `   RPC_URL: ${
      rpcUrl.includes("alchemy") || rpcUrl.includes("sepolia")
        ? "✅ Sepolia"
        : "⚠️  Localhost"
    }`
  );
  console.log(
    `   CONTRACT_ADDRESS: ${
      contractAddress
        ? `✅ ${contractAddress.substring(0, 10)}...`
        : "❌ Não configurado"
    }`
  );
  console.log(
    `   SYSTEM_WALLET_PRIVATE_KEY: ${
      systemWallet ? "✅ Configurada" : "⚠️  Usando padrão (Hardhat)"
    }`
  );

  // 2. Verificar tickets no banco
  console.log("\n2. 🎫 Tickets no Banco:");

  const allTickets = await prisma.ticket.findMany({
    include: {
      owner: {
        select: {
          email: true,
          walletAddress: true,
        },
      },
    },
  });

  console.log(`   Total de tickets: ${allTickets.length}`);

  const ticketsByStatus = {
    valid: allTickets.filter((t) => t.status === "valid"),
    canceled: allTickets.filter((t) => t.status === "canceled"),
    minted: allTickets.filter((t) => t.status === "minted"),
  };

  console.log(`   - Válidos: ${ticketsByStatus.valid.length}`);
  console.log(`   - Cancelados: ${ticketsByStatus.canceled.length}`);
  console.log(`   - Mintados: ${ticketsByStatus.minted.length}`);

  // 3. Verificar tickets pendentes de mintagem
  console.log("\n3. ⏳ Tickets Pendentes de Mintagem:");

  const pendingTickets = await prisma.ticket.findMany({
    where: {
      status: "valid",
      tokenId: null,
    },
    include: {
      owner: {
        select: {
          email: true,
          walletAddress: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  console.log(`   Tickets pendentes: ${pendingTickets.length}`);

  if (pendingTickets.length > 0) {
    console.log("\n   Detalhes dos tickets pendentes:");
    for (const ticket of pendingTickets) {
      const hasWallet = !!ticket.owner.walletAddress;
      const startDate = new Date(ticket.startDate);
      const now = new Date();
      const canMint = ticket.status === "valid" && now >= startDate;

      console.log(`\n   📌 Ticket ${ticket.id.substring(0, 8)}...`);
      console.log(`      Nome: ${ticket.name}`);
      console.log(`      Owner: ${ticket.owner.email}`);
      console.log(`      Wallet: ${hasWallet ? "✅" : "❌ Não possui"}`);
      console.log(`      Status: ${ticket.status}`);
      console.log(`      Data início ticket: ${startDate.toISOString()}`);
      console.log(`      Pode mintar agora: ${canMint ? "✅ Sim" : "❌ Não"}`);

      if (!canMint) {
        const diff = startDate.getTime() - now.getTime();
        const minutes = Math.ceil(diff / (1000 * 60));
        console.log(`      ⏰ Aguardando: ${minutes} minutos`);
      }
    }
  }

  // 4. Verificar tickets já mintados
  console.log("\n4. ✅ Tickets Já Mintados:");

  const mintedTickets = await prisma.ticket.findMany({
    where: {
      tokenId: { not: null },
    },
    select: {
      id: true,
      name: true,
      tokenId: true,
      txHash: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  console.log(`   Total mintados: ${mintedTickets.length}`);

  if (mintedTickets.length > 0) {
    console.log("\n   Últimos tickets mintados:");
    for (const ticket of mintedTickets) {
      console.log(`   📌 ${ticket.name}`);
      console.log(`      Token ID: ${ticket.tokenId}`);
      console.log(`      TX Hash: ${ticket.txHash?.substring(0, 20)}...`);
      console.log(`      Data: ${ticket.createdAt.toISOString()}`);
    }
  }

  // 5. Verificar configuração do Redis (para filas)
  console.log("\n5. 🔄 Sistema de Filas:");
  const redisHost = process.env.REDIS_HOST || "localhost";
  const redisPort = process.env.REDIS_PORT || "6379";

  console.log(`   Redis Host: ${redisHost}`);
  console.log(`   Redis Port: ${redisPort}`);
  console.log(
    `   Status: ${
      process.env.REDIS_HOST
        ? "✅ Configurado"
        : "⚠️  Usando padrão (localhost)"
    }`
  );

  // 6. Resumo e recomendações
  console.log("\n6. 📊 Resumo:");

  const issues: string[] = [];

  if (!contractAddress) {
    issues.push(
      "❌ CONTRACT_ADDRESS não configurado - necessário fazer deploy do contrato"
    );
  }

  if (pendingTickets.length > 0) {
    const now = new Date();
    const readyToMint = pendingTickets.filter(
      (t) => t.status === "valid" && new Date(t.startDate) <= now
    );
    const notReady = pendingTickets.length - readyToMint.length;

    if (readyToMint.length > 0) {
      const withoutWallet = readyToMint.filter((t) => !t.owner.walletAddress);
      if (withoutWallet.length > 0) {
        issues.push(
          `⚠️  ${withoutWallet.length} ticket(s) pronto(s) mas sem wallet do owner`
        );
      } else {
        console.log(
          `   ✅ ${readyToMint.length} ticket(s) pronto(s) para mintagem`
        );
      }
    }

    if (notReady > 0) {
      console.log(`   ⏳ ${notReady} ticket(s) aguardando startDate do ticket`);
    }
  } else {
    console.log("   ✅ Nenhum ticket pendente");
  }

  if (issues.length > 0) {
    console.log("\n⚠️  Problemas encontrados:");
    issues.forEach((issue) => console.log(`   ${issue}`));
  } else {
    console.log("   ✅ Tudo parece estar configurado corretamente!");
  }

  console.log("\n💡 Para processar tickets pendentes manualmente:");
  console.log("   curl -X POST http://localhost:3000/api/sync/process");

  console.log("\n💡 Para verificar se o agendador está rodando:");
  console.log(
    "   Verifique os logs do servidor por: 'Agendador de sincronização iniciado'"
  );
}

async function main() {
  try {
    await checkMintingStatus();
  } catch (error: any) {
    console.error("\n❌ Erro ao verificar status:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
