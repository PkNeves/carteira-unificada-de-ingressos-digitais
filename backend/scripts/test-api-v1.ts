/**
 * Script de teste para verificar se as rotas API v1 estão funcionando
 * Execute: npx ts-node scripts/test-api-v1.ts
 */

import axios from "axios";

const BASE_URL = process.env.API_URL || "http://localhost:3000";

// Cores para output
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testHealthCheck() {
  try {
    log("\n=== Teste 1: Health Check ===", colors.blue);
    const response = await axios.get(`${BASE_URL}/health`);
    log(`✓ Health check: ${response.status} - ${JSON.stringify(response.data)}`, colors.green);
    return true;
  } catch (error: any) {
    log(`✗ Health check falhou: ${error.message}`, colors.red);
    return false;
  }
}

async function testWebhookEndpoint() {
  try {
    log("\n=== Teste 2: Webhook de Confirmação ===", colors.blue);
    const testData = {
      ticket: {
        id: "test-id",
        externalId: "test-external",
        tokenId: "123",
      },
    };
    const response = await axios.post(`${BASE_URL}/api/v1/webhooks/confirmation`, testData);
    log(`✓ Webhook recebido: ${response.status} - ${JSON.stringify(response.data)}`, colors.green);
    return true;
  } catch (error: any) {
    log(`✗ Webhook falhou: ${error.message}`, colors.red);
    if (error.response) {
      log(`  Status: ${error.response.status}`, colors.yellow);
      log(`  Data: ${JSON.stringify(error.response.data)}`, colors.yellow);
    }
    return false;
  }
}

async function testDatabaseSchema() {
  try {
    log("\n=== Teste 3: Verificação do Schema do Banco ===", colors.blue);
    
    // Usa Prisma para verificar se o campo existe
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    
    // Tenta criar um evento com postbackUrl para verificar se o campo existe
    const testEvent = await prisma.event.findFirst({
      select: {
        id: true,
        name: true,
        postbackUrl: true,
      },
    });
    
    if (testEvent) {
      log(`✓ Campo postbackUrl existe no schema`, colors.green);
      log(`  Exemplo: Evento "${testEvent.name}" tem postbackUrl: ${testEvent.postbackUrl || "null"}`, colors.yellow);
    } else {
      log(`⚠ Nenhum evento encontrado no banco`, colors.yellow);
    }
    
    await prisma.$disconnect();
    return true;
  } catch (error: any) {
    log(`✗ Erro ao verificar schema: ${error.message}`, colors.red);
    return false;
  }
}

async function main() {
  log("\n🚀 Iniciando testes da API v1...\n", colors.blue);
  
  const results = {
    healthCheck: false,
    webhook: false,
    database: false,
  };
  
  results.healthCheck = await testHealthCheck();
  results.webhook = await testWebhookEndpoint();
  results.database = await testDatabaseSchema();
  
  log("\n=== Resumo dos Testes ===", colors.blue);
  log(`Health Check: ${results.healthCheck ? "✓" : "✗"}`, results.healthCheck ? colors.green : colors.red);
  log(`Webhook: ${results.webhook ? "✓" : "✗"}`, results.webhook ? colors.green : colors.red);
  log(`Database Schema: ${results.database ? "✓" : "✗"}`, results.database ? colors.green : colors.red);
  
  const allPassed = Object.values(results).every((r) => r);
  
  if (allPassed) {
    log("\n✅ Todos os testes passaram!", colors.green);
  } else {
    log("\n⚠ Alguns testes falharam. Verifique os logs acima.", colors.yellow);
  }
  
  process.exit(allPassed ? 0 : 1);
}

main().catch((error) => {
  log(`\n✗ Erro fatal: ${error.message}`, colors.red);
  process.exit(1);
});

