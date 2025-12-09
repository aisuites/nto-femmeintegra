#!/bin/bash

# ============================================
# Script para Ativar/Desativar Sidebar Fixo
# ============================================
# 
# Uso:
#   ./toggle_sidebar_fixo.sh ativar
#   ./toggle_sidebar_fixo.sh desativar
#   ./toggle_sidebar_fixo.sh status
#
# ============================================

CSS_FILE="frontend/static/css/base_app.css"
BACKUP_FILE="frontend/static/css/base_app.css.backup"

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se arquivo existe
if [ ! -f "$CSS_FILE" ]; then
    echo -e "${RED}❌ Erro: Arquivo $CSS_FILE não encontrado!${NC}"
    exit 1
fi

# Função para verificar status atual
check_status() {
    if grep -q "^\.sidebar { position: sticky;" "$CSS_FILE"; then
        echo -e "${GREEN}✅ Sidebar fixo está ATIVADO${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Sidebar fixo está DESATIVADO${NC}"
        return 1
    fi
}

# Função para ativar
ativar() {
    echo -e "${BLUE}🔄 Ativando sidebar fixo...${NC}"
    
    # Criar backup se não existir
    if [ ! -f "$BACKUP_FILE" ]; then
        cp "$CSS_FILE" "$BACKUP_FILE"
        echo -e "${GREEN}📦 Backup criado: $BACKUP_FILE${NC}"
    fi
    
    # Descomentar a linha
    sed -i.tmp 's|^/\* \.sidebar { position: sticky;.*} \*/$|.sidebar { position: sticky; top: 88px; align-self: flex-start; max-height: calc(100vh - 108px); overflow-y: auto; }|' "$CSS_FILE"
    rm -f "${CSS_FILE}.tmp"
    
    echo -e "${GREEN}✅ Sidebar fixo ATIVADO com sucesso!${NC}"
    echo -e "${YELLOW}💡 Recarregue a página com Ctrl+F5 para ver as mudanças${NC}"
}

# Função para desativar
desativar() {
    echo -e "${BLUE}🔄 Desativando sidebar fixo...${NC}"
    
    # Comentar a linha
    sed -i.tmp 's|^\.sidebar { position: sticky; top: 88px; align-self: flex-start; max-height: calc(100vh - 108px); overflow-y: auto; }$|/* .sidebar { position: sticky; top: 88px; align-self: flex-start; max-height: calc(100vh - 108px); overflow-y: auto; } */|' "$CSS_FILE"
    rm -f "${CSS_FILE}.tmp"
    
    echo -e "${GREEN}✅ Sidebar fixo DESATIVADO com sucesso!${NC}"
    echo -e "${YELLOW}💡 Recarregue a página com Ctrl+F5 para ver as mudanças${NC}"
}

# Função para restaurar backup
restaurar() {
    if [ ! -f "$BACKUP_FILE" ]; then
        echo -e "${RED}❌ Erro: Backup não encontrado!${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}🔄 Restaurando backup...${NC}"
    cp "$BACKUP_FILE" "$CSS_FILE"
    echo -e "${GREEN}✅ Backup restaurado com sucesso!${NC}"
}

# Menu principal
case "$1" in
    ativar)
        ativar
        ;;
    desativar)
        desativar
        ;;
    status)
        check_status
        ;;
    restaurar)
        restaurar
        ;;
    *)
        echo -e "${BLUE}📌 Toggle Sidebar Fixo - FEMME INTEGRA${NC}"
        echo ""
        echo "Uso: $0 {ativar|desativar|status|restaurar}"
        echo ""
        echo "Comandos:"
        echo -e "  ${GREEN}ativar${NC}     - Ativa o sidebar fixo"
        echo -e "  ${YELLOW}desativar${NC}  - Desativa o sidebar fixo"
        echo -e "  ${BLUE}status${NC}     - Verifica status atual"
        echo -e "  ${RED}restaurar${NC}  - Restaura backup original"
        echo ""
        echo "Status atual:"
        check_status
        exit 1
        ;;
esac

exit 0
