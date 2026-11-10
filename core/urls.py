from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from inventario.views import (
    CategoriaViewSet,
    ProductoViewSet,
    ProcesarVentaView,
    VentaViewSet,
    ClienteDeudorViewSet,
    DeudaViewSet
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = routers.DefaultRouter()
router.register(r'categorias', CategoriaViewSet)
router.register(r'productos', ProductoViewSet)
router.register(r'ventas', VentaViewSet, basename='ventas')
router.register(r'clientes-deudores', ClienteDeudorViewSet, basename='clientes-deudores')
router.register(r'deudas', DeudaViewSet, basename='deudas')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/ventas/procesar/', ProcesarVentaView.as_view(), name='procesar_venta'),
    path('api/', include(router.urls)),
]