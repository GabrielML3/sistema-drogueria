from django.db import models

class Categoria(models.Model):
    nombre = models.CharField(max_length=100)

    def __str__(self):
        return self.nombre

class Producto(models.Model):
    # LAS 3 OPCIONES DE PRESENTACIÓN
    TIPOS_PRESENTACION = [
        ('SIMPLE', 'Unidad Simple (Cremas, Jarabes, Gotas)'),
        ('CAJA_UNIDAD', 'Caja a Unidades (Jeringas, Cuchillas)'),
        ('COMPLETO', 'Caja, Blíster y Unidad (Pastillas)')
    ]

    nombre = models.CharField(max_length=200)
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE, related_name='productos')
    codigo_barras = models.CharField(max_length=50, unique=True, blank=True, null=True)
    
    # NUEVO CAMPO: Selector de comportamiento
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

# NUEVO: TABLAS DE NÚCLEO TRANSACCIONAL Y CONTABILIDAD
class Venta(models.Model):
    fecha_hora = models.DateTimeField(auto_now_add=True)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    ganancia_neta = models.DecimalField(max_digits=12, decimal_places=2, default=0.00) # Para los reportes contables

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
    cantidad = models.IntegerField() # Cuántas cajas, cuántos blísters o cuántas unidades se vendieron
    precio_unitario_aplicado = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.cantidad} {self.tipo_unidad} de {self.producto.nombre}"