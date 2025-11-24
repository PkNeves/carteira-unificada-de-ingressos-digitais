#!/bin/sh
set -e

echo "Aguardando PostgreSQL estar pronto..."

# Aguarda PostgreSQL estar disponível
until nc -z postgres 5432; do
  echo "PostgreSQL não está pronto ainda. Aguardando..."
  sleep 1
done

echo "PostgreSQL está pronto!"

# Executa migrations ou push do schema
echo "Aplicando schema do Prisma..."
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations)" ]; then
  echo "Executando migrations..."
  npx prisma migrate deploy || echo "Erro ao executar migrations, tentando db push..."
  npx prisma db push --accept-data-loss || echo "Erro ao fazer push do schema"
else
  echo "Nenhuma migration encontrada, fazendo push do schema..."
  npx prisma db push --accept-data-loss || echo "Erro ao fazer push do schema"
fi

# Executa comando passado
exec "$@"

