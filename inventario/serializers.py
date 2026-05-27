from rest_framework import serializers
from .models import Categoria, Producto, Venta

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = '__all__'

class VentaSerializer(serializers.ModelSerializer):
    fecha_formateada = serializers.SerializerMethodField()

    class Meta:
        model = Venta
        fields = '__all__'

    def get_fecha_formateada(self, obj):
        return obj.fecha_hora.strftime("%d/%m/%Y %I:%M %p")