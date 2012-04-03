import os, sys; sys.path.insert(0, os.path.join("..", ".."))
from pattern.web import URL, Document, plaintext
from pattern.db import Datasheet
from pprint import pprint

def numeric(value):
	try:
		return float(value)
	except:
		return value

def main():
	table = Datasheet()
	tel = ''
	street = ''
	locality = ''
	title = ''
	for i in range(3):
		page = i+1
		url = 	URL("http://torino.paginegialle.it/pgol/4-veterinari/3-torino/p-%s?mr=50" % page)
		print "collecting from %s" % url
		connection = url.open()
		doc = Document( connection.read() )
		items = doc.by_class('item_sx')
		row = []
		for j, item in enumerate(items):
			divs = item.by_class('address')
			try:	
				title = item.by_class('item_head')[0].by_tag('a')[0].content
			except IndexError, e:
				print >> sys.stderr, "%s" % j, e
				pass
			for z, div in enumerate(divs):
				if div != None:
					try:
						street = div.by_class('street-address')[0].content
						locality = div.by_class('locality')[0].content
						tel = div.by_class('tel')[0].by_class('value')[0].content
					except IndexError, e:
						print >> sys.stderr, "%s" % z, e
						pass
					save = "%s, %s %s, %s \n" % ( plaintext(title), plaintext(street).replace(",", ""), plaintext(locality).replace('(TO)', ''), plaintext(tel).replace(",", "") )
					print >> sys.stderr, save
					row.append(save)
		print "%s --------------------------------------------------" % i
		table.append( row )
		
	table.save("files/v_torino.txt")
	
if __name__ == '__main__':
	main()