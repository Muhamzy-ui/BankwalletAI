from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from bot.views import (RegisterView, TelegramChannelViewSet, ScheduleWindowViewSet,
                       CaptionTemplateViewSet, PostViewSet, BotSettingsView, dashboard_stats,
                       create_educational_receipt, list_templates, delete_template, rename_template,
                       template_coordinates, CustomGalleryViewSet, TemplateImageViewSet,
                       test_telegram_connection)
from analytics.views import activity_log, channel_performance, post_timeline

router = DefaultRouter()
router.register(r'channels', TelegramChannelViewSet, basename='channels')
router.register(r'schedule-windows', ScheduleWindowViewSet, basename='schedule-windows')
router.register(r'caption-templates', CaptionTemplateViewSet, basename='caption-templates')
router.register(r'posts', PostViewSet, basename='posts')
router.register(r'gallery', CustomGalleryViewSet, basename='gallery')
router.register(r'templates-db', TemplateImageViewSet, basename='templates-db')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/register/', RegisterView.as_view()),
    path('api/auth/login/', TokenObtainPairView.as_view()),
    path('api/auth/refresh/', TokenRefreshView.as_view()),
    path('api/settings/', BotSettingsView.as_view()),
    path('api/dashboard/', dashboard_stats),
    path('api/bot/generate-receipt/', create_educational_receipt),
    path('api/bot/test-telegram/', test_telegram_connection),
    path('api/templates/', list_templates),
    path('api/templates/rename/', rename_template),
    path('api/templates/coords/', template_coordinates),
    path('api/templates/<str:filename>/', delete_template),
    path('api/analytics/activity/', activity_log),
    path('api/analytics/performance/', channel_performance),
    path('api/analytics/timeline/', post_timeline),
    path('api/', include(router.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)