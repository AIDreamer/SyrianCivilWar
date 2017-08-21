import csv
import json

csvfile = open('../data/Factions in Syrian Civil War.csv', 'r')
jsonfile = open('../PlayGround/graph.json', 'w')

fieldnames = ("ID","Faction Name","Parent ID", "Strength low", "Strength high", "Allies", "Enemies", "Support", "Oppose", "Source")
reader = csv.DictReader(csvfile, fieldnames)

# Read in all the dat
data = []
data_dict = {}
first_row = False
for row in reader:
    if first_row == False:
        first_row = True
        continue
    row["children"] = []
    data.append(row)
    data_dict[row["ID"]] = row

# Process the data. Add "children" and "strength" into the mix
for row in data:
    if row["Parent ID"] != "": data_dict[row["Parent ID"]]["children"].append(row["ID"])
    try:
        row["Strength"] = (int(row["Strength low"]) + int(row["Strength high"])) // 2
    except:
        row["Strength"] = -1;

# Redistribute the population to sub groups
def redistribute_to_children(row):
    strength = row["Strength"]
    num_child = len(row["children"])
    for id in row["children"]:
        if data_dict[id]["Strength"] != -1:
            strength -= data_dict[id]["Strength"]
            num_child -= 1

    if num_child > 0:
        redistributed_strength = strength // num_child
        for id in row["children"]:
            if data_dict[id]["Strength"] == -1:
                data_dict[id]["Strength"] = redistributed_strength
            redistribute_to_children(data_dict[id])

for row in data:
    redistribute_to_children(row)

# Trace back to the source
def trace_back(row):
    if row["Parent ID"] == "": return row["ID"]
    else: return trace_back(data_dict[row["Parent ID"]])

nodes = []

for i in range(len(data)):
    row = data[i]
    node = {}
    node["id"] = row["ID"]
    node["parent"] = row["Parent ID"]
    node["group"] = int(trace_back(row))
    node["strength"] = row["Strength"]
    nodes.append(node)

links = []

for i in range(len(data)):
    row = data[i]
    if row["Parent ID"] == "": continue
    link = {}
    link["source"] = row["ID"]
    link["target"] = row["Parent ID"]
    link["type"] = 1
    links.append(link)

for i in range(len(data)):
    row = data[i]
    if row["Allies"] != "":
        allies_id = row["Allies"].split(".")
        for id in allies_id:
            link["source"] = row["ID"]
            link["target"] = id
            link["value"] = 2
            links.append(link)

for i in range(len(data)):
    row = data[i]
    if row["Enemies"] != "":
        enemies_id = row["Enemies"].split(".")
        for id in enemies_id:
            link["source"] = row["ID"]
            link["target"] = id
            link["value"] = 3
            links.append(link)

obj = {}
obj["nodes"] = nodes
obj["links"] = links

json.dump(obj, jsonfile)