from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from tickets.views import TicketViewSet, TicketStatsView, AIClassifyView

router = DefaultRouter()
router.register(r"tickets", TicketViewSet)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    path("api/stats/", TicketStatsView.as_view(), name="stats"),
    path("api/classify/", AIClassifyView.as_view(), name="classify"),
]
