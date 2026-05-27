from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from inventario.views import CategoriaViewSet, ProductoViewSet, ProcesarVentaView, VentaViewSet

router = routers.DefaultRouter()
router.register(r'categorias', CategoriaViewSet)
router.register(r'productos', ProductoViewSet)
router.register(r'ventas', VentaViewSet, basename='ventas')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/ventas/procesar/', ProcesarVentaView.as_view(), name='procesar_venta'),
    path('api/', include(router.urls)),
]