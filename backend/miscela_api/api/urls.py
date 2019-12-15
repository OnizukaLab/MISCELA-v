#!coding:utf-8

from django.conf.urls import  url
from django.urls import path

from api import views

urlpatterns = [
        path('upload/', views.upload, name = 'upload'),
        path('sensor/<str:dataset>/<str:sensor_id>/<str:attribute>', views.sensor, name = 'sensor'),
        path('delete_dataset/<str:dataset>', views.delete_dataset, name = 'delete_dataset'),
        path('is_exists/<str:dataset>/<int:maxAtt>/<int:minSup>/<str:evoRate>/<str:distance>', views.is_exists, name = 'is_exists'),
        path('is_dataset_exists/<str:dataset>', views.is_dataset_exists, name = 'is_dataset_exists'),
        path('miscela/<str:dataset>/<int:maxAtt>/<int:minSup>/<str:evoRate>/<str:distance>', views.miscela, name = 'miscela')
]
