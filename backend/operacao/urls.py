from django.urls import path

from . import views

app_name = 'operacao'

urlpatterns = [
    path('triagem/', views.TriagemView.as_view(), name='triagem'),
    path(
        'triagem/localizar/',
        views.TriagemLocalizarView.as_view(),
        name='triagem-localizar',
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
