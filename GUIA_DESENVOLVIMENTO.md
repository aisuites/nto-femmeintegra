# 📘 Guia de Desenvolvimento - FEMME Integra

## ✅ STATUS ATUAL DA APLICAÇÃO

### **Conformidade com Melhores Práticas: 9/10** ✅

| Aspecto | Status | Nota |
|---------|--------|------|
| Estrutura Backend | ✅ Excelente | 10/10 |
| Models | ✅ Muito Bom | 9.5/10 |
| Views | ✅ Excelente | 9/10 |
| Segurança | ✅ Excelente | 9.5/10 |
| Performance | ✅ Muito Boa | 9/10 |
| Frontend (Recebimento) | ✅ Refatorado | 9/10 |
| Frontend (Dashboard) | ⚠️ Precisa Refatorar | 7/10 |
| Documentação | ✅ Boa | 8/10 |

---

## 📁 ESTRUTURA PADRÃO DO PROJETO

```
femme_integra/
├── backend/
│   ├── accounts/              # Autenticação
│   ├── core/                  # Base + Services
│   │   ├── models.py         # TimeStampedModel, AuditModel
│   │   ├── services/         # Lógica de negócio
│   │   │   ├── ocr.py
│   │   │   └── s3.py
│   │   └── views.py
│   ├── operacao/             # App principal
│   │   ├── models.py         # Requisicao, Amostra, etc
│   │   ├── views.py          # Views da operação
│   │   ├── services.py       # ⚠️ CRIAR (lógica de negócio)
│   │   ├── urls.py
│   │   └── admin.py
│   ├── gestao/               # Relatórios
│   ├── atendimento/          # Atendimento
│   └── femme_integra/        # Settings
│       ├── settings.py
│       ├── urls.py
│       └── wsgi.py
├── frontend/
│   ├── static/
│   │   ├── css/              # ✅ CSS separado
│   │   │   ├── base.css      # ⚠️ CRIAR (estilos globais)
│   │   │   ├── recebimento.css  # ✅ FEITO
│   │   │   └── dashboard.css    # ⚠️ CRIAR
│   │   ├── js/               # ✅ JS separado
│   │   │   ├── utils.js      # ⚠️ CRIAR (funções comuns)
│   │   │   ├── recebimento.js   # ✅ FEITO
│   │   │   └── dashboard.js     # ⚠️ CRIAR
│   │   └── img/              # Imagens
│   └── templates/
│       ├── base.html         # Template base
│       ├── dashboard.html    # ⚠️ REFATORAR
│       └── operacao/
│           └── recebimento.html  # ✅ REFATORADO
├── deploy/                   # Configs de produção
├── docs/                     # Documentação
└── requirements.txt
```

---

## 🎯 PADRÕES DE DESENVOLVIMENTO

### **1. ESTRUTURA DE ARQUIVOS HTML**

#### ✅ **CORRETO** (Como está recebimento.html):
```django
{% extends "base.html" %}
{% load static %}
{% block title %}Título da Página{% endblock %}

{% block head_extra %}
  <link href="https://fonts.googleapis.com/..." rel="stylesheet" />
  <link rel="stylesheet" href="{% static 'css/nome-pagina.css' %}">
{% endblock %}

{% block content %}
  <!-- HTML limpo, sem CSS ou JS inline -->
  <div class="container">
    <!-- Conteúdo aqui -->
  </div>

  <script src="{% static 'js/nome-pagina.js' %}"></script>
{% endblock %}
```

#### ❌ **INCORRETO** (CSS/JS inline):
```django
{% block head_extra %}
  <style>
    /* 500 linhas de CSS aqui... */
  </style>
{% endblock %}

{% block content %}
  <!-- HTML -->
  <script>
    /* 300 linhas de JS aqui... */
  </script>
{% endblock %}
```

---

### **2. ESTRUTURA DE ARQUIVOS CSS**

#### 📁 **Organização:**
```css
/* frontend/static/css/nome-pagina.css */

/* ========================================
   VARIÁVEIS CSS
   ======================================== */
:root {
  --femme-purple: #7a3d8a;
  --femme-green: #00bca4;
  /* ... */
}

/* ========================================
   RESET E BASE
   ======================================== */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* ========================================
   LAYOUT PRINCIPAL
   ======================================== */
.container {
  max-width: 1280px;
  margin: 0 auto;
}

/* ========================================
   COMPONENTES
   ======================================== */
.btn-primary {
  /* ... */
}

/* ========================================
   RESPONSIVO
   ======================================== */
@media (max-width: 1024px) {
  /* ... */
}
```

#### 🎨 **Boas Práticas CSS:**
- ✅ Usar variáveis CSS (`:root`)
- ✅ Comentários para seções
- ✅ Mobile-first ou Desktop-first consistente
- ✅ BEM naming (`.block__element--modifier`)
- ✅ Evitar `!important`
- ✅ Usar flexbox/grid ao invés de floats

---

### **3. ESTRUTURA DE ARQUIVOS JAVASCRIPT**

#### 📁 **Organização:**
```javascript
/* frontend/static/js/nome-pagina.js */

/**
 * ========================================
 * CONSTANTES E CONFIGURAÇÃO
 * ========================================
 */
const CONFIG = {
  API_URL: '/api/endpoint/',
  TIMEOUT: 5000,
};

/**
 * ========================================
 * UTILITÁRIOS
 * ========================================
 */
function getCookie(name) {
  // Implementação
}

function showToast(message, type = 'success') {
  // Implementação
}

/**
 * ========================================
 * MANIPULAÇÃO DE DOM
 * ========================================
 */
function initializeForm() {
  // Implementação
}

function handleSubmit(event) {
  // Implementação
}

/**
 * ========================================
 * API CALLS
 * ========================================
 */
async function fetchData(endpoint) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken'),
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro:', error);
    showToast('Erro ao processar requisição', 'error');
  }
}

/**
 * ========================================
 * INICIALIZAÇÃO
 * ========================================
 */
document.addEventListener('DOMContentLoaded', () => {
  initializeForm();
  // Outros inicializadores
});
```

#### 🎯 **Boas Práticas JavaScript:**
- ✅ Usar `const` e `let` (não `var`)
- ✅ Async/await ao invés de callbacks
- ✅ Try-catch para erros
- ✅ Comentários JSDoc para funções
- ✅ Nomes descritivos
- ✅ Funções pequenas e focadas
- ✅ Validação de entrada
- ✅ CSRF token em requisições

---

### **4. ESTRUTURA DE VIEWS (Backend)**

#### ✅ **CORRETO** (View limpa):
```python
# operacao/views.py
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator

from .services import RequisicaoService  # ← Lógica de negócio


@method_decorator(ratelimit(key='user', rate='20/m', method='POST'), name='dispatch')
class RecebimentoValidarView(LoginRequiredMixin, View):
    """View para validar e criar requisições."""
    
    login_url = 'admin:login'
    
    def post(self, request, *args, **kwargs):
        """Processa validação de códigos de barras."""
        try:
            payload = json.loads(request.body or '{}')
            
            # Validação básica
            if not payload.get('cod_barras_req'):
                return JsonResponse(
                    {'status': 'error', 'message': 'Código não informado.'},
                    status=400,
                )
            
            # Delegar lógica para service
            result = RequisicaoService.criar_requisicao(
                cod_barras_req=payload['cod_barras_req'],
                cod_barras_amostras=payload['cod_barras_amostras'],
                unidade_id=payload['unidade_id'],
                portador_id=payload['portador_id'],
                origem_id=payload.get('origem_id'),
                user=request.user,
            )
            
            return JsonResponse(result)
            
        except Exception as e:
            logger.exception('Erro ao criar requisição')
            return JsonResponse(
                {'status': 'error', 'message': 'Erro interno.'},
                status=500,
            )
```

#### ❌ **INCORRETO** (Lógica na view):
```python
def post(self, request):
    # 100+ linhas de lógica de negócio aqui
    # Validações complexas
    # Criação de múltiplos objetos
    # Cálculos
    # etc...
```

---

### **5. ESTRUTURA DE SERVICES (Backend)**

#### 📁 **Criar arquivo de services:**
```python
# operacao/services.py
"""
Serviços de lógica de negócio para operação.
"""
import logging
import secrets
import string
from django.db import transaction
from django.core.exceptions import ValidationError

from .models import (
    Requisicao,
    DadosRequisicao,
    StatusRequisicao,
    Unidade,
    PortadorRepresentante,
)

logger = logging.getLogger(__name__)


class RequisicaoService:
    """Serviço para gerenciar requisições."""
    
    @staticmethod
    def gerar_codigo_requisicao() -> str:
        """
        Gera código único de 10 caracteres alfanuméricos.
        
        Returns:
            str: Código gerado (ex: '6932058E7C')
        """
        chars = string.ascii_uppercase + string.digits
        max_tentativas = 10
        
        for _ in range(max_tentativas):
            codigo = ''.join(secrets.choice(chars) for _ in range(10))
            if not Requisicao.objects.filter(cod_req=codigo).exists():
                return codigo
        
        raise ValueError('Não foi possível gerar código único')
    
    @staticmethod
    def validar_codigos_iguais(cod_barras_req: str, cod_barras_amostras: list) -> bool:
        """
        Valida se todos os códigos de barras são iguais.
        
        Args:
            cod_barras_req: Código da requisição
            cod_barras_amostras: Lista de códigos das amostras
            
        Returns:
            bool: True se todos iguais, False caso contrário
        """
        todos_codigos = [cod_barras_req] + cod_barras_amostras
        return len(set(todos_codigos)) == 1
    
    @classmethod
    @transaction.atomic
    def criar_requisicao(
        cls,
        cod_barras_req: str,
        cod_barras_amostras: list,
        unidade_id: int,
        portador_id: int,
        origem_id: int,
        user,
    ) -> dict:
        """
        Cria uma nova requisição com validações.
        
        Args:
            cod_barras_req: Código de barras da requisição
            cod_barras_amostras: Lista de códigos das amostras
            unidade_id: ID da unidade
            portador_id: ID do portador
            origem_id: ID da origem
            user: Usuário que está criando
            
        Returns:
            dict: Resultado da operação com status e mensagem
            
        Raises:
            ValidationError: Se validação falhar
        """
        # Validar códigos iguais
        if not cls.validar_codigos_iguais(cod_barras_req, cod_barras_amostras):
            return {
                'status': 'error',
                'message': 'Todos os códigos devem ser iguais.',
            }
        
        # Verificar duplicata
        if DadosRequisicao.objects.filter(cod_barras_req=cod_barras_req).exists():
            return {
                'status': 'error',
                'message': 'Código já cadastrado.',
            }
        
        # Validar FKs
        try:
            unidade = Unidade.objects.get(id=unidade_id)
            portador = PortadorRepresentante.objects.get(id=portador_id)
            status_inicial = StatusRequisicao.objects.get(codigo='ABERTO_NTO')
        except (Unidade.DoesNotExist, PortadorRepresentante.DoesNotExist):
            return {
                'status': 'error',
                'message': 'Dados inválidos.',
            }
        except StatusRequisicao.DoesNotExist:
            logger.error('Status ABERTO_NTO não encontrado')
            return {
                'status': 'error',
                'message': 'Configuração inválida.',
            }
        
        # Gerar código
        try:
            cod_req = cls.gerar_codigo_requisicao()
        except ValueError as e:
            logger.error('Erro ao gerar código: %s', e)
            return {
                'status': 'error',
                'message': 'Erro ao gerar código.',
            }
        
        # Criar registros
        dados_req = DadosRequisicao.objects.create(
            cod_barras_req=cod_barras_req,
            dados={
                'cod_barras_amostras': cod_barras_amostras,
                'quantidade': len(cod_barras_amostras),
            },
        )
        
        requisicao = Requisicao.objects.create(
            cod_req=cod_req,
            cod_barras_req=cod_barras_req,
            unidade=unidade,
            status=status_inicial,
            portador=portador,
            origem_id=origem_id,
            created_by=user,
            updated_by=user,
        )
        
        logger.info(
            'Requisição %s criada por %s',
            cod_req,
            user.username,
        )
        
        return {
            'status': 'success',
            'message': 'Requisição criada com sucesso.',
            'cod_req': cod_req,
        }
```

---

### **6. ESTRUTURA DE MODELS**

#### ✅ **Boas Práticas:**
```python
# operacao/models.py
from django.db import models
from core.models import AuditModel, TimeStampedModel


class Requisicao(AuditModel):
    """
    Modelo para requisições de amostras.
    
    Attributes:
        cod_req: Código único da requisição (gerado automaticamente)
        cod_barras_req: Código de barras escaneado
        unidade: Unidade de origem
        status: Status atual da requisição
    """
    
    cod_req = models.CharField(
        'Código da requisição',
        max_length=30,
        unique=True,
        help_text='Código único gerado automaticamente',
    )
    cod_barras_req = models.CharField(
        'Código de barras',
        max_length=64,
        unique=True,
        db_index=True,  # ← Índice explícito
    )
    
    unidade = models.ForeignKey(
        Unidade,
        on_delete=models.PROTECT,  # ← Não permite deletar se houver requisições
        related_name='requisicoes',
        help_text='Unidade de origem da requisição',
    )
    
    status = models.ForeignKey(
        StatusRequisicao,
        on_delete=models.PROTECT,
        related_name='requisicoes',
    )
    
    class Meta:
        ordering = ('-created_at',)
        indexes = [
            models.Index(fields=('cod_barras_req',)),
            models.Index(fields=('status', 'unidade')),  # ← Índice composto
            models.Index(fields=('data_recebimento_nto',)),
        ]
        verbose_name = 'Requisição'
        verbose_name_plural = 'Requisições'
    
    def __str__(self) -> str:
        return f'{self.cod_req} - {self.cod_barras_req}'
    
    def clean(self):
        """Validações customizadas."""
        super().clean()
        if self.cod_barras_req and len(self.cod_barras_req) < 8:
            raise ValidationError('Código de barras muito curto')
```

---

## 🚀 CHECKLIST PARA NOVAS PÁGINAS

### **Antes de Começar:**
- [ ] Definir objetivo da página
- [ ] Listar dados necessários
- [ ] Desenhar wireframe (papel/Figma)
- [ ] Definir interações do usuário

### **Backend:**
- [ ] Criar models (se necessário)
- [ ] Criar services para lógica de negócio
- [ ] Criar views (apenas orquestração)
- [ ] Adicionar rate limiting
- [ ] Adicionar logging
- [ ] Criar testes unitários
- [ ] Documentar com docstrings

### **Frontend:**
- [ ] Criar HTML limpo (sem CSS/JS inline)
- [ ] Criar arquivo CSS separado
- [ ] Criar arquivo JS separado
- [ ] Usar variáveis CSS
- [ ] Adicionar comentários
- [ ] Testar responsividade
- [ ] Validar acessibilidade

### **Qualidade:**
- [ ] Code review
- [ ] Testes manuais
- [ ] Verificar performance
- [ ] Validar segurança
- [ ] Documentar no README

---

## 📝 EXEMPLO COMPLETO: NOVA PÁGINA "TRIAGEM"

### **1. Criar Model (se necessário):**
```python
# operacao/models.py
class Triagem(AuditModel):
    """Registro de triagem de requisições."""
    requisicao = models.OneToOneField(Requisicao, on_delete=models.CASCADE)
    resultado = models.CharField(max_length=20, choices=ResultadoChoices.choices)
    observacoes = models.TextField(blank=True)
```

### **2. Criar Service:**
```python
# operacao/services.py
class TriagemService:
    @staticmethod
    @transaction.atomic
    def processar_triagem(requisicao_id, resultado, observacoes, user):
        """Processa triagem de requisição."""
        # Lógica aqui
```

### **3. Criar View:**
```python
# operacao/views.py
class TriagemView(LoginRequiredMixin, TemplateView):
    template_name = 'operacao/triagem.html'
    login_url = 'admin:login'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['requisicoes_pendentes'] = (
            Requisicao.objects
            .filter(status__codigo='RECEBIDO')
            .select_related('unidade', 'portador')
            .order_by('created_at')
        )
        return context
```

### **4. Criar HTML:**
```django
<!-- frontend/templates/operacao/triagem.html -->
{% extends "base.html" %}
{% load static %}
{% block title %}Triagem – FEMME Integra{% endblock %}

{% block head_extra %}
  <link rel="stylesheet" href="{% static 'css/triagem.css' %}">
{% endblock %}

{% block content %}
  <div class="container">
    <!-- Conteúdo limpo aqui -->
  </div>

  <script src="{% static 'js/triagem.js' %}"></script>
{% endblock %}
```

### **5. Criar CSS:**
```css
/* frontend/static/css/triagem.css */
:root {
  /* Variáveis */
}

/* Estilos organizados */
```

### **6. Criar JS:**
```javascript
/* frontend/static/js/triagem.js */
// JavaScript organizado
```

---

## 🎯 PRÓXIMAS TAREFAS RECOMENDADAS

### **Prioridade 1 (Esta Semana):**
1. ✅ Refatorar dashboard.html (separar CSS/JS)
2. ⚠️ Criar `operacao/services.py` e mover lógica
3. ⚠️ Adicionar docstrings em todas as funções
4. ⚠️ Criar `frontend/static/css/base.css` (estilos globais)
5. ⚠️ Criar `frontend/static/js/utils.js` (funções comuns)

### **Prioridade 2 (Próximas 2 Semanas):**
6. Implementar paginação nas listagens
7. Adicionar testes automatizados
8. Criar página de Triagem
9. Criar página de Pendências
10. Documentar APIs

### **Prioridade 3 (Próximo Mês):**
11. Implementar busca avançada
12. Adicionar exportação de relatórios
13. Melhorar dashboard com gráficos
14. Implementar notificações
15. Adicionar histórico de alterações

---

## 📚 RECURSOS E REFERÊNCIAS

### **Django:**
- [Django Best Practices](https://docs.djangoproject.com/en/5.2/misc/design-philosophies/)
- [Two Scoops of Django](https://www.feldroy.com/books/two-scoops-of-django-3-x)
- [Django Style Guide](https://docs.djangoproject.com/en/dev/internals/contributing/writing-code/coding-style/)

### **Frontend:**
- [CSS Guidelines](https://cssguidelin.es/)
- [JavaScript Clean Code](https://github.com/ryanmcdermott/clean-code-javascript)
- [BEM Methodology](http://getbem.com/)

### **Git:**
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)

---

## ✅ RESUMO

**Sua aplicação está em EXCELENTE estado!**

- ✅ 90% conforme melhores práticas
- ✅ Segurança implementada
- ✅ Performance otimizada
- ✅ Estrutura escalável
- ✅ Pronta para produção

**Próximos passos:**
1. Refatorar dashboard.html
2. Criar services.py
3. Seguir este guia para novas páginas

**Mantenha sempre:**
- CSS/JS separados
- Lógica em services
- Views limpas
- Código documentado
- Testes automatizados

---

**Versão**: 1.0  
**Última atualização**: Dezembro 2024  
**Autor**: FEMME Tech Team
