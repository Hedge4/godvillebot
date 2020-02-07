def omnibus_get():
    import webscraper
    from bs4 import BeautifulSoup
    omnibus = webscraper.getcrossword('https://wiki.godvillegame.com/Omnibus_List')
    if omnibus != None:
        print("Nieuwste versie van de omnibus lijst aan het ophalen...")
        omnibus = BeautifulSoup(omnibus,'html.parser')
        f= open("python/omnibus.txt","w+")
        data = []
        for li in omnibus.select('li'):
            try:
                f.write(str(li.text)+'\n')
                data.append(str(li.text))
            except UnicodeEncodeError:
                print("Een stom ding kan niet aan de lijst worden toegevoegd.")
        print("Klaar."+'\n')
        f.close()
    else:
        print("Omnibus lijst online niet gevonden, backup gebruiken...")
        try:
            with open('python/omnibus.txt', 'r') as f:
                data = [line.strip() for line in f]
            print("Klaar."+'\n')
        except FileNotFoundError:
            print("Geen backup van de omnibuslijst gevonden.")
            exit()
    return data
    
def find(words, data):
    import re
    new_words = []
    print()
    for num in range(len(words)):
        word = str("^"+words[num]+"$")
        print()
        results = []
        for element in data:
            result = re.match(str(word), element, re.IGNORECASE)
            if result:
                results.append(result.group(0))
        if len(results) == 0:
            results = "No words found."
        if len(results) == 1:
            results = str(results[0])
        new_words.append(str(results))
        print(word, "--->", new_words[num])
    return new_words