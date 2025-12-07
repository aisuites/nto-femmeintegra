from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import Count
from django.views.generic import TemplateView

from operacao.models import Requisicao, StatusRequisicao, Unidade


class DashboardView(LoginRequiredMixin, TemplateView):
    template_name = 'dashboard.html'
    login_url = 'admin:login'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        total_requisicoes = Requisicao.objects.count()
        requisicoes_recent = (
            Requisicao.objects.select_related('unidade', 'status').order_by('-created_at')[:5]
        )
        status_totais = (
            StatusRequisicao.objects.annotate(total=Count('requisicoes'))
            .order_by('ordem')
            .values('descricao', 'codigo', 'total')
        )
        total_unidades = Unidade.objects.count()

        context.update(
            {
                'total_requisicoes': total_requisicoes,
                'total_unidades': total_unidades,
                'status_totais': status_totais,
                'requisicoes_recent': requisicoes_recent,
                'active_page': 'dashboard',
            }
        )
        return context
