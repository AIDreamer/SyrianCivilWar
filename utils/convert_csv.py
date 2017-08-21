import csv
import json

csvfile = open('../data/Factions in Syrian Civil War.csv', 'r')
jsonfile = open('../data/Factions in Syrian Civil War.js', 'w')

fieldnames = ("ID","Faction Name","Parent ID", "Strength low", "Strength high", "Allies", "Enemies", "Support", "Oppose", "Source")
reader = csv.DictReader(csvfile, fieldnames)
jsonfile.write("var data = [")

first_row = False
for row in reader:
    if first_row == False:
        first_row = True
        continue
    json.dump(row, jsonfile)
    jsonfile.write(',\n')
jsonfile.write("]")