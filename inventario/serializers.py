from rest_framework import serializers
from .models import Categoria, Producto, EmpaqueAlternativo

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

class EmpaqueAlternativoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmpaqueAlternativo
        fields = '__all__'

class ProductoSerializer(serializers.ModelSerializer):
    # Esto le dice a DRF que, al pedir un producto, también traiga la info de sus empaques
    empaques = EmpaqueAlternativoSerializer(many=True, read_only=True)
    
    class Meta:
        model = Producto
        fields = ['id', 'nombre', 'categoria', 'laboratorio', 'unidad_medida_minima', 'stock_total', 'stock_minimo_alerta', 'empaques']