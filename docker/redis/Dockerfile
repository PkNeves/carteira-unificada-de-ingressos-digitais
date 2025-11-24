FROM redis:7-alpine

# Cria arquivo de configuração customizado
RUN mkdir -p /usr/local/etc/redis && \
    echo "save 900 1" > /usr/local/etc/redis/redis.conf && \
    echo "save 300 10" >> /usr/local/etc/redis/redis.conf && \
    echo "save 60 10000" >> /usr/local/etc/redis/redis.conf

EXPOSE 6379

CMD ["redis-server", "/usr/local/etc/redis/redis.conf"]

