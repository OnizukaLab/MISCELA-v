import pandas as pd
import numpy as np
import copy
import pickle
import json
import io
import pdb
from pyclustering.cluster.dbscan import dbscan

from api.src.myclass import Color
from api.src.myclass import Sensor
from api.src.myclass import Cluster
from api.src.myclass import CAP
from api.src.myclass import Result
from api.src.myutility import deg2km
from api.src.myutility import dist

from api.models import DataSet

def loadDataFile(dataset):
    datas = DataSet.objects.filter(data_name=dataset, data_type='data')
    data = '\n'.join(list(map(lambda d: d.data, datas)))
    data = data.replace('\n\n', '\n').strip('\n')

    data_df = pd.read_csv(io.StringIO(data))
    data_df["id"] = data_df["id"].map(lambda i: str(i).zfill(5))
    data_df["data"] = data_df["data"].map(lambda i: float(str(i)))
    return data_df

def loadLocationFile(dataset):
    location = pd.read_csv(io.StringIO(DataSet.objects.filter(data_name=dataset, data_type='location')[0].data))
    location["id"] = location["id"].map(lambda i: str(i).zfill(5))
    location["lat"] = location["lat"].map(lambda i: str(round(i, 5)))
    location["lon"] = location["lon"].map(lambda i: str(round(i, 5)))
    return location


def loadData(attribute, dataset, data, location):
    data = data.query(f'attribute == \'{attribute}\'')
    
    location = location.query(f'attribute == \'{attribute}\'')
    ids = list(location.id)
    timestamps = list(data.time)

    s = list()

    for i in ids:
        location_i = location.query(f'id == \'{str(i)}\'')
        location_i = (float(location_i["lat"]), float(location_i["lon"]))
        data_i = data.query(f'id == \'{str(i)}\'')
        data_i = list(data_i["data"])
        s_i = Sensor()
        s_i.setId(str(i))
        s_i.setAttribute(str(attribute))
        s_i.setTime(timestamps)
        s_i.setLocation(location_i)
        s_i.setData(data_i)
        s.append(s_i)
        del s_i

    return s

def dataSegmenting(S):

    '''
    algorithm
    rpt.Dynp(model='l2', custom_cost=None, min_size=2, jump=5, params=None)
    rpt.Pelt(model='l2', custom_cost=None, min_size=2, jump=5, params=None)
    rpt.Binseg(model='l2', custom_cost=None, min_size=2, jump=5, params=None)
    rpt.BottomUp(model='l2', custom_cost=None, min_size=2, jump=5, params=None)
    rpt.Window(width=100, model='l2', custom_cost=None, min_size=2, jump=5, params=None)
    '''

    for s_i in S:
        data = pd.Series(s_i.getData())
        data = data.fillna(method="ffill")
        data = data.fillna(method="bfill")
        data = data.astype("float64")
        s_i.setData_filled(list(data))

def estimateThreshold(S, M, evoRate):

    thresholds = dict()

    # each attribute
    offset = 0
    for attribute in M.keys():
        distribution = list()

        # each sensor
        for s_i in S[offset: offset+M[attribute]]:
            data = s_i.getData_filled()
            prev = 0.0

            # each value
            for value in data:
                distribution.append(abs(value-prev))
                prev = value

        distribution.sort(reverse=True)
        if len(distribution) == 0:
            continue
        threshold = distribution[int(evoRate * len(distribution))]
        thresholds[attribute] = threshold
        offset += M[attribute]
        del distribution

    return thresholds

def extractEvolving(S, thresholds):

    for s in S:
        prev = 0.0
        data = s.getData_filled()
        for i in range(len(data)):
            delta = data[i] - prev
            if delta > thresholds[s.getAttribute()]:
                s.addTp(i)
            if delta < (-1)*thresholds[s.getAttribute()]:
                s.addTn(i)
            prev = data[i]

def clustering(S, distance):

    '''
    DBSCAN
    '''

    locations = list(map(lambda s_i: deg2km(s_i.getLocation()[0], s_i.getLocation()[1]), S))
    inst = dbscan(data=locations, eps=distance, neighbors=2, ccore=False) # True is for C++, False is for Python.
    inst.process()
    clusters = inst.get_clusters()

    '''
    set the results into Cluster class
    '''

    C = list()
    for cluster in clusters:
        c = Cluster()
        cluster.sort()
        c.setMember(cluster)
        attributes = set()
        for i in cluster:
            attributes.add(S[i].getAttribute())
            for j in cluster[cluster.index(i)+1:]:
                    if dist(S[i].getLocation(), S[j].getLocation()) <= distance:
                        S[i].addNeighbor(j)
                        S[j].addNeighbor(i)

        c.setAttribute(attributes)
        C.append(c)

    return C

def capSearch(S, C, K, psi):

    CAPs = list()
    for c in C:
        CAPs += search(S, c, K, psi, list(), list())



    for i in range(len(CAPs)):
        CAPs[i].setId(i)
        CAPs[i].setCoevolution()

    return CAPs

def search(S, c, K, psi, X, CAP_X):

    CAPs = list()

    if len(X) >= 2:
        CAPs += CAP_X

    F_X = follower(S, c, X)

    for y in F_X:
        Y = X.copy()
        Y.append(y)
        Y.sort()

        if parent(S, Y, K) == X:
            CAP_Y = getCAP(S, y, psi, CAP_X)
            if len(CAP_Y) != 0:
                CAPs += search(S, c, K, psi, Y, CAP_Y)

    return CAPs

def follower(S, c, X):

    # root
    if len(X) == 0:
        return c.getMember()

    # followers
    else:
        F_X = set()
        for x in X:
            F_X |= S[x].getNeighbor()
        F_X -= set(X)
        return sorted(list(F_X))

def parent(S, Y, K):

    # size(Y) = 1
    if len(Y) == 1:
        return list()

    # size(Y) == 2
    if len(Y) == 2:
        if S[Y[0]].getAttribute() == S[Y[1]].getAttribute():
            return list()
        else:
            return [Y[1], ]

    # size(Y) >= 3
    # Y contains more/less than or equal to 2/K attributes
    attCounter = set()
    for y in Y:
        attCounter.add(S[y].getAttribute())
    if len(attCounter) > K:
        return list()

    for y in Y:
        Z = Y.copy()
        Z.remove(y)
        L_Z = np.array([[0]*len(Z)]*len(Z))
        for i in range(0, len(Z)):
            for j in range(i+1, len(Z)):
                if Z[j] in S[Z[i]].getNeighbor():
                    L_Z[i][j] = -1
                    L_Z[j][i] = -1
            L_Z[i][i] = np.count_nonzero(L_Z[i])

        # rank(L(Z)) = |Z|-1 => Z is connected
        if np.linalg.matrix_rank(L_Z) == len(Z)-1:

            # Z contains more/less than or equal to 2/K attributes
            attCounter = set()
            for z in Z:
                attCounter.add(S[z].getAttribute())
            if len(attCounter) >= 2 and len(attCounter) <= K:
                return Z

    return list()

def getCAP(S, y, psi, C_X):

    C_Y = list()

    # init
    if len(C_X) == 0:
        if len(S[y].getTp()) + len(S[y].getTn()) >= psi:
            cap = CAP()
            cap.addMember(y)
            cap.addAttribute(S[y].getAttribute())
            cap.setPattern(S[y].getAttribute(), 1)
            cap.setP1(S[y].getTp())
            cap.setP2(S[y].getTn())
            C_Y.append(cap)

        return C_Y

    # following
    else:

        for cap_x in C_X:
            cap = copy.deepcopy(cap_x)
            p1 = set()
            p2 = set()

            # y_a isn't a new attribute
            if S[y].getAttribute() in cap.getAttribute():

                # calculate intersection (1:increase, -1:decrease)
                if cap.getPattern()[S[y].getAttribute()] == 1:
                    p1 = cap.getP1() & S[y].getTp()
                    p2 = cap.getP2() & S[y].getTn()
                if cap.getPattern()[S[y].getAttribute()] == -1:
                    p1 = cap.getP1() & S[y].getTn()
                    p2 = cap.getP2() & S[y].getTp()
                if cap.getPattern()[S[y].getAttribute()] == 0:
                    print("cap error")
                    quit()

                # set cap
                if len(p1)+len(p2) >= psi:
                    cap.addMember(y)
                    cap.setP1(p1)
                    cap.setP2(p2)
                    C_Y.append(cap)

            # y_a is a new attribute
            else:

                cap_new = copy.deepcopy(cap)
                p1 = cap_new.getP1() & S[y].getTp()
                p2 = cap_new.getP2() & S[y].getTn()
                if len(p1) + len(p2) >= psi:
                    cap_new.addAttribute(S[y].getAttribute())
                    cap_new.addMember(y)
                    cap_new.setPattern(S[y].getAttribute(), 1)
                    cap_new.setP1(p1)
                    cap_new.setP2(p2)
                    C_Y.append(cap_new)

                del cap_new

                cap_new = copy.deepcopy(cap)
                p1 = cap_new.getP1() & S[y].getTn()
                p2 = cap_new.getP2() & S[y].getTp()
                if len(p1) + len(p2) >= psi:
                    cap_new.addAttribute(S[y].getAttribute())
                    cap_new.addMember(y)
                    cap_new.setPattern(S[y].getAttribute(), -1)
                    cap_new.setP1(p1)
                    cap_new.setP2(p2)
                    C_Y.append(cap_new)

        return C_Y

def miscela_sensor(args, sensors, data_df):

    print("*----------------------------------------------------------*")
    print("* MISCELA is getting start ...")

    # load data on memory
    print("\t|- phase0: loading data ... ", end="")
    S = list()
    M = dict()
    
    dataset_attribute = DataSet.objects.filter(data_name=str(args['dataset']), data_type='attribute')[0].data
    data_df = loadDataFile(args['dataset'])
    location_df = loadLocationFile(args['dataset'])
    for attribute in dataset_attribute.rstrip('\n').split('\n'):
    #for attribute in attributes:
        attribute = attribute.strip()
        S_a = loadData(attribute, str(args['dataset']), data_df, location_df)
        S += S_a
        M[attribute] = len(S_a)
        del S_a

        print(Color.GREEN + "OK" + Color.END)

    # data segmenting
    print("\t|- phase1: pre-processing ... ", end="")
    dataSegmenting(S)
    print(Color.GREEN + "OK" + Color.END)

    # extract evolving timestamps
    print("\t|- phase2: extracting evolving timestamp ... ", end="")
    thresholds = estimateThreshold(S, M, args['evoRate'])
    extractEvolving(S, thresholds)
    print(Color.GREEN + "OK" + Color.END)

    # clustering
    print("\t|- phase3: clustering ... ", end="")
    C = clustering(S, args['distance'])
    print(Color.GREEN + "OK" + Color.END)

    # CAP search
    print("\t|- phase4: cap search ... ", end="")
    CAPs = capSearch(S, C, args['maxAtt'], args['minSup'])
    print(Color.GREEN + "OK" + Color.END)

    tmp_cap = []
    for cap in CAPs:
        if all([S[m].getId() in sensors for m in cap.getMember()]):
           tmp_cap.append(cap)
           break

    return tmp_cap[0], S


def miscela_(args):

    print("*----------------------------------------------------------*")
    print("* MISCELA is getting start ...")

    # load data on memory
    print("\t|- phase0: loading data ... ", end="")
    S = list()
    M = dict()
    
    dataset_attribute = DataSet.objects.filter(data_name=str(args['dataset']), data_type='attribute')[0].data
    #if len(dataset_attribute) == 0:
    #    print('no dataset found')
    #    return False, False

    data_df = loadDataFile(args['dataset'])
    location_df = loadLocationFile(args['dataset'])
    for attribute in dataset_attribute.rstrip('\n').split('\n'):
        attribute = attribute.strip()
        S_a = loadData(attribute, str(args['dataset']), data_df, location_df)
        S += S_a
        M[attribute] = len(S_a)
        del S_a
    print(Color.GREEN + "OK" + Color.END)

    # data segmenting
    print("\t|- phase1: pre-processing ... ", end="")
    dataSegmenting(S)
    print(Color.GREEN + "OK" + Color.END)

    # extract evolving timestamps
    print("\t|- phase2: extracting evolving timestamp ... ", end="")
    thresholds = estimateThreshold(S, M, args['evoRate'])
    extractEvolving(S, thresholds)
    print(Color.GREEN + "OK" + Color.END)

    # clustering
    print("\t|- phase3: clustering ... ", end="")
    C = clustering(S, args['distance'])
    print(Color.GREEN + "OK" + Color.END)

    # CAP search
    print("\t|- phase4: cap search ... ", end="")
    CAPs = capSearch(S, C, args['maxAtt'], args['minSup'])
    print(Color.GREEN + "OK" + Color.END)

    return CAPs, S
