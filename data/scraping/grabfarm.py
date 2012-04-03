import os, sys; sys.path.insert(0, os.path.join("..", ".."))
from pattern.web import URL, Document, plaintext
from pattern.db import Datasheet
from pprint import pprint
#ff

CAPS = (10121,10125,10129,10134,10138,10143,10147,10152,10156,10122,10126,10131,10135,10139,10144,10148,10153,10123,10127,10132,10136,10141,10149,10154,10124,10128,10133,10137,10142,10146,10151,10155,10145)

def numeric(value):
	try:
		return float(value)
	except:
		return value

def main():
	table = Datasheet()

	for cap in CAPS:
		url = 	URL("http://www.comuni-italiani.it/001/272/farmacie/cap%s.html" % cap)
		connection = url.open()
		doc = Document( connection.read() )
		items = doc.by_tag("table")
		row = []
		for j, td in enumerate( items[5].by_tag('td') ):
			strcap = "%s, Telefono:" % cap
			save = "%s" % plaintext(td.content).replace('\n', ',', 3).replace("Telefono:", strcap).replace(";", "").replace("Partita Iva", ",Partita Iva") + "\n"
			if save != None:
				row.append( save )
		table.append( row )
		print  "%s ----------------------------------------------------------------------------" % str(j)
		
	table.save("files/farmacie_torino.txt")
	
	
if __name__ == '__main__':
	main()