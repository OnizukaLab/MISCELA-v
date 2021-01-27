# MISCELA_demo

This project is a DEMO framework for time-series sensor data mining system, MISCELA.

## requirements

* docker
* docker-compose

## quick start

### 1. Run api server by docker-compose.

  ```
  cd backend
  bash run_containers.sh
  ```

  API server on django and MongoDB start on your local environment.
  You can check all API urls in `./backend/miscela_api/api/urls.py` and main view file is `./backend/miscela_api/api/views.py`.
  All native MISCELA programs are under `./backend/miscela_api/api/src/`
  Console outputs are redirected to `./backend/miscela_log.txt`

### 2. open `index.html` in your web-browser. 

You can upload our datasets at `Your Dataset` page via a user interface that provides two ways of data upload: drag-and-drop and selecting files from finder. For uploading datasets, we need to prepare three files; data.csv, location.csv, and attribute.csv. data.csv. 

![Sample Image 1](/img/upload_dataset.png)

The datasets folder contains the sample datasets. You can check the format of the dataset files and try to run them easily.

### 3. Run MISCELA with the parameters you set.

You can run MISCELA by setting parameters Max Attribute, Minimum Support, Evolving rate and Distance and then pushing the `Update` button.

![Sample Image 2](/img/set_parameters.png)


### 4. Draw a graph of the set of CAP sensors.

After the calculation is completed, the CAP sensor set is displayed on the map. You select a sensor and click on it to discover correlations between multiple attributes from a set of spatially proximate sensors, and to check that the measurements are temporally correlated.

![Sample Image 3](/img/draw_graph.png)