from django.db import models
from django.contrib.auth.models import User

class Perfil(models.Model):
    ROLES_CHOICES = (
        ('admin_general', 'Administrador General'),
        ('admin', 'Administrador'),
        ('capturista', 'Capturista'),
        ('jefe_logistica', 'Jefe de Logística'),
        ('monitoreo', 'Monitoreo'),
        ('lector_gastos', 'Lector de Gastos'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
    rol = models.CharField(max_length=20, choices=ROLES_CHOICES, default='capturista')
    avatar = models.CharField(max_length=50, default='User', blank=True, null=True, verbose_name="Icono de Avatar")

    def __str__(self):
        return f"{self.user.username} - {self.get_rol_display()}"

from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Perfil.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if not hasattr(instance, 'perfil'):
        Perfil.objects.create(user=instance)
    instance.perfil.save()

class HistorialAccion(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='historial_acciones')
    accion = models.CharField(max_length=255, verbose_name="Acción Realizada")
    detalles = models.TextField(blank=True, null=True, verbose_name="Detalles de la Acción")
    fecha = models.DateTimeField(auto_now_add=True, verbose_name="Fecha y Hora")

    class Meta:
        verbose_name = "Historial de Acción"
        verbose_name_plural = "Historial de Acciones"
        ordering = ['-fecha']

    def __str__(self):
        usuario_nombre = self.user.username if self.user else "Usuario Desconocido"
        return f"{usuario_nombre} - {self.accion} - {self.fecha.strftime('%Y-%m-%d %H:%M:%S')}"
