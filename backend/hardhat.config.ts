import * as dotenv from "dotenv";

dotenv.config();

import { HardhatUserConfig } from "hardhat/config";

import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "@nomicfoundation/hardhat-verify";
import "hardhat-deploy";
import "hardhat-deploy-ethers";

function getDeployerPrivateKey(): string {
  const key = process.env.SYSTEM_WALLET_PRIVATE_KEY;

  if (!key) {
    throw new Error("SYSTEM_WALLET_PRIVATE_KEY não configurada no .env");
  }

  if (!key.startsWith("0x") || key.length !== 66) {
    throw new Error(
      "SYSTEM_WALLET_PRIVATE_KEY inválida. Deve começar com 0x e ter 66 caracteres"
    );
  }

  return key;
}

function getEtherscanApiKey(): string {
  const key = process.env.ETHERSCAN_V2_API_KEY;

  if (!key) {
    throw new Error("ETHERSCAN_V2_API_KEY não configurada no .env");
  }

  return key;
}

const deployerPrivateKey = getDeployerPrivateKey();
const etherscanApiKey = getEtherscanApiKey();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
    ],
  },
  defaultNetwork: "localhost",
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
      forking: {
        url: process.env.BLOCKCHAIN_RPC_URL || "http://localhost:8545",
        enabled: process.env.MAINNET_FORKING_ENABLED === "true",
      },
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
    },
    sepolia: {
      url: process.env.BLOCKCHAIN_RPC_URL || "",
      accounts: [deployerPrivateKey],
    },
    polygon: {
      url: process.env.BLOCKCHAIN_RPC_URL || "",
      accounts: [deployerPrivateKey],
      chainId: 137,
    },
    polygonMumbai: {
      url: process.env.BLOCKCHAIN_RPC_URL || "",
      accounts: [deployerPrivateKey],
      chainId: 80001,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  etherscan: {
    apiKey: {
      mainnet: etherscanApiKey,
      sepolia: etherscanApiKey,
      polygon: etherscanApiKey,
      polygonMumbai: etherscanApiKey,
    },
  },
  verify: {
    etherscan: {
      apiKey: etherscanApiKey,
    },
  },
  sourcify: {
    enabled: false,
  },
};

export default config;
