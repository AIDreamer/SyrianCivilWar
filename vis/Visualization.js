/**
 * Created by Son Pham on 5/15/2017.
 */

////////////
// CONSTANTS
////////////

var SIZE_RATIO = 0.24;
var STRENGTH_TEXT_RATIO = 0.075;
var TEXT_RATIO = 0.50 * STRENGTH_TEXT_RATIO;
var TEXT_OFFSET_RATIO = SIZE_RATIO * 1;
var TEXT_SIZE_MIN = 8;
var CHARGE_RATIO = 0.01;
var BASE_CHARGE = 80;

var LINK_RATIO_HIERARCHY = SIZE_RATIO * 1;
var LINK_RATIO_ENEMY = SIZE_RATIO * 4;
var LINK_RATIO_ALLY = SIZE_RATIO * 4;
var LINK_SIZE_HIERARCHY = 1.5;
var LINK_SIZE_RELATIONSHIP = 3;


var COLOR_DICT = {
    1: "#C24F4D",
    2: "#369A70",
    3: "#727272",
    4: "#FCC604",
    5: "#A09CCE",
    6: "#F2902C",
    7: "#7D9AB7"
};
var LINK_COLOR_DICT = {
    "Hierarchy": "#1096BA",
    "Enemy": "#C22421",
    "Ally": "#1096BA"
}

var CAP_TITLE = 5000;
var CAP_ADDED_BASE = 7;
var CAP_ALPHA = 1;
var CAP_STRENGTH_ALPHA = 0.7;
var UNDERCAP_ALPHA = .2; //.12
var UNDERCAP_STRENGTH_ALPHA = 0; //.08
var UNDERCAP_TOGGLED_ALPHA = 1;
var UNDERCAP_STRENGTH_TOGGLED_ALPHA = 0.7;

var TOGGLED_ALPHA = 1;
var UNTOGGLED_ALPHA = 0.1;

//////////
// UTILITY
//////////

var padding = 1, // separation between circles
    radius=8;
function collide(alpha) {
    var quadtree = d3.geom.quadtree(nodes);
    return function(d) {
        var rb = 2*radius + padding,
            nx1 = d.x - rb,
            nx2 = d.x + rb,
            ny1 = d.y - rb,
            ny2 = d.y + rb;
        quadtree.visit(function(quad, x1, y1, x2, y2) {
            if (quad.point && (quad.point !== d)) {
                var x = d.x - quad.point.x,
                    y = d.y - quad.point.y,
                    l = Math.sqrt(x * x + y * y);
                if (l < rb) {
                    l = (l - rb) / l * alpha;
                    d.x -= x *= l;
                    d.y -= y *= l;
                    quad.point.x += x;
                    quad.point.y += y;
                }
            }
            return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        });
    };
}

////////////////////////
// INTERACTION UTILITIES
////////////////////////

var displayed_nodes = [];

/**
 * Initialize isDisplayed value of each node. Default to false,
 * @param d
 */
function setNodeDislay(d, val) {
    if (!val) d.isDisplayed = false;
    else d.isDisplayed = val;
}

//This function looks up whether a pair are neighbours
function markAncestorsTrue(d) {
    d.isDisplayed = true;
    displayed_nodes.push(d);
    if (d.parent_node) markAncestorsTrue(d.parent_node);
}

function markNodesFalse() {
    for (var node of displayed_nodes) node.isDisplayed = false;
    displayed_nodes = [];
}

function toggleConnectedParents() {

    if (toggle == 0) {
        // Toggle all ancestors as true
        d = d3.select(this).node().__data__;
        markAncestorsTrue(d);

        // Turn on the nodes that are displayed
        node.style("opacity", function (o) {
            return o.isDisplayed ? TOGGLED_ALPHA : UNTOGGLED_ALPHA;
        });

        console.log(node.text);

        // Turn on the nodes that are displayed
        link.style("opacity", function (o) {
            return o.target.isDisplayed ? TOGGLED_ALPHA : UNTOGGLED_ALPHA;
        });

        //Reduce the op
        toggle = true;

    } else {

        // Clean all marked nodes
        markNodesFalse();

        //Put them back to opacity=1
        node.style("opacity", 1);
        link.style("opacity", 1);
        toggle = false;
    }
}

// Toggle children on click.
function click(d) {
    if (d3.event.defaultPrevented) return; // ignore drag
    if (d.children) {
        d._children = d.children;
        d.children = null;
    } else {
        d.children = d._children;
        d._children = null;
    }
    update();
}

///////////////////
// HELPER FUNCTIONS
///////////////////

// ATTRIBUTE HELPERS
// These functions help with assign specific value such as node size, text size to a node

function titleTextSize(d) {
    var textSize = Math.sqrt(d.strength) * TEXT_RATIO > TEXT_SIZE_MIN ? Math.sqrt(d.strength) * TEXT_RATIO : TEXT_SIZE_MIN;
    return (d.strength > CAP_TITLE) || !d.parent_node ? textSize + CAP_ADDED_BASE : textSize;
}

function strengthTextSize(d) {
    var strengthSize = Math.sqrt(d.strength) * STRENGTH_TEXT_RATIO > TEXT_SIZE_MIN ? Math.sqrt(d.strength) * STRENGTH_TEXT_RATIO : TEXT_SIZE_MIN;
    return d.strength > CAP_TITLE || !d.parent_node ? strengthSize + CAP_ADDED_BASE : strengthSize;
}

function titleTextOffset(d) {
    var textSize = titleTextSize(d);
    return Math.sqrt(d.strength) * TEXT_OFFSET_RATIO + textSize;
}

function strengthTextOffset(d) {
    var textSize = titleTextSize(d);
    var strengthSize = strengthTextSize(d);
    return Math.sqrt(d.strength) * TEXT_OFFSET_RATIO + strengthSize + textSize;
}

function titleTextOpacity(d) {
    var notCapTitleOpac = (d.isDisplayed) ? UNDERCAP_TOGGLED_ALPHA : UNDERCAP_ALPHA;
    return d.strength > CAP_TITLE || !d.parent_node ? CAP_ALPHA : notCapTitleOpac;
}

function strengthTextOpacity(d) {
    var notCapTitleOpac = (d.isDisplayed) ? UNDERCAP_STRENGTH_TOGGLED_ALPHA : UNDERCAP_STRENGTH_ALPHA;
    return d.strength > CAP_TITLE || !d.parent_node ? CAP_STRENGTH_ALPHA : notCapTitleOpac;
}

function nodeCharge(d) {
    return -d.strength * CHARGE_RATIO - BASE_CHARGE;
}

function linkDistance(d) {
    switch (d.type) {
        case "Hierarchy":
            return (Math.sqrt(d.source.strength) + Math.sqrt(d.target.strength)) * LINK_RATIO_HIERARCHY;
        case "Ally":
            return (Math.sqrt(d.source.strength) + Math.sqrt(d.target.strength)) * LINK_RATIO_ALLY;
        case "Enemy":
            return (Math.sqrt(d.source.strength) + Math.sqrt(d.target.strength)) * LINK_RATIO_ENEMY;
    }
}

function linkWidth(d) {
    return d.type == "Hierarchy" ? LINK_SIZE_HIERARCHY : LINK_SIZE_RELATIONSHIP;
}

function linkColor(d) {
    return d.type == "Hierarchy" ? COLOR_DICT[d.source.color_id] : LINK_COLOR_DICT[d.type]
}

// REDISTRIBUTION HELPERS
// These functions help with assigning relationship between node for other convenient functions

/**
 * Recursively set parent to the node.
 * @param node
 */
function setParentNode(node) {
    if (!node.children) return;
    for (var child of node.children) {
        child.parent_node = node;
        setParentNode(child);
    }
}

function setLinkType(links, type) {
    for (var link of links) {
        link.type = type;
    }
}

//////////////
// SET UP CODE
//////////////

var width = 1800,
    height = 1800,
    root;

var force = d3.layout.force()
    .size([width, height])
    .on("tick", tick);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

var link = svg.selectAll(".link"),
    node = svg.selectAll(".node");

force
    .charge(nodeCharge)
    .linkDistance(linkDistance);

toggle = false;

// READ IN CONTENT FROM THE JSON FILE

var nodes = [],
    links = [],
    nodesDict = {},
    linkedByIndex = {},
    hierarchyLinks;
d3.json("graph.json", function(error, json) {
    if (error) throw error;
    root = json;
    tree = root.tree;

    // CONSTRUCT NODES:
    // In this section we will construct nodes as a hierarchy. The "tree" attributes of root should have enough
    // information to create all hierarchy
    // Read in data
    for (var obj of tree) {

        // Add nodes and links to the big lists
        var objNodes = flatten(obj);
        var objLinks = d3.layout.tree().links(objNodes);
        nodes = nodes.concat(objNodes);
        links = links.concat(objLinks);

        // Store the connection information to the dictionary
        for (i = 0; i < objNodes.length; i++) {
            linkedByIndex[String(objNodes[i].id) + "," + String(objNodes[i].id)] = 1;
        };
        objLinks.forEach(function (d) {
            linkedByIndex[String(d.source.id) + "," + String(d.target.id)] = 1;
        });
    }

    // Set node parent relationship (for interactive purpose)
    for (var node of nodes) {
        setNodeDislay(node);
        setParentNode(node);
    }

    // Set all current links to hierarchical links
    setLinkType(links, "Hierarchy")
    hierarchyLinks = links.slice();

    // Create a dictionary to look up nodes by ID. This will useful for constructing relationships later
    for (var node of nodes) {
        nodesDict[node.id] = node;
    }

    // Update the vis after having new data
    update();
});

function update() {
    // Restart the force layout.
    force
        .nodes(nodes)
        .links(hierarchyLinks)
        .start();

    // Update the links…
    link = link.data(links, function(d) { return d.target.id; });

    // Exit any old links.
    link.exit().remove();

    // Enter any new links.
    link.enter().insert("line", ".node")
        .attr("class", "link")
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; })
        .style("stroke", linkColor)
        .style("stroke-width", linkWidth);

    // Update the nodes…
    node = node.data(nodes, function(d) { return d.id; }).style("fill", color);

    // Exit any old nodes.
    node.exit().remove();

    var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; })
        .attr("r", function(d) { return Math.sqrt(d.strength) * SIZE_RATIO; })
        .style("fill", color)
        .style("stroke", function(d) { return COLOR_DICT[d.color_id];})
        .call(force.drag)

    nodeEnter.append("circle")
        .attr("r", function(d) { return Math.sqrt(d.strength) * SIZE_RATIO; })

    nodeEnter.transition()
        .attr("r", function(d) { return d.children ? 4.5 : Math.sqrt(d.size) ; });

    nodeEnter.append("text")
        .attr("class", "title_text")
        .attr("dy", titleTextOffset)
        .text(function(d) { return d.name.toUpperCase();;})
        .style("font-size", titleTextSize)
        .style("opacity", titleTextOpacity);


    nodeEnter.append("text")
        .attr("class", "strength_text")
        .attr("dy", strengthTextOffset)
        .text(function(d) { return d.strength; })
        .style("font-size", strengthTextSize)
        .style("opacity", strengthTextOpacity)

    nodeEnter
        .on('mouseover', toggleConnectedParents)
        .on('mouseout', toggleConnectedParents);
}

function tick() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    node.each(collide(0.5)); //Added
}

// Color leaf nodes orange, and packages white or blue.
function color(d) {
    return d._children ? COLOR_DICT[d.color_id] : d.children ? "#091213" : COLOR_DICT[d.color_id];
}

// Returns a list of all nodes under the root.
function flatten(root) {
    var nodes = [], i = 0;

    function recurse(node) {
        if (node.children) node.children.forEach(recurse);
        if (!node.id) node.id = ++i;
        nodes.push(node);
    }

    recurse(root);
    return nodes;
}