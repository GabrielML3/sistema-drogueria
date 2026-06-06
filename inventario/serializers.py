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
    # Generamos el nombre del producto de forma segura con un try/except
    producto_nombre = serializers.SerializerMethodField()

    class Meta:
        model = DetalleVenta
        fields = '__all__'  # <-- CRUCIAL: Evita que Django colapse por buscar nombres de columnas inexactos

    def get_producto_nombre(self, obj):
        try:
            return obj.producto.nombre
        except:
            return "Producto Registrado"

class VentaSerializer(serializers.ModelSerializer):
    fecha_formateada = serializers.SerializerMethodField()
    detalles = serializers.SerializerMethodField()

    class Meta:
        model = Venta
        fields = '__all__'

    def get_fecha_formateada(self, obj):
        try:
            # 1. Convertimos la hora UTC a la hora local (América/Bogota)
            hora_local = localtime(obj.fecha_hora)
            
            # 2. Formateamos la hora ya convertida
            return hora_local.strftime("%d/%m/%Y %I:%M %p")
        except:
            return ""

    def get_detalles(self, obj):
        try:
            # Buscamos los detalles asociados a esta venta en específico
            detalles = DetalleVenta.objects.filter(venta=obj)
            return DetalleVentaSerializer(detalles, many=True).data
        except Exception as e:
            print("Error interno buscando detalles:", e)
            return []