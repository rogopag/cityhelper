from django.db import models
#from django.contrib.auth.models import User


class PublicService(models.Model):
	name = models.CharField(max_length=255, blank=False, null=False)
	address = models.TextField()
	phone = models.CharField(max_length=35, blank=False, null=False)
	cap = models.CharField(max_length=5, blank=False, null=False)
	lat = models.CharField(max_length=30,blank=False, null=False)
	lng = models.CharField(max_length=30,blank=False, null=False)
	town = models.CharField(max_length=35, blank=False, null=False)
	
	class Meta:
		abstract = True
		
class Pharma(PublicService):
	piva = models.CharField(max_length=11, blank=True, null=True)
	is_open = models.BooleanField()
	

class Hospital(PublicService):
	kind = models.CharField(max_length=35, blank=True, null=True)
	
class Veterinarian(PublicService):
	kind = models.CharField(max_length=35, blank=True, null=True)