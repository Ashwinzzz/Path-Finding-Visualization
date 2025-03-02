#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <float.h>

#define MAX_NODES 100
#define MAX_NAME_LENGTH 10
#define MAX_EDGES 100

// Node structure
typedef struct {
    char name[MAX_NAME_LENGTH];
    double x, y;
} Node;

// Edge structure
typedef struct {
    char from[MAX_NAME_LENGTH];
    char to[MAX_NAME_LENGTH];
    double cost;
} Edge;

// Graph structure
typedef struct {
    Node nodes[MAX_NODES];
    int node_count;
    // Adjacency list using arrays
    char adj_nodes[MAX_NODES][MAX_NODES][MAX_NAME_LENGTH];
    double adj_costs[MAX_NODES][MAX_NODES];
    int adj_counts[MAX_NODES];
} Graph;

// Priority Queue element
typedef struct {
    char name[MAX_NAME_LENGTH];
    double priority;
} PQElement;

// Priority Queue
typedef struct {
    PQElement* elements;
    int size;
    int capacity;
} PriorityQueue;

// Function prototypes
void init_graph(Graph* g);
void add_node(Graph* g, const char* name, double x, double y);
void add_edge(Graph* g, const char* from, const char* to, double cost);
double heuristic(Graph* g, const char* a, const char* b);
int find_node_index(Graph* g, const char* name);
PriorityQueue* create_priority_queue(int capacity);
void push_priority_queue(PriorityQueue* pq, const char* name, double priority);
PQElement pop_priority_queue(PriorityQueue* pq);
void swap_elements(PQElement* a, PQElement* b);
void heapify_down(PriorityQueue* pq, int idx);

// Initialize graph
void init_graph(Graph* g) {
    g->node_count = 0;
    for (int i = 0; i < MAX_NODES; i++) {
        g->adj_counts[i] = 0;
    }
}

// Add node to graph
void add_node(Graph* g, const char* name, double x, double y) {
    strcpy(g->nodes[g->node_count].name, name);
    g->nodes[g->node_count].x = x;
    g->nodes[g->node_count].y = y;
    g->node_count++;
}

// Find node index by name
int find_node_index(Graph* g, const char* name) {
    for (int i = 0; i < g->node_count; i++) {
        if (strcmp(g->nodes[i].name, name) == 0) {
            return i;
        }
    }
    return -1;
}

// Add edge to graph
void add_edge(Graph* g, const char* from, const char* to, double cost) {
    int from_idx = find_node_index(g, from);
    int to_idx = find_node_index(g, to);
    
    // Add edge in both directions (undirected graph)
    strcpy(g->adj_nodes[from_idx][g->adj_counts[from_idx]], to);
    g->adj_costs[from_idx][g->adj_counts[from_idx]] = cost;
    g->adj_counts[from_idx]++;
    
    strcpy(g->adj_nodes[to_idx][g->adj_counts[to_idx]], from);
    g->adj_costs[to_idx][g->adj_counts[to_idx]] = cost;
    g->adj_counts[to_idx]++;
}

// Calculate heuristic distance
double heuristic(Graph* g, const char* a, const char* b) {
    int a_idx = find_node_index(g, a);
    int b_idx = find_node_index(g, b);
    return sqrt(pow(g->nodes[a_idx].x - g->nodes[b_idx].x, 2) + 
               pow(g->nodes[a_idx].y - g->nodes[b_idx].y, 2));
}

// Priority Queue functions
PriorityQueue* create_priority_queue(int capacity) {
    PriorityQueue* pq = (PriorityQueue*)malloc(sizeof(PriorityQueue));
    pq->elements = (PQElement*)malloc(sizeof(PQElement) * capacity);
    pq->size = 0;
    pq->capacity = capacity;
    return pq;
}

void swap_elements(PQElement* a, PQElement* b) {
    PQElement temp = *a;
    *a = *b;
    *b = temp;
}

void heapify_down(PriorityQueue* pq, int idx) {
    int smallest = idx;
    int left = 2 * idx + 1;
    int right = 2 * idx + 2;

    if (left < pq->size && pq->elements[left].priority < pq->elements[smallest].priority)
        smallest = left;

    if (right < pq->size && pq->elements[right].priority < pq->elements[smallest].priority)
        smallest = right;

    if (smallest != idx) {
        swap_elements(&pq->elements[idx], &pq->elements[smallest]);
        heapify_down(pq, smallest);
    }
}

void push_priority_queue(PriorityQueue* pq, const char* name, double priority) {
    if (pq->size == pq->capacity) return;

    int i = pq->size;
    pq->size++;

    strcpy(pq->elements[i].name, name);
    pq->elements[i].priority = priority;

    while (i > 0 && pq->elements[(i - 1) / 2].priority > pq->elements[i].priority) {
        swap_elements(&pq->elements[i], &pq->elements[(i - 1) / 2]);
        i = (i - 1) / 2;
    }
}

PQElement pop_priority_queue(PriorityQueue* pq) {
    PQElement root = pq->elements[0];
    pq->elements[0] = pq->elements[pq->size - 1];
    pq->size--;
    heapify_down(pq, 0);
    return root;
}

// A* algorithm implementation
char** a_star(Graph* g, const char* start, const char* goal, double* weather_impact, int* path_length) {
    printf("Entering A* function\n");  // Debug print
    
    PriorityQueue* open_set = create_priority_queue(MAX_NODES);
    if (!open_set) {
        printf("Failed to create priority queue\n");
        return NULL;
    }
    
    double g_score[MAX_NODES];
    double f_score[MAX_NODES];
    char* came_from[MAX_NODES];
    char** path = (char**)malloc(sizeof(char*) * MAX_NODES);
    if (!path) {
        printf("Failed to allocate path array\n");
        free(open_set->elements);
        free(open_set);
        return NULL;
    }
    
    printf("Initializing arrays\n");  // Debug print
    
    for (int i = 0; i < g->node_count; i++) {
        g_score[i] = DBL_MAX;
        f_score[i] = DBL_MAX;
        came_from[i] = NULL;
        path[i] = (char*)malloc(MAX_NAME_LENGTH);
        if (!path[i]) {
            printf("Failed to allocate path[%d]\n", i);
            // Clean up previously allocated memory
            for (int j = 0; j < i; j++) {
                free(path[j]);
            }
            free(path);
            free(open_set->elements);
            free(open_set);
            return NULL;
        }
    }
    
    int start_idx = find_node_index(g, start);
    printf("Start index: %d\n", start_idx);  // Debug print
    
    g_score[start_idx] = 0;
    f_score[start_idx] = heuristic(g, start, goal);
    push_priority_queue(open_set, start, f_score[start_idx]);
    
    printf("Starting main loop\n");  // Debug print
    
    while (open_set->size > 0) {
        PQElement current = pop_priority_queue(open_set);
        printf("Examining node: %s\n", current.name);  // Debug print
        
        if (strcmp(current.name, goal) == 0) {
            printf("Goal found! Reconstructing path...\n");  // Debug print
            
            // Reconstruct path
            *path_length = 0;
            const char* current_node = goal;
            while (current_node != NULL) {
                strcpy(path[*path_length], current_node);
                (*path_length)++;
                int curr_idx = find_node_index(g, current_node);
                current_node = came_from[curr_idx];
            }
            
            // Reverse path
            for (int i = 0; i < *path_length / 2; i++) {
                char temp[MAX_NAME_LENGTH];
                strcpy(temp, path[i]);
                strcpy(path[i], path[*path_length - 1 - i]);
                strcpy(path[*path_length - 1 - i], temp);
            }
            
            printf("Path reconstruction complete\n");  // Debug print
            free(open_set->elements);
            free(open_set);
            return path;
        }
        
        int current_idx = find_node_index(g, current.name);
        for (int i = 0; i < g->adj_counts[current_idx]; i++) {
            char* neighbor = g->adj_nodes[current_idx][i];
            int neighbor_idx = find_node_index(g, neighbor);
            double edge_cost = g->adj_costs[current_idx][i] + weather_impact[neighbor_idx];
            double tentative_g_score = g_score[current_idx] + edge_cost;
            
            if (tentative_g_score < g_score[neighbor_idx]) {
                came_from[neighbor_idx] = strdup(current.name);  // Use strdup to create a new copy
                g_score[neighbor_idx] = tentative_g_score;
                f_score[neighbor_idx] = tentative_g_score + heuristic(g, neighbor, goal);
                push_priority_queue(open_set, neighbor, f_score[neighbor_idx]);
                printf("Updated neighbor: %s (cost: %.2f)\n", neighbor, f_score[neighbor_idx]);  // Debug print
            }
        }
    }
    
    printf("No path found\n");  // Debug print
    *path_length = 0;
    free(open_set->elements);
    free(open_set);
    return path;
}

int main() {
    Graph graph;
    init_graph(&graph);
    
    printf("Starting program...\n");
    
    // Add nodes (name, x-coordinate, y-coordinate)
    add_node(&graph, "A", 0, 0);
    add_node(&graph, "B", 2, 3);
    add_node(&graph, "C", 5, 1);
    add_node(&graph, "D", 7, 5);
    add_node(&graph, "E", 10, 2);
    
    printf("Nodes added successfully. Node count: %d\n", graph.node_count);
    
    // Verify nodes
    for (int i = 0; i < graph.node_count; i++) {
        printf("Node %d: %s at (%.1f, %.1f)\n", 
               i, graph.nodes[i].name, graph.nodes[i].x, graph.nodes[i].y);
    }
    
    // Add roads (edges)
    add_edge(&graph, "A", "B", 4);
    add_edge(&graph, "B", "C", 2);
    add_edge(&graph, "C", "D", 5);
    add_edge(&graph, "D", "E", 3);
    add_edge(&graph, "B", "D", 7);
    add_edge(&graph, "A", "C", 6);
    
    printf("Edges added successfully\n");
    
    // Verify edges
    for (int i = 0; i < graph.node_count; i++) {
        printf("Edges from %s: ", graph.nodes[i].name);
        for (int j = 0; j < graph.adj_counts[i]; j++) {
            printf("%s(%.1f) ", 
                   graph.adj_nodes[i][j], 
                   graph.adj_costs[i][j]);
        }
        printf("\n");
    }
    
    // Weather impact factor
    double weather_impact[MAX_NODES] = {0, 1, 3, 0.5, 2};
    printf("Weather impacts: ");
    for (int i = 0; i < graph.node_count; i++) {
        printf("%s(%.1f) ", graph.nodes[i].name, weather_impact[i]);
    }
    printf("\n");
    
    printf("Starting A* search from A to E...\n");
    
    // Find best route from A to E
    int path_length;
    char** path = a_star(&graph, "A", "E", weather_impact, &path_length);
    
    printf("A* search completed. Path length: %d\n", path_length);
    
    // Output the path
    if (path_length > 0) {
        printf("Optimal Path: ");
        for (int i = 0; i < path_length; i++) {
            printf("%s ", path[i]);
            if (i < path_length - 1) {
                // Print the cost between nodes
                int curr_idx = find_node_index(&graph, path[i]);
                int next_idx = find_node_index(&graph, path[i + 1]);
                double cost = 0;
                for (int j = 0; j < graph.adj_counts[curr_idx]; j++) {
                    if (strcmp(graph.adj_nodes[curr_idx][j], path[i + 1]) == 0) {
                        cost = graph.adj_costs[curr_idx][j];
                        break;
                    }
                }
                printf("-(%.1f)-> ", cost);
            }
        }
        printf("\n");
        
        // Calculate total cost
        double total_cost = 0;
        for (int i = 0; i < path_length - 1; i++) {
            int curr_idx = find_node_index(&graph, path[i]);
            int next_idx = find_node_index(&graph, path[i + 1]);
            for (int j = 0; j < graph.adj_counts[curr_idx]; j++) {
                if (strcmp(graph.adj_nodes[curr_idx][j], path[i + 1]) == 0) {
                    total_cost += graph.adj_costs[curr_idx][j];
                    total_cost += weather_impact[next_idx];
                    break;
                }
            }
        }
        printf("Total cost (including weather): %.1f\n", total_cost);
        
        // Free allocated memory
        for (int i = 0; i < MAX_NODES; i++) {
            free(path[i]);
        }
        free(path);
    } else {
        printf("No path found.\n");
    }
    
    printf("Program completed successfully.\n");
    return 0;
}
