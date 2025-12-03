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

const systemWalletKey = process.env.SYSTEM_WALLET_PRIVATE_KEY || "";
const deployerPrivateKey =
  systemWalletKey &&
  systemWalletKey.startsWith("0x") &&
  systemWalletKey.length === 66
    ? systemWalletKey
    : "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const etherscanApiKey =
  process.env.ETHERSCAN_V2_API_KEY || "DNXJA8RX2Q3VZ4URQIWP7Z68CJXQZSC6AW";

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
        url: process.env.BLOCKCHAIN_RPC_URL,
        enabled: process.env.MAINNET_FORKING_ENABLED === "true",
      },
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
    },
    sepolia: {
      url: process.env.BLOCKCHAIN_RPC_URL,
      accounts: [deployerPrivateKey],
    },
    polygon: {
      url: process.env.BLOCKCHAIN_RPC_URL,
      accounts: [deployerPrivateKey],
      chainId: 137,
    },
    polygonMumbai: {
      url: process.env.BLOCKCHAIN_RPC_URL,
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
      polygon: process.env.POLYGONSCAN_API_KEY || etherscanApiKey,
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || etherscanApiKey,
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
