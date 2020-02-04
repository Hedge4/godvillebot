import webscraper
from bs4 import BeautifulSoup
import findwords
import searchwords
import os, re, os.path
import random

# get the crossword from the site and save it to a file
print('\n'+"Het kruiswoordraadsel wordt van online opgehaald...")
raw_html = webscraper.getcrossword('https://godvillegame.com/news/')
if raw_html == None:
    exit()
print("Klaar."+'\n')
html = BeautifulSoup(raw_html, 'html.parser')

# get news from crossword
news = []
forecast = html.findAll("div", {"class": "fc clearfix"})
forecast = BeautifulSoup(str(forecast), 'html.parser')
for p in forecast.select('p'):
    news.append(p.text)
        
# stap 1 interpreteren crossword
for table in html.select('table'):
    if table['id'] == 'cross_tbl':
        crossword = table
        trs = int(0)
        cell_values = []
        nums = []
        for tr in table.select('tr'):
            trs += 1
            for td in tr.select('td'):
                if td['class'] == []:
                    cell_values.append('#')
                if td['class'] == ['td_cell']:
                    cell_values.append('.')
                    for div in td.select('div'):
                        if div['class'] == ['num']:
                            nums.append(len(cell_values)-1)
                if td['class'] == ['td_cell', 'known']:
                    for div in td.select('div'):
                        if div['class'] == ['num']:
                            nums.append(len(cell_values))
                        if div['class'] == ['open']:
                            cell_values.append(div.text)

# stap 2 interpreteren crossword
tds = int(len(cell_values)/trs)
b = 0
for a in range(trs):
    c = 0
    while c < tds:
        print(cell_values[b]+"  ", end='')
        b += 1
        c += 1
    print()
print('\n'+"Totaal aantal cellen:",b)
print("De celnummers waar woorden beginnen:",nums)

# vind uit de lijst met waarden van het kruiswoordraadsel de woorden
words_hor, words_vert = findwords.finder(nums, cell_values, trs, tds)
print("Horizontale woorden:",words_hor)
print("Verticale woorden:",words_vert,'\n')

# vervang de woorden d.m.v. de omnibus-lijst met de gehele woorden
print("Ff omnibusje pakken hoor...")
omnibus = searchwords.omnibus_get()
print("Nou en dan nu lekker die dingen met elkaar matchen zodat we antwoorden hebben")
words_hor = searchwords.find(words_hor, omnibus)
words_vert = searchwords.find(words_vert, omnibus)

# delete old solution[rand_int].json files
pattern = "^solution[0-9]*.json$"
mypath = str(os.getcwd())
for root, dirs, files in os.walk(mypath):
    for file in filter(lambda x: re.match(pattern, x), files):
        os.remove(os.path.join(root, file))

# schrijf de oplossing naar het .json bestand in de juiste indeling
f= open("./solution"+str(random.randint(0, 1000000000))+".json","w+")
f.write('{\n    "embedTitle1": "Daily crossword solution and news:",\n    "embedBody1": "')
f.write(r"**=== Horizontal words ===**||\n")
for word in words_hor:
    f.write(r"\n*"+word+"*")
f.write(r"||\n\n**=== Vertical words ===**||\n")
for word in words_vert:
    f.write(r"\n*"+word+"*")
f.write('||",\n    "embedTitle2": "Daily Forecast",\n    "embedBody2": "')
if len(news) == 1:
    s = news[0]
if len(news) == 2:
    s = news[0]+r"*\n*"+news[1]
if len(news) == 3:
    s = news[0]+r"*\n*"+news[1]+r"*\n*"+news[2]
f.write('*'+str(s)+'*"\n}')
f.close()
print("Hoppeta ik ben klaar hoor")
exit()