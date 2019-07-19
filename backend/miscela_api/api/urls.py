#!coding:utf-8

from django.conf.urls import  url
from django.urls import path

from api import views

#urlpatterns = patterns('',
#        url('miscela', views.miscela, name='miscela'),
#)
urlpatterns = [
        #path('miscela', views.miscela, name = 'miscela')
        path('miscela/<str:dataset>/<int:maxAtt>/<int:minSup>/<str:evoRate>/<str:distance>', views.miscela, name = 'miscela')
        ]
