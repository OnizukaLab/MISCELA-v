from django.shortcuts import render
from django.http import HttpResponse

import argparse
import pickle
import csv
import pdb
import itertools
import json
from api.src.func import miscela_
from api.src.func import miscela_sensor
from api.src.func import loadDataFile
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

def sensor(request, dataset, sensor_id, attribute):
    data_df = loadDataFile(dataset)
    if len(data_df) == 0:
        return HttpResponse("Required data not found. upload data first.")

    data_df = data_df.query(f'id == \'{sensor_id}\' and attribute == \'{attribute}\'')
    return HttpResponse(data_df[['time', 'data']].to_json())

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

def _set_params(dataset, maxAtt, minSup, evoRate, distance):
    params = {}
    params["dataset"] = dataset
    params["maxAtt"] = int(maxAtt)
    params["minSup"] = int(minSup)
    params["evoRate"] = float(evoRate) 
    params["distance"] = float(distance)
    return params

def miscela(request, dataset, maxAtt, minSup, evoRate, distance):

    cached = Cache.objects.filter(dataset=dataset, maxAtt=maxAtt, minSup=minSup, evoRate=evoRate, distance=distance)
    if len(cached) > 0:
        return HttpResponse(cached[0].json_output)

    params = _set_params(dataset, maxAtt, minSup, evoRate, distance)
    # cap mining
    CAP, S = miscela_(params)

    if CAP == False:
        return HttpResponse(False)

    # output
    json_res = outputCAPJson(params['dataset'], S, CAP)

    c = Cache(dataset=dataset, maxAtt=maxAtt, minSup=minSup, evoRate=evoRate, distance=distance, json_output=json_res)
    c.save()

    return HttpResponse(json_res)

@csrf_exempt
def sensor_correlation(request, dataset, maxAtt, minSup, evoRate, distance):
    sensor_ids = dict(request.POST)['sensor_ids']
    data_df = loadDataFile(dataset)

    #attributes = itertools.chain.from_iterable([set(data_df.query(f'id == \'{sensor_id}\'').attribute.values) for sensor_id in sensor_ids])

    params = _set_params(dataset, maxAtt, minSup, evoRate, distance)
    CAP, S = miscela_sensor(params, sensor_ids, data_df)
    indexes = list(CAP.getP1() | CAP.getP2())
    indexes.sort()

    result = dict()
    result['sensor'] = dict()
    for sensor_index in CAP.getMember():
        attribute = S[sensor_index].getAttribute()
        sensor_id = S[sensor_index].getId()
        result['sensor']['timestamp'] = list(data_df.query(f'id == \'{sensor_id}\' and attribute == \'{attribute}\'').time)
        result['sensor'][sensor_id] = list(data_df.query(f'id == \'{sensor_id}\' and attribute == \'{attribute}\'').data)
        #result['sensor'][sensor_id] = []
        #for time in result['sensor']['timestamp']:
        #    tmp = data_df.query(f'id == \'{sensor_id}\' and attribute == \'{attribute}\'')[['time','data']]
        #    result['sensor'][sensor_id].append(tmp[tmp.time == time].data)

    result['indexes'] = indexes

    return HttpResponse(json.dumps(result))

