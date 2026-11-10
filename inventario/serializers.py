from rest_framework import serializers
from django.utils.timezone import localtime
from .models import (
    Categoria,
    Producto,
    Venta,
    DetalleVenta,
    ClienteDeudor,
    Deuda,
    DetalleDeuda,
    AbonoDeuda
)


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'


class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = '__all__'


class DetalleVentaSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.SerializerMethodField()

    class Meta:
        model = DetalleVenta
        fields = '__all__'

    def get_producto_nombre(self, obj):
        try:
            return obj.producto.nombre if obj.producto else "Producto Registrado"
        except Exception:
            return "Producto Registrado"


class VentaSerializer(serializers.ModelSerializer):
    fecha_formateada = serializers.SerializerMethodField()
    detalles = serializers.SerializerMethodField()

    class Meta:
        model = Venta
        fields = '__all__'

    def get_fecha_formateada(self, obj):
        try:
            hora_local = localtime(obj.fecha_hora)
            return hora_local.strftime("%d/%m/%Y %I:%M %p")
        except Exception:
            return ""

    def get_detalles(self, obj):
        try: 
            if hasattr(obj, 'detalles_precargados'):
                return DetalleVentaSerializer(obj.detalles_precargados, many=True).data

            detalles = DetalleVenta.objects.filter(venta=obj).select_related('producto') 
            return DetalleVentaSerializer(detalles, many=True).data
        except Exception as e:
            print("Error interno buscando detalles:", e)
            return []


# ==========================================
# SERIALIZERS DE DEUDAS Y FIADOS
# ==========================================
class ClienteDeudorSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClienteDeudor
        fields = '__all__'


class DetalleDeudaSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.SerializerMethodField()

    class Meta:
        model = DetalleDeuda
        fields = '__all__'

    def get_producto_nombre(self, obj):
        try:
            return obj.producto.nombre if obj.producto else "Producto Registrado"
        except Exception:
            return "Producto Registrado"


class AbonoDeudaSerializer(serializers.ModelSerializer):
    fecha_formateada = serializers.SerializerMethodField()

    class Meta:
        model = AbonoDeuda
        fields = '__all__'

    def get_fecha_formateada(self, obj):
        try:
            hora_local = localtime(obj.fecha_hora)
            return hora_local.strftime("%d/%m/%Y %I:%M %p")
        except Exception:
            return ""


class DeudaSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)
    cliente_telefono = serializers.CharField(source='cliente.telefono', read_only=True)
    fecha_formateada = serializers.SerializerMethodField()
    fecha_pago_formateada = serializers.SerializerMethodField()
    detalles = serializers.SerializerMethodField()
    abonos = serializers.SerializerMethodField()

    class Meta:
        model = Deuda
        fields = '__all__'

    def get_fecha_formateada(self, obj):
        try:
            hora_local = localtime(obj.fecha_creacion)
            return hora_local.strftime("%d/%m/%Y %I:%M %p")
        except Exception:
            return ""

    def get_fecha_pago_formateada(self, obj):
        try:
            if not obj.fecha_pago_completo:
                return ""
            hora_local = localtime(obj.fecha_pago_completo)
            return hora_local.strftime("%d/%m/%Y %I:%M %p")
        except Exception:
            return ""

    def get_detalles(self, obj):
        try:
            if hasattr(obj, 'detalles_precargados'):
                return DetalleDeudaSerializer(obj.detalles_precargados, many=True).data
            detalles = DetalleDeuda.objects.filter(deuda=obj).select_related('producto')
            return DetalleDeudaSerializer(detalles, many=True).data
        except Exception:
            return []

    def get_abonos(self, obj):
        try:
            if hasattr(obj, 'abonos_precargados'):
                return AbonoDeudaSerializer(obj.abonos_precargados, many=True).data
            abonos = AbonoDeuda.objects.filter(deuda=obj).order_by('-fecha_hora')
            return AbonoDeudaSerializer(abonos, many=True).data
        except Exception:
            return []