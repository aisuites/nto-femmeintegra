# 🎯 PLANO DE IMPLEMENTAÇÃO - TRIAGEM ETAPA 1 COM VALIDAÇÕES

## ✅ DECISÕES CONFIRMADAS

1. **Campo de validação:** `triagem1_validada` (BooleanField)
2. **Motivo inadequado:** Tabela `lista_motivo_inadequado` (FK)
3. **Fluxo após validação:** Prosseguir automaticamente para Etapa 2

---

## 📋 REGRAS DE VALIDAÇÃO

### **Campos Obrigatórios:**
- ✅ Tipo de amostra (sempre obrigatório)
- ✅ Data de validade (sempre obrigatório)
- ⚠️ Data de coleta (pode estar em branco)

### **Impeditivos (bloqueiam prosseguimento):**

| Campo/Flag | Condição | Impeditivo? |
|------------|----------|-------------|
| `flag_data_coleta_rasurada` | Marcado | ✅ SIM |
| `data_validade` | Vazio | ✅ SIM |
| `data_validade` | > 90 dias da data atual | ✅ SIM |
| `flag_sem_data_validade` | Marcado | ✅ SIM |
| `flag_amostra_sem_identificacao` | Marcado | ✅ SIM |
| `flag_armazenamento_inadequado` | Marcado | ✅ SIM |
| `flag_frasco_trocado` | Marcado | ✅ SIM |
| `flag_material_nao_analisado` | Marcado | ✅ SIM |
| `data_coleta` | Vazio | ❌ NÃO (permitido) |

### **Fluxos de Rejeição por Unidade:**

| Unidade | Código | Status Destino | ID Status |
|---------|--------|----------------|-----------|
| EXTERNOS | 09 | CAIXA BARRADOS | 5 |
| PAPA BRASIL | 17 | CAIXA BO | 4 |

---

## 🗄️ BANCO DE DADOS - MUDANÇAS

### 1. Criar Model `ListaMotivoInadequado`

```python
class ListaMotivoInadequado(TimeStampedModel):
    """
    Lista de motivos de armazenamento inadequado.
    """
    codigo = models.CharField(
        'Código',
        max_length=20,
        unique=True,
        help_text='Código único do motivo'
    )
    descricao = models.CharField(
        'Descrição',
        max_length=200
    )
    ativo = models.BooleanField(
        'Ativo',
        default=True
    )
    
    class Meta:
        db_table = 'lista_motivo_inadequado'
        ordering = ('codigo', 'descricao')
        verbose_name = 'Motivo de Armazenamento Inadequado'
        verbose_name_plural = 'Motivos de Armazenamento Inadequado'
    
    def __str__(self):
        return f'{self.codigo} - {self.descricao}'
```

**Dados iniciais:**
```python
MOTIVOS_INICIAIS = [
    {'codigo': 'TEMP', 'descricao': 'Temperatura inadequada'},
    {'codigo': 'FRASC', 'descricao': 'Frasco danificado'},
    {'codigo': 'VAZAM', 'descricao': 'Amostra derramada/vazamento'},
    {'codigo': 'VENC', 'descricao': 'Prazo de validade vencido'},
    {'codigo': 'CONTAM', 'descricao': 'Contaminação visível'},
    {'codigo': 'OUTRO', 'descricao': 'Outros'},
]
```

### 2. Alterar Model `RequisicaoAmostra`

**Adicionar campos:**
```python
# Campo de validação da triagem 1
triagem1_validada = models.BooleanField(
    'Triagem 1 validada',
    default=False,
    db_index=True,
    help_text='Indica se a amostra foi validada na triagem etapa 1'
)

# Converter motivo_inadequado_id para FK
motivo_inadequado = models.ForeignKey(
    'ListaMotivoInadequado',
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name='amostras',
    verbose_name='Motivo de armazenamento inadequado',
    db_column='motivo_inadequado_id'  # Manter nome da coluna
)
```

**Migration:**
```python
# 1. Adicionar campo triagem1_validada
operations = [
    migrations.AddField(
        model_name='requisicaoamostra',
        name='triagem1_validada',
        field=models.BooleanField(default=False, db_index=True),
    ),
]

# 2. Criar tabela lista_motivo_inadequado
# 3. Popular dados iniciais
# 4. Converter motivo_inadequado_id para FK (se houver dados, migrar primeiro)
```

### 3. Criar Model `TipoAmostra` (se não existir)

```python
class TipoAmostra(TimeStampedModel):
    """
    Tipos de amostras biológicas.
    """
    codigo = models.CharField(
        'Código',
        max_length=20,
        unique=True
    )
    descricao = models.CharField(
        'Descrição',
        max_length=100
    )
    ativo = models.BooleanField(
        'Ativo',
        default=True
    )
    
    class Meta:
        ordering = ('descricao',)
        verbose_name = 'Tipo de Amostra'
        verbose_name_plural = 'Tipos de Amostras'
    
    def __str__(self):
        return self.descricao
```

---

## 🔧 BACKEND - IMPLEMENTAÇÃO

### 1. View: `ListarTiposAmostraView`

```python
@method_decorator(ratelimit(key='user', rate='60/m', method='GET'), name='dispatch')
class ListarTiposAmostraView(LoginRequiredMixin, View):
    """
    Lista tipos de amostras ativos.
    GET /operacao/triagem/tipos-amostra/
    """
    def get(self, request):
        tipos = TipoAmostra.objects.filter(ativo=True).values('id', 'codigo', 'descricao')
        return JsonResponse({
            'status': 'success',
            'tipos': list(tipos)
        })
```

### 2. View: `ListarMotivosInadequadosView`

```python
@method_decorator(ratelimit(key='user', rate='60/m', method='GET'), name='dispatch')
class ListarMotivosInadequadosView(LoginRequiredMixin, View):
    """
    Lista motivos de armazenamento inadequado ativos.
    GET /operacao/triagem/motivos-inadequados/
    """
    def get(self, request):
        motivos = ListaMotivoInadequado.objects.filter(ativo=True).values('id', 'codigo', 'descricao')
        return JsonResponse({
            'status': 'success',
            'motivos': list(motivos)
        })
```

### 3. View: `ListarAmostrasRequisicaoView`

```python
@method_decorator(ratelimit(key='user', rate='60/m', method='GET'), name='dispatch')
class ListarAmostrasRequisicaoView(LoginRequiredMixin, View):
    """
    Lista amostras de uma requisição com status de validação.
    GET /operacao/triagem/amostras/?requisicao_id=123
    """
    def get(self, request):
        requisicao_id = request.GET.get('requisicao_id')
        
        if not requisicao_id:
            return JsonResponse({'status': 'error', 'message': 'ID da requisição não informado.'}, status=400)
        
        amostras = RequisicaoAmostra.objects.filter(
            requisicao_id=requisicao_id
        ).select_related('requisicao').order_by('ordem')
        
        amostras_data = []
        for amostra in amostras:
            amostras_data.append({
                'id': amostra.id,
                'ordem': amostra.ordem,
                'cod_barras_amostra': amostra.cod_barras_amostra,
                'tipos_amostra_id': amostra.tipos_amostra_id,
                'data_coleta': amostra.data_coleta.isoformat() if amostra.data_coleta else None,
                'data_validade': amostra.data_validade.isoformat() if amostra.data_validade else None,
                'triagem1_validada': amostra.triagem1_validada,
                'flags': {
                    'data_coleta_rasurada': amostra.flag_data_coleta_rasurada,
                    'sem_data_validade': amostra.flag_sem_data_validade,
                    'amostra_sem_identificacao': amostra.flag_amostra_sem_identificacao,
                    'armazenamento_inadequado': amostra.flag_armazenamento_inadequado,
                    'frasco_trocado': amostra.flag_frasco_trocado_tipo_coleta,
                    'material_nao_analisado': amostra.flag_material_nao_analisado,
                },
                'motivo_inadequado_id': amostra.motivo_inadequado_id,
                'descricao': amostra.descricao or '',
            })
        
        total = len(amostras_data)
        validadas = sum(1 for a in amostras_data if a['triagem1_validada'])
        pendentes = total - validadas
        
        return JsonResponse({
            'status': 'success',
            'amostras': amostras_data,
            'total': total,
            'validadas': validadas,
            'pendentes': pendentes
        })
```

### 4. View: `SalvarAmostraTriagemView` (COMPLEXA)

```python
@method_decorator(ratelimit(key='user', rate='30/m', method='POST'), name='dispatch')
class SalvarAmostraTriagemView(LoginRequiredMixin, View):
    """
    Salva dados da amostra na triagem etapa 1 e valida impeditivos.
    POST /operacao/triagem/salvar-amostra/
    """
    def post(self, request):
        try:
            data = json.loads(request.body)
            amostra_id = data.get('amostra_id')
            
            # Buscar amostra
            amostra = RequisicaoAmostra.objects.select_related('requisicao', 'requisicao__unidade').get(id=amostra_id)
            
            # Atualizar campos
            amostra.tipos_amostra_id = data.get('tipos_amostra_id')
            amostra.data_coleta = data.get('data_coleta') or None
            amostra.data_validade = data.get('data_validade') or None
            amostra.flag_data_coleta_rasurada = data.get('flag_data_coleta_rasurada', False)
            amostra.flag_sem_data_validade = data.get('flag_sem_data_validade', False)
            amostra.flag_amostra_sem_identificacao = data.get('flag_amostra_sem_identificacao', False)
            amostra.flag_armazenamento_inadequado = data.get('flag_armazenamento_inadequado', False)
            amostra.flag_frasco_trocado_tipo_coleta = data.get('flag_frasco_trocado', False)
            amostra.flag_material_nao_analisado = data.get('flag_material_nao_analisado', False)
            amostra.motivo_inadequado_id = data.get('motivo_inadequado_id') or None
            amostra.descricao = data.get('descricao', '')
            
            # VALIDAÇÕES
            erros = []
            
            # 1. Tipo de amostra obrigatório
            if not amostra.tipos_amostra_id:
                erros.append('Tipo de amostra é obrigatório')
            
            # 2. Data de validade obrigatória
            if not amostra.data_validade:
                erros.append('Data de validade é obrigatória')
            
            # 3. Se armazenamento inadequado, motivo é obrigatório
            if amostra.flag_armazenamento_inadequado and not amostra.motivo_inadequado_id:
                erros.append('Motivo de armazenamento inadequado é obrigatório')
            
            if erros:
                return JsonResponse({'status': 'error', 'message': '\n'.join(erros)}, status=400)
            
            # VERIFICAR IMPEDITIVOS
            impeditivos = []
            
            if amostra.flag_data_coleta_rasurada:
                impeditivos.append('Data de coleta rasurada')
            
            if amostra.flag_sem_data_validade:
                impeditivos.append('Sem data de validade')
            
            if amostra.data_validade:
                dias_validade = (amostra.data_validade - timezone.now().date()).days
                if dias_validade > 90:
                    impeditivos.append(f'Data de validade excede 90 dias ({dias_validade} dias)')
            
            if amostra.flag_amostra_sem_identificacao:
                impeditivos.append('Amostra sem identificação')
            
            if amostra.flag_armazenamento_inadequado:
                impeditivos.append('Armazenamento inadequado')
            
            if amostra.flag_frasco_trocado_tipo_coleta:
                impeditivos.append('Frasco trocado')
            
            if amostra.flag_material_nao_analisado:
                impeditivos.append('Material não analisado')
            
            # Se há impeditivos, retornar para frontend decidir
            if impeditivos:
                # Determinar status de rejeição baseado na unidade
                unidade_codigo = amostra.requisicao.unidade.codigo
                
                if unidade_codigo == '09':  # EXTERNOS
                    status_rejeicao_id = 5  # CAIXA BARRADOS
                    status_rejeicao_nome = 'CAIXA BARRADOS'
                elif unidade_codigo == '17':  # PAPA BRASIL
                    status_rejeicao_id = 4  # CAIXA BO
                    status_rejeicao_nome = 'CAIXA BO'
                else:
                    # Outras unidades - usar CAIXA BO como padrão
                    status_rejeicao_id = 4
                    status_rejeicao_nome = 'CAIXA BO'
                
                return JsonResponse({
                    'status': 'impeditivo',
                    'impeditivos': impeditivos,
                    'status_rejeicao': {
                        'id': status_rejeicao_id,
                        'nome': status_rejeicao_nome
                    },
                    'unidade_codigo': unidade_codigo
                })
            
            # SEM IMPEDITIVOS - Marcar como validada
            amostra.triagem1_validada = True
            amostra.updated_by = request.user
            amostra.save()
            
            # Verificar se há mais amostras pendentes
            proxima_amostra = RequisicaoAmostra.objects.filter(
                requisicao=amostra.requisicao,
                triagem1_validada=False
            ).exclude(id=amostra.id).order_by('ordem').first()
            
            return JsonResponse({
                'status': 'success',
                'message': 'Amostra validada com sucesso!',
                'proxima_amostra': {
                    'existe': proxima_amostra is not None,
                    'id': proxima_amostra.id if proxima_amostra else None,
                    'ordem': proxima_amostra.ordem if proxima_amostra else None
                }
            })
            
        except RequisicaoAmostra.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Amostra não encontrada.'}, status=404)
        except Exception as e:
            logger.error(f"Erro ao salvar amostra: {str(e)}", exc_info=True)
            return JsonResponse({'status': 'error', 'message': 'Erro ao salvar amostra.'}, status=500)
```

### 5. View: `RejeitarRequisicaoView`

```python
@method_decorator(ratelimit(key='user', rate='30/m', method='POST'), name='dispatch')
class RejeitarRequisicaoView(LoginRequiredMixin, View):
    """
    Rejeita requisição alterando status para CAIXA BO/BARRADOS.
    POST /operacao/triagem/rejeitar-requisicao/
    """
    def post(self, request):
        try:
            data = json.loads(request.body)
            requisicao_id = data.get('requisicao_id')
            status_rejeicao_id = data.get('status_rejeicao_id')
            
            # Buscar requisição
            requisicao = DadosRequisicao.objects.get(id=requisicao_id)
            
            # Buscar status
            status_rejeicao = StatusRequisicao.objects.get(id=status_rejeicao_id)
            
            # Alterar status
            status_anterior = requisicao.status
            requisicao.status = status_rejeicao
            requisicao.updated_by = request.user
            requisicao.save()
            
            # Registrar no histórico
            RequisicaoStatusHistorico.objects.create(
                requisicao=requisicao,
                cod_req=requisicao.cod_req,
                status=status_rejeicao,
                usuario=request.user,
                observacao=f'Rejeitada na triagem etapa 1. Status anterior: {status_anterior.descricao}'
            )
            
            logger.info(
                f"Requisição {requisicao.cod_req} rejeitada: {status_anterior.descricao} → {status_rejeicao.descricao} "
                f"por {request.user.username}"
            )
            
            return JsonResponse({
                'status': 'success',
                'message': f'Requisição enviada para {status_rejeicao.descricao}'
            })
            
        except DadosRequisicao.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Requisição não encontrada.'}, status=404)
        except StatusRequisicao.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Status de rejeição não encontrado.'}, status=404)
        except Exception as e:
            logger.error(f"Erro ao rejeitar requisição: {str(e)}", exc_info=True)
            return JsonResponse({'status': 'error', 'message': 'Erro ao rejeitar requisição.'}, status=500)
```

### 6. URLs

```python
# operacao/urls.py
urlpatterns = [
    # ... existentes ...
    
    # Triagem Etapa 1
    path('triagem/tipos-amostra/', views.ListarTiposAmostraView.as_view(), name='triagem-tipos-amostra'),
    path('triagem/motivos-inadequados/', views.ListarMotivosInadequadosView.as_view(), name='triagem-motivos-inadequados'),
    path('triagem/amostras/', views.ListarAmostrasRequisicaoView.as_view(), name='triagem-amostras'),
    path('triagem/salvar-amostra/', views.SalvarAmostraTriagemView.as_view(), name='triagem-salvar-amostra'),
    path('triagem/rejeitar-requisicao/', views.RejeitarRequisicaoView.as_view(), name='triagem-rejeitar-requisicao'),
]
```

---

## 🎨 FRONTEND - IMPLEMENTAÇÃO

### 1. Estrutura de Dados Global

```javascript
// Cache de dados
let tiposAmostraCache = [];
let motivosInadequadosCache = [];
let amostrasCache = [];
let amostraAtualId = null;

// Carregar dados iniciais
async function carregarDadosIniciais() {
  // Carregar tipos de amostra
  const tiposResp = await fetch('/operacao/triagem/tipos-amostra/');
  const tiposData = await tiposResp.json();
  tiposAmostraCache = tiposData.tipos;
  
  // Carregar motivos inadequados
  const motivosResp = await fetch('/operacao/triagem/motivos-inadequados/');
  const motivosData = await motivosResp.json();
  motivosInadequadosCache = motivosData.motivos;
  
  // Popular selects
  popularSelectTiposAmostra();
  popularSelectMotivosInadequados();
}
```

### 2. Carregar Amostras ao Localizar Requisição

```javascript
async function carregarAmostras(requisicaoId) {
  const response = await fetch(`/operacao/triagem/amostras/?requisicao_id=${requisicaoId}`);
  const data = await response.json();
  
  if (data.status === 'success') {
    amostrasCache = data.amostras;
    
    // Filtrar apenas amostras não validadas
    const amostrasPendentes = data.amostras.filter(a => !a.triagem1_validada);
    
    if (amostrasPendentes.length === 0) {
      // Todas validadas - prosseguir para Etapa 2
      mostrarMensagemSucesso('Todas as amostras foram validadas!');
      carregarEtapa2();
      return;
    }
    
    // Popular select com amostras pendentes
    popularSelectAmostras(amostrasPendentes);
    
    // Selecionar primeira amostra automaticamente
    if (amostrasPendentes.length > 0) {
      document.getElementById('select-amostra').value = amostrasPendentes[0].id;
      aoSelecionarAmostra(amostrasPendentes[0].id);
    }
    
    // Atualizar contador
    atualizarContadorAmostras(data.validadas, data.total);
  }
}
```

### 3. Validações Frontend

```javascript
function validarFormularioAmostra() {
  const erros = [];
  
  // Tipo de amostra obrigatório
  const tipoAmostra = document.getElementById('select-tipo-amostra').value;
  if (!tipoAmostra) {
    erros.push('Selecione o tipo de amostra');
  }
  
  // Data de validade obrigatória
  const dataValidade = document.getElementById('input-data-validade').value;
  if (!dataValidade) {
    erros.push('Informe a data de validade');
  }
  
  // Se armazenamento inadequado, motivo é obrigatório
  const armazenamentoInadequado = document.getElementById('checkbox-armazenamento-inadequado').checked;
  const motivoInadequado = document.getElementById('select-motivo-inadequado').value;
  if (armazenamentoInadequado && !motivoInadequado) {
    erros.push('Selecione o motivo do armazenamento inadequado');
  }
  
  if (erros.length > 0) {
    mostrarErro(erros.join('\n'));
    return false;
  }
  
  return true;
}
```

### 4. Salvar Amostra com Tratamento de Impeditivos

```javascript
async function salvarAmostra() {
  if (!validarFormularioAmostra()) return;
  
  const dados = coletarDadosFormulario();
  
  const response = await fetch('/operacao/triagem/salvar-amostra/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCsrfToken()
    },
    body: JSON.stringify(dados)
  });
  
  const result = await response.json();
  
  if (result.status === 'impeditivo') {
    // Há impeditivos - mostrar modal de rejeição
    mostrarModalRejeicao(result);
    
  } else if (result.status === 'success') {
    // Validada com sucesso
    mostrarMensagemSucesso('Amostra validada com sucesso!');
    
    if (result.proxima_amostra.existe) {
      // Há mais amostras pendentes
      await carregarAmostras(requisicaoAtual.id);
      
    } else {
      // Todas validadas - prosseguir para Etapa 2
      mostrarMensagemSucesso('Todas as amostras foram validadas! Prosseguindo para Etapa 2...');
      setTimeout(() => carregarEtapa2(), 1500);
    }
  }
}
```

### 5. Modal de Rejeição

```javascript
function mostrarModalRejeicao(data) {
  const modal = document.getElementById('modal-rejeicao');
  const listaImpeditivos = document.getElementById('lista-impeditivos');
  const statusRejeicao = document.getElementById('status-rejeicao-nome');
  
  // Montar lista de impeditivos
  listaImpeditivos.innerHTML = data.impeditivos.map(imp => 
    `<li style="color: #d32f2f;">• ${imp}</li>`
  ).join('');
  
  // Mostrar status de destino
  statusRejeicao.textContent = data.status_rejeicao.nome;
  
  // Guardar dados para uso nos botões
  modal.dataset.statusRejeicaoId = data.status_rejeicao.id;
  
  // Exibir modal
  modal.style.display = 'flex';
}

async function confirmarRejeicao() {
  const modal = document.getElementById('modal-rejeicao');
  const statusRejeicaoId = modal.dataset.statusRejeicaoId;
  
  const response = await fetch('/operacao/triagem/rejeitar-requisicao/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCsrfToken()
    },
    body: JSON.stringify({
      requisicao_id: requisicaoAtual.id,
      status_rejeicao_id: statusRejeicaoId
    })
  });
  
  const result = await response.json();
  
  if (result.status === 'success') {
    modal.style.display = 'none';
    mostrarMensagemSucesso(result.message);
    
    // Limpar formulário e voltar para busca
    limparFormularioTriagem();
  }
}

function cancelarRejeicao() {
  const modal = document.getElementById('modal-rejeicao');
  modal.style.display = 'none';
  // Usuário pode corrigir dados e tentar novamente
}
```

### 6. Carregar Etapa 2 (placeholder)

```javascript
function carregarEtapa2() {
  // TODO: Implementar carregamento da Etapa 2
  // Por enquanto, apenas mostrar mensagem
  const stepContainer = document.getElementById('triagem-step-container');
  stepContainer.innerHTML = `
    <div style="padding: 40px; text-align: center;">
      <h2 style="color: var(--femme-purple);">🎉 Etapa 1 Concluída!</h2>
      <p>Etapa 2 será implementada em breve.</p>
    </div>
  `;
}
```

---

## 📋 HTML - Modal de Rejeição

```html
<!-- Modal: Impeditivos e Rejeição -->
<div id="modal-rejeicao" class="modal-overlay" style="display:none;">
  <div class="modal-container" style="max-width:550px;">
    <div class="modal-header" style="background: linear-gradient(135deg, #fce4ec 0%, #fff 100%);">
      <h3 style="color: #c62828;">⚠️ Requisição Não Apta para Prosseguir</h3>
    </div>
    <div class="modal-body">
      <p style="margin-bottom:16px; font-weight: 500;">
        A requisição apresenta os seguintes impeditivos:
      </p>
      <ul id="lista-impeditivos" style="margin: 16px 0; padding-left: 20px; line-height: 1.8;">
        <!-- Preenchido via JS -->
      </ul>
      <div style="background:#fff3cd; padding:12px; border-radius:6px; border-left:4px solid #ffc107; margin-top:16px;">
        <strong>Status de destino:</strong>
        <span id="status-rejeicao-nome" style="color:#856404;"></span>
      </div>
      <p style="margin-top:16px; font-size:0.9em; color:#666;">
        Deseja confirmar o envio para rejeição ou cancelar para fazer correções?
      </p>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn-pill-danger" onclick="confirmarRejeicao()">
        Confirmar Rejeição
      </button>
      <button type="button" class="btn-pill-ghost" onclick="cancelarRejeicao()">
        Cancelar
      </button>
    </div>
  </div>
</div>
```

---

## 🔄 FLUXO COMPLETO

### Cenário 1: Sem Impeditivos
1. Usuário localiza requisição
2. Carrega amostras (apenas não validadas)
3. Seleciona amostra 1
4. Preenche dados
5. Clica "Seguir"
6. Backend valida: SEM impeditivos
7. Marca `triagem1_validada=True`
8. Frontend: "Amostra 1 validada!"
9. Carrega amostra 2 automaticamente
10. Repete até última amostra
11. Após última: "Todas validadas! Prosseguindo para Etapa 2..."
12. Carrega Etapa 2 automaticamente

### Cenário 2: Com Impeditivos (Unidade EXTERNOS)
1. Usuário preenche amostra com flag impeditivo
2. Clica "Seguir"
3. Backend detecta impeditivo
4. Retorna: `status='impeditivo'`, `status_rejeicao={id:5, nome:'CAIXA BARRADOS'}`
5. Frontend abre modal mostrando impeditivos
6. Usuário clica "Confirmar Rejeição"
7. Backend altera status da requisição para ID=5
8. Registra histórico
9. Frontend: "Requisição enviada para CAIXA BARRADOS"
10. Limpa formulário

### Cenário 3: Com Impeditivos - Usuário Cancela
1. Modal de impeditivos aberto
2. Usuário clica "Cancelar"
3. Modal fecha
4. Usuário pode corrigir dados (desmarcar flags, etc)
5. Tenta salvar novamente

---

## ⚡ PERFORMANCE E OTIMIZAÇÕES

1. **Cache de Selects:**
   - Tipos de amostra e motivos carregados 1x no início
   - Armazenados em variáveis globais

2. **Queries Otimizadas:**
   - `.select_related('requisicao', 'requisicao__unidade')` ao buscar amostras
   - `.filter(triagem1_validada=False)` para amostras pendentes

3. **Índices no Banco:**
   - `triagem1_validada` (BooleanField com db_index=True)
   - FK's já têm índices automáticos

4. **Carregamento Etapa 2:**
   - Usar innerHTML para substituir conteúdo do container
   - Evitar recarregar página inteira
   - Transição suave com setTimeout

---

## 🔒 SEGURANÇA

1. ✅ Autenticação: LoginRequiredMixin
2. ✅ Rate Limiting: 60/min listagens, 30/min salvamento
3. ✅ CSRF Protection
4. ✅ Validação de propriedade (amostra pertence à requisição)
5. ✅ Auditoria (updated_by)
6. ✅ Sanitização (textContent)

---

## 📝 ORDEM DE IMPLEMENTAÇÃO

### COMMIT ATUAL
```bash
git add -A
git commit -m "📋 PLANEJAMENTO: Triagem Etapa 1 com validações e fluxos de rejeição"
```

### FASE 1: Banco de Dados (2-3h)
1. Criar model `ListaMotivoInadequado`
2. Criar model `TipoAmostra` (se necessário)
3. Adicionar campo `triagem1_validada` em `RequisicaoAmostra`
4. Converter `motivo_inadequado_id` para FK
5. Criar migrations
6. Popular dados iniciais

### FASE 2: Backend (4-5h)
1. Implementar 5 views
2. Adicionar URLs
3. Testar endpoints

### FASE 3: Frontend (5-6h)
1. Carregar dados iniciais
2. Implementar fluxo de amostras
3. Implementar validações
4. Implementar modal de rejeição
5. Implementar transição para Etapa 2

### FASE 4: Testes (2-3h)
1. Testar fluxo sem impeditivos
2. Testar fluxo com impeditivos (EXTERNOS e PAPA BRASIL)
3. Testar cancelamento de rejeição
4. Ajustes finais

**TOTAL: 13-17 horas**

---

## ✅ CHECKLIST FINAL

- [ ] Commit atual garantido
- [ ] Models criados e migrations aplicadas
- [ ] Dados iniciais populados
- [ ] 5 views implementadas e testadas
- [ ] URLs configuradas
- [ ] Frontend carrega dados corretamente
- [ ] Validações funcionam
- [ ] Modal de rejeição funciona
- [ ] Fluxo de rejeição altera status corretamente
- [ ] Transição para Etapa 2 funciona
- [ ] Código limpo e sem logs
- [ ] Tudo commitado

**PRONTO PARA INICIAR!** 🚀
