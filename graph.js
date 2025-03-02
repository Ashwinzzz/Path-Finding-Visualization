class Node {
    constructor(name, x, y) {
        this.name = name;
        this.x = x;
        this.y = y;
    }
}

class Graph {
    constructor() {
        this.nodes = new Map();
        this.edges = new Map();
    }

    addNode(name, x, y) {
        this.nodes.set(name, new Node(name, x, y));
        this.edges.set(name, new Map());
        this.updateNodeSelects();
        this.updateNodeTable();
    }

    removeNode(name) {
        // Remove all edges connected to this node
        this.edges.delete(name);
        for (const [_, edges] of this.edges) {
            edges.delete(name);
        }
        this.nodes.delete(name);
        weatherImpact.delete(name);
        this.updateNodeSelects();
        this.updateNodeTable();
        this.updateEdgeTable();
        drawGraph();
    }

    addEdge(from, to, cost) {
        this.edges.get(from).set(to, cost);
        this.edges.get(to).set(from, cost); // Undirected graph
        this.updateEdgeTable();
    }

    removeEdge(from, to) {
        this.edges.get(from).delete(to);
        this.edges.get(to).delete(from);
        this.updateEdgeTable();
        drawGraph();
    }

    getNeighbors(node) {
        return Array.from(this.edges.get(node).keys());
    }

    getCost(from, to) {
        return this.edges.get(from).get(to);
    }

    updateNodeSelects() {
        const nodeNames = Array.from(this.nodes.keys());
        ['fromNode', 'toNode', 'startNode', 'endNode'].forEach(selectId => {
            const select = document.getElementById(selectId);
            select.innerHTML = '';
            nodeNames.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                select.appendChild(option);
            });
        });
    }

    updateNodeTable() {
        const tbody = document.querySelector('#nodeTable tbody');
        tbody.innerHTML = '';
        for (const [name, node] of this.nodes) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${name}</td>
                <td>(${node.x}, ${node.y})</td>
                <td>${weatherImpact.get(name)}</td>
                <td><button class="delete-btn" onclick="graph.removeNode('${name}')">Delete</button></td>
            `;
            tbody.appendChild(tr);
        }
    }

    updateEdgeTable() {
        const tbody = document.querySelector('#edgeTable tbody');
        tbody.innerHTML = '';
        for (const [from, edges] of this.edges) {
            for (const [to, cost] of edges) {
                // Only show each edge once (since it's undirected)
                if (from < to) {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${from}</td>
                        <td>${to}</td>
                        <td>${cost}</td>
                        <td><button class="delete-btn" onclick="graph.removeEdge('${from}', '${to}')">Delete</button></td>
                    `;
                    tbody.appendChild(tr);
                }
            }
        }
    }
}

class PriorityQueue {
    constructor() {
        this.values = [];
    }

    enqueue(val, priority) {
        this.values.push({ val, priority });
        this.sort();
    }

    dequeue() {
        return this.values.shift();
    }

    sort() {
        this.values.sort((a, b) => a.priority - b.priority);
    }
}

// Initialize the graph
const graph = new Graph();
const weatherImpact = new Map();

// Add nodes
graph.addNode("A", 200, 150);
graph.addNode("B", 350, 250);
graph.addNode("C", 400, 100);
graph.addNode("D", 500, 300);
graph.addNode("E", 600, 150);

// Add edges
graph.addEdge("A", "B", 4);
graph.addEdge("B", "C", 2);
graph.addEdge("C", "D", 5);
graph.addEdge("D", "E", 3);
graph.addEdge("B", "D", 7);
graph.addEdge("A", "C", 6);

// Set weather impact
weatherImpact.set("A", 0);
weatherImpact.set("B", 1);
weatherImpact.set("C", 3);
weatherImpact.set("D", 0.5);
weatherImpact.set("E", 2);

function heuristic(a, b) {
    const nodeA = graph.nodes.get(a);
    const nodeB = graph.nodes.get(b);
    return Math.sqrt(
        Math.pow(nodeA.x - nodeB.x, 2) + 
        Math.pow(nodeA.y - nodeB.y, 2)
    ) / 50; // Scale down for better results
}

function aStar(start, goal) {
    const openSet = new PriorityQueue();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    gScore.set(start, 0);
    fScore.set(start, heuristic(start, goal));
    openSet.enqueue(start, fScore.get(start));

    while (openSet.values.length > 0) {
        const current = openSet.dequeue().val;

        if (current === goal) {
            const path = [];
            let curr = goal;
            while (curr) {
                path.unshift(curr);
                curr = cameFrom.get(curr);
            }
            return path;
        }

        for (const neighbor of graph.getNeighbors(current)) {
            const tentativeGScore = gScore.get(current) + 
                                  graph.getCost(current, neighbor) + 
                                  weatherImpact.get(neighbor);

            if (!gScore.has(neighbor) || tentativeGScore < gScore.get(neighbor)) {
                cameFrom.set(neighbor, current);
                gScore.set(neighbor, tentativeGScore);
                fScore.set(neighbor, tentativeGScore + heuristic(neighbor, goal));
                openSet.enqueue(neighbor, fScore.get(neighbor));
            }
        }
    }
    return null;
}

function drawGraph() {
    const canvas = document.getElementById('graphCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges with costs
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    for (const [from, edges] of graph.edges) {
        const fromNode = graph.nodes.get(from);
        for (const [to, cost] of edges) {
            const toNode = graph.nodes.get(to);
            ctx.beginPath();
            ctx.moveTo(fromNode.x, fromNode.y);
            ctx.lineTo(toNode.x, toNode.y);
            ctx.stroke();

            // Draw edge cost
            const midX = (fromNode.x + toNode.x) / 2;
            const midY = (fromNode.y + toNode.y) / 2;
            ctx.fillStyle = '#666';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${cost}`, midX, midY - 10);
        }
    }

    // Draw nodes with weather impact
    for (const [name, node] of graph.nodes) {
        // Node circle
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 25, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // Node name
        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name, node.x, node.y);

        // Weather impact
        ctx.font = '12px Arial';
        ctx.fillText(`+${weatherImpact.get(name)}`, node.x, node.y + 20);
    }
}

function drawPath(path) {
    const canvas = document.getElementById('graphCanvas');
    const ctx = canvas.getContext('2d');

    if (!path) return;

    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 3;
    
    for (let i = 0; i < path.length - 1; i++) {
        const fromNode = graph.nodes.get(path[i]);
        const toNode = graph.nodes.get(path[i + 1]);
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();
    }
}

function findPath() {
    const startNode = document.getElementById('startNode').value;
    const endNode = document.getElementById('endNode').value;

    if (!startNode || !endNode) {
        alert('Please select both start and goal nodes');
        return;
    }

    if (startNode === endNode) {
        document.getElementById('output').innerHTML = `
            <strong>Start and goal nodes are the same!</strong><br>
            Distance: 0<br>
            Weather Impact: ${weatherImpact.get(startNode)}
        `;
        drawGraph();
        return;
    }

    const path = aStar(startNode, endNode);
    
    if (!path) {
        document.getElementById('output').innerHTML = `
            <div class="no-path">
                No path found between ${startNode} and ${endNode}!
            </div>
        `;
        drawGraph();
        return;
    }

    // Calculate detailed path information
    let totalDistance = 0;
    let totalWeather = 0;
    let pathDetails = [];

    for (let i = 0; i < path.length - 1; i++) {
        const current = path[i];
        const next = path[i + 1];
        const distance = graph.getCost(current, next);
        const weather = weatherImpact.get(next);
        
        totalDistance += distance;
        totalWeather += weather;
        
        pathDetails.push(`
            <tr>
                <td>${current} → ${next}</td>
                <td>${distance}</td>
                <td>${weather}</td>
                <td>${(distance + weather).toFixed(1)}</td>
            </tr>
        `);
    }

    // Display detailed results
    document.getElementById('output').innerHTML = `
        <strong>Path Found:</strong> ${path.join(' → ')}<br><br>
        <strong>Detailed Breakdown:</strong>
        <table>
            <thead>
                <tr>
                    <th>Segment</th>
                    <th>Distance</th>
                    <th>Weather Impact</th>
                    <th>Total Cost</th>
                </tr>
            </thead>
            <tbody>
                ${pathDetails.join('')}
                <tr style="font-weight: bold">
                    <td>Total</td>
                    <td>${totalDistance}</td>
                    <td>${totalWeather}</td>
                    <td>${(totalDistance + totalWeather).toFixed(1)}</td>
                </tr>
            </tbody>
        </table>
    `;

    drawGraph();
    drawPath(path);
}

function addNewNode() {
    const name = document.getElementById('nodeName').value.toUpperCase();
    const x = parseInt(document.getElementById('nodeX').value);
    const y = parseInt(document.getElementById('nodeY').value);
    const weather = parseFloat(document.getElementById('weatherImpact').value);

    if (!name || isNaN(x) || isNaN(y) || isNaN(weather)) {
        alert('Please fill all node fields with valid values');
        return;
    }

    if (graph.nodes.has(name)) {
        alert('Node already exists');
        return;
    }

    graph.addNode(name, x, y);
    weatherImpact.set(name, weather);
    
    // Update the start/end node dropdowns
    updatePathFindingDropdowns();
    
    drawGraph();

    // Clear inputs
    document.getElementById('nodeName').value = '';
    document.getElementById('nodeX').value = '';
    document.getElementById('nodeY').value = '';
    document.getElementById('weatherImpact').value = '';
}

function addNewEdge() {
    const from = document.getElementById('fromNode').value;
    const to = document.getElementById('toNode').value;
    const cost = parseFloat(document.getElementById('edgeCost').value);

    if (from === to) {
        alert('Cannot create edge to same node');
        return;
    }

    if (isNaN(cost)) {
        alert('Please enter a valid edge cost');
        return;
    }

    graph.addEdge(from, to, cost);
    drawGraph();

    // Clear input
    document.getElementById('edgeCost').value = '';
}

function resetGraph() {
    graph.nodes.clear();
    graph.edges.clear();
    weatherImpact.clear();
    graph.updateNodeTable();
    graph.updateEdgeTable();
    graph.updateNodeSelects();
    document.getElementById('output').innerHTML = '';
    drawGraph();
}

// Add this helper function to validate if a path exists between nodes
function pathExists(start, end) {
    const visited = new Set();
    
    function dfs(node) {
        if (node === end) return true;
        visited.add(node);
        
        for (const neighbor of graph.getNeighbors(node)) {
            if (!visited.has(neighbor)) {
                if (dfs(neighbor)) return true;
            }
        }
        return false;
    }
    
    return dfs(start);
}

// Add this new function to update the pathfinding dropdowns
function updatePathFindingDropdowns() {
    const nodes = Array.from(graph.nodes.keys()).sort();
    const startSelect = document.getElementById('startNode');
    const endSelect = document.getElementById('endNode');
    
    // Save current selections
    const currentStart = startSelect.value;
    const currentEnd = endSelect.value;
    
    // Clear and update options
    startSelect.innerHTML = '';
    endSelect.innerHTML = '';
    
    nodes.forEach(node => {
        startSelect.add(new Option(node, node, false, node === currentStart));
        endSelect.add(new Option(node, node, false, node === currentEnd));
    });
}

// Initial draw
drawGraph(); 