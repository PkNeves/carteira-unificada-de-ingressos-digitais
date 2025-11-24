import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("\n🚀 Deployando contrato TicketNFT...");
  console.log("📡 Rede:", network.name, `(Chain ID: ${network.chainId})`);
  console.log("👤 Conta deployer:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Saldo da conta:", ethers.formatEther(balance), "ETH");

  if (network.chainId !== 1337n && balance === 0n) {
    console.warn("⚠️  Atenção: Conta sem saldo! Você pode precisar de ETH para gas.");
  }

  const TicketNFT = await ethers.getContractFactory("TicketNFT");
  console.log("\n⏳ Fazendo deploy...");
  
  const ticketNFT = await TicketNFT.deploy(deployer.address);

  await ticketNFT.waitForDeployment();

  const address = await ticketNFT.getAddress();
  console.log("\n✅ Contrato TicketNFT deployado com sucesso!");
  console.log("📍 Endereço do contrato:", address);
  console.log("\n💡 Adicione no arquivo .env:");
  console.log(`CONTRACT_ADDRESS=${address}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

