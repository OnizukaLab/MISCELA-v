#!coding:utf-8

from django.conf.urls import  url
from django.urls import path

from api import views

urlpatterns = [
        path('upload/', views.upload, name = 'upload'),
        path('is_exists/<str:dataset>/<int:maxAtt>/<int:minSup>/<str:evoRate>/<str:distance>', views.is_exists, name = 'is_exists'),
        path('miscela/<str:dataset>/<int:maxAtt>/<int:minSup>/<str:evoRate>/<str:distance>', views.miscela, name = 'miscela')
]
