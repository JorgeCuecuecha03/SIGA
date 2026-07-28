from django.db import models
from rest_framework import serializers
from .models import PrecioCombustible, CargaCombustible, BloqueCargaCombustible
from vehiculos.models import UnidadTractocamion

class PrecioCombustibleSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrecioCombustible
        fields = '__all__'

class CargaCombustibleSerializer(serializers.ModelSerializer):
    unidad_detalle = serializers.SerializerMethodField()
    alcance = serializers.SerializerMethodField()
    unidad = serializers.PrimaryKeyRelatedField(queryset=UnidadTractocamion.objects.all(), required=False, allow_null=True)
    precio_unitario = serializers.FloatField(required=False)
    monto_total = serializers.FloatField(required=False)
    litros = serializers.FloatField()
    fecha = serializers.DateField(required=False)
    
    class Meta:
        model = CargaCombustible
        fields = '__all__'

    def get_unidad_detalle(self, obj):
        if obj.unidad:
            return obj.unidad.numero_economico
        if obj.unidad_variada:
            return obj.unidad_variada.numero_economico
        return 'Desconocido'

    def get_alcance(self, obj):
        if obj.ignorar_kilometraje or obj.kilometraje is None:
            return None
        unidad_filter = {'unidad': obj.unidad} if obj.unidad else ({'unidad_variada': obj.unidad_variada} if obj.unidad_variada else None)
        if not unidad_filter:
            return None

        prev_carga = CargaCombustible.objects.filter(
            **unidad_filter,
            ignorar_kilometraje=False,
            kilometraje__isnull=False
        ).filter(
            models.Q(fecha__lt=obj.fecha) | models.Q(fecha=obj.fecha, fecha_registro__lt=obj.fecha_registro)
        ).exclude(id=obj.id if obj.id else None).order_by('-fecha', '-fecha_registro').first()

        if prev_carga and prev_carga.kilometraje is not None:
            diff = obj.kilometraje - prev_carga.kilometraje
            return diff if diff > 0 else 0
        return None

class BloqueCargaCombustibleSerializer(serializers.ModelSerializer):
    cargas = CargaCombustibleSerializer(many=True, read_only=True)

    class Meta:
        model = BloqueCargaCombustible
        fields = '__all__'

class BulkCargaCombustibleSerializer(serializers.Serializer):
    fecha = serializers.DateField()
    precio_magna = serializers.FloatField(required=False, default=0)
    precio_premium = serializers.FloatField(required=False, default=0)
    precio_diesel = serializers.FloatField(required=False, default=0)
    precio_electrico = serializers.FloatField(required=False, default=0)
    precio_gas_lp = serializers.FloatField(required=False, default=0)
    cargas = CargaCombustibleSerializer(many=True)

    def create(self, validated_data):
        fecha = validated_data['fecha']
        # Update or create price for the day
        precio_obj, _ = PrecioCombustible.objects.update_or_create(
            fecha=fecha,
            defaults={
                'precio_magna': validated_data['precio_magna'],
                'precio_premium': validated_data['precio_premium'],
                'precio_diesel': validated_data['precio_diesel'],
                'precio_electrico': validated_data.get('precio_electrico', 0),
                'precio_gas_lp': validated_data.get('precio_gas_lp', 0),
            }
        )
        
        # Create the block
        bloque = BloqueCargaCombustible.objects.create(fecha=fecha)

        cargas_data = validated_data['cargas']
        cargas_created = []
        for carga_data in cargas_data:
            carga_data['fecha'] = fecha
            carga_data['bloque'] = bloque
            # Ensure price matches the type
            tipo = carga_data['tipo_combustible']
            if tipo == 'magna':
                carga_data['precio_unitario'] = precio_obj.precio_magna
            elif tipo == 'premium':
                carga_data['precio_unitario'] = precio_obj.precio_premium
            elif tipo == 'diesel':
                carga_data['precio_unitario'] = precio_obj.precio_diesel
            elif tipo == 'electrico':
                carga_data['precio_unitario'] = precio_obj.precio_electrico
            elif tipo == 'gas_lp':
                carga_data['precio_unitario'] = precio_obj.precio_gas_lp
            else:
                carga_data['precio_unitario'] = 0
                
            carga = CargaCombustible.objects.create(**carga_data)
            cargas_created.append(carga)
            
        bloque.update_totals()
            
        return {'fecha': fecha, 'bloque_id': bloque.id, 'cargas': cargas_created}

from .models import EvidenciaGas

class EvidenciaGasSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvidenciaGas
        fields = '__all__'
