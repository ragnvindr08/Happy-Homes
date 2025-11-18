from django.contrib import admin
from django.urls import path, include, re_path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from api import views
from api.views import UserHistoryListView, active_visitors
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

class FrontendAppView(TemplateView):
    template_name = 'index.html'

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    path('admin/users/', views.admin_user_list, name='admin_user_list'),
    path('admin/users/<int:pk>/', views.admin_user_detail, name='admin_user_detail'),

    # API
    path('api/', include('api.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', views.register, name='register'),
    path('api/verify-captcha/', views.verify_recaptcha, name='verify_recaptcha'),
    path("api/user-history/", UserHistoryListView.as_view(), name="user-history"),
    path('api/admin/pending-verifications/', views.pending_verifications, name='pending_verifications'),
    path('api/admin/verify-user/<int:user_id>/', views.verify_user, name='verify_user'),
    path("visitor/active/", active_visitors, name="active_visitors"),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Catch-all route for React SPA
urlpatterns += [
    re_path(r'^.*$', FrontendAppView.as_view(), name='frontend'),
]


# """
# URL configuration for core project.

# The `urlpatterns` list routes URLs to views. For more information please see:
#     https://docs.djangoproject.com/en/4.2/topics/http/urls/
# Examples:
# Function views
#     1. Add an import:  from my_app import views
#     2. Add a URL to urlpatterns:  path('', views.home, name='home')
# Class-based views
#     1. Add an import:  from other_app.views import Home
#     2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
# Including another URLconf
#     1. Import the include() function: from django.urls import include, path
#     2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
# """
# from django.contrib import admin
# from django.urls import path, include
# from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


# from api import views 
# from api.views import UserHistoryListView, active_visitors
# from django.conf import settings
# from django.conf.urls.static import static # <-- import your Django app views here
# from django.views.generic import TemplateView
# # Serve React frontend

# class FrontendAppView(TemplateView):
#     template_name = 'index.html'

# urlpatterns = [
#     path('admin/', admin.site.urls),
#     path('admin/users/', views.admin_user_list, name='admin_user_list'),
#     path('admin/users/<int:pk>/', views.admin_user_detail, name='admin_user_detail'),
#     path('api/', include('api.urls')),  # your api app URLs
#     path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
#     path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
#     path('api/register/', views.register, name='register'),
#     path('api/verify-captcha/', views.verify_recaptcha, name='verify_recaptcha'),
#     path("api/user-history/", UserHistoryListView.as_view(), name="user-history"),
#     path('api/admin/pending-verifications/', views.pending_verifications, name='pending_verifications'),
#     path('api/admin/verify-user/<int:user_id>/', views.verify_user, name='verify_user'),
#     path("visitor/active/", active_visitors, name="active_visitors"),
#     path('', FrontendAppView.as_view(), name='home'),
    
 
#         # reCAPTCHA verification endpoint
# ]

# if settings.DEBUG:
#     urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

