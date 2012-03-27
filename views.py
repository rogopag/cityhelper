# Create your views here.
import os, sys, csv
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
	pharma = []
	
	def get(self, request):
		t = loader.get_template('map.html')
		c = RequestContext(request, {'page_title':'Data Living Turin'})
		return HttpResponse(t.render(c), content_type="text/html")
	
	def post(self, request):
		pck_url = 'http://opendata.5t.torino.it/get_pk'
		trf_url = 'http://opendata.5t.torino.it/get_fdt'
		self.parkings = self.fetch_parkings(pck_url)
		self.traffic = self.fetch_traffic(trf_url)
		self.pharma = self.fetch_pharma()
		response = {'pharma' : self.pharma, 'parkings' : self.parkings, 'traffic' : self.traffic}
		return HttpResponse( json.dumps(response), content_type="application/json", mimetype='application/json' )
	
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
			print "Problems loading the url %s" + e
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
			print "Problems loading the url %s" + e
			return None
	
	def fetch_pharma(self):
		pharma = []
		INPUT_FILE = "data/farmacie_geo.csv"
		try:
			all_rows = list(csv.reader(open(INPUT_FILE, "rU")))
			for row in all_rows:
				pharma.append({
				'name' : row[0],
				'address' : str(row[1]) + ", " + str(row[2]),
				'cap' : row[3],
				'phone' : row[4],
				'code' : row[5],
				'vat': row[6],
				'lat': row[7],
				'lng' : row[8]
				})
			return pharma
		except IOError as (errno, strerror):
				print "I/O error({0}): {1}".format(errno, strerror)
				return None