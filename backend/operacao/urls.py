from django.urls import path

from . import views

app_name = 'operacao'

urlpatterns = [
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
]
