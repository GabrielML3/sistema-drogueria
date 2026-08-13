from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from inventario.views import CategoriaViewSet, ProductoViewSet, ProcesarVentaView, VentaViewSet

# 1. IMPORTAMOS LAS VISTAS DE SEGURIDAD JWT
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = routers.DefaultRouter()
router.register(r'categorias', CategoriaViewSet)
router.register(r'productos', ProductoViewSet)
router.register(r'ventas', VentaViewSet, basename='ventas')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # 2. CREAMOS LAS RUTAS DE LOGIN (Generación de Tokens)
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'), # Esta es la ruta para hacer LOGIN
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'), # Esta renueva el token
    
    path('api/ventas/procesar/', ProcesarVentaView.as_view(), name='procesar_venta'),
    path('api/', include(router.urls)),
]