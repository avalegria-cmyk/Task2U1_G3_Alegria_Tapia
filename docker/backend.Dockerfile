FROM composer:2 AS dependencies
WORKDIR /app
COPY backend/composer.* ./
RUN composer install --no-dev --prefer-dist --no-scripts --no-progress --ignore-platform-req=php
FROM php:8.4-fpm-alpine
RUN apk add --no-cache libpq && apk add --no-cache --virtual .build-deps postgresql-dev $PHPIZE_DEPS \
    && docker-php-ext-install pdo_pgsql && apk del .build-deps
WORKDIR /app
COPY backend/ ./
COPY database/migrations/ ./migrations/
COPY --from=dependencies /app/vendor ./vendor
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"
USER www-data
CMD ["php-fpm", "-F"]
