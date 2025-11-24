# Ticket Wallet

Sistema de carteira de ingressos NFT. Backend em Node/TypeScript, frontend React, contratos Solidity na Sepolia.

## Tech Stack

- Backend: Node.js, TypeScript, Express
- DB: PostgreSQL + Prisma
- Blockchain: Sepolia (testnet)
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

Se quiser fazer deploy do contrato na Sepolia:

```bash
npm run hardhat:deploy:sepolia
```

Depois cola o endereço do contrato no CONTRACT_ADDRESS do .env

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
- Contrato ERC-721 na Sepolia

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
