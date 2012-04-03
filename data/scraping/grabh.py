import os, sys; sys.path.insert(0, os.path.join("..", ".."))
from pattern.web import URL, Document, plaintext
from pattern.db import Datasheet
from pprint import pprint
#ff
def numeric(value):
	try:
		return float(value)
	except:
		return value

def main():
	table = Datasheet()

	url = 	URL("http://www.comuniecitta.it/torino/elenco-ospedali-di-torino.html")
	connection = url.open()
	doc = Document( connection.read() )
	items = doc.by_class('ulamm')[1:]
	row = []
	for ul in items:
		li = ul.by_tag('li')
		kind = plaintext(ul.previous.content)
		for el in li:
			if el != None:
				save = "%s, %s \n" % ( plaintext(el.content).replace('\n', ','), kind, )
				row.append(save)
	table.append( row )
		
	table.save("files/h_torino.txt")
	
	
if __name__ == '__main__':
	main()