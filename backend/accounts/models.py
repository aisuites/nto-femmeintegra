from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        RECEBIMENTO = 'recebimento', 'Recebimento'
        TRIAGEM = 'triagem', 'Triagem'
        GESTAO = 'gestao', 'Gestão'
        ATENDIMENTO = 'atendimento', 'Atendimento'
        ADMIN = 'admin', 'Administração'

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.RECEBIMENTO,
        help_text='Perfil operacional principal usado para permissões e dashboards.',
    )

    def __str__(self) -> str:
        return f'{self.get_full_name() or self.username} ({self.get_role_display()})'
