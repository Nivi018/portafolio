#!/usr/bin/env bash
# ============================================
# Script de Deploy Automatizado a Vercel
# ============================================

set -e  # Exit on error

echo "🚀 BookingSystem - Deploy Script"
echo "================================"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json no encontrado${NC}"
    echo "   Ejecuta este script desde la raíz del proyecto"
    exit 1
fi

# Verificar que git está instalado
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Error: git no está instalado${NC}"
    exit 1
fi

# Verificar que vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI no está instalado${NC}"
    echo "   Instalando..."
    npm install -g vercel
fi

echo -e "${GREEN}✅ Pre-requisitos verificados${NC}"
echo ""

# Verificar que hay cambios sin commitear
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Hay cambios sin commitear${NC}"
    echo ""
    git status --short
    echo ""
    read -p "¿Quieres hacer commit de estos cambios? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Mensaje del commit: " commit_message
        git add .
        git commit -m "$commit_message"
        echo -e "${GREEN}✅ Cambios commiteados${NC}"
    else
        echo -e "${RED}❌ Deploy cancelado${NC}"
        exit 1
    fi
fi

# Push a GitHub
echo ""
echo -e "${YELLOW}📤 Subiendo cambios a GitHub...${NC}"
git push

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al hacer push${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Cambios en GitHub${NC}"
echo ""

# Deploy a Vercel
echo -e "${YELLOW}🚀 Desplegando a Vercel...${NC}"
echo ""

# Preguntar si es producción o preview
echo "¿Qué tipo de deploy quieres?"
echo "1) Producción (main branch)"
echo "2) Preview (genera URL temporal)"
read -p "Selecciona (1/2): " -n 1 -r
echo ""

if [[ $REPLY == "1" ]]; then
    vercel --prod
else
    vercel
fi

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error en el deploy${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 ¡Deploy exitoso!${NC}"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Verifica la URL de tu app"
echo "   2. Configura el webhook de Stripe"
echo "   3. Ejecuta las migraciones en producción (si no lo has hecho)"
echo "   4. Configura tu dominio personalizado (opcional)"
echo ""
echo "📖 Ver DEPLOY_GUIDE.md para más detalles"
