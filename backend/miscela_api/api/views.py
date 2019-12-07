from django.shortcuts import render
from django.http import HttpResponse

import argparse
import pickle
import csv
import pdb
from api.src.func import miscela_
from api.src.output import outputCAP
from api.src.output import outputCAPJson
from api.models import Cache
from api.models import DataSet

from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.csrf import csrf_exempt

def is_dataset_exists(request, dataset):
    dataset = DataSet.objects.filter(data_name=dataset)
    return HttpResponse(len(dataset) > 0)

def delete_dataset(request, dataset):
    dataset = DataSet.objects.filter(data_name=dataset).delete()
    return HttpResponse(dataset[0] > 0)

@csrf_exempt
def upload(request):
    data_name = request.POST['data_name']
    data_type = request.POST['data_type']
    data_id = request.POST['data_id']
    csv_data = request.FILES['upload_file'].read().decode('utf-8')

    data_set = DataSet(data_name=data_name, data_type=data_type, data_id=data_id, data=csv_data)
    data_set.save()
    return HttpResponse(True)

def is_exists(request, dataset, maxAtt, minSup, evoRate, distance):
    cached = Cache.objects.filter(dataset=dataset, maxAtt=maxAtt, minSup=minSup, evoRate=evoRate, distance=distance)
    return HttpResponse(len(cached) > 0)

def miscela(request, dataset, maxAtt, minSup, evoRate, distance):

    cached = Cache.objects.filter(dataset=dataset, maxAtt=maxAtt, minSup=minSup, evoRate=evoRate, distance=distance)
    if len(cached) > 0:
        return HttpResponse(cached[0].json_output)

    params = {}
    params["dataset"] = dataset
    params["maxAtt"] = int(maxAtt)
    params["minSup"] = int(minSup)
    params["evoRate"] = float(evoRate) 
    params["distance"] = float(distance)
    # cap mining
    CAP, S = miscela_(params)

    if CAP == False:
        return HttpResponse(False)

    # output
    json_res = outputCAPJson(params['dataset'], S, CAP)
    print(json_res)

    c = Cache(dataset=dataset, maxAtt=maxAtt, minSup=minSup, evoRate=evoRate, distance=distance, json_output=json_res)
    c.save()

    return HttpResponse(json_res)

