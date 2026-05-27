from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from django.db import transaction
from decimal import Decimal

from .models import Categoria, Producto, Venta, DetalleVenta
from .serializers import CategoriaSerializer, ProductoSerializer, VentaSerializer

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer

    # Tu buscador en vivo
    @action(detail=False, methods=['get'])
    def buscar(self, request):
        termino = request.query_params.get('q', '')
        if not termino:
            return Response([])
        
        resultados = Producto.objects.filter(Q(nombre__icontains=termino))
        serializer = self.get_serializer(resultados, many=True)
        return Response(serializer.data)

# El motor de cobro y descuento de inventario
class ProcesarVentaView(APIView):
    @transaction.atomic
    def post(self, request):
        items = request.data.get('items', [])
        if not items:
            return Response({"error": "El carrito de compras está vacío"}, status=status.HTTP_400_BAD_REQUEST)
        
        total_venta = Decimal('0.00')
        total_costo_compra = Decimal('0.00')
        detalles_a_crear = []
        productos_a_actualizar = []
        
        for item in items:
            try:
                producto = Producto.objects.select_for_update().get(id=item['id'])
            except Producto.DoesNotExist:
                return Response({"error": f"El producto no existe"}, status=status.HTTP_404_NOT_FOUND)
            
            tipo_unidad = item['tipo_unidad'] 
            cantidad_vendida = int(item['cantidad'])
            
            if tipo_unidad == 'CAJA':
                unidades_a_descontar = cantidad_vendida * producto.unidades_por_caja
                precio_venta_actual = producto.precio_venta_caja
                costo_compra_proporcional = producto.precio_compra_caja
            elif tipo_unidad == 'BLISTER':
                unidades_a_descontar = cantidad_vendida * producto.unidades_por_blister
                precio_venta_actual = producto.precio_venta_blister
                costo_compra_proporcional = (producto.precio_compra_caja / producto.unidades_por_caja) * producto.unidades_por_blister
            elif tipo_unidad == 'UNIDAD':
                unidades_a_descontar = cantidad_vendida
                precio_venta_actual = producto.precio_venta_unidad
                costo_compra_proporcional = producto.precio_compra_caja / producto.unidades_por_caja
            else:
                return Response({"error": "Tipo de unidad no válido"}, status=status.HTTP_400_BAD_REQUEST)
            
            if producto.stock_actual_unidades < unidades_a_descontar:
                return Response({"error": f"Stock insuficiente para {producto.nombre}."}, status=status.HTTP_400_BAD_REQUEST)
            
            producto.stock_actual_unidades -= unidades_a_descontar
            productos_a_actualizar.append(producto)
            
            subtotal_item = precio_venta_actual * cantidad_vendida
            total_venta += subtotal_item
            total_costo_compra += (costo_compra_proporcional * Decimal(str(cantidad_vendida)))
            
            detalles_a_crear.append({
                'producto': producto,
                'tipo_unidad': tipo_unidad,
                'cantidad': cantidad_vendida,
                'precio_unitario': precio_venta_actual,
                'subtotal': subtotal_item
            })
            
        ganancia_neta = total_venta - total_costo_compra
        nueva_venta = Venta.objects.create(total=total_venta, ganancia_neta=ganancia_neta)
        
        for d in detalles_a_crear:
            DetalleVenta.objects.create(
                venta=nueva_venta,
                producto=d['producto'],
                tipo_unidad=d['tipo_unidad'],
                cantidad=d['cantidad'],
                precio_unitario_aplicado=d['precio_unitario'],
                subtotal=d['subtotal']
            )
            
        for prod in productos_a_actualizar:
            prod.save()
            
        return Response({
            "mensaje": "Factura generada e inventario descontado con éxito",
            "venta_id": nueva_venta.id,
            "total": float(total_venta)
        }, status=status.HTTP_201_CREATED)
    
class VentaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Venta.objects.all().order_by('-fecha_hora') 
    serializer_class = VentaSerializer