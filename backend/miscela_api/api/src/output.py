import pandas as pd
import json
from api.src.myclass import Result
from api.src.myclass import Sensor4Output


def outputCAP(dataset, S, CAPs):

    for cap in CAPs:

        cap_id = cap.getId()

        with open("result/" + dataset + "/" + str(cap_id).zfill(5) + "_pattern.csv", "w") as of_pattern:
            with open("result/"+dataset+"/"+str(cap_id).zfill(5)+"_location.csv", "w") as of_location:
                with open("result/" + dataset + "/" + str(cap_id).zfill(5) + "_data.csv", "w") as of_data:
                    with open("result/" + dataset + "/" + str(cap_id).zfill(5) + "_data_filled.csv", "w") as of_data_filled:

                        of_pattern.write("id,attribute,pattern\n")
                        of_location.write("id,attribute,lat,lon\n")
                        data = pd.DataFrame(S[0].getTime(), columns=["time"])
                        data_filled = pd.DataFrame(S[0].getTime(), columns=["time"])

                        for i in cap.getMember():

                            sid = S[i].getId()
                            attribute = S[i].getAttribute()

                            # pattern
                            pattern = cap.getPattern()[attribute]
                            of_pattern.write(sid+","+attribute+","+str(pattern)+"\n")

                            # location
                            lat, lon = S[i].getLocation()
                            of_location.write(sid+","+attribute+","+str(lat)+","+str(lon)+"\n")

                            # data
                            data[sid] = pd.Series(S[i].getData())
                            data_filled[sid] = pd.Series(S[i].getData_filled())

                        data.to_csv(of_data, index=False)
                        data_filled.to_csv(of_data_filled, index=False)

def outputCAPJson(dataset, S, CAPs):

    result = Result(dataset)

    for cap in CAPs:

        group = list()
        for i in cap.getMember():
            sid = S[i].getId()
            attribute = S[i].getAttribute()
            pattern = cap.getPattern()[attribute]
            lat, lon = S[i].getLocation()

            group.append(Sensor4Output(sid, attribute, pattern, lat,lon))

        result.addGroup(group)

    return json.dumps(result, default=lambda o: getattr(o,'__dict__',str(o)),indent=4)
