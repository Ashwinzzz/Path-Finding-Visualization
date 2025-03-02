# Path Finding Visualization with Weather Impact

An interactive web-based visualization tool for pathfinding algorithms that considers weather conditions and their impact on path selection.

## Features

- **Interactive Graph Creation**
  - Add nodes with custom positions (X,Y coordinates)
  - Specify weather impact factors for each node
  - Create edges between nodes with custom costs
  - Visual representation on a canvas

- **Node Management**
  - Add nodes with unique identifiers
  - Define X,Y positions (0-800, 0-500 range)
  - Set weather impact values
  - View and delete existing nodes through a table interface

- **Edge Management**
  - Connect any two existing nodes
  - Specify edge costs
  - View and delete existing edges through a table interface

- **Pathfinding**
  - Find optimal paths between any two nodes
  - Considers both edge costs and weather impacts
  - Visual representation of the calculated path
  - Reset functionality to clear the graph

## Technical Details

- **Frontend Technologies**
  - HTML5
  - CSS3
  - JavaScript
  - Canvas API for visualization

- **UI Components**
  - Responsive design
  - Grid-based layout
  - Interactive forms and tables
  - Real-time visualization

## Usage

1. **Adding Nodes**
   - Enter a single character node name
   - Specify X position (0-800)
   - Specify Y position (0-500)
   - Set weather impact factor
   - Click "Add Node"

2. **Adding Edges**
   - Select starting node
   - Select ending node
   - Enter edge cost
   - Click "Add Edge"

3. **Finding Paths**
   - Select start node
   - Select goal node
   - Click "Find Optimal Path"
   - View results in the output section

4. **Reset**
   - Use the "Reset Graph" button to clear all nodes and edges

## Styling

The interface features a clean, modern design with:
- Soft color scheme based on #2c3e50
- Responsive card-based layout
- Interactive buttons and controls
- Clear visual hierarchy
- Shadow effects for depth
- Consistent spacing and padding

## Browser Compatibility

The visualization requires a modern web browser with support for:
- HTML5 Canvas
- CSS Grid
- Modern JavaScript

## File Structure

- `index.html` - Main application interface
- `graph.js` - Graph manipulation and pathfinding logic
- CSS styling is embedded in the HTML file

---

Feel free to contribute to this project by submitting issues or pull requests.