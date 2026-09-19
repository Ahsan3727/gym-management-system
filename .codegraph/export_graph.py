import sqlite3
import json
import os
from pathlib import Path

WORKSPACE = Path(r"c:\Users\Welcome\Desktop\MyProjects\gym-management-system")
DB_PATH = WORKSPACE / ".codegraph" / "graph.db"
OUT_DIR = WORKSPACE / ".codegraph"

def export_codegraph():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    # Fetch entities
    c.execute("""
        SELECT id, type, name, qualified_name, file_path, start_line, end_line, community_id, signature, docstring
        FROM entities
    """)
    entities = [dict(row) for row in c.fetchall()]

    # Fetch relations
    c.execute("""
        SELECT id, source_id, target_id, type, weight
        FROM relations
    """)
    relations = [dict(row) for row in c.fetchall()]

    # Fetch communities
    c.execute("""
        SELECT id, level, name, summary, member_count
        FROM communities
    """)
    communities = [dict(row) for row in c.fetchall()]

    # Clean file paths to be relative to workspace
    for e in entities:
        if e['file_path']:
            try:
                rel = os.path.relpath(e['file_path'], str(WORKSPACE))
                e['rel_path'] = rel.replace('\\', '/')
            except Exception:
                e['rel_path'] = e['file_path']
        else:
            e['rel_path'] = ""

    # Generate graph.json
    graph_data = {
        "project": "gym-management-system",
        "entity_count": len(entities),
        "relation_count": len(relations),
        "community_count": len(communities),
        "entities": entities,
        "relations": relations,
        "communities": communities
    }
    with open(OUT_DIR / "graph.json", "w", encoding="utf-8") as f:
        json.dump(graph_data, f, indent=2)
    print(f"Exported {len(entities)} entities and {len(relations)} relations to graph.json")

    # Generate CODEGRAPH_REPORT.md
    comm_members = {}
    for e in entities:
        cid = e.get('community_id') or 0
        comm_members.setdefault(cid, []).append(e)

    # Calculate degrees
    in_deg = {}
    out_deg = {}
    for r in relations:
        s = r['source_id']
        t = r['target_id']
        out_deg[s] = out_deg.get(s, 0) + 1
        in_deg[t] = in_deg.get(t, 0) + 1

    report_lines = [
        "# CodeGraph Architecture & Network Report",
        "",
        f"**Repository:** `gym-management-system`  ",
        f"**Generated via:** `codegraph-mcp-server` (Tree-sitter AST & Louvain Community Detection)  ",
        f"**Total Entities:** {len(entities)} (Functions: {sum(1 for e in entities if e['type'] == 'function')}, Modules: {sum(1 for e in entities if e['type'] == 'module')}, Classes: {sum(1 for e in entities if e['type'] == 'class')})  ",
        f"**Total Relations:** {len(relations)} (Calls: {sum(1 for r in relations if r['type'] == 'calls')}, Imports: {sum(1 for r in relations if r['type'] == 'imports')}, Contains: {sum(1 for r in relations if r['type'] == 'contains')})  ",
        f"**Communities:** {len(communities)}  ",
        "",
        "---",
        "",
        "## Top 15 Architectural Hubs (Highest Connectivity)",
        "",
        "| Entity Name | Type | File Path | Total Degree (Calls + Imports) |",
        "| :--- | :--- | :--- | :--- |"
    ]

    # Sort entities by total degree
    top_entities = sorted(entities, key=lambda e: in_deg.get(e['id'], 0) + out_deg.get(e['id'], 0), reverse=True)[:15]
    for te in top_entities:
        deg = in_deg.get(te['id'], 0) + out_deg.get(te['id'], 0)
        report_lines.append(f"| `{te['name']}` | `{te['type']}` | `{te['rel_path']}` | **{deg}** |")

    report_lines.extend([
        "",
        "---",
        "",
        "## Top Communities (Louvain Clusters)",
        ""
    ])

    sorted_comms = sorted(comm_members.items(), key=lambda x: len(x[1]), reverse=True)
    for cid, members in sorted_comms[:10]:
        mod_names = sorted(list(set(m['rel_path'] for m in members if m['rel_path'])))
        report_lines.append(f"### Community {cid} ({len(members)} entities across {len(mod_names)} files)")
        report_lines.append("Key files:")
        for mf in mod_names[:8]:
            report_lines.append(f"- `{mf}`")
        if len(mod_names) > 8:
            report_lines.append(f"- *... and {len(mod_names) - 8} more files*")
        report_lines.append("")

    with open(OUT_DIR / "CODEGRAPH_REPORT.md", "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))
    print(f"Generated CODEGRAPH_REPORT.md")

    # Generate standalone graph.html
    # To keep the visual fast and responsive, we focus on modules and top function nodes
    # Color palette for communities
    colors = [
        "#4F46E5", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", 
        "#8B5CF6", "#EC4899", "#14B8A6", "#F97316", "#6366F1",
        "#84CC16", "#E11D48", "#0EA5E9", "#D946EF", "#22C55E"
    ]

    vis_nodes = []
    entity_map = {e['id']: e for e in entities}

    for e in entities:
        cid = e.get('community_id') or 0
        color = colors[cid % len(colors)]
        is_mod = e['type'] == 'module'
        vis_nodes.append({
            "id": e['id'],
            "label": e['name'],
            "title": f"<b>{e['name']}</b><br>Type: {e['type']}<br>File: {e['rel_path']}<br>Community: {cid}",
            "group": str(cid),
            "value": 15 if is_mod else (5 + min(in_deg.get(e['id'], 0), 15)),
            "color": color if is_mod else "#94A3B8",
            "shape": "diamond" if is_mod else "dot",
            "type": e['type'],
            "file": e['rel_path'],
            "community": cid
        })

    vis_edges = []
    # Include calls and imports (skip pure contains to avoid cluttering view)
    for r in relations:
        if r['type'] in ['calls', 'imports']:
            vis_edges.append({
                "from": r['source_id'],
                "to": r['target_id'],
                "title": r['type'],
                "arrows": "to",
                "color": {"color": "#6366F1" if r['type'] == 'calls' else "#10B981", "opacity": 0.4},
                "type": r['type']
            })

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CodeGraph Interactive Visualizer - Gym Management System</title>
  <script type="text/javascript" src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      overflow: hidden;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }}
    header {{
      background: #1e293b;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #334155;
      z-index: 10;
    }}
    .brand {{
      display: flex;
      align-items: center;
      gap: 12px;
    }}
    .brand h1 {{
      font-size: 18px;
      font-weight: 700;
      color: #38bdf8;
    }}
    .stats-badge {{
      background: #0f172a;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 12px;
      color: #94a3b8;
      border: 1px solid #334155;
    }}
    .controls {{
      display: flex;
      gap: 12px;
      align-items: center;
    }}
    input, select {{
      background: #0f172a;
      border: 1px solid #334155;
      color: #f8fafc;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 13px;
      outline: none;
    }}
    input:focus, select:focus {{
      border-color: #38bdf8;
    }}
    .btn {{
      background: #2563eb;
      color: white;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      font-weight: 500;
    }}
    .btn:hover {{ background: #1d4ed8; }}
    #container {{
      flex: 1;
      position: relative;
    }}
    #network {{
      width: 100%;
      height: 100%;
    }}
    #sidebar {{
      position: absolute;
      right: 20px;
      top: 20px;
      width: 320px;
      background: rgba(30, 41, 59, 0.95);
      backdrop-filter: blur(8px);
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 18px;
      display: none;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
      z-index: 20;
    }}
    #sidebar h3 {{
      font-size: 16px;
      color: #38bdf8;
      margin-bottom: 8px;
      word-break: break-all;
    }}
    #sidebar p {{
      font-size: 13px;
      color: #cbd5e1;
      margin-bottom: 6px;
    }}
    .tag {{
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 8px;
    }}
    .tag-module {{ background: #3b82f6; color: white; }}
    .tag-function {{ background: #10b981; color: white; }}
    .legend {{
      position: absolute;
      left: 20px;
      bottom: 20px;
      background: rgba(30, 41, 59, 0.9);
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 12px;
      z-index: 10;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }}
    .legend-item {{
      display: flex;
      align-items: center;
      gap: 8px;
    }}
    .dot {{
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }}
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <h1>CodeGraph Explorer</h1>
      <span class="stats-badge">{len(entities)} Entities</span>
      <span class="stats-badge">{len(relations)} Relations</span>
      <span class="stats-badge">{len(communities)} Communities</span>
    </div>
    <div class="controls">
      <input type="text" id="searchInput" placeholder="Search function or module..." onkeyup="filterGraph()">
      <select id="typeFilter" onchange="filterGraph()">
        <option value="all">All Types</option>
        <option value="module">Modules (Files)</option>
        <option value="function">Functions</option>
      </select>
      <button class="btn" onclick="network.fit()">Reset View</button>
    </div>
  </header>

  <div id="container">
    <div id="network"></div>
    <div id="sidebar">
      <button onclick="document.getElementById('sidebar').style.display='none'" style="float:right;background:transparent;border:none;color:#94a3b8;cursor:pointer;font-size:16px;">✕</button>
      <span id="sideType" class="tag tag-module">Module</span>
      <h3 id="sideName">Entity Name</h3>
      <p><strong>Path:</strong> <span id="sideFile"></span></p>
      <p><strong>Community:</strong> <span id="sideComm"></span></p>
      <p id="sideSig" style="font-family:monospace;font-size:12px;background:#0f172a;padding:6px;border-radius:4px;margin-top:8px;"></p>
    </div>
    <div class="legend">
      <div class="legend-item"><span class="dot" style="background:#38bdf8;"></span> Diamond = Module / File</div>
      <div class="legend-item"><span class="dot" style="background:#94a3b8;"></span> Dot = Function</div>
      <div class="legend-item"><span class="dot" style="background:#6366F1;"></span> Purple Link = Call</div>
      <div class="legend-item"><span class="dot" style="background:#10B981;"></span> Green Link = Import</div>
    </div>
  </div>

  <script>
    const allNodes = {json.dumps(vis_nodes)};
    const allEdges = {json.dumps(vis_edges)};

    const nodesDataSet = new vis.DataSet(allNodes);
    const edgesDataSet = new vis.DataSet(allEdges);

    const container = document.getElementById('network');
    const data = {{ nodes: nodesDataSet, edges: edgesDataSet }};
    const options = {{
      nodes: {{
        scaling: {{ min: 8, max: 28 }},
        font: {{ color: '#f8fafc', size: 12, strokeWidth: 2, strokeColor: '#0f172a' }}
      }},
      edges: {{
        smooth: {{ type: 'continuous' }}
      }},
      physics: {{
        stabilization: {{ iterations: 150 }},
        barnesHut: {{
          gravitationalConstant: -3500,
          springLength: 95,
          springConstant: 0.04
        }}
      }},
      interaction: {{
        hover: true,
        tooltipDelay: 100
      }}
    }};

    const network = new vis.Network(container, data, options);

    network.on("click", function(params) {{
      if (params.nodes.length > 0) {{
        const nodeId = params.nodes[0];
        const node = allNodes.find(n => n.id === nodeId);
        if (node) {{
          document.getElementById('sidebar').style.display = 'block';
          document.getElementById('sideName').innerText = node.label;
          document.getElementById('sideFile').innerText = node.file;
          document.getElementById('sideComm').innerText = 'Community #' + node.community;
          const typeSpan = document.getElementById('sideType');
          typeSpan.innerText = node.type;
          typeSpan.className = 'tag ' + (node.type === 'module' ? 'tag-module' : 'tag-function');
        }}
      }}
    }});

    function filterGraph() {{
      const query = document.getElementById('searchInput').value.toLowerCase();
      const type = document.getElementById('typeFilter').value;

      const filteredNodes = allNodes.filter(n => {{
        const matchesQuery = n.label.toLowerCase().includes(query) || n.file.toLowerCase().includes(query);
        const matchesType = (type === 'all') || (n.type === type);
        return matchesQuery && matchesType;
      }});

      nodesDataSet.clear();
      nodesDataSet.add(filteredNodes);
    }}
  </script>
</body>
</html>
"""
    with open(OUT_DIR / "graph.html", "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Generated standalone visual interactive graph.html")

if __name__ == "__main__":
    export_codegraph()
