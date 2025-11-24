FROM node:18-alpine

WORKDIR /app

# Instala dependências
COPY package*.json ./
RUN npm ci --include=dev

# Copia código fonte
COPY . .

# Expõe porta do Vite
EXPOSE 5173

# Inicia servidor de desenvolvimento Vite
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

