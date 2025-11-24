#!/bin/bash

# Script para testar as rotas da API v1
# Requer que o servidor esteja rodando

BASE_URL="${API_URL:-http://localhost:3000}"

echo "🧪 Testando rotas da API v1..."
echo "Base URL: $BASE_URL"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Teste 1: Health Check
echo "1. Testando Health Check..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
if [ "$response" = "200" ]; then
    echo -e "${GREEN}✓ Health check: OK${NC}"
else
    echo -e "${RED}✗ Health check falhou (status: $response)${NC}"
fi
echo ""

# Teste 2: Webhook de Confirmação (não requer autenticação)
echo "2. Testando POST /api/v1/webhooks/confirmation..."
response=$(curl -s -X POST "$BASE_URL/api/v1/webhooks/confirmation" \
  -H "Content-Type: application/json" \
  -d '{"ticket":{"id":"test","externalId":"test123"}}' \
  -w "\n%{http_code}")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ Webhook: OK${NC}"
    echo "  Response: $body"
else
    echo -e "${RED}✗ Webhook falhou (status: $http_code)${NC}"
    echo "  Response: $body"
fi
echo ""

# Teste 3: Verificar se rotas existem (vai retornar 401 sem token, mas confirma que a rota existe)
echo "3. Verificando se rotas estão registradas..."
routes=(
    "POST /api/v1/events"
    "GET /api/v1/events/:id"
    "PATCH /api/v1/events/:id"
    "DELETE /api/v1/events/:id"
    "POST /api/v1/tickets"
    "GET /api/v1/tickets/:id"
    "PATCH /api/v1/tickets/:id"
    "DELETE /api/v1/tickets/:id"
)

for route in "${routes[@]}"; do
    method=$(echo "$route" | cut -d' ' -f1)
    path=$(echo "$route" | cut -d' ' -f2- | sed 's/:id/test-id/g')
    
    if [ "$method" = "GET" ] || [ "$method" = "DELETE" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE_URL$path" \
          -H "Authorization: Bearer test-token")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE_URL$path" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer test-token" \
          -d '{}')
    fi
    
    # 401 = não autenticado (rota existe)
    # 404 = rota não existe
    # 403 = autenticado mas sem permissão (rota existe)
    if [ "$response" = "401" ] || [ "$response" = "403" ]; then
        echo -e "${GREEN}✓ $route: Rota existe (status: $response)${NC}"
    elif [ "$response" = "404" ]; then
        echo -e "${RED}✗ $route: Rota não encontrada${NC}"
    else
        echo -e "${YELLOW}? $route: Status inesperado ($response)${NC}"
    fi
done

echo ""
echo "✅ Testes concluídos!"
echo ""
echo "📝 Para testar com autenticação real:"
echo "   1. Faça login como company: POST /api/auth/login/company"
echo "   2. Use o token retornado nas requisições:"
echo "      curl -H 'Authorization: Bearer SEU_TOKEN' ..."

