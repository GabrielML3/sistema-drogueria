from django.db import models


class Categoria(models.Model):
    nombre = models.CharField(max_length=100)

    def __str__(self):
        return self.nombre


class Producto(models.Model): 
    TIPOS_PRESENTACION = [
        ('SIMPLE', 'Unidad Simple (Cremas, Jarabes, Gotas)'),
        ('CAJA_UNIDAD', 'Caja a Unidades (Jeringas, Cuchillas)'),
        ('COMPLETO', 'Caja, Blíster y Unidad (Pastillas)')
    ]

    nombre = models.CharField(max_length=200)
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE, related_name='productos')
    codigo_barras = models.CharField(max_length=50, unique=True, blank=True, null=True) 
    tipo_presentacion = models.CharField(max_length=20, choices=TIPOS_PRESENTACION, default='COMPLETO')

    precio_compra_caja = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    precio_venta_caja = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    precio_venta_blister = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, default=0.00)
    precio_venta_unidad = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, default=0.00)

    unidades_por_blister = models.IntegerField(default=1, help_text="Número de tabletas por blíster")
    unidades_por_caja = models.IntegerField(default=1, help_text="Número total de unidades por caja")

    stock_actual_unidades = models.IntegerField(default=0, help_text="Stock absoluto medido en la unidad más pequeña")
    stock_minimo_alerta = models.IntegerField(default=5)

    def __str__(self):
        return self.nombre


class Venta(models.Model):
    fecha_hora = models.DateTimeField(auto_now_add=True)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    ganancia_neta = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    def __str__(self):
        return f"Venta #{self.id} - {self.fecha_hora.strftime('%Y-%m-%d %H:%M')}"


class DetalleVenta(models.Model):
    TIPO_UNIDAD_CHOICES = [
        ('CAJA', 'Caja'),
        ('BLISTER', 'Blíster'),
        ('UNIDAD', 'Unidad'),
    ]

    venta = models.ForeignKey(Venta, on_delete=models.CASCADE, related_name='detalles')
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    tipo_unidad = models.CharField(max_length=10, choices=TIPO_UNIDAD_CHOICES)
    cantidad = models.IntegerField()
    precio_unitario_aplicado = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.cantidad} {self.tipo_unidad} de {self.producto.nombre}"


# ==========================================
# NUEVO: MÓDULO DE DEUDAS Y FIADOS
# ==========================================
class ClienteDeudor(models.Model):
    nombre = models.CharField(max_length=150)
    telefono = models.CharField(max_length=50, blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre


class Deuda(models.Model):
    TIPO_DEUDA_CHOICES = [
        ('POS', 'Productos Fiados desde Caja (Afecta Contabilidad al pagar)'),
        ('MANUAL', 'Saldo Manual Representativo (No afecta Contabilidad)'),
    ]
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('PAGADA', 'Pagada'),
    ]

    cliente = models.ForeignKey(ClienteDeudor, on_delete=models.CASCADE, related_name='deudas')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_pago_completo = models.DateTimeField(blank=True, null=True)
    tipo_deuda = models.CharField(max_length=10, choices=TIPO_DEUDA_CHOICES, default='POS')
    descripcion_manual = models.CharField(max_length=255, blank=True, null=True)

    total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    ganancia_estimada = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    monto_abonado = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    saldo_pendiente = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='PENDIENTE')
    venta_generada = models.ForeignKey(Venta, on_delete=models.SET_NULL, blank=True, null=True, related_name='deuda_origen')

    def __str__(self):
        return f"Deuda #{self.id} - {self.cliente.nombre} (${self.saldo_pendiente})"


class DetalleDeuda(models.Model):
    TIPO_UNIDAD_CHOICES = [
        ('CAJA', 'Caja'),
        ('BLISTER', 'Blíster'),
        ('UNIDAD', 'Unidad'),
    ]

    deuda = models.ForeignKey(Deuda, on_delete=models.CASCADE, related_name='detalles')
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    tipo_unidad = models.CharField(max_length=10, choices=TIPO_UNIDAD_CHOICES)
    cantidad = models.IntegerField()
    precio_unitario_aplicado = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.cantidad} {self.tipo_unidad} de {self.producto.nombre}"


class AbonoDeuda(models.Model):
    deuda = models.ForeignKey(Deuda, on_delete=models.CASCADE, related_name='abonos')
    fecha_hora = models.DateTimeField(auto_now_add=True)
    monto = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"Abono ${self.monto} a Deuda #{self.deuda.id}"