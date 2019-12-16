from django.db import models

class Cache(models.Model):
    dataset = models.CharField(max_length=100)
    maxAtt = models.IntegerField()
    minSup = models.IntegerField()
    evoRate = models.FloatField()
    distance = models.FloatField()
    json_output = models.TextField()

class DataSet(models.Model):
    data_name = models.TextField()
    data_type = models.TextField()
    data_id = models.IntegerField()
    data = models.TextField()
