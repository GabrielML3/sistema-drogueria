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
    
class VentaViewSet(viewsets.ModelViewSet):
    queryset = Venta.objects.all().order_by('-fecha_hora') 
    serializer_class = VentaSerializer

    # Anular factura completa
    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        venta = self.get_object()
        
        detalles = getattr(venta, 'detalles', None)
        lista_detalles = detalles.all() if detalles is not None else venta.detalleventa_set.all()
        
        for detalle in lista_detalles:
            producto = detalle.producto
            if detalle.tipo_unidad == 'CAJA':
                unidades = detalle.cantidad * producto.unidades_por_caja
            elif detalle.tipo_unidad == 'BLISTER':
                unidades = detalle.cantidad * producto.unidades_por_blister
            else:
                unidades = detalle.cantidad

            producto.stock_actual_unidades += unidades
            producto.save()

        venta.delete()

        return Response(
            {"mensaje": "Venta eliminada e inventario restablecido con éxito"},
            status=status.HTTP_200_OK
        )

    # Devolver producto individual de la factura y recalcular
    @action(detail=True, methods=['post'], url_path='eliminar-item')
    @transaction.atomic
    def eliminar_item(self, request, pk=None):
        venta = self.get_object()
        detalle_id = request.data.get('detalle_id')
        
        if not detalle_id:
            return Response({"error": "Se requiere el ID del detalle"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            detalle = DetalleVenta.objects.get(id=detalle_id, venta=venta)
        except DetalleVenta.DoesNotExist:
            return Response({"error": "El producto no pertenece a esta factura"}, status=status.HTTP_404_NOT_FOUND)

        # 1. Restablecer el stock del producto devuelto
        producto = detalle.producto
        if detalle.tipo_unidad == 'CAJA':
            unidades = detalle.cantidad * producto.unidades_por_caja
        elif detalle.tipo_unidad == 'BLISTER':
            unidades = detalle.cantidad * producto.unidades_por_blister
        else:
            unidades = detalle.cantidad

        producto.stock_actual_unidades += unidades
        producto.save()

        # 2. Eliminar el producto de la factura
        detalle.delete()

        # 3. Comprobar si quedaron más productos en la factura
        detalles_restantes = DetalleVenta.objects.filter(venta=venta)
        if not detalles_restantes.exists():
            venta.delete()
            return Response({
                "mensaje": "Factura eliminada por completo ya que no quedaron productos.",
                "venta_eliminada": True
            }, status=status.HTTP_200_OK)

        # 4. Recalcular el Total y la Ganancia Neta con los ítems que quedaron
        nuevo_total = Decimal('0.00')
        nuevo_costo = Decimal('0.00')

        for d in detalles_restantes:
            nuevo_total += d.subtotal
            prod = d.producto
            if d.tipo_unidad == 'CAJA':
                costo_unit = prod.precio_compra_caja
            elif d.tipo_unidad == 'BLISTER':
                costo_unit = (prod.precio_compra_caja / prod.unidades_por_caja) * prod.unidades_por_blister
            else:
                costo_unit = prod.precio_compra_caja / prod.unidades_por_caja
            
            nuevo_costo += (costo_unit * Decimal(str(d.cantidad)))

        venta.total = nuevo_total
        venta.ganancia_neta = nuevo_total - nuevo_costo
        venta.save()

        serializer = self.get_serializer(venta)
        return Response({
            "mensaje": "Producto devuelto y factura recalculada con éxito",
            "venta_eliminada": False,
            "venta": serializer.data
        }, status=status.HTTP_200_OK)