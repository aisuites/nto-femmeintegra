# 🔄 Como Limpar o Cache do Sistema

## Problema
Quando você adiciona novas **Unidades** ou **Portadores**, eles não aparecem imediatamente na página de Recebimentos porque o sistema usa cache de 1 hora para melhorar a performance.

---

## ✅ Soluções Disponíveis

### 1️⃣ Via Linha de Comando (Mais Rápido)

#### Limpar cache de Unidades e Portadores:
```bash
cd backend
python3 manage.py limpar_cache
```

#### Limpar TODO o cache do sistema:
```bash
python3 manage.py limpar_cache --all
```

#### Limpar uma chave específica:
```bash
python3 manage.py limpar_cache --key recebimento:unidades
```

---

### 2️⃣ Via Django Admin (Mais Visual)

1. Acesse o **Django Admin** (http://127.0.0.1:8000/admin/)
2. Vá para **Operação → Unidades** ou **Operação → Portadores/Representantes**
3. Selecione qualquer registro (pode ser apenas 1)
4. No dropdown "Ação", escolha:
   - **🔄 Limpar cache (Unidades e Portadores)** - Limpa apenas o cache do recebimento
   - **🗑️ Limpar TODO o cache do sistema** - Limpa todo o cache

5. Clique em **Ir**
6. Você verá uma mensagem de sucesso verde

---

## 📋 Quando Limpar o Cache?

Limpe o cache sempre que:
- ✅ Adicionar uma nova **Unidade**
- ✅ Adicionar um novo **Portador/Representante**
- ✅ Modificar dados de Unidades ou Portadores
- ✅ A página de Recebimentos não mostrar dados atualizados

---

## 🎯 Cache Atual do Sistema

O sistema usa cache para:
- **Unidades** - Cache de 1 hora (`recebimento:unidades`)
- **Portadores** - Cache de 1 hora (`recebimento:portadores`)

Isso melhora a performance, pois esses dados raramente mudam.

---

## 💡 Dica Profissional

Se você está fazendo muitas mudanças em Unidades/Portadores, use:
```bash
python3 manage.py limpar_cache
```

É mais rápido que acessar o Admin! 🚀

---

## 🔧 Arquivos Relacionados

- **Comando**: `backend/operacao/management/commands/limpar_cache.py`
- **Admin Actions**: `backend/operacao/admin.py` (linhas 19-37)
- **Views com Cache**: `backend/operacao/views.py` (linhas 38-51)
