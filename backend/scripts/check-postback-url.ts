/**
 * Script para verificar se o campo postbackUrl existe no banco
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkPostbackUrl() {
  try {
    console.log("Verificando se o campo postbackUrl existe...\n");

    // Tenta fazer uma query que inclui postbackUrl
    const events = await prisma.event.findMany({
      take: 1,
      select: {
        id: true,
        name: true,
        postbackUrl: true,
      },
    });

    console.log("✅ Campo postbackUrl existe e está acessível!");
    console.log(`   Exemplo: ${events.length > 0 ? "Evento encontrado" : "Nenhum evento no banco"}`);
    
    if (events.length > 0) {
      console.log(`   postbackUrl do primeiro evento: ${events[0].postbackUrl || "null"}`);
    }

    // Tenta criar um evento de teste com postbackUrl
    console.log("\nTestando criação de evento com postbackUrl...");
    const testEvent = await prisma.event.create({
      data: {
        companyId: (await prisma.company.findFirst({ select: { id: true } }))?.id || "test-id",
        name: "Teste postbackUrl",
        externalId: `test-${Date.now()}`,
        startDate: new Date(),
        postbackUrl: "https://example.com/webhook",
      },
    });

    console.log(`✅ Evento criado com sucesso!`);
    console.log(`   ID: ${testEvent.id}`);
    console.log(`   postbackUrl: ${testEvent.postbackUrl}`);

    // Limpa o evento de teste
    await prisma.event.delete({
      where: { id: testEvent.id },
    });
    console.log("✅ Evento de teste removido");

    console.log("\n✅ Tudo funcionando! O campo postbackUrl está disponível.");
    console.log("\n⚠️  Se você ainda está vendo erros:");
    console.log("   1. Reinicie o servidor (o Prisma Client foi regenerado)");
    console.log("   2. Certifique-se de que está usando a versão mais recente do código");
  } catch (error: any) {
    console.error("\n❌ Erro:", error.message);
    
    if (error.message.includes("Unknown argument") || error.message.includes("postbackUrl")) {
      console.error("\n⚠️  O Prisma Client não reconhece o campo postbackUrl.");
      console.error("   Isso pode significar:");
      console.error("   1. O Prisma Client não foi regenerado após adicionar o campo");
      console.error("   2. O servidor está usando uma versão antiga em cache");
      console.error("\n   Solução:");
      console.error("   1. Execute: npx prisma generate");
      console.error("   2. Reinicie o servidor completamente");
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkPostbackUrl();

