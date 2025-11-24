import * as dotenv from "dotenv";
dotenv.config();

import { ethers } from "ethers";

async function main() {
  console.log("🔍 Testando conexão do backend com Alchemy Sepolia...\n");

  const RPC_URL = process.env.SEPOLIA_RPC_URL || "http://localhost:8545";
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";
  const SYSTEM_WALLET_PRIVATE_KEY =
    process.env.SYSTEM_WALLET_PRIVATE_KEY ||
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

  console.log("1. Verificando configuração");
  console.log("   RPC_URL:", RPC_URL.includes("alchemy") ? "✅ Alchemy Sepolia" : "⚠️  Localhost");
  console.log("   CONTRACT_ADDRESS:", CONTRACT_ADDRESS || "⚠️  Não configurado");
  console.log("   SYSTEM_WALLET_PRIVATE_KEY:", SYSTEM_WALLET_PRIVATE_KEY ? "✅ Configurada" : "❌ Não configurada");

  console.log("\n2. Testando conexão com provider");
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const blockNumber = await provider.getBlockNumber();
    const network = await provider.getNetwork();
    
    console.log("   ✅ Conexão estabelecida!");
    console.log("   Block atual:", blockNumber);
    console.log("   Chain ID:", network.chainId.toString());
  } catch (error: any) {
    console.log("   ❌ Erro ao conectar:", error.message);
    return;
  }

  console.log("\n3. Testando carteira do sistema");
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const systemWallet = new ethers.Wallet(SYSTEM_WALLET_PRIVATE_KEY, provider);
    
    console.log("   Endereço da carteira:", systemWallet.address);
    
    const balance = await provider.getBalance(systemWallet.address);
    console.log("   Saldo:", ethers.formatEther(balance), "ETH");
    
    if (balance === 0n) {
      console.log("   ⚠️  ATENÇÃO: Carteira sem saldo! Você precisa de ETH na Sepolia para pagar gas.");
      console.log("   💡 Use um faucet: https://sepoliafaucet.com/");
    } else if (balance < ethers.parseEther("0.001")) {
      console.log("   ⚠️  Saldo muito baixo! Considere adicionar mais ETH.");
    } else {
      console.log("   ✅ Saldo suficiente para transações");
    }
  } catch (error: any) {
    console.log("   ❌ Erro:", error.message);
    return;
  }

  if (CONTRACT_ADDRESS) {
    console.log("\n4. Testando conexão com contrato");
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contractABI = [
        "function name() public view returns (string)",
        "function symbol() public view returns (string)",
      ];
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);
      const name = await contract.name();
      const symbol = await contract.symbol();
      
      console.log("   ✅ Contrato acessível!");
      console.log("   Nome:", name);
      console.log("   Símbolo:", symbol);
    } catch (error: any) {
      console.log("   ⚠️  Não foi possível acessar o contrato:", error.message);
      console.log("   Isso é normal se o contrato ainda não foi deployado na Sepolia");
    }
  } else {
    console.log("\n4. ⏭️  Pulando teste de contrato (CONTRACT_ADDRESS não configurado)");
  }

  console.log("\n✅ Testes concluídos!");
  console.log("\n📝 Próximos passos:");
  console.log("   1. Se a carteira não tem saldo, adicione ETH usando um faucet");
  console.log("   2. Faça deploy do contrato: npm run hardhat:deploy:sepolia");
  console.log("   3. Configure CONTRACT_ADDRESS no .env após o deploy");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



