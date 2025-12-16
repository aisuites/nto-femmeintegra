from django.urls import path

from . import views
from . import upload_views
from . import triagem_views

app_name = 'operacao'

urlpatterns = [
    path('triagem/', views.TriagemView.as_view(), name='triagem'),
    path(
        'triagem/localizar/',
        views.TriagemLocalizarView.as_view(),
        name='triagem-localizar',
    ),
    # Triagem Etapa 1
    path(
        'triagem/motivos-inadequados/',
        triagem_views.ListarMotivosInadequadosView.as_view(),
        name='triagem-motivos-inadequados',
    ),
    path(
        'triagem/verificar-arquivo/',
        triagem_views.VerificarArquivoRequisicaoView.as_view(),
        name='triagem-verificar-arquivo',
    ),
    path(
        'triagem/amostras/',
        triagem_views.ListarAmostrasRequisicaoView.as_view(),
        name='triagem-amostras',
    ),
    path(
        'triagem/salvar-amostra/',
        triagem_views.SalvarAmostraTriagemView.as_view(),
        name='triagem-salvar-amostra',
    ),
    path(
        'triagem/rejeitar-requisicao/',
        triagem_views.RejeitarRequisicaoView.as_view(),
        name='triagem-rejeitar-requisicao',
    ),
    # Triagem Etapa 2
    path(
        'triagem/tipos-pendencia/',
        triagem_views.ListarTiposPendenciaView.as_view(),
        name='triagem-tipos-pendencia',
    ),
    path(
        'triagem/finalizar/',
        triagem_views.FinalizarTriagemView.as_view(),
        name='triagem-finalizar',
    ),
    # Triagem Etapa 3
    path(
        'triagem/motivos-exclusao-amostra/',
        triagem_views.ListarMotivosExclusaoAmostraView.as_view(),
        name='triagem-motivos-exclusao-amostra',
    ),
    path(
        'triagem/tipos-amostra/',
        triagem_views.ListarTiposAmostraView.as_view(),
        name='triagem-tipos-amostra',
    ),
    path(
        'triagem/amostras/atualizar/',
        triagem_views.AtualizarTipoAmostraView.as_view(),
        name='triagem-amostras-atualizar',
    ),
    path(
        'triagem/amostras/excluir/',
        triagem_views.ExcluirAmostraView.as_view(),
        name='triagem-amostras-excluir',
    ),
    path(
        'triagem/amostras/adicionar/',
        triagem_views.AdicionarAmostraView.as_view(),
        name='triagem-amostras-adicionar',
    ),
    path(
        'triagem/cadastrar/',
        triagem_views.CadastrarRequisicaoView.as_view(),
        name='triagem-cadastrar',
    ),
    # Upload de arquivos
    path(
        'upload/signed-url/',
        upload_views.ObterSignedUrlView.as_view(),
        name='upload-signed-url',
    ),
    path(
        'upload/confirmar/',
        upload_views.ConfirmarUploadView.as_view(),
        name='upload-confirmar',
    ),
    path(
        'upload/verificar-existente/',
        upload_views.VerificarArquivoExistenteView.as_view(),
        name='upload-verificar-existente',
    ),
    path(
        'upload/deletar/',
        upload_views.DeletarArquivoView.as_view(),
        name='upload-deletar',
    ),
    path(
        'upload/listar/',
        upload_views.ListarArquivosRequisicaoView.as_view(),
        name='upload-listar',
    ),
    path(
        'upload/tipos-permitidos/',
        upload_views.ObterTiposArquivoPermitidosView.as_view(),
        name='upload-tipos-permitidos',
    ),
    path('recebimento/', views.RecebimentoView.as_view(), name='recebimento'),
    path(
        'recebimento/localizar/',
        views.RecebimentoLocalizarView.as_view(),
        name='recebimento-localizar',
    ),
    path(
        'recebimento/validar/',
        views.RecebimentoValidarView.as_view(),
        name='recebimento-validar',
    ),
    path(
        'recebimento/finalizar/',
        views.RecebimentoFinalizarView.as_view(),
        name='recebimento-finalizar',
    ),
    # Notificações
    path(
        'notificacoes/contador/',
        views.NotificacoesContadorView.as_view(),
        name='notificacoes-contador',
    ),
    path(
        'notificacoes/listar/',
        views.NotificacoesListarView.as_view(),
        name='notificacoes-listar',
    ),
    path(
        'notificacoes/marcar-lida/',
        views.NotificacoesMarcarLidaView.as_view(),
        name='notificacoes-marcar-lida',
    ),
    path(
        'notificacoes/marcar-todas-lidas/',
        views.NotificacoesMarcarTodasLidasView.as_view(),
        name='notificacoes-marcar-todas-lidas',
    ),
    # Transferência de requisição
    path(
        'requisicao/transferir/',
        views.TransferirRequisicaoView.as_view(),
        name='requisicao-transferir',
    ),
    # Rota de teste isolado do scanner
    path(
        'scanner/teste/',
        views.TestScannerView.as_view(),
        name='test-scanner',
    ),
    # DEBUG: Verificar licença Dynamsoft
    path(
        'debug/license/',
        views.DebugLicenseView.as_view(),
        name='debug-license',
    ),
]
