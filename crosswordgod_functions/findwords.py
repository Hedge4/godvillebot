def finder(nums, cells, trs, tds):
    words_hor = []
    words_vert = []
    for a in nums:
        word = str(cells[a])
        if a % tds == 0:
            if cells[a+1] != "#" and a % tds != tds-1:
                b = a
                while b % tds < tds-1:
                    b += 1
                    if cells[b] != "#":
                        word+=str(cells[b])
                    else:
                        b = tds-1
                if len(word) > 1:
                    words_hor.append(word)
        else:
            if cells[a-1] == "#":
                if cells[a+1] != "#" and a % tds != tds-1:
                    b = a
                    while b % tds < tds-1:
                        b += 1
                        if cells[b] != "#":
                            word+=str(cells[b])
                        else:
                            b = tds-1
                    if len(word) > 1:
                        words_hor.append(word)
        
        word = str(cells[a])
        if a < tds:
            if cells[a+tds] != "#":
                b = a+tds
                while b < tds*trs:
                    if cells[b] != "#":
                        word+=str(cells[b])
                    else:
                        b = tds*trs
                    b += tds
                if len(word) > 1:
                    words_vert.append(word)
        else:
            if cells[a-tds] == "#" and a <= tds*trs-(tds+1):
                if cells[a+tds] != "#":
                    b = a+tds
                    while b < tds*trs:
                        if cells[b] != "#":
                            word+=str(cells[b])
                        else:
                            b = tds*trs
                        b += tds
                    if len(word) > 1:
                        words_vert.append(word)
    
    return words_hor, words_vert