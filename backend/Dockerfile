FROM yusukew/miscela_base

WORKDIR /code
ADD ./miscela_api/requirements.txt /code
ADD ./miscela_api/wait_pg.sh /code
RUN pip install -r requirements.txt
CMD ["python3", "manage.py", "runserver", "0.0.0.0:8000"]
