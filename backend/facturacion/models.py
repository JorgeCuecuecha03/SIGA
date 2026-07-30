from django.db import models
from vehiculos.models import UnidadTractocamion
from mantenimiento.models import Taller

class Producto(models.Model):
    CATEGORIAS = [
        ('Mantenimiento', 'Mantenimiento'),
        ('Combustible', 'Combustible'),
        ('Operativo', 'Operativo'),
        ('Administrativo', 'Administrativo'),
        ('Refacciones', 'Refacciones'),
        ('Llantas', 'Llantas'),
        ('Otro', 'Otro'),
    ]
    nombre = models.CharField(max_length=100, unique=True, verbose_name="Nombre del Producto/Servicio")
    categoria = models.CharField(max_length=50, choices=CATEGORIAS, default='Otro', verbose_name="Categoría")
    descripcion = models.TextField(blank=True, null=True, verbose_name="Descripción")

    class Meta:
        verbose_name = "Producto/Servicio"
        verbose_name_plural = "Productos/Servicios"
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} ({self.categoria})"

class Ticket(models.Model):
    CATEGORIAS = [
        ('Mantenimiento', 'Mantenimiento'),
        ('Refacciones', 'Refacciones'),
        ('Administrativo', 'Administrativo'),
        ('Operativo', 'Operativo'),
        ('Llantas', 'Llantas'),
        ('Combustible', 'Combustible'),
        ('Otro', 'Otro'),
    ]

    folio_interno = models.CharField(max_length=50, unique=True, verbose_name="Folio Interno", blank=True)
    folio_emision = models.CharField(max_length=50, verbose_name="Folio de Emisión", blank=True, null=True)
    fecha = models.DateField(verbose_name="Fecha del Ticket")
    monto = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Monto")
    descripcion = models.CharField(max_length=255, blank=True, null=True, verbose_name="Descripción Breve")
    categoria = models.CharField(max_length=50, choices=CATEGORIAS, default='Otro', verbose_name="Categoría")
    taller = models.ForeignKey(
        Taller,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tickets_facturacion',
        verbose_name="Taller/Origen"
    )
    proveedor = models.ForeignKey(
        'proveedores.Proveedor',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tickets_facturacion',
        verbose_name="Proveedor"
    )
    unidad = models.ForeignKey(
        UnidadTractocamion, 
        on_delete=models.SET_NULL, 
        null=True,
        blank=True,
        related_name='tickets',
        verbose_name="Unidad Principal"
    )
    caja = models.ForeignKey(
        'vehiculos.RemolqueCaja',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tickets',
        verbose_name="Caja/Remolque"
    )
    variado = models.ForeignKey(
        'vehiculos.VehiculoVariado',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tickets',
        verbose_name="Vehículo Variado"
    )
    unidades = models.ManyToManyField(
        UnidadTractocamion,
        blank=True,
        related_name='tickets_multiples',
        verbose_name="Unidades Relacionadas"
    )
    cajas = models.ManyToManyField(
        'vehiculos.RemolqueCaja',
        blank=True,
        related_name='tickets_multiples_cajas',
        verbose_name="Cajas Relacionadas"
    )
    variados = models.ManyToManyField(
        'vehiculos.VehiculoVariado',
        blank=True,
        related_name='tickets_multiples_variados',
        verbose_name="Vehículos Variados Relacionados"
    )
    producto = models.ForeignKey(
        Producto,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tickets',
        verbose_name="Producto/Servicio"
    )
    archivo_escaneado = models.FileField(upload_to='tickets/%Y/%m/', verbose_name="Documento Escaneado", null=True, blank=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    convertido_en_factura = models.BooleanField(default=False, verbose_name="¿Facturado?")

    class Meta:
        verbose_name = "Ticket"
        verbose_name_plural = "Tickets"
        ordering = ['-fecha']

    def save(self, *args, **kwargs):
        if not self.folio_interno:
            last_ticket = Ticket.objects.all().order_by('id').last()
            if not last_ticket:
                self.folio_interno = 'TK-00001'
            else:
                try:
                    last_folio = last_ticket.folio_interno
                    if '-' in last_folio:
                        last_number = int(last_folio.split('-')[1])
                        self.folio_interno = f'TK-{(last_number + 1):05d}'
                    else:
                        self.folio_interno = f'TK-{(last_ticket.id + 1):05d}'
                except (ValueError, IndexError):
                    self.folio_interno = f'TK-{(last_ticket.id + 1):05d}'
        
        if not self.folio_emision:
            self.folio_emision = self.folio_interno
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.folio_interno}"

class Factura(models.Model):
    fecha = models.DateField(verbose_name="Fecha de Factura")
    monto = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Monto")
    folio = models.CharField(max_length=50, unique=True, verbose_name="Folio de Factura")
    descripcion = models.CharField(max_length=255, blank=True, null=True, verbose_name="Descripción Breve")
    categoria = models.CharField(max_length=50, choices=Ticket.CATEGORIAS, default='Otro', verbose_name="Categoría")
    cancelado = models.BooleanField(default=False, verbose_name="¿Cancelada?")
    motivo_cancelacion = models.TextField(blank=True, null=True, verbose_name="Motivo de Cancelación")
    factura_reemplazo = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='facturas_reemplazadas', verbose_name="Factura de Reemplazo")
    taller = models.ForeignKey(
        Taller,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='facturas_facturacion',
        verbose_name="Taller/Origen"
    )
    proveedor = models.ForeignKey(
        'proveedores.Proveedor',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='facturas',
        verbose_name="Proveedor"
    )
    rfc_emisor = models.CharField(max_length=13, blank=True, null=True, verbose_name="RFC Emisor")
    razon_social_emisor = models.CharField(max_length=255, blank=True, null=True, verbose_name="Razón Social Emisor")
    unidad = models.ForeignKey(
        UnidadTractocamion, 
        on_delete=models.SET_NULL, 
        null=True,
        blank=True,
        related_name='facturas',
        verbose_name="Unidad Principal"
    )
    caja = models.ForeignKey(
        'vehiculos.RemolqueCaja',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='facturas',
        verbose_name="Caja/Remolque"
    )
    variado = models.ForeignKey(
        'vehiculos.VehiculoVariado',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='facturas',
        verbose_name="Vehículo Variado"
    )
    unidades = models.ManyToManyField(
        UnidadTractocamion,
        blank=True,
        related_name='facturas_multiples',
        verbose_name="Unidades Relacionadas"
    )
    cajas = models.ManyToManyField(
        'vehiculos.RemolqueCaja',
        blank=True,
        related_name='facturas_multiples_cajas',
        verbose_name="Cajas Relacionadas"
    )
    variados = models.ManyToManyField(
        'vehiculos.VehiculoVariado',
        blank=True,
        related_name='facturas_multiples_variados',
        verbose_name="Vehículos Variados Relacionados"
    )
    producto = models.ForeignKey(
        Producto,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='facturas',
        verbose_name="Producto/Servicio"
    )
    ticket = models.OneToOneField(
        Ticket,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='factura_vinculada',
        verbose_name="Ticket Relacionado"
    )
    archivo_escaneado = models.FileField(upload_to='facturas/%Y/%m/', verbose_name="Documento Escaneado", null=True, blank=True)
    iva_aplicado = models.BooleanField(default=False, verbose_name="IVA Aplicado")
    resico_aplicado = models.BooleanField(default=False, verbose_name="RESICO Aplicado")
    es_preventivo = models.BooleanField(default=False, verbose_name="¿Mantenimiento Preventivo?")
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Factura"
        verbose_name_plural = "Facturas"
        ordering = ['-fecha']

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if is_new and not self.ticket:
            # Auto-generar ticket si no se proporcionó uno
            from django.core.files.base import ContentFile
            
            nuevo_ticket = Ticket.objects.create(
                fecha=self.fecha,
                monto=self.monto,
                descripcion=f"Auto-generado por Factura {self.folio}. {self.descripcion or ''}"[:255],
                categoria=self.categoria,
                taller=self.taller,
                proveedor=self.proveedor,
                unidad=self.unidad,
                caja=self.caja,
                variado=self.variado,
                producto=self.producto,
                convertido_en_factura=True
            )
            # Vincular unidades ManyToMany
            if self.pk:
                nuevo_ticket.unidades.set(self.unidades.all())
                nuevo_ticket.cajas.set(self.cajas.all())
                nuevo_ticket.variados.set(self.variados.all())
            
            self.ticket = nuevo_ticket

        if self.ticket:
            self.ticket.convertido_en_factura = True
            self.ticket.save()
        super().save(*args, **kwargs)

    def cancel(self, motivo, reemplazo=None, usuario=None):
        """Mark the invoice as cancelled, store reason and optional replacement.
        Adjust unit expense totals accordingly by removing related detail records.
        """
        self.cancelado = True
        self.motivo_cancelacion = motivo
        if reemplazo:
            self.factura_reemplazo = reemplazo
        # Remove expense detail rows linked to this factura
        self.detalles_unidades.all().delete()
        # If the factura has an associated ticket, also remove its unit detail rows
        if self.ticket:
            self.ticket.detalles_unidades.all().delete()
        self.save()

    def __str__(self):
        return f"{self.folio} - {self.unidad or self.caja or self.variado or 'Múltiple'}"

class TicketDetalleUnidad(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='detalles_unidades')
    unidad = models.ForeignKey(UnidadTractocamion, on_delete=models.CASCADE, null=True, blank=True)
    caja = models.ForeignKey('vehiculos.RemolqueCaja', on_delete=models.CASCADE, null=True, blank=True)
    variado = models.ForeignKey('vehiculos.VehiculoVariado', on_delete=models.CASCADE, null=True, blank=True)
    monto = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        verbose_name = "Detalle de Gasto por Unidad (Ticket)"
        verbose_name_plural = "Detalles de Gasto por Unidades (Tickets)"
        unique_together = (('ticket', 'unidad'), ('ticket', 'caja'), ('ticket', 'variado'))

class FacturaDetalleUnidad(models.Model):
    factura = models.ForeignKey(Factura, on_delete=models.CASCADE, related_name='detalles_unidades')
    unidad = models.ForeignKey(UnidadTractocamion, on_delete=models.CASCADE, null=True, blank=True)
    caja = models.ForeignKey('vehiculos.RemolqueCaja', on_delete=models.CASCADE, null=True, blank=True)
    variado = models.ForeignKey('vehiculos.VehiculoVariado', on_delete=models.CASCADE, null=True, blank=True)
    monto = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        verbose_name = "Detalle de Gasto por Unidad (Factura)"
        verbose_name_plural = "Detalles de Gasto por Unidades (Facturas)"
        unique_together = (('factura', 'unidad'), ('factura', 'caja'), ('factura', 'variado'))

class SolicitudCambioFactura(models.Model):
    ESTADOS = (
        ('Pendiente', 'Pendiente'),
        ('Aprobada', 'Aprobada'),
        ('Rechazada', 'Rechazada'),
    )
    factura = models.ForeignKey(Factura, on_delete=models.CASCADE, related_name='solicitudes_cambio', verbose_name="Factura a Modificar")
    solicitante = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='solicitudes_cambio_creadas', verbose_name="Solicitante (Capturista)")
    autorizador = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='solicitudes_cambio_autorizadas', verbose_name="Autorizador")
    motivo = models.TextField(verbose_name="Motivo del Cambio")
    cambios_propuestos = models.JSONField(verbose_name="Cambios Propuestos")
    estado = models.CharField(max_length=20, choices=ESTADOS, default='Pendiente', verbose_name="Estado de la Solicitud")
    nuevo_archivo_escaneado = models.FileField(upload_to='solicitudes_facturas/%Y/%m/', null=True, blank=True, verbose_name="Nuevo Documento Escaneado")
    fecha_solicitud = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Solicitud")
    fecha_resolucion = models.DateTimeField(null=True, blank=True, verbose_name="Fecha de Resolución")

    class Meta:
        verbose_name = "Solicitud de Cambio de Factura"
        verbose_name_plural = "Solicitudes de Cambio de Facturas"
        ordering = ['-fecha_solicitud']

    def __str__(self):
        return f"Solicitud Cambio Factura {self.factura.folio} - {self.estado}"

class ContraRecibo(models.Model):
    folio = models.CharField(max_length=50, unique=True, verbose_name="Folio Contra Recibo")
    proveedor = models.ForeignKey(
        'proveedores.Proveedor',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contra_recibos',
        verbose_name="Proveedor"
    )
    taller = models.ForeignKey(
        Taller,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contra_recibos',
        verbose_name="Taller/Origen"
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Creación")
    capturista = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Capturista")
    resico_aplicado = models.BooleanField(default=False, verbose_name="RESICO Aplicado")
    total_facturas = models.IntegerField(default=0, verbose_name="Total de Facturas")
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name="Subtotal")
    es_efectivo = models.BooleanField(default=False, verbose_name="¿Es pago en efectivo?")

    class Meta:
        verbose_name = "Contra Recibo"
        verbose_name_plural = "Contra Recibos"
        ordering = ['-fecha_creacion']

    def __str__(self):
        return self.folio

class ContraReciboFactura(models.Model):
    ESTADOS = (
        ('Aceptada', 'Aceptada'),
        ('Rechazada', 'Rechazada'),
    )
    contra_recibo = models.ForeignKey(ContraRecibo, on_delete=models.CASCADE, related_name='facturas_detalle')
    folio_factura = models.CharField(max_length=100, verbose_name="Folio Factura")
    fecha_emision = models.DateField(verbose_name="Fecha Emisión")
    importe = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Importe")
    estado = models.CharField(max_length=20, choices=ESTADOS, default='Aceptada', verbose_name="Estado")
    motivo_rechazo = models.TextField(blank=True, null=True, verbose_name="Motivo de Rechazo")
    observacion = models.TextField(blank=True, null=True, verbose_name="Observación para el proveedor")

    class Meta:
        verbose_name = "Factura de Contra Recibo"
        verbose_name_plural = "Facturas de Contra Recibos"

    def __str__(self):
        return f"{self.folio_factura} ({self.estado})"

