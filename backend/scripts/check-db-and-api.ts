/**
 * Script para verificar o banco de dados e testar a API
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log("\n=== Verificando Banco de Dados ===\n");
  
  try {
    // Verifica se o campo postbackUrl existe tentando fazer uma query
    const events = await prisma.event.findMany({
      take: 1,
      select: {
        id: true,
        name: true,
        postbackUrl: true,
        active: true,
        createdAt: true,
      },
    });
    
    console.log("✓ Conexão com banco de dados OK");
    console.log(`✓ Campo 'postbackUrl' existe no modelo Event`);
    
    if (events.length > 0) {
      console.log(`\nExemplo de evento encontrado:`);
      console.log(`  - ID: ${events[0].id}`);
      console.log(`  - Nome: ${events[0].name}`);
      console.log(`  - postbackUrl: ${events[0].postbackUrl || "null"}`);
      console.log(`  - Ativo: ${events[0].active}`);
    } else {
      console.log("\n⚠ Nenhum evento encontrado no banco");
    }
    
    // Testa criar um evento com postbackUrl
    console.log("\n=== Testando criação de evento com postbackUrl ===");
    const testEvent = await prisma.event.create({
      data: {
        companyId: (await prisma.company.findFirst({ select: { id: true } }))?.id || "test-company-id",
        name: "Evento Teste API v1",
        externalId: `test-${Date.now()}`,
        startDate: new Date(),
        postbackUrl: "https://example.com/webhook",
        active: true,
      },
    });
    
    console.log(`✓ Evento criado com sucesso:`);
    console.log(`  - ID: ${testEvent.id}`);
    console.log(`  - postbackUrl: ${testEvent.postbackUrl}`);
    
    // Limpa o evento de teste
    await prisma.event.delete({
      where: { id: testEvent.id },
    });
    console.log("✓ Evento de teste removido");
    
    return true;
  } catch (error: any) {
    console.error("✗ Erro ao verificar banco de dados:", error.message);
    if (error.message.includes("Unknown column") || error.message.includes("does not exist")) {
      console.error("  ⚠ O campo 'postbackUrl' pode não ter sido criado no banco!");
      console.error("  Execute: npx prisma migrate dev");
    }
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log("🔍 Verificando implementação da API v1...\n");
  
  const dbOk = await checkDatabase();
  
  console.log("\n=== Resumo ===");
  if (dbOk) {
    console.log("✅ Banco de dados: OK");
    console.log("✅ Campo postbackUrl: Existe e funciona");
  } else {
    console.log("❌ Banco de dados: Erro");
  }
  
  console.log("\n📝 Próximos passos:");
  console.log("  1. Inicie o servidor: npm run dev");
  console.log("  2. Teste as rotas da API v1:");
  console.log("     - POST /api/v1/events");
  console.log("     - GET /api/v1/events/:id");
  console.log("     - PATCH /api/v1/events/:id");
  console.log("     - DELETE /api/v1/events/:id");
  console.log("     - POST /api/v1/tickets");
  console.log("     - GET /api/v1/tickets/:id");
  console.log("     - PATCH /api/v1/tickets/:id");
  console.log("     - DELETE /api/v1/tickets/:id");
  console.log("     - POST /api/v1/webhooks/confirmation");
  
  process.exit(dbOk ? 0 : 1);
}

main().catch((error) => {
  console.error("Erro fatal:", error);
  process.exit(1);
});

