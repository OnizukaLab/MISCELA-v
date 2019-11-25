from django.shortcuts import render
from django.http import HttpResponse

import argparse
import pickle
from api.src.func import miscela_
from api.src.output import outputCAP
from api.src.output import outputCAPJson
from api.models import Cache

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

    # output
    json_res = outputCAPJson(params['dataset'], S, CAP)
    print(json_res)

    c = Cache(dataset=dataset, maxAtt=maxAtt, minSup=minSup, evoRate=evoRate, distance=distance, json_output=json_res)
    c.save()

    return HttpResponse(json_res)

