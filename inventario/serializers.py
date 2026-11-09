from rest_framework import serializers
from django.utils.timezone import localtime
from .models import Categoria, Producto, Venta, DetalleVenta


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
            # 1. Usa los detalles precargados en memoria desde VentaViewSet
            if hasattr(obj, 'detalles_precargados'):
                return DetalleVentaSerializer(obj.detalles_precargados, many=True).data

            # 2. Respaldo con select_related si se consulta una venta individual
            detalles = DetalleVenta.objects.filter(venta=obj).select_related('producto')
            return DetalleVentaSerializer(detalles, many=True).data
        except Exception as e:
            print("Error interno buscando detalles:", e)
            return []