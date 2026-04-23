from rest_framework import viewsets
from .models import Categoria, Producto, EmpaqueAlternativo
from .serializers import CategoriaSerializer, ProductoSerializer, EmpaqueAlternativoSerializer

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer

class EmpaqueAlternativoViewSet(viewsets.ModelViewSet):
    queryset = EmpaqueAlternativo.objects.all()
    serializer_class = EmpaqueAlternativoSerializer