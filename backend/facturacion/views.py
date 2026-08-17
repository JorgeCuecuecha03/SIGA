from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Q
from django.http import HttpResponse

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus.flowables import Flowable

class BottomContainer(Flowable):
    def __init__(self, content):
        Flowable.__init__(self)
        self.content = content
        
    def wrap(self, availWidth, availHeight):
        self.width = availWidth
        self.w, self.h = self.content.wrap(availWidth, availHeight)
        
        if self.h > availHeight:
            self.height = self.h
            return (self.width, self.height)
            
        self.height = availHeight
        return (self.width, self.height)
        
    def draw(self):
        self.content.drawOn(self.canv, 0, 0)

from core.pagination import CustomPagination
from .models import Factura, Producto, Ticket, ContraRecibo
from .serializers import FacturaSerializer, ProductoSerializer, TicketSerializer, ContraReciboSerializer

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer

class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all().order_by('-fecha')
    serializer_class = TicketSerializer
    pagination_class = CustomPagination
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['folio_interno', 'folio_emision', 'descripcion', 'taller__nombre', 'proveedor__nombre', 'unidad__numero_economico', 'unidad__placas', 'caja__numero_economico', 'caja__placas', 'variado__numero_economico', 'variado__placas']
    filterset_fields = ['convertido_en_factura']
    ordering_fields = ['fecha', 'monto']
    @action(detail=False, methods=['get'])
    def pendientes(self, request):
        """Retorna tickets que aún no han sido convertidos en factura."""
        tickets = Ticket.objects.filter(convertido_en_factura=False).order_by('-fecha')
        serializer = self.get_serializer(tickets, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def totales(self, request):
        """Retorna estadísticas generales de tickets."""
        total_pendientes = Ticket.objects.filter(convertido_en_factura=False).count()
        monto_pendiente = Ticket.objects.filter(convertido_en_factura=False).aggregate(Sum('monto'))['monto__sum'] or 0
        total_facturados = Ticket.objects.filter(convertido_en_factura=True).count()
        
        return Response({
            'pendientes_count': total_pendientes,
            'monto_pendiente': float(monto_pendiente),
            'facturados_count': total_facturados
        })

from usuarios.models import HistorialAccion
from django.db.models import Sum, Count, Q

class FacturaViewSet(viewsets.ModelViewSet):
    queryset = Factura.objects.all()
    serializer_class = FacturaSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    pagination_class = CustomPagination
    search_fields = ['folio', 'descripcion', 'taller__nombre', 'proveedor__nombre', 'rfc_emisor', 'razon_social_emisor', 'unidad__numero_economico', 'unidad__placas', 'caja__numero_economico', 'caja__placas', 'variado__numero_economico', 'variado__placas']
    filterset_fields = ['cancelado']
    ordering_fields = ['fecha', 'monto']

    def get_queryset(self):
        queryset = Factura.objects.all().select_related(
            'unidad', 'caja', 'variado', 'producto', 'taller', 'proveedor', 'ticket'
        ).prefetch_related(
            'detalles_unidades__unidad',
            'detalles_unidades__caja',
            'detalles_unidades__variado',
            'unidades',
            'cajas',
            'variados'
        ).order_by('-fecha')
        
        # Filtrado por unidad, caja, variado
        unidad_id = self.request.query_params.get('unidad')
        caja_id = self.request.query_params.get('caja')
        variado_id = self.request.query_params.get('variado')

        if unidad_id:
            queryset = queryset.filter(
                Q(unidad_id=unidad_id) | Q(detalles_unidades__unidad_id=unidad_id) | Q(unidades__id=unidad_id)
            ).distinct()
        if caja_id:
            queryset = queryset.filter(
                Q(caja_id=caja_id) | Q(detalles_unidades__caja_id=caja_id) | Q(cajas__id=caja_id)
            ).distinct()
        if variado_id:
            queryset = queryset.filter(
                Q(variado_id=variado_id) | Q(detalles_unidades__variado_id=variado_id) | Q(variados__id=variado_id)
            ).distinct()
            
        # Filtrado por rango de fechas
        fecha_inicio = self.request.query_params.get('fecha_inicio')
        fecha_fin = self.request.query_params.get('fecha_fin')
        if fecha_inicio:
            queryset = queryset.filter(fecha__gte=fecha_inicio)
        if fecha_fin:
            queryset = queryset.filter(fecha__lte=fecha_fin)
            
        # Filtrado por categoría
        categoria = self.request.query_params.get('categoria')
        exclude_categoria = self.request.query_params.get('exclude_categoria')
        if categoria:
            queryset = queryset.filter(categoria=categoria)
        if exclude_categoria:
            queryset = queryset.exclude(categoria=exclude_categoria)
            
        return queryset

    @action(detail=False, methods=['get'])
    def stats(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        
        # Filtramos facturas canceladas para los totales
        valid_qs = queryset.filter(cancelado=False)
        
        total = valid_qs.aggregate(total_monto=Sum('monto'))['total_monto'] or 0
        count = valid_qs.count()
        unidades = valid_qs.exclude(unidad__isnull=True).values('unidad').distinct().count()
        
        # También podemos agrupar por categoría para la gráfica
        chart_data_raw = valid_qs.values('categoria', 'producto__categoria').annotate(monto_total=Sum('monto'))
        chart_data = {}
        for item in chart_data_raw:
            cat = item['categoria']
            if not cat or cat == 'Otro':
                cat = item['producto__categoria'] or 'Otro'
            chart_data[cat] = chart_data.get(cat, 0) + float(item['monto_total'] or 0)
            
        chart_data_list = [{'name': k, 'value': v} for k, v in chart_data.items()]
        chart_data_list.sort(key=lambda x: x['value'], reverse=True)
        
        # Agrupar por proveedor/taller
        proveedor_chart_data_raw = valid_qs.values('taller__nombre', 'proveedor__nombre').annotate(monto_total=Sum('monto'))
        proveedor_data = {}
        for item in proveedor_chart_data_raw:
            prov = item['taller__nombre'] or item['proveedor__nombre'] or 'No especificado'
            proveedor_data[prov] = proveedor_data.get(prov, 0) + float(item['monto_total'] or 0)
            
        proveedor_chart_data_list = [{'name': k, 'value': v} for k, v in proveedor_data.items()]
        proveedor_chart_data_list.sort(key=lambda x: x['value'], reverse=True)
        
        return Response({
            'total': float(total),
            'count': count,
            'units': unidades,
            'chart_data': chart_data_list,
            'proveedor_chart_data': proveedor_chart_data_list
        })

    @action(detail=False, methods=['get'])
    def descargar_pdf_semana(self, request):
        queryset = self.get_queryset().filter(
            cancelado=False,
            archivo_escaneado__isnull=False
        ).exclude(archivo_escaneado='')

        def get_sort_key(factura):
            import re
            def extract_num(s):
                if not s: return 999999
                nums = re.findall(r'\d+', str(s))
                return int(nums[0]) if nums else 999999
            
            if factura.unidad:
                return (0, extract_num(factura.unidad.numero_economico))
            elif factura.detalles_unidades.exists():
                first = factura.detalles_unidades.first()
                if first.unidad:
                    return (0, extract_num(first.unidad.numero_economico))
                return (0, 999998)
            elif factura.caja:
                return (1, extract_num(factura.caja.numero_economico))
            elif factura.variado:
                return (2, extract_num(factura.variado.numero_economico))
            return (9, 999999)

        facturas = list(queryset)
        facturas.sort(key=get_sort_key)

        from pypdf import PdfWriter, PdfReader
        from PIL import Image
        import io
        import os
        from django.http import HttpResponse

        merger = PdfWriter()

        for f in facturas:
            if not f.archivo_escaneado:
                continue
            path = f.archivo_escaneado.path
            if not os.path.exists(path):
                continue
                
            ext = os.path.splitext(path)[1].lower()
            try:
                if ext == '.pdf':
                    reader = PdfReader(path)
                    for page in reader.pages:
                        merger.add_page(page)
                elif ext in ['.jpg', '.jpeg', '.png']:
                    image = Image.open(path)
                    pdf_bytes = io.BytesIO()
                    if image.mode == "RGBA":
                        image = image.convert("RGB")
                    image.save(pdf_bytes, format='PDF')
                    pdf_bytes.seek(0)
                    reader = PdfReader(pdf_bytes)
                    for page in reader.pages:
                        merger.add_page(page)
            except Exception as e:
                print(f"Error procesando {path}: {e}")
                continue

        output = io.BytesIO()
        merger.write(output)
        output.seek(0)
        
        fecha_inicio = request.query_params.get('fecha_inicio', 'inicio')
        fecha_fin = request.query_params.get('fecha_fin', 'fin')
        
        response = HttpResponse(output.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="facturas_{fecha_inicio}_a_{fecha_fin}.pdf"'
        return response

    def procesar_mantenimiento_preventivo(self, factura, data):
        es_preventivo = data.get('es_preventivo') == 'true' or data.get('es_preventivo') is True or getattr(factura, 'es_preventivo', False)
        if es_preventivo:
            fecha_servicio = data.get('fecha_servicio')
            if not fecha_servicio:
                fecha_servicio = factura.fecha

            from django.utils.dateparse import parse_date
            if isinstance(fecha_servicio, str):
                fecha_servicio = parse_date(fecha_servicio)

            unidades_a_reiniciar = set()
            
            unidades_mantenimiento_raw = data.get('unidades_mantenimiento')
            if unidades_mantenimiento_raw:
                import json
                try:
                    selected_ids = set(json.loads(unidades_mantenimiento_raw)) if isinstance(unidades_mantenimiento_raw, str) else set(unidades_mantenimiento_raw)
                    from vehiculos.models import UnidadTractocamion
                    for u in UnidadTractocamion.objects.filter(id__in=selected_ids):
                        unidades_a_reiniciar.add(u)
                except Exception:
                    pass
            
            if not unidades_a_reiniciar:
                if factura.unidad:
                    unidades_a_reiniciar.add(factura.unidad)
                for u in factura.unidades.all():
                    unidades_a_reiniciar.add(u)

            for unidad in unidades_a_reiniciar:
                unidad.ultimo_kilometraje_mantenimiento = unidad.ultimo_kilometraje
                unidad.fecha_ultimo_mantenimiento = fecha_servicio
                unidad.save()

    def perform_create(self, serializer):
        factura = serializer.save()
        user = self.request.user if self.request.user.is_authenticated else None
        
        monto = factura.monto if hasattr(factura, 'monto') else 'N/A'
        
        HistorialAccion.objects.create(
            user=user,
            accion="Alta de Factura",
            detalles=f"Se ha dado de alta la factura con folio {factura.folio}."
        )

        self.procesar_mantenimiento_preventivo(factura, self.request.data)

    def perform_update(self, serializer):
        factura = serializer.save()
        self.procesar_mantenimiento_preventivo(factura, self.request.data)

    def update(self, request, *args, **kwargs):
        user = request.user
        try:
            rol = user.perfil.rol
        except:
            rol = 'capturista'

        if rol == 'capturista':
            motivo = request.data.get('motivo_cambio')
            if not motivo:
                return Response({'detail': 'Se requiere un motivo para solicitar el cambio.'}, status=400)
            
            factura = self.get_object()
            from .models import SolicitudCambioFactura
            
            # Preparar los datos a guardar en JSON, parseando listas y excluyendo archivos
            cambios = {}
            import json
            for k in request.data.keys():
                if k == 'motivo_cambio' or k == 'archivo_escaneado': continue
                
                # Filtrar arreglos vacíos o nulos en M2M
                if k in ['unidades', 'cajas', 'variados']:
                    # Remover strings vacíos
                    val_list = request.data.getlist(k)
                    cambios[k] = [v for v in val_list if v and v != 'null']
                elif k == 'detalles_unidades':
                    try:
                        cambios[k] = json.loads(request.data.get(k))
                    except:
                        cambios[k] = request.data.get(k)
                else:
                    val = request.data.get(k)
                    if val == 'null' or val == 'undefined':
                        val = None
                    cambios[k] = val
            
            SolicitudCambioFactura.objects.create(
                factura=factura,
                solicitante=user,
                motivo=motivo,
                cambios_propuestos=cambios,
                nuevo_archivo_escaneado=request.FILES.get('archivo_escaneado')
            )
            
            HistorialAccion.objects.create(
                user=user,
                accion="Solicitud de Cambio en Factura",
                detalles=f"Se ha solicitado un cambio en la factura con folio {factura.folio}. Motivo: {motivo}"
            )
            
            return Response({'detail': 'Solicitud de cambio enviada a revisión.'}, status=202)
        
        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=['get'], url_path='candidatos')
    def candidatos(self, request, pk=None):
        """Return replacement candidate invoices for the same vehicle (unidad, caja or variado) that are not cancelled."""
        from django.db.models import Q
        factura = self.get_object()
        filters = Q()
        if factura.unidad:
            filters |= Q(unidad=factura.unidad)
        if factura.caja:
            filters |= Q(caja=factura.caja)
        if factura.variado:
            filters |= Q(variado=factura.variado)
        if not filters:
            return Response([])
        candidatos_qs = Factura.objects.filter(filters, cancelado=False).exclude(id=factura.id).distinct()
        serializer = self.get_serializer(candidatos_qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='cancelar')
    def cancelar(self, request, pk=None):
        """Cancel a factura with reason and mandatory replacement."""
        factura = self.get_object()
        if factura.cancelado:
            return Response({'detail': 'Factura ya está cancelada.'}, status=400)
        motivo = request.data.get('motivo')
        reemplazo_id = request.data.get('factura_reemplazo_id')
        if not motivo:
            return Response({'detail': 'Se requiere motivo de cancelación.'}, status=400)
        if not reemplazo_id:
            return Response({'detail': 'Se requiere seleccionar una factura de reemplazo.'}, status=400)
        try:
            reemplazo = Factura.objects.get(id=reemplazo_id)
        except Factura.DoesNotExist:
            return Response({'detail': 'Factura de reemplazo no encontrada.'}, status=404)
        factura.cancel(motivo, reemplazo)
        
        user = request.user if request.user.is_authenticated else None
        HistorialAccion.objects.create(
            user=user,
            accion="Cancelación de Factura",
            detalles=f"Se solicitó la cancelación de la factura con folio {factura.folio}. Motivo: {motivo}."
        )
        
        serializer = self.get_serializer(factura)
        return Response(serializer.data, status=200)

from .models import SolicitudCambioFactura
from .serializers import SolicitudCambioFacturaSerializer
from django.utils import timezone

class SolicitudCambioFacturaViewSet(viewsets.ModelViewSet):
    queryset = SolicitudCambioFactura.objects.all()
    serializer_class = SolicitudCambioFacturaSerializer

    def get_queryset(self):
        user = self.request.user
        try:
            rol = user.perfil.rol
        except:
            rol = 'capturista'
            
        if rol == 'capturista':
            return SolicitudCambioFactura.objects.filter(solicitante=user)
        return SolicitudCambioFactura.objects.all()

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        try:
            solicitud = self.get_object()
            if solicitud.estado != 'Pendiente':
                return Response({'detail': 'Solo se pueden aprobar solicitudes pendientes.'}, status=400)
                
            # Manejar posibles strings o None en cambios_propuestos
            cambios_raw = solicitud.cambios_propuestos
            import json
            if isinstance(cambios_raw, str):
                try:
                    cambios = json.loads(cambios_raw)
                except:
                    cambios = {}
            elif isinstance(cambios_raw, dict):
                cambios = cambios_raw.copy()
            else:
                cambios = {}

            # Limpiar datos corruptos de solicitudes antiguas si las hay
            if 'archivo_escaneado' in cambios:
                del cambios['archivo_escaneado']
            for k in ['unidades', 'cajas', 'variados']:
                if k in cambios and isinstance(cambios[k], list):
                    cambios[k] = [v for v in cambios[k] if v and v != 'null']
            for k, v in list(cambios.items()):
                if v == 'null' or v == 'undefined' or v == '':
                    cambios[k] = None

            if solicitud.nuevo_archivo_escaneado:
                solicitud.factura.archivo_escaneado = solicitud.nuevo_archivo_escaneado
                solicitud.factura.save(update_fields=['archivo_escaneado'])

            # Usar FacturaSerializer con partial=True para validar los cambios
            serializer = FacturaSerializer(solicitud.factura, data=cambios, partial=True)
            if serializer.is_valid():
                factura_actualizada = serializer.save()
                FacturaViewSet().procesar_mantenimiento_preventivo(factura_actualizada, cambios)
                
                solicitud.estado = 'Aprobada'
                solicitud.autorizador = request.user
                solicitud.fecha_resolucion = timezone.now()
                solicitud.save()
                
                HistorialAccion.objects.create(
                    user=request.user,
                    accion="Aprobación de Cambio en Factura",
                    detalles=f"Se aprobó el cambio en la factura folio {solicitud.factura.folio} solicitado por {solicitud.solicitante.username}."
                )
                return Response({'detail': 'Solicitud aprobada y factura actualizada.'})
            return Response(serializer.errors, status=400)
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print("ERROR EN APROBAR:", error_trace)
            return Response({'detail': f'Error interno: {str(e)}', 'trace': error_trace}, status=500)

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        solicitud = self.get_object()
        if solicitud.estado != 'Pendiente':
            return Response({'detail': 'Solo se pueden rechazar solicitudes pendientes.'}, status=400)
            
        solicitud.estado = 'Rechazada'
        solicitud.autorizador = request.user
        solicitud.fecha_resolucion = timezone.now()
        solicitud.save()
        
        HistorialAccion.objects.create(
            user=request.user,
            accion="Rechazo de Cambio en Factura",
            detalles=f"Se rechazó el cambio en la factura folio {solicitud.factura.folio} solicitado por {solicitud.solicitante.username}."
        )
        return Response({'detail': 'Solicitud rechazada.'})

class ContraReciboViewSet(viewsets.ModelViewSet):
    queryset = ContraRecibo.objects.all()
    serializer_class = ContraReciboSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['folio', 'proveedor__nombre', 'taller__nombre', 'capturista__username']

    def perform_create(self, serializer):
        serializer.save(capturista=self.request.user)

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        cr = self.get_object()
        
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{cr.folio}.pdf"'
        
        doc = SimpleDocTemplate(response, pagesize=letter,
                                rightMargin=40, leftMargin=40,
                                topMargin=40, bottomMargin=40)
        
        styles = getSampleStyleSheet()
        elements = []
        
        header_style = ParagraphStyle(
            name='HeaderStyle',
            parent=styles['Heading1'],
            fontSize=16,
            alignment=1, # Center
            spaceAfter=6
        )
        sub_header_style = ParagraphStyle(
            name='SubHeaderStyle',
            parent=styles['Normal'],
            fontSize=10,
            alignment=1, # Center
            spaceAfter=3
        )
        title_style = ParagraphStyle(
            name='TitleStyle',
            parent=styles['Heading2'],
            fontSize=14,
            alignment=1,
            spaceAfter=12
        )
        info_style = styles['Normal']
        totals_style = ParagraphStyle(
            name='TotalsStyle',
            parent=styles['Normal'],
            fontSize=11,
            alignment=2 # Right
        )
        
        def build_copy(title_suffix, invoices, is_company_copy=False):
            copy_elements = []
            copy_elements.append(Paragraph("AUTOTRANSPORTES COLUMBIA S.A DE C.V", header_style))
            copy_elements.append(Paragraph("RFC: ACO090825HW4", sub_header_style))
            copy_elements.append(Paragraph("Dirección: Lucero 1B, San Miguel Contla, 90640 San Miguel Contla, Tlax.", sub_header_style))
            copy_elements.append(Spacer(1, 10))
            
            if title_suffix:
                copy_elements.append(Paragraph(f"Contra Recibo: {cr.folio} - {title_suffix}", title_style))
            else:
                copy_elements.append(Paragraph(f"Contra Recibo: {cr.folio}", title_style))
            
            prov_nombre = cr.proveedor.nombre if cr.proveedor else (cr.taller.nombre if cr.taller else 'N/A')
            copy_elements.append(Paragraph(f"<b>Recibido de:</b> {prov_nombre}", info_style))
            fecha_local = cr.fecha_creacion.astimezone() if cr.fecha_creacion else None
            fecha_str = fecha_local.strftime('%d/%m/%Y %H:%M') if fecha_local else ""
            copy_elements.append(Paragraph(f"<b>Fecha:</b> {fecha_str}", info_style))
            copy_elements.append(Paragraph(f"<b>Capturista:</b> {cr.capturista.username if cr.capturista else 'N/A'}", info_style))
            copy_elements.append(Paragraph(f"<b>Aplica RESICO:</b> {'Sí' if cr.resico_aplicado else 'No'}", info_style))
            copy_elements.append(Spacer(1, 15))
            
            if cr.resico_aplicado:
                if is_company_copy:
                    data = [['Folio', 'Fecha', 'Subtotal', 'Desc.', 'IVA', 'RESICO', 'Total', 'Estado']]
                else:
                    data = [['Folio', 'Fecha', 'Subtotal', 'Desc.', 'IVA', 'RESICO', 'Total', 'Estado', 'Motivo/Obs.']]
            else:
                if is_company_copy:
                    data = [['Folio', 'Fecha', 'Subtotal', 'Desc.', 'IVA', 'Total', 'Estado']]
                else:
                    data = [['Folio', 'Fecha', 'Subtotal', 'Desc.', 'IVA', 'Total', 'Estado', 'Motivo/Obs.']]
            
            sum_subtotal = 0
            sum_iva = 0
            sum_total_antes_retenciones = 0
            sum_gran_total = 0
            sum_descuentos = 0
            count_copy = 0
            
            for factura in invoices:
                observacion = factura.observacion or ""
                motivo = factura.motivo_rechazo or ""
                texto_rechazo = f"{motivo} - {observacion}" if motivo or observacion else ""
                
                # Desglose matemático:
                gran_total_fac = float(factura.importe)
                descuento_fac = float(factura.descuento) if hasattr(factura, 'descuento') and factura.descuento else 0.0
                
                if cr.resico_aplicado:
                    # Gran Total = (Subtotal - Descuento) * 1.1475
                    subtotal_menos_descuento = gran_total_fac / 1.1475
                    resico_fac = subtotal_menos_descuento * 0.0125
                else:
                    # Gran Total = (Subtotal - Descuento) * 1.16
                    subtotal_menos_descuento = gran_total_fac / 1.16
                    resico_fac = 0.0
                
                subtotal_fac = subtotal_menos_descuento + descuento_fac
                iva_fac = subtotal_menos_descuento * 0.16
                total_antes_resico = subtotal_menos_descuento + iva_fac
                
                sum_gran_total += gran_total_fac
                sum_total_antes_retenciones += total_antes_resico
                sum_subtotal += subtotal_fac
                sum_iva += iva_fac
                sum_descuentos += descuento_fac
                count_copy += 1
                
                val_subtotal = "" if cr.sin_desglose else f"${subtotal_fac:,.2f}"
                val_iva = "" if cr.sin_desglose else f"${iva_fac:,.2f}"
                val_resico = "" if cr.sin_desglose else f"-${resico_fac:,.2f}"

                row = [
                    factura.folio_factura,
                    factura.fecha_emision.strftime('%d/%m/%Y'),
                    val_subtotal,
                    f"${descuento_fac:,.2f}",
                    val_iva,
                ]

                if cr.resico_aplicado:
                    row.append(val_resico)

                row.extend([
                    f"${gran_total_fac:,.2f}",
                    factura.estado
                ])

                if not is_company_copy:
                    row.append(texto_rechazo)

                data.append(row)
            
            if cr.resico_aplicado:
                if is_company_copy:
                    table = Table(data, colWidths=[1.0*inch, 0.7*inch, 0.9*inch, 0.7*inch, 0.7*inch, 0.8*inch, 0.9*inch, 1.0*inch])
                else:
                    table = Table(data, colWidths=[0.8*inch, 0.7*inch, 0.8*inch, 0.6*inch, 0.6*inch, 0.7*inch, 0.8*inch, 0.7*inch, 1.4*inch])
            else:
                if is_company_copy:
                    table = Table(data, colWidths=[1.1*inch, 0.8*inch, 1.0*inch, 0.9*inch, 1.0*inch, 1.0*inch, 1.2*inch])
                else:
                    table = Table(data, colWidths=[0.9*inch, 0.7*inch, 0.8*inch, 0.7*inch, 0.8*inch, 0.9*inch, 0.7*inch, 1.5*inch])
                
            table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1f2937')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,0), 9),
                ('BOTTOMPADDING', (0,0), (-1,0), 8),
                ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#f9fafb')),
                ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#d1d5db')),
                ('FONTSIZE', (0,1), (-1,-1), 8),
                ('WORDWRAP', (0,0), (-1,-1), True),
            ]))
            
            copy_elements.append(table)
            copy_elements.append(Spacer(1, 20))
            
            # Totales
            copy_elements.append(Paragraph(f"<b>Total Facturas:</b> {count_copy}", totals_style))
            if sum_descuentos > 0:
                copy_elements.append(Paragraph(f"<b>Total Descuentos:</b> ${sum_descuentos:,.2f}", totals_style))
            if not cr.sin_desglose:
                copy_elements.append(Paragraph(f"<b>Suma Subtotal:</b> ${sum_subtotal:,.2f}", totals_style))
                copy_elements.append(Paragraph(f"<b>Suma IVA:</b> ${sum_iva:,.2f}", totals_style))
            
            if cr.resico_aplicado:
                # Retención RESICO is applied on the base (Subtotal - Descuento)
                resico = (sum_subtotal - sum_descuentos) * 0.0125
                copy_elements.append(Paragraph(f"<b>Suma Total (Antes de Retención):</b> ${sum_total_antes_retenciones:,.2f}", totals_style))
                copy_elements.append(Paragraph(f"<b>Retención RESICO (1.25%):</b> -${resico:,.2f}", totals_style))
                copy_elements.append(Paragraph(f"<b>Gran Total a Pagar:</b> ${sum_gran_total:,.2f}", totals_style))
            else:
                copy_elements.append(Paragraph(f"<b>Suma Total:</b> ${sum_gran_total:,.2f}", totals_style))
            
            if not cr.es_efectivo:
                sig_data = [
                    ['_________________________', '_________________________'],
                    ['Entregado por (Proveedor)', 'Recibido por (Capturista)']
                ]
                sig_table = Table(sig_data, colWidths=[3.5*inch, 3.5*inch])
                sig_table.setStyle(TableStyle([
                    ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                    ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
                    ('FONTSIZE', (0,0), (-1,-1), 10),
                    ('TOPPADDING', (0,0), (-1,-1), 15),
                ]))
                
                copy_elements.append(BottomContainer(sig_table))
            
            return copy_elements

        all_invoices = cr.facturas_detalle.all()
        accepted_invoices = cr.facturas_detalle.filter(estado='Aceptada')
        
        if cr.es_efectivo:
            # Para pagos en efectivo, solo se genera una sola hoja (Comprobante Único)
            elements.extend(build_copy("", all_invoices, is_company_copy=False))
        else:
            # Copia Proveedor (Todas las facturas)
            elements.extend(build_copy("COPIA PROVEEDOR", all_invoices, is_company_copy=False))
            
            elements.append(PageBreak())
            
            # Copia Empresa (Solo Aceptadas)
            elements.extend(build_copy("COPIA EMPRESA", accepted_invoices, is_company_copy=True))
        
        doc.build(elements)
        return response
