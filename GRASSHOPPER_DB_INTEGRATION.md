# Grasshopper ↔ Neo4j Integration via Swiftlet

This document covers how to push scripts **from Grasshopper into the graph DB**
and how to **reconstruct a script on the canvas** from a stored document, using
C# Script components and the [Swiftlet](https://www.food4rhino.com/en/app/swiftlet)
plugin for HTTP transport.

---

## Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│  Grasshopper Canvas                                                    │
│                                                                        │
│  ┌─────────────────┐   JSON payload   ┌──────────────────────────┐   │
│  │  C# Script      │ ───────────────► │  Swiftlet POST Request   │   │
│  │  (Serializer)   │                  │  POST /scripts            │   │
│  └─────────────────┘                  └──────────┬───────────────┘   │
│                                                   │  { docId }        │
│  ┌─────────────────┐   JSON response              │                   │
│  │  C# Script      │ ◄────────────────────────────┘                  │
│  │  (Reconstructor)│   Swiftlet GET /scripts/:id                     │
│  └─────────────────┘                                                  │
└────────────────────────────────────────────────────────────────────────┘
                        │                  ▲
              REST API  │                  │
                        ▼                  │
┌────────────────────────────────────────────────────────────────────────┐
│  backend-compute-gateway  (Node.js / Express)                         │
│  POST /scripts   GET /scripts/:id   GET /scripts/:id/ancestors/:comp  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │  Cypher
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│  Neo4j                                                                 │
│  (:GHDocument)-[:HAS_COMPONENT]->(:GHComponent)-[:WIRE]->(:GHComponent)│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Swiftlet setup

Install [Swiftlet](https://www.food4rhino.com/en/app/swiftlet) from Food4Rhino.
It adds these GH components (under *Params > Swiftlet*):

| Component | Use |
|---|---|
| `HTTP GET` | Fetch a document or list |
| `HTTP POST` | Push a new script |
| `HTTP DELETE` | Remove a script |
| `Deserialize JSON` | Parse response bodies |
| `Serialize Object` | Convert data tree → JSON string |

The gateway URL defaults to `http://localhost:4001`. Store it in a **Panel**
and wire it into every Swiftlet request component so it's easy to change.

---

## 2. Exporting a script to the database

### 2a. What the C# component needs to produce

The `POST /scripts` endpoint expects:

```json
{
  "name": "My Script",
  "description": "Optional description",
  "author": "Nicolas",
  "tags": ["parametric", "geometry"],
  "graph": {
    "nodes": [
      {
        "id": "slider_x",
        "guid": "57da07bd-ecab-415d-9d86-af36d7073abc",
        "nickname": "X",
        "x": 120.5,
        "y": 340.0,
        "properties": { "Min": -10.0, "Max": 10.0, "Value": 2.0 }
      }
    ],
    "links": [
      { "fromNode": "slider_x", "fromParam": "0", "toNode": "pt", "toParam": "X" }
    ]
  }
}
```

`nodes[].id` is a **local stable identifier** — use the component's
`InstanceGuid` (trimmed to the first 8 chars is fine for local uniqueness, or
use the full string).  `guid` is the **component type GUID** from the GH
component server; this is what drives "similar scripts" queries in Neo4j.

### 2b. C# Script component — Serializer

**Inputs:** `name` (string), `description` (string), `author` (string),
`tags` (string list)

**Output:** `json` (string) — ready to pass directly into Swiftlet POST body

```csharp
// References needed (right-click C# component → Manage Assemblies):
//   Grasshopper.dll  (already available in GH context)
//   Newtonsoft.Json  (ship with Rhino since v7)

using System;
using System.Collections.Generic;
using Grasshopper.Kernel;
using Grasshopper.Kernel.Types;
using Grasshopper.Kernel.Special;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

private void RunScript(string name, string description, string author,
                       List<string> tags, ref object json)
{
    var doc = Grasshopper.Instances.ActiveCanvas.Document;
    if (doc == null) { AddRuntimeMessage(GH_RuntimeMessageLevel.Error, "No active document"); return; }

    var nodes = new List<JObject>();
    var links = new List<JObject>();

    // ── collect nodes ──────────────────────────────────────────────────
    foreach (IGH_DocumentObject docObj in doc.Objects)
    {
        string localId   = docObj.InstanceGuid.ToString();
        string typeGuid  = docObj.ComponentGuid.ToString();
        string nickname  = docObj.NickName;
        float  px        = docObj.Attributes.Pivot.X;
        float  py        = docObj.Attributes.Pivot.Y;

        var node = new JObject {
            ["id"]       = localId,
            ["guid"]     = typeGuid,
            ["nickname"] = nickname,
            ["x"]        = px,
            ["y"]        = py,
        };

        // Capture properties for special component types
        if (docObj is GH_NumberSlider slider) {
            node["properties"] = new JObject {
                ["Min"]   = (double)slider.Slider.Minimum,
                ["Max"]   = (double)slider.Slider.Maximum,
                ["Value"] = (double)slider.CurrentValue,
            };
        }
        else if (docObj is GH_Panel panel) {
            node["properties"] = new JObject { ["Text"] = panel.UserText };
        }

        nodes.Add(node);
    }

    // ── collect wires ──────────────────────────────────────────────────
    // Walk every input param of every component and trace its sources.
    foreach (IGH_DocumentObject docObj in doc.Objects)
    {
        IEnumerable<IGH_Param> inputs = null;

        if (docObj is IGH_Component comp)
            inputs = comp.Params.Input;
        else if (docObj is IGH_Param p && p.Kind == GH_ParamKind.floating)
            inputs = new[] { p };

        if (inputs == null) continue;

        foreach (IGH_Param param in inputs)
        {
            foreach (IGH_Param source in param.Sources)
            {
                links.Add(new JObject {
                    ["fromNode"]  = source.Attributes.GetTopLevel.DocObject.InstanceGuid.ToString(),
                    ["fromParam"] = source.NickName,
                    ["toNode"]    = param.Attributes.GetTopLevel.DocObject.InstanceGuid.ToString(),
                    ["toParam"]   = param.NickName,
                });
            }
        }
    }

    // ── assemble payload ───────────────────────────────────────────────
    var payload = new JObject {
        ["name"]        = name,
        ["description"] = description ?? "",
        ["author"]      = author ?? "",
        ["tags"]        = tags != null ? new JArray(tags) : new JArray(),
        ["graph"]       = new JObject {
            ["nodes"] = new JArray(nodes),
            ["links"] = new JArray(links),
        },
    };

    json = payload.ToString(Formatting.None);
}
```

### 2c. Swiftlet wiring for export

```
[Panel: "http://localhost:4001/scripts"] ──► Swiftlet POST ◄── [C# Serializer output: json]
                                                │
                                                ▼
                                       [Panel: shows docId]
```

Set the POST component's `Content-Type` header input to `application/json`.
The response body will contain `{ "docId": "...", "componentCount": N, "wireCount": N }`.
Store the `docId` panel — you'll need it to reload the script.

---

## 3. Reconstructing a script from the database

### 3a. High-level approach

Reconstruction has three phases:

1. **Fetch** — Swiftlet GET `/scripts/:id` → JSON string
2. **Instantiate** — C# creates one `IGH_DocumentObject` per node using the
   stored type GUID, sets canvas position
3. **Wire** — C# calls `targetParam.AddSource(sourceParam)` for each link

> **Important:** Reconstruction adds components to the **currently open**
> document. Create a new blank GH file before running the reconstructor to
> avoid mixing with existing content.

### 3b. C# Script component — Reconstructor

**Input:** `json` (string) — the full response body from `GET /scripts/:id`

```csharp
using System;
using System.Collections.Generic;
using Grasshopper.Kernel;
using Grasshopper.Kernel.Types;
using Newtonsoft.Json.Linq;

private void RunScript(string json, ref object result)
{
    if (string.IsNullOrWhiteSpace(json)) return;

    var doc    = Grasshopper.Instances.ActiveCanvas.Document;
    var server = Grasshopper.Instances.ComponentServer;
    var data   = JObject.Parse(json);

    // Map localId → instantiated object (for wire pass)
    var instanceMap = new Dictionary<string, IGH_DocumentObject>();

    // ── Phase 1: instantiate components ───────────────────────────────
    foreach (var nodeToken in data["components"])
    {
        var node     = (JObject)nodeToken;
        string localId  = node["local_id"].ToString();
        string guidStr  = node["guid"].ToString();
        float  x        = node["position_x"].Value<float>();
        float  y        = node["position_y"].Value<float>();

        Guid typeGuid;
        if (!Guid.TryParse(guidStr, out typeGuid)) continue;

        var proxy = server.FindObject(typeGuid);
        if (proxy == null) {
            AddRuntimeMessage(GH_RuntimeMessageLevel.Warning,
                $"Component type not found: {guidStr} ({node["nickname"]})");
            continue;
        }

        var obj = proxy.CreateInstance();
        obj.NickName = node["nickname"].ToString();
        doc.AddObject(obj, false);
        obj.Attributes.Pivot = new System.Drawing.PointF(x, y);
        obj.Attributes.ExpireLayout();

        instanceMap[localId] = obj;

        // Restore special properties
        var props = node["properties_json"];
        if (props != null && props.Type != JTokenType.Null)
        {
            var p = JObject.Parse(props.ToString());
            if (obj is Grasshopper.Kernel.Special.GH_NumberSlider s)
            {
                if (p["Min"]   != null) s.Slider.Minimum = (decimal)p["Min"].Value<double>();
                if (p["Max"]   != null) s.Slider.Maximum = (decimal)p["Max"].Value<double>();
                if (p["Value"] != null) s.SetSliderValue  ((decimal)p["Value"].Value<double>());
            }
            else if (obj is Grasshopper.Kernel.Special.GH_Panel panel)
            {
                if (p["Text"] != null) panel.UserText = p["Text"].ToString();
            }
        }
    }

    // ── Phase 2: recreate wires ────────────────────────────────────────
    foreach (var linkToken in data["links"])
    {
        var link = (JObject)linkToken;
        string fromNode  = link["fromNode"].ToString();
        string fromParam = link["fromParam"].ToString();
        string toNode    = link["toNode"].ToString();
        string toParam   = link["toParam"].ToString();

        if (!instanceMap.ContainsKey(fromNode) || !instanceMap.ContainsKey(toNode)) continue;

        IGH_Param sourceParam = FindParam(instanceMap[fromNode], fromParam, output: true);
        IGH_Param targetParam = FindParam(instanceMap[toNode],   toParam,   output: false);

        if (sourceParam == null || targetParam == null) continue;

        targetParam.AddSource(sourceParam);
    }

    doc.NewSolution(false);
    result = $"Loaded {instanceMap.Count} components";
}

// Helper: find a named or indexed output/input param on a document object
private IGH_Param FindParam(IGH_DocumentObject obj, string nameOrIndex, bool output)
{
    IList<IGH_Param> list = null;

    if (obj is IGH_Component comp)
        list = output ? (IList<IGH_Param>)comp.Params.Output
                      : (IList<IGH_Param>)comp.Params.Input;
    else if (obj is IGH_Param p)
        return output ? p : p;   // standalone params are both source and target

    if (list == null) return null;

    // Try by NickName first, then by index
    foreach (var param in list)
        if (param.NickName == nameOrIndex) return param;

    if (int.TryParse(nameOrIndex, out int idx) && idx < list.Count)
        return list[idx];

    return null;
}
```

### 3c. Swiftlet wiring for import

```
[Panel: "http://localhost:4001/scripts/<docId>"] ──► Swiftlet GET
                                                           │ response body
                                                           ▼
                                                    [C# Reconstructor]
                                                           │ result string
                                                           ▼
                                                    [Panel: "Loaded N components"]
```

---

## 4. Useful traversal queries from GH

These can be driven entirely by Swiftlet GETs — no C# needed.

### Find all upstream ancestors of a component

Useful when you want to know "what feeds into this output?"

```
Swiftlet GET:  /scripts/{docId}/ancestors/{compLocalId}?depth=5
```

Returns a list of `GHComponent` objects ordered by traversal depth.
Wire the response into a `Deserialize JSON` component to inspect the tree.

### Find scripts using the same component types

```
Swiftlet GET:  /scripts/{docId}/similar
```

Returns documents sorted by number of shared component GUIDs — good for a
"you might also like" panel in the web UI.

### Direct Cypher (if you expose a query endpoint later)

```cypher
-- All paths between two components in one script
MATCH path = (a:GHComponent { id: $fromId })-[:WIRE*]->(b:GHComponent { id: $toId })
RETURN path ORDER BY length(path) LIMIT 5

-- Most-used component types across all scripts
MATCH (c:GHComponent)
RETURN c.guid, c.nickname, count(*) AS uses
ORDER BY uses DESC LIMIT 20
```

---

## 5. Design considerations and gotchas

### Component GUID stability
`ComponentGuid` is the **type** GUID baked into the Grasshopper component
definition — it's stable across machines. `InstanceGuid` is per-object per-file
and is what we use as `local_id`. Do not mix them up.

### Components not found on reconstruction
If a script uses a third-party plugin component and that plugin isn't installed
on the target machine, `server.FindObject(typeGuid)` returns `null`. The
reconstructor logs a warning and skips those nodes. The graph in Neo4j is still
intact — you can query which GUIDs are missing before reconstruction.

```cypher
-- Find all component type GUIDs used in a document
MATCH (d:GHDocument { id: $docId })-[:HAS_COMPONENT]->(c:GHComponent)
RETURN DISTINCT c.guid, c.nickname
```

Cross-reference this list against the local component server before attempting
reconstruction.

### Cluster and Group objects
`GH_Cluster` and `GH_Group` are `IGH_DocumentObject` but not `IGH_Component`.
The serializer above captures them as nodes (their GUID is stored), but their
internal sub-graphs are not recursively expanded. For now, clusters should be
exploded before export. This is a known limitation to address later.

### Param tree structure (DataTree / access)
The current schema stores only the **topology** (which params are wired
together), not the **data** flowing through params at solve time. Volatile data
(geometry, numbers) is intentionally not stored in Neo4j — it's ephemeral and
large. If you need to cache solve results, write them to a separate blob store
and reference the blob ID as a property on the `GHDocument` node.

### Thread safety in C#
`Grasshopper.Instances.ActiveCanvas.Document` must only be accessed on the
**main Rhino/GH thread**. The C# Script component runs on the GH solution
thread, so this is fine. If you ever move this logic to an async context
(e.g., a Rhino command plugin), use `RhinoApp.InvokeOnUiThread`.

### Idempotent ingestion
`POST /scripts` always creates a **new** `GHDocument` node with a fresh UUID.
If you re-export a modified version of the same script, you'll get a second
document. To update in place, add a `PUT /scripts/:id` endpoint later and pass
the existing `docId` from the stored panel.

---

## 6. Recommended GH canvas layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Group: "DB Config"                                              │
│  [Panel: API_BASE = "http://localhost:4001"]                     │
│  [Panel: SCRIPT_NAME = "My Script"]                              │
│  [Panel: AUTHOR = "Nicolas"]                                     │
└──────────────────────────────────────────────────────────────────┘
          │                                │
          ▼                                ▼
┌─────────────────────┐       ┌─────────────────────┐
│  Group: "Export"    │       │  Group: "Import"    │
│                     │       │                     │
│  [C# Serializer]    │       │  [Panel: DOC_ID]    │
│       │             │       │       │             │
│       ▼             │       │       ▼             │
│  [Swiftlet POST]    │       │  [Swiftlet GET]     │
│       │             │       │       │             │
│       ▼             │       │       ▼             │
│  [Panel: docId] ───────────►│  [C# Reconstructor] │
└─────────────────────┘       └─────────────────────┘
```

Wire `[Panel: docId]` from the export group directly into the import group's
`DOC_ID` panel so a round-trip (export → reload) requires only one button click.

---

## 7. Future extensions

| Feature | Approach |
|---|---|
| **Diff two versions** | Store both docIds, run Cypher to compare `HAS_COMPONENT` sets |
| **Script lineage** | Add `(:GHDocument)-[:DERIVED_FROM]->(:GHDocument)` on export if a parent docId is known |
| **Tag-based search** | `MATCH (d:GHDocument) WHERE $tag IN d.tags RETURN d` |
| **Dependency graph** | Add `(:GHPlugin { guid, name, version })` nodes; link components to their plugin |
| **Solve result caching** | Store blob URLs as properties on `GHDocument`; invalidate when topology changes |
