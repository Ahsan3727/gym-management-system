---
name: codegraph
description: Use CodeGraph MCP to query code entities, analyze dependency relations, and perform GraphRAG semantic searches across the codebase.
---

# CodeGraph Skill

CodeGraph builds a local SQLite GraphRAG index (`.codegraph/graph.db`) using Tree-sitter AST parsing and Louvain community detection.

## Database Location
- SQLite database: [`.codegraph/graph.db`](file:///c:/Users/Welcome/Desktop/MyProjects/gym-management-system/.codegraph/graph.db)

## CLI Workflows

### 1. Incremental Re-index
To update the graph after code changes:
```powershell
codegraph-mcp index .
```

### 2. Querying Entities
To search for symbols, route handlers, or context across frontend and backend:
```powershell
codegraph-mcp query "<search_term>" --format text
```

### 3. Repository Stats & Metrics
```powershell
codegraph-mcp stats .
```

### 4. Community Detection (Louvain)
To view architectural clusters and module modularity:
```powershell
codegraph-mcp community .
```

## MCP Tools
When the CodeGraph MCP server is running (`codegraph-mcp serve --repo .`), it exposes tools for impact analysis, call-hierarchy tracing, and GraphRAG search directly into the conversation context.
