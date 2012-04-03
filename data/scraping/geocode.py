import os, sys; sys.path.insert(0, os.path.join("..", ".."))
from pattern.web import URL, Document, plaintext
from pattern.db import Datasheet
from pprint import pprint
from geopy import geocoders
import csv

#Usage python geocode.py path_to_file.csv start_from end_to ### this is needed cause Google() geocoder has severe limitations on query per second and our app is fast....
data = []

def main():
	try:
		INPUT_FILE = sys.argv[1] # "block_4_night.csv"
	except IOError, e:
		print 'No input file provided', e

	try:
		#OUTPUT_FILE = sys.argv[2]
		OUTPUT_FILE = 'files/geo_v_%s.csv' % sys.argv[3]
	except IOError, e:
		print 'No output file provided', e
		
	all_rows = list(csv.reader(open(INPUT_FILE, "rU")))

	rows = all_rows[int(sys.argv[2]):int(sys.argv[3])]
	
	
#	rows = rows[20:]
	print "row num is %s" % len(rows) 
	
	for row in rows:
		addr = ''
		addr =  "%s, IT" % row[1]
		print >> sys.stderr, "%s" % addr
		geocode_cities(addr)
		
	map(lambda x, y: y.append( x ), data, rows)
	
	with open(OUTPUT_FILE, 'wb') as f:
		writer = csv.writer(f)
		writer.writerows(rows)


def geocode_cities( cities ):
	g = geocoders.Google()
	try:
		place =  g.geocode(cities, exactly_one=False)
		print "%s" % place
		lat = place[0][1][0]
		lng = place[0][1][1]
		data.append([lat, lng])
	except TypeError, e:
		print e, "%s" % cities
	geocode_cities.count = geocode_cities.count + 1

geocode_cities.count = 1
	
if __name__ == "__main__":
	main()