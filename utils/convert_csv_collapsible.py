import csv
import json

# ----------------
# PROCESS FACTIONS
# ----------------

csvfile = open('../data/Syrian Civil War Information - Factions.csv', 'r')
fieldnames = ("ID","Faction Name","Parent ID", "Strength low", "Strength high", "Color ID", "Source", "Merger or Predecessor", "Note")
reader = csv.DictReader(csvfile, fieldnames)

# Read in all the data
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

# Redistribute color ID
def redistribute_color_id(row):
    for child_id in row["children"]:
        child_row = data_dict[child_id]
        child_row["Color ID"] = row["Color ID"]
        redistribute_color_id(child_row)

for row in data:
    redistribute_to_children(row)

for row in data:
    if row["Parent ID"] == "": redistribute_color_id(row)

def create_obj(row):

    obj = {}
    obj["id"] = row["ID"]
    obj["name"] = row["Faction Name"]
    obj["strength"] = row["Strength"]
    obj["color_id"] = row["Color ID"]
    obj["part_of_merger"] = row["Merger or Predecessor"]

    if len(row["children"]):
        obj["children"] = []

    for id in row["children"]:
        obj["children"].append(create_obj(data_dict[id]))

    return obj

tree = []
for row in data:
    if row["Parent ID"] == "":
        obj = create_obj(row)
        tree.append(obj)

# ---------------------
# PROCESS RELATIONSHIPS
# ---------------------

csvfile = open('../data/Syrian Civil War Information - Relationships.csv', 'r')
fieldnames = ("Source ID","Source Name","Target ID", "Target Name", "Connection Type", "Description", "Last Activity", "Source")
reader = csv.DictReader(csvfile, fieldnames)

# Read in all the data
data = []
first_row = False
for row in reader:
    if first_row == False:
        first_row = True
        continue
    data.append(row)

# Process the data and create an array of links
links = []
for row in data:
    obj = {}
    obj["source_id"] = row["Source ID"]
    obj["target_id"] = row["Target ID"]
    obj["link_type"] = row["Connection Type"]
    try: int(obj["target_id"])
    except: continue
    links.append(obj)

# ------------------
# PROCESS COALITIONS
# ------------------

csvfile = open('../data/Syrian Civil War Information - Coalitions.csv', 'r')
fieldnames = ("ID", "Name", "Number of Children")
reader = csv.DictReader(csvfile, fieldnames)

# Read in all the data
data = []
first_row = False
for row in reader:
    if first_row == False:
        first_row = True
        continue
    data.append(row)

# Process the data and create an array of links
coalitions = []
for row in data:
    obj = {}
    obj["id"] = row["ID"]
    obj["name"] = row["Name"]
    obj["num_children"] = row["Number of Children"]
    coalitions.append(obj)

# ---------------------------------------------------
# CONCATENATE EVERYTHING AND DUMP IT INTO A JSON FILE
# ---------------------------------------------------

graph = {}
graph["tree"] = tree
graph["links"] = links
graph["coalitions"] = coalitions
jsonfile = open('../PlayGround2/graph.json', 'w')
json.dump(graph, jsonfile)