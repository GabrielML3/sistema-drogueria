from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoriaViewSet, ProductoViewSet, EmpaqueAlternativoViewSet

router = DefaultRouter()
router.register(r'categorias', CategoriaViewSet)
router.register(r'productos', ProductoViewSet)
router.register(r'empaques', EmpaqueAlternativoViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]