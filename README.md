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

If you have already uploaded datasets for santander, china-6, china-13, you can execute queries on each page. If there are no datasets, you can upload datasets at `Your Dataset` page.
