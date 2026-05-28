from django.db import models

class Categoria(models.Model):
    """Clasificación general para agrupar el inventario."""
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nombre

class Producto(models.Model):
    """Gestión del inventario base unificado en su unidad mínima de medida."""
    nombre = models.CharField(max_length=200)
    categoria = models.ForeignKey(Categoria, on_delete=models.SET_NULL, null=True, blank=True)
    laboratorio = models.CharField(max_length=100, blank=True, null=True)
    unidad_medida_minima = models.CharField(max_length=50) 
    stock_total = models.IntegerField(default=0)
    stock_minimo_alerta = models.IntegerField(default=10)

    def __str__(self):
        return f"{self.nombre} ({self.stock_total} {self.unidad_medida_minima}s)"

class EmpaqueAlternativo(models.Model):
    """Presentaciones físicas, precios y códigos de barras vinculados a un producto base."""
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='empaques')
    nombre_empaque = models.CharField(max_length=100) 
    codigo_barras = models.CharField(max_length=100, unique=True, null=True, blank=True)
    factor_conversion = models.IntegerField()
    precio_compra = models.DecimalField(max_digits=10, decimal_places=2)
    precio_venta = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.nombre_empaque} de {self.producto.nombre}"
