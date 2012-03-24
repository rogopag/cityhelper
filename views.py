# Create your views here.
import os
from django.http import HttpResponse
from django.template import RequestContext, loader
from django.views.generic import View
from django.utils import simplejson as json
from pprint import pprint
import urllib2
from xml.dom import minidom


class HomePage(View):
	
	parkings = []
	traffic = []
	
	def get(self, request):
		
		t = loader.get_template('map.html')
		c = RequestContext(request, {'page_title':'Data Living Turin'})
		return HttpResponse(t.render(c), content_type="text/html")
	
	def post(self, request):
		pck_url = 'http://opendata.5t.torino.it/get_pk'
		trf_url = 'http://opendata.5t.torino.it/get_fdt'
		self.parkings = self.fetch_parkings(pck_url)
		self.traffic = self.fetch_traffic(trf_url)
		return HttpResponse( json.dumps({'parkings' : self.parkings, 'traffic' : self.traffic}), type="application/json" )
		
	def fetch_parkings(self, url):
		parkings = []
		try:
			s = urllib2.urlopen(urllib2.Request(url=url))
			r = minidom.parse(s)
			for node in r.getElementsByTagName('td:PK_data'):
				parkings.append({
				'name' : node.getAttribute('Name'),
				'status': node.getAttribute('status'),
				'total': node.getAttribute('Total'),
				'free': node.getAttribute('Free'),
				'lat': node.getAttribute('lat'),
				'lng': node.getAttribute('lng')
				})
			return parkings
		except urllib2.HTTPError, e:
			print "Problems loading the url " + str(e)
			return None
	
	def fetch_traffic(self, url):
		traffic = []
		try:
			s = urllib2.urlopen(urllib2.Request(url=url))
			r = minidom.parse(s)
			for node in r.getElementsByTagName('FDT_data'):
				child = node.getElementsByTagName('speedflow')[0]
				traffic.append({
				'name' : node.getAttribute('Road_name'),
				'lat': node.getAttribute('lat'),
				'lng': node.getAttribute('lng'),
				'flow' : child.getAttribute('flow'),
				'speed' : child.getAttribute('speed')
				})
			return traffic
		except urllib2.HTTPError, e:
			print "Problems loading the url " + str(e)
			return None