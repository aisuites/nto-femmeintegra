from django.urls import path

from .views import DashboardView, health

app_name = 'core'

urlpatterns = [
    path('', DashboardView.as_view(), name='dashboard'),
    path('health/', health, name='health'),
]
