from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q, Prefetch
from django.db import transaction
from django.utils import timezone
from decimal import Decimal

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
from .serializers import (
    CategoriaSerializer,
    ProductoSerializer,
    VentaSerializer,
    ClienteDeudorSerializer,
    DeudaSerializer
)


class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer


class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer

    @action(detail=False, methods=['get']) 
    def buscar(self, request):
        termino = request.query_params.get('q', '').strip()
        if not termino:
            return Response([])

        resultados = Producto.objects.filter(Q(nombre__icontains=termino))
        serializer = self.get_serializer(resultados, many=True)
        return Response(serializer.data)


class ProcesarVentaView(APIView): 
    @transaction.atomic
    def post(self, request):
        items = request.data.get('items', [])
        if not items:
            return Response(
                {"error": "El carrito de compras está vacío"},
                status=status.HTTP_400_BAD_REQUEST
            )

        total_venta = Decimal('0.00')
        total_costo_compra = Decimal('0.00')
        detalles_a_crear = []
 
        ids_productos = [item['id'] for item in items]
        productos_db = Producto.objects.select_for_update().filter(id__in=ids_productos)
        productos_map = {p.id: p for p in productos_db}
        productos_modificados = {}

        for item in items:
            prod_id = item['id']
            producto = productos_map.get(prod_id)
            if not producto:
                return Response(
                    {"error": "El producto no existe"},
                    status=status.HTTP_404_NOT_FOUND
                )

            tipo_unidad = item['tipo_unidad']
            cantidad_vendida = int(item['cantidad'])

            if tipo_unidad == 'CAJA':
                unidades_a_descontar = cantidad_vendida * producto.unidades_por_caja
                precio_venta_actual = producto.precio_venta_caja
                costo_compra_proporcional = producto.precio_compra_caja
            elif tipo_unidad == 'BLISTER':
                unidades_a_descontar = cantidad_vendida * producto.unidades_por_blister
                precio_venta_actual = producto.precio_venta_blister
                costo_compra_proporcional = (
                    producto.precio_compra_caja / producto.unidades_por_caja
                ) * producto.unidades_por_blister
            elif tipo_unidad == 'UNIDAD':
                unidades_a_descontar = cantidad_vendida
                precio_venta_actual = producto.precio_venta_unidad
                costo_compra_proporcional = (
                    producto.precio_compra_caja / producto.unidades_por_caja
                )
            else:
                return Response(
                    {"error": "Tipo de unidad no válido"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if producto.stock_actual_unidades < unidades_a_descontar:
                return Response(
                    {"error": f"Stock insuficiente para {producto.nombre}."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            producto.stock_actual_unidades -= unidades_a_descontar
            productos_modificados[producto.id] = producto

            subtotal_item = precio_venta_actual * cantidad_vendida
            total_venta += subtotal_item
            total_costo_compra += costo_compra_proporcional * Decimal(str(cantidad_vendida))

            detalles_a_crear.append({
                'producto': producto,
                'tipo_unidad': tipo_unidad,
                'cantidad': cantidad_vendida,
                'precio_unitario': precio_venta_actual,
                'subtotal': subtotal_item
            })

        ganancia_neta = total_venta - total_costo_compra
        nueva_venta = Venta.objects.create(total=total_venta, ganancia_neta=ganancia_neta)
 
        DetalleVenta.objects.bulk_create([
            DetalleVenta(
                venta=nueva_venta,
                producto=d['producto'],
                tipo_unidad=d['tipo_unidad'],
                cantidad=d['cantidad'],
                precio_unitario_aplicado=d['precio_unitario'],
                subtotal=d['subtotal']
            )
            for d in detalles_a_crear
        ])

        for prod in productos_modificados.values():
            prod.save(update_fields=['stock_actual_unidades'])

        return Response({
            "mensaje": "Factura generada e inventario descontado con éxito",
            "venta_id": nueva_venta.id,
            "total": float(total_venta)
        }, status=status.HTTP_201_CREATED)


class VentaViewSet(viewsets.ModelViewSet):
    serializer_class = VentaSerializer

    def get_queryset(self):
        relacion_detalles = 'detalles' if hasattr(Venta, 'detalles') else 'detalleventa_set'

        return Venta.objects.prefetch_related(
            Prefetch(
                relacion_detalles,
                queryset=DetalleVenta.objects.select_related('producto'),
                to_attr='detalles_precargados'
            )
        ).order_by('-fecha_hora')

    @transaction.atomic 
    def destroy(self, request, *args, **kwargs):
        venta = self.get_object()

        lista_detalles = DetalleVenta.objects.filter(venta=venta).select_related('producto')
        productos_modificados = {}

        for detalle in lista_detalles:
            producto = detalle.producto
            if not producto:
                continue

            if detalle.tipo_unidad == 'CAJA':
                unidades = detalle.cantidad * producto.unidades_por_caja
            elif detalle.tipo_unidad == 'BLISTER':
                unidades = detalle.cantidad * producto.unidades_por_blister
            else:
                unidades = detalle.cantidad

            if producto.id in productos_modificados:
                productos_modificados[producto.id].stock_actual_unidades += unidades
            else:
                producto.stock_actual_unidades += unidades
                productos_modificados[producto.id] = producto

        for prod in productos_modificados.values():
            prod.save(update_fields=['stock_actual_unidades'])

        venta.delete()

        return Response(
            {"mensaje": "Venta eliminada e inventario restablecido con éxito"},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='eliminar-item') 
    @transaction.atomic
    def eliminar_item(self, request, pk=None):
        venta = self.get_object()
        detalle_id = request.data.get('detalle_id')

        if not detalle_id:
            return Response(
                {"error": "Se requiere el ID del detalle"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            detalle = DetalleVenta.objects.select_related('producto').get(
                id=detalle_id,
                venta=venta
            )
        except DetalleVenta.DoesNotExist:
            return Response(
                {"error": "El producto no pertenece a esta factura"},
                status=status.HTTP_404_NOT_FOUND
            )

        producto = detalle.producto 
        if producto:
            if detalle.tipo_unidad == 'CAJA':
                unidades = detalle.cantidad * producto.unidades_por_caja
            elif detalle.tipo_unidad == 'BLISTER':
                unidades = detalle.cantidad * producto.unidades_por_blister
            else:
                unidades = detalle.cantidad

            producto.stock_actual_unidades += unidades
            producto.save(update_fields=['stock_actual_unidades'])
 
        detalle.delete()
 
        detalles_restantes = list(
            DetalleVenta.objects.filter(venta=venta).select_related('producto')
        )
        if not detalles_restantes:
            venta.delete()
            return Response({
                "mensaje": "Factura eliminada por completo ya que no quedaron productos.",
                "venta_eliminada": True
            }, status=status.HTTP_200_OK)
 
        nuevo_total = Decimal('0.00')
        nuevo_costo = Decimal('0.00') 

        for d in detalles_restantes:
            nuevo_total += d.subtotal
            prod = d.producto
            if prod:
                if d.tipo_unidad == 'CAJA':
                    costo_unit = prod.precio_compra_caja
                elif d.tipo_unidad == 'BLISTER':
                    costo_unit = (
                        prod.precio_compra_caja / prod.unidades_por_caja
                    ) * prod.unidades_por_blister
                else:
                    costo_unit = prod.precio_compra_caja / prod.unidades_por_caja

                nuevo_costo += costo_unit * Decimal(str(d.cantidad))

        venta.total = nuevo_total
        venta.ganancia_neta = nuevo_total - nuevo_costo
        venta.save(update_fields=['total', 'ganancia_neta'])
 
        venta.detalles_precargados = detalles_restantes
        serializer = self.get_serializer(venta)

        return Response({
            "mensaje": "Producto devuelto y factura recalculada con éxito",
            "venta_eliminada": False,
            "venta": serializer.data
        }, status=status.HTTP_200_OK)


# ==========================================
# VISTAS DE DEUDAS Y FIADOS
# ==========================================
class ClienteDeudorViewSet(viewsets.ModelViewSet):
    queryset = ClienteDeudor.objects.all().order_by('nombre')
    serializer_class = ClienteDeudorSerializer


class DeudaViewSet(viewsets.ModelViewSet):
    serializer_class = DeudaSerializer

    def get_queryset(self):
        return Deuda.objects.select_related('cliente').prefetch_related(
            Prefetch(
                'detalles',
                queryset=DetalleDeuda.objects.select_related('producto'),
                to_attr='detalles_precargados'
            ),
            Prefetch(
                'abonos',
                queryset=AbonoDeuda.objects.all().order_by('-fecha_hora'),
                to_attr='abonos_precargados'
            )
        ).order_by('-fecha_creacion')

    def _convertir_deuda_a_venta(self, deuda):
        """
        Cuando una deuda de tipo POS se termina de pagar al 100%,
        se registra como una Venta real en Contabilidad con la fecha del día del pago.
        """
        if deuda.tipo_deuda != 'POS' or deuda.venta_generada is not None:
            return None

        nueva_venta = Venta.objects.create(
            total=deuda.total,
            ganancia_neta=deuda.ganancia_estimada
        )
        detalles_deuda = DetalleDeuda.objects.filter(deuda=deuda).select_related('producto')
        DetalleVenta.objects.bulk_create([
            DetalleVenta(
                venta=nueva_venta,
                producto=d.producto,
                tipo_unidad=d.tipo_unidad,
                cantidad=d.cantidad,
                precio_unitario_aplicado=d.precio_unitario_aplicado,
                subtotal=d.subtotal
            )
            for d in detalles_deuda
        ])
        deuda.venta_generada = nueva_venta
        return nueva_venta

    # 1. Crear deuda desde el Punto de Venta (Fiar productos descontando stock)
    @action(detail=False, methods=['post'], url_path='registrar-pos')
    @transaction.atomic
    def registrar_pos(self, request):
        items = request.data.get('items', [])
        cliente_id = request.data.get('cliente_id')
        nuevo_cliente_nombre = (request.data.get('nuevo_cliente_nombre') or '').strip()
        nuevo_cliente_telefono = (request.data.get('nuevo_cliente_telefono') or '').strip()
        abono_inicial = Decimal(str(request.data.get('abono_inicial') or '0'))

        if not items:
            return Response(
                {"error": "El carrito está vacío"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if cliente_id:
            try:
                cliente = ClienteDeudor.objects.get(id=cliente_id)
            except ClienteDeudor.DoesNotExist:
                return Response(
                    {"error": "El cliente seleccionado no existe"},
                    status=status.HTTP_404_NOT_FOUND
                )
        elif nuevo_cliente_nombre:
            cliente = ClienteDeudor.objects.create(
                nombre=nuevo_cliente_nombre,
                telefono=nuevo_cliente_telefono
            )
        else:
            return Response(
                {"error": "Debes seleccionar un deudor o escribir el nombre de uno nuevo"},
                status=status.HTTP_400_BAD_REQUEST
            )

        total_deuda = Decimal('0.00')
        total_costo_compra = Decimal('0.00')
        detalles_a_crear = []

        ids_productos = [item['id'] for item in items]
        productos_db = Producto.objects.select_for_update().filter(id__in=ids_productos)
        productos_map = {p.id: p for p in productos_db}
        productos_modificados = {}

        for item in items:
            producto = productos_map.get(item['id'])
            if not producto:
                return Response(
                    {"error": "Uno de los productos no existe"},
                    status=status.HTTP_404_NOT_FOUND
                )

            tipo_unidad = item['tipo_unidad']
            cantidad_vendida = int(item['cantidad'])

            if tipo_unidad == 'CAJA':
                unidades_a_descontar = cantidad_vendida * producto.unidades_por_caja
                precio_venta_actual = producto.precio_venta_caja
                costo_compra_proporcional = producto.precio_compra_caja
            elif tipo_unidad == 'BLISTER':
                unidades_a_descontar = cantidad_vendida * producto.unidades_por_blister
                precio_venta_actual = producto.precio_venta_blister
                costo_compra_proporcional = (
                    producto.precio_compra_caja / producto.unidades_por_caja
                ) * producto.unidades_por_blister
            elif tipo_unidad == 'UNIDAD':
                unidades_a_descontar = cantidad_vendida
                precio_venta_actual = producto.precio_venta_unidad
                costo_compra_proporcional = (
                    producto.precio_compra_caja / producto.unidades_por_caja
                )
            else:
                return Response(
                    {"error": "Tipo de unidad no válido"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if producto.stock_actual_unidades < unidades_a_descontar:
                return Response(
                    {"error": f"Stock insuficiente para {producto.nombre}."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            producto.stock_actual_unidades -= unidades_a_descontar
            productos_modificados[producto.id] = producto

            subtotal_item = precio_venta_actual * cantidad_vendida
            total_deuda += subtotal_item
            total_costo_compra += costo_compra_proporcional * Decimal(str(cantidad_vendida))

            detalles_a_crear.append({
                'producto': producto,
                'tipo_unidad': tipo_unidad,
                'cantidad': cantidad_vendida,
                'precio_unitario': precio_venta_actual,
                'subtotal': subtotal_item
            })

        if abono_inicial < Decimal('0.00') or abono_inicial >= total_deuda:
            abono_inicial = Decimal('0.00')

        ganancia_estimada = total_deuda - total_costo_compra
        saldo_pendiente = total_deuda - abono_inicial

        # Si el cliente ya tenía una deuda POS pendiente, acumulamos en su cuenta activa
        deuda_activa = Deuda.objects.filter(
            cliente=cliente,
            estado='PENDIENTE',
            tipo_deuda='POS'
        ).first()

        if deuda_activa:
            deuda_activa.total += total_deuda
            deuda_activa.ganancia_estimada += ganancia_estimada
            deuda_activa.monto_abonado += abono_inicial
            deuda_activa.saldo_pendiente += saldo_pendiente
            deuda_activa.save()
            deuda_final = deuda_activa
        else:
            deuda_final = Deuda.objects.create(
                cliente=cliente,
                tipo_deuda='POS',
                total=total_deuda,
                ganancia_estimada=ganancia_estimada,
                monto_abonado=abono_inicial,
                saldo_pendiente=saldo_pendiente,
                estado='PENDIENTE'
            )

        DetalleDeuda.objects.bulk_create([
            DetalleDeuda(
                deuda=deuda_final,
                producto=d['producto'],
                tipo_unidad=d['tipo_unidad'],
                cantidad=d['cantidad'],
                precio_unitario_aplicado=d['precio_unitario'],
                subtotal=d['subtotal']
            )
            for d in detalles_a_crear
        ])

        if abono_inicial > Decimal('0.00'):
            AbonoDeuda.objects.create(deuda=deuda_final, monto=abono_inicial)

        for prod in productos_modificados.values():
            prod.save(update_fields=['stock_actual_unidades'])

        serializer = self.get_serializer(deuda_final)
        return Response({
            "mensaje": "Productos registrados en la cuenta del deudor y descontados del stock.",
            "deuda": serializer.data
        }, status=status.HTTP_201_CREATED)

    # 2. Crear deuda manual representativa (No afecta inventario ni contabilidad)
    @action(detail=False, methods=['post'], url_path='registrar-manual')
    @transaction.atomic
    def registrar_manual(self, request):
        cliente_id = request.data.get('cliente_id')
        nuevo_cliente_nombre = (request.data.get('nuevo_cliente_nombre') or '').strip()
        nuevo_cliente_telefono = (request.data.get('nuevo_cliente_telefono') or '').strip()
        monto = Decimal(str(request.data.get('monto') or '0'))
        descripcion = (request.data.get('descripcion') or 'Saldo pendiente de compra').strip()

        if monto <= Decimal('0.00'):
            return Response(
                {"error": "El monto debe ser mayor a 0"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if cliente_id:
            try:
                cliente = ClienteDeudor.objects.get(id=cliente_id)
            except ClienteDeudor.DoesNotExist:
                return Response(
                    {"error": "El cliente seleccionado no existe"},
                    status=status.HTTP_404_NOT_FOUND
                )
        elif nuevo_cliente_nombre:
            cliente = ClienteDeudor.objects.create(
                nombre=nuevo_cliente_nombre,
                telefono=nuevo_cliente_telefono
            )
        else:
            return Response(
                {"error": "Debes seleccionar un deudor o ingresar un nombre"},
                status=status.HTTP_400_BAD_REQUEST
            )

        nueva_deuda = Deuda.objects.create(
            cliente=cliente,
            tipo_deuda='MANUAL',
            descripcion_manual=descripcion,
            total=monto,
            ganancia_estimada=Decimal('0.00'),
            monto_abonado=Decimal('0.00'),
            saldo_pendiente=monto,
            estado='PENDIENTE'
        )

        serializer = self.get_serializer(nueva_deuda)
        return Response({
            "mensaje": "Saldo manual registrado correctamente.",
            "deuda": serializer.data
        }, status=status.HTTP_201_CREATED)

    # 3. Registrar un abono parcial o total
    @action(detail=True, methods=['post'], url_path='abonar')
    @transaction.atomic
    def abonar(self, request, pk=None):
        deuda = self.get_object()
        if deuda.estado == 'PAGADA':
            return Response(
                {"error": "Esta deuda ya se encuentra completamente pagada"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            monto = Decimal(str(request.data.get('monto') or '0'))
        except Exception:
            return Response(
                {"error": "Monto inválido"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if monto <= Decimal('0.00'):
            return Response(
                {"error": "El abono debe ser mayor a $0"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if monto > deuda.saldo_pendiente:
            return Response(
                {"error": f"El abono supera el saldo pendiente (${deuda.saldo_pendiente})"},
                status=status.HTTP_400_BAD_REQUEST
            )

        AbonoDeuda.objects.create(deuda=deuda, monto=monto)
        deuda.monto_abonado += monto
        deuda.saldo_pendiente -= monto

        enviada_a_contabilidad = False
        if deuda.saldo_pendiente <= Decimal('0.00'):
            deuda.saldo_pendiente = Decimal('0.00')
            deuda.estado = 'PAGADA'
            deuda.fecha_pago_completo = timezone.now()
            venta_creada = self._convertir_deuda_a_venta(deuda)
            enviada_a_contabilidad = venta_creada is not None

        deuda.save()
        serializer = self.get_serializer(deuda)

        return Response({
            "mensaje": "Abono registrado con éxito",
            "liquidada": deuda.estado == 'PAGADA',
            "enviada_a_contabilidad": enviada_a_contabilidad,
            "deuda": serializer.data
        }, status=status.HTTP_200_OK)

    # 4. Liquidar / Cobrar todo el saldo restante de inmediato
    @action(detail=True, methods=['post'], url_path='liquidar')
    @transaction.atomic
    def liquidar(self, request, pk=None):
        deuda = self.get_object()
        if deuda.estado == 'PAGADA':
            return Response(
                {"error": "Esta deuda ya fue pagada"},
                status=status.HTTP_400_BAD_REQUEST
            )

        saldo_a_cobrar = deuda.saldo_pendiente
        if saldo_a_cobrar > Decimal('0.00'):
            AbonoDeuda.objects.create(deuda=deuda, monto=saldo_a_cobrar)

        deuda.monto_abonado = deuda.total
        deuda.saldo_pendiente = Decimal('0.00')
        deuda.estado = 'PAGADA'
        deuda.fecha_pago_completo = timezone.now()

        venta_creada = self._convertir_deuda_a_venta(deuda)
        deuda.save()

        serializer = self.get_serializer(deuda)
        return Response({
            "mensaje": "Deuda cobrada en su totalidad",
            "enviada_a_contabilidad": venta_creada is not None,
            "venta_id": venta_creada.id if venta_creada else None,
            "deuda": serializer.data
        }, status=status.HTTP_200_OK)

    # 5. Eliminar registro de deuda (devuelve stock si era deuda POS pendiente)
    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        deuda = self.get_object()
        devolver_stock = request.query_params.get('devolver_stock', 'true') == 'true'

        if deuda.estado == 'PENDIENTE' and deuda.tipo_deuda == 'POS' and devolver_stock:
            detalles = DetalleDeuda.objects.filter(deuda=deuda).select_related('producto')
            productos_modificados = {}

            for d in detalles:
                prod = d.producto
                if not prod:
                    continue
                if d.tipo_unidad == 'CAJA':
                    unidades = d.cantidad * prod.unidades_por_caja
                elif d.tipo_unidad == 'BLISTER':
                    unidades = d.cantidad * prod.unidades_por_blister
                else:
                    unidades = d.cantidad

                if prod.id in productos_modificados:
                    productos_modificados[prod.id].stock_actual_unidades += unidades
                else:
                    prod.stock_actual_unidades += unidades
                    productos_modificados[prod.id] = prod

            for prod in productos_modificados.values():
                prod.save(update_fields=['stock_actual_unidades'])

        deuda.delete()
        return Response(
            {"mensaje": "Registro de deuda eliminado correctamente"},
            status=status.HTTP_200_OK
        )