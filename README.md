# Ticket Wallet

Sistema de carteira de ingressos NFT. Backend em Node/TypeScript, frontend React, contratos Solidity com suporte multi-rede.

## Tech Stack

- Backend: Node.js, TypeScript, Express
- DB: PostgreSQL + Prisma
- Blockchain: Suporte dinâmico para múltiplas redes (Sepolia, Polygon, Polygon Mumbai, localhost)
- Contratos: ERC-721 (OpenZeppelin)
- Frontend: React + Vite
- Fila: Bull + Redis

## Setup

### Com Docker

Precisa ter Docker e Docker Compose instalados.

1. Copie os .env de exemplo:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

2. Se quiser gerar um JWT_SECRET (opcional, tem padrão pra dev):

```bash
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

Cola no backend/.env

3. Roda tudo:

```bash
docker-compose up
```

Backend: http://localhost:3001  
Frontend: http://localhost:5174

### Sem Docker

Backend:

```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npm run hardhat:compile
npm run dev
```

### Configuração de Rede Blockchain

O sistema suporta múltiplas redes blockchain através de variáveis de ambiente genéricas:

**Variáveis de ambiente (backend/.env):**

```bash
# Rede blockchain (sepolia | polygon | polygon-mumbai | localhost)
BLOCKCHAIN_NETWORK=sepolia

# RPC URL (obrigatória) - use qualquer provedor RPC (Alchemy, Infura, QuickNode, etc)
BLOCKCHAIN_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/SUA_KEY

# Endereço do contrato deployado na rede escolhida
CONTRACT_ADDRESS=0x...

# Chave privada da carteira do sistema (OBRIGATÓRIA)
# IMPORTANTE: Esta deve ser a MESMA carteira que faz o deploy do contrato
# O contrato tem restrição onlyOwner, então apenas quem fez deploy pode mintar tickets
SYSTEM_WALLET_PRIVATE_KEY=0x...

# Obrigatória: para verificação de contratos no explorer (Etherscan API V2)
# Funciona para todas as redes: Ethereum, Sepolia, Polygon, Polygon Mumbai
# Obtenha em: https://etherscan.io/myapikey
ETHERSCAN_V2_API_KEY=sua_chave
```

**Deploy do contrato:**

⚠️ **IMPORTANTE**: Configure `SYSTEM_WALLET_PRIVATE_KEY` no `.env` ANTES de fazer o deploy. A mesma carteira que faz deploy será owner do contrato e será usada para mintar tickets.

```bash
# Sepolia (testnet Ethereum)
npm run hardhat:deploy:sepolia

# Polygon Mainnet
npm run hardhat:deploy:polygon

# Polygon Mumbai (testnet)
npm run hardhat:deploy:polygon-mumbai

# Localhost (Hardhat)
npm run hardhat:deploy
```

Depois do deploy:
1. Copie o endereço do contrato para `CONTRACT_ADDRESS` no `.env`
2. Certifique-se de que `SYSTEM_WALLET_PRIVATE_KEY` está configurada com a mesma chave usada no deploy

Frontend:

```bash
cd frontend
npm install
cp .env.example .env
# Coloca VITE_API_URL=http://localhost:3001/api
npm run dev
```

## O que faz

Usuários podem se registrar, receber ingressos como NFT e ver na carteira. Companies criam eventos e distribuem ingressos. Os tickets são sincronizados automaticamente pra blockchain quando a data do evento chega.

- Carteira custodiada (chaves criptografadas)
- Sincronização automática off-chain -> on-chain
- Contrato ERC-721 compatível com múltiplas redes
- Sistema dinâmico de configuração de rede blockchain

## API

Principais endpoints:

- `POST /api/auth/user/register` - Registro de usuário
- `POST /api/auth/user/login` - Login
- `POST /api/auth/company/register` - Registro de company
- `POST /api/events` - Criar evento (company)
- `GET /api/events` - Listar eventos
- `POST /api/events/:eventoId/tickets` - Criar ingressos
- `GET /api/tickets` - Listar ingressos do usuário
- `GET /api/tickets/:id` - Detalhes do ingresso
