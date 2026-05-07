#!/bin/bash
# ============================================
# CalApp01 — Environment Switcher
# ============================================
# Скрипт для переключения между локальной разработкой и продакшеном.
# Использование: ./switch-env.sh [local|production]

set -e

ENV=$1

if [[ "$ENV" != "local" && "$ENV" != "production" ]]; then
    echo "Usage: $0 [local|production]"
    echo "  local      - настройки для локальной разработки"
    echo "  production - настройки для продакшена на VPS"
    exit 1
fi

echo "Переключаем окружение на $ENV..."

# 1. Обновляем переменную ENVIRONMENT в .env файле
if [[ -f .env ]]; then
    if grep -q "^ENVIRONMENT=" .env; then
        sed -i.bak "s/^ENVIRONMENT=.*/ENVIRONMENT=$ENV/" .env
    else
        echo "ENVIRONMENT=$ENV" >> .env
    fi
    echo "✓ Обновлен .env (ENVIRONMENT=$ENV)"
else
    echo "⚠ Файл .env не найден. Создайте его из .env.example"
fi

# 2. Выбираем правильный Caddyfile
if [[ "$ENV" == "local" ]]; then
    CADDY_SOURCE="Caddyfile.local"
else
    CADDY_SOURCE="Caddyfile"
fi

if [[ -f "$CADDY_SOURCE" ]]; then
    # В продакшене Caddyfile уже правильный, в локальной разработке
    # используем docker-compose.local.yml для переопределения.
    echo "✓ Используется $CADDY_SOURCE для Caddy"
else
    echo "⚠ Файл $CADDY_SOURCE не найден"
fi

# 3. Подсказка по командам запуска
echo ""
echo "=== Готово ==="
if [[ "$ENV" == "local" ]]; then
    echo "Для запуска в локальном режиме используйте:"
    echo "  docker-compose -f docker-compose.yml -f docker-compose.local.yml up"
    echo ""
    echo "Или используйте скрипт run-caddy-local.ps1 (Windows)"
else
    echo "Для запуска в продакшен-режиме используйте:"
    echo "  docker-compose up -d"
    echo ""
    echo "Убедитесь, что в .env установлены правильные домены и секреты."
fi