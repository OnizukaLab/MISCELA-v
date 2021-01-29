from django.shortcuts import render
from django.http import HttpResponse
import argparse
import pickle
import csv
import pdb
import itertools
import json
import random
from api.src.func import miscela_
from api.src.func import miscela_sensor
from api.src.func import loadDataFile
from api.src.output import outputCAP
from api.src.output import outputCAPJson
from api.models import Cache
from api.models import CapCache
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

    for cap in CAP:
        sensor_ids = cap.getMember()
        sensor_attributes = cap.getAttribute()
        indexes = cap.getP1() | cap.getP2()

        sensor_id_csv = ','.join(list(map(lambda s: str(S[s].getId()), sensor_ids)))
        sensor_attribute_csv = ','.join(list(map(lambda s: str(s), sensor_attributes)))
        indexes_csv = ','.join(list(map(lambda i: str(i), indexes)))
        cc = CapCache(dataset=dataset, maxAtt=maxAtt, minSup=minSup, evoRate=evoRate, distance=distance, sensors=sensor_id_csv, attributes=sensor_attribute_csv, indexes=indexes_csv)
        cc.save()

    # output
    json_res = outputCAPJson(params['dataset'], S, CAP)

    c = Cache(dataset=dataset, maxAtt=maxAtt, minSup=minSup, evoRate=evoRate, distance=distance, json_output=json_res)
    c.save()

    return HttpResponse(json_res)

@csrf_exempt
def sensor_correlation(request, dataset, maxAtt, minSup, evoRate, distance):

    sensor_ids = dict(request.POST)['sensor_ids']
    sensor_attributes = dict(request.POST)['sensor_attributes']
    data_df = loadDataFile(dataset)

    cap_caches = CapCache.objects.filter(dataset=dataset, maxAtt=maxAtt, minSup=minSup, evoRate=evoRate, distance=distance)
    if len(cap_caches) == 0:
        raise "cap cache should be in the CapCache. But not found"

    # idから全ての組み合わせを列挙
    pattern_ids = []
    for n in range(2, maxAtt+1):
        for comb in itertools.combinations(sensor_ids, n):
            pattern_ids.append(list(comb))
    '''
    cap_cache = None
    for cc in cap_caches:
        cache_sensor_ids = set(cc.sensors.split(','))
        cache_sensor_attributes = set(cc.attributes.split(','))
        #if not (set(sensor_ids) == cache_sensor_ids and set(sensor_attributes) == cache_sensor_attributes):
        if not (set(sensor_ids) == cache_sensor_ids):
            continue
        cap_cache = cc
        break
    indexes = list(map(lambda i: int(i),cap_cache.indexes.split(',')))
    indexes.sort()
    '''

    # 全ての組み合わせパターンとCAPで同じ共起の組み合わせがあればindexを取り出して集める
    indexes = []
    for cc in cap_caches:
        for comb_ids in pattern_ids:
            cache_sensor_ids = set(cc.sensors.split(','))
            cache_sensor_attributes = set(cc.attributes.split(','))
            #if not (set(sensor_ids) == cache_sensor_ids and set(sensor_attributes) == cache_sensor_attributes):
            if set(comb_ids) == cache_sensor_ids:
                cap_cache = cc
                indexes.extend(list(map(lambda i:int(i),cap_cache.indexes.split(','))))
                break
    indexes = list(set(indexes)) # 重複を無くし、ソートする
    #indexes.sort()

    result = dict()
    result['sensor'] = dict()
    for sensor_id, attribute in zip(sensor_ids, sensor_attributes):
        target_df = data_df.query(f'id == \'{sensor_id}\' and attribute == \'{attribute}\'')
        result['sensor'][sensor_id] = dict()
        result['sensor'][sensor_id]['attribute'] = attribute
        result['sensor'][sensor_id]['timestamp'] = list(target_df.time)
        result['sensor'][sensor_id]['data'] = list(target_df.data)
    result['indexes'] = indexes

    return HttpResponse(json.dumps(result))
