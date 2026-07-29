from rest_framework import serializers
from decimal import Decimal
from .models import UnidadTractocamion, RemolqueCaja, VehiculoVariado

class RemolqueCajaSerializer(serializers.ModelSerializer):
    class Meta:
        model = RemolqueCaja
        fields = '__all__'

class VehiculoVariadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehiculoVariado
        fields = '__all__'

class UnidadSerializer(serializers.ModelSerializer):
    capacidad = serializers.DecimalField(max_digits=4, decimal_places=1, required=False)
    orden_activa = serializers.SerializerMethodField()

    class Meta:
        model = UnidadTractocamion
        fields = '__all__'

    def validate_capacidad(self, value):
        if value is not None:
            val_float = float(value)
            formatted = Decimal(f"{val_float:.1f}")
            valid_values = [Decimal('0.0'), Decimal('1.5'), Decimal('3.5'), Decimal('5.0'), Decimal('8.0'), Decimal('10.0'), Decimal('30.0')]
            if formatted in valid_values:
                return formatted
            raise serializers.ValidationError(f"{value} no es una opción de capacidad válida.")
        return value

    def validate_numero_vin(self, value):
        if value == "":
            return None
        return value

    def get_orden_activa(self, obj):
        # Importamos aquí para evitar importaciones circulares
        from mantenimiento.models import OrdenTrabajo
        # Buscamos una orden que no esté completada
        orden = OrdenTrabajo.objects.filter(unidad=obj).exclude(estatus='completado').last()
        return orden.id if orden else None
