import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🔍 Testando configuração do Alchemy...\n");

  // Testa conexão via Hardhat
  console.log("1. Testando conexão via Hardhat (network: sepolia)");
  try {
    const provider = ethers.provider;
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    
    console.log("   ✅ Conexão estabelecida!");
    console.log("   Rede:", network.name);
    console.log("   Chain ID:", network.chainId.toString());
    console.log("   Block atual:", blockNumber);
    
    const [signer] = await ethers.getSigners();
    console.log("   Conta deployer:", signer.address);
    
    const balance = await provider.getBalance(signer.address);
    console.log("   Saldo:", ethers.formatEther(balance), "ETH");
    
    if (balance === 0n) {
      console.log("   ⚠️  Atenção: Conta sem saldo! Você precisará de ETH para gas.");
    }
  } catch (error: any) {
    console.log("   ❌ Erro:", error.message);
    return;
  }

  console.log("\n2. Testando conexão direta via ethers.js");
  try {
    const RPC_URL = process.env.SEPOLIA_RPC_URL || "";
    
    if (!RPC_URL) {
      console.log("   ❌ SEPOLIA_RPC_URL não configurado");
      return;
    }
    
    console.log("   RPC URL:", RPC_URL.substring(0, 50) + "...");
    
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const blockNumber = await provider.getBlockNumber();
    const network = await provider.getNetwork();
    
    console.log("   ✅ Conexão estabelecida!");
    console.log("   Block atual:", blockNumber);
    console.log("   Chain ID:", network.chainId.toString());
  } catch (error: any) {
    console.log("   ❌ Erro:", error.message);
    return;
  }

  console.log("\n3. Verificando variáveis de ambiente");
  console.log("   ALCHEMY_API_KEY:", process.env.ALCHEMY_API_KEY ? "✅ Configurada" : "❌ Não configurada");
  console.log("   SEPOLIA_RPC_URL:", process.env.SEPOLIA_RPC_URL ? "✅ Configurada" : "❌ Não configurada");
  console.log("   CONTRACT_ADDRESS:", process.env.CONTRACT_ADDRESS || "⚠️  Não configurado (faça deploy primeiro)");
  console.log("   PRIVATE_KEY:", process.env.PRIVATE_KEY ? "✅ Configurada" : "⚠️  Não configurada (usando padrão)");
  console.log("   SYSTEM_WALLET_PRIVATE_KEY:", process.env.SYSTEM_WALLET_PRIVATE_KEY ? "✅ Configurada" : "⚠️  Não configurada (usando padrão)");

  console.log("\n✅ Todos os testes concluídos!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



