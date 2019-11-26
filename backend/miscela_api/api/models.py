from django.db import models

class Cache(models.Model):
    dataset = models.CharField(max_length=100)
    maxAtt = models.IntegerField()
    minSup = models.IntegerField()
    evoRate = models.FloatField()
    distance = models.FloatField()
    json_output = models.TextField()
