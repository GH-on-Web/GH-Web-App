# Simplified JSON Format

The node parser now supports a simplified JSON format that reduces redundancy and makes graph files more compact and maintainable.

## Format Overview

Instead of embedding full component definitions in each node, the simplified format uses **GUIDs as references** to look up component information from the database (`gh_components_native.json`).

## Structure

### Simplified Format (Recommended)

```json
{
  "nodes": [
    {
      "id": "slider_x",
      "guid": "57da07bd-ecab-415d-9d86-af36d7073abc",
      "nickname": "X",
      "x": 40,
      "y": 40,
      "properties": {
        "Min": -10.0,
        "Max": 10.0,
        "Value": 2.0
      }
    },
    {
      "id": "pt",
      "guid": "3581f42a-9592-4549-bd6b-1c0fc39d067b",
      "nickname": "Pt",
      "x": 260,
      "y": 100
    }
  ],
  "links": [
    {
      "fromNode": "slider_x",
      "fromParam": "0",
      "toNode": "pt",
      "toParam": "X"
    }
  ]
}
```

### Node Fields

- **`id`** (required): Unique identifier for this node instance
- **`guid`** (required): Component GUID to look up from database
- **`nickname`** (optional): Display name for this instance
- **`x`, `y`** (required): Canvas position
- **`properties`** (optional): Object containing:
  - For interactive components (sliders, panels, etc.): UI-specific properties like `Min`, `Max`, `Value`, `Text`, etc.
  - For standard components: Input values keyed by parameter name (e.g., `{"X": 2.0, "Y": 1.0}`)

### Link Fields

- **`fromNode`**: Source node ID
- **`fromParam`**: Source parameter - can be index (`"0"`) or name (`"Pt"`)
- **`toNode`**: Target node ID
- **`toParam`**: Target parameter - can be index or name (`"X"`, `"Y"`, etc.)

## Interactive Components

Special GUIDs for interactive UI components:

| GUID | Component | Properties |
|------|-----------|------------|
| `57da07bd-ecab-415d-9d86-af36d7073abc` | Number Slider | `Min`, `Max`, `Step`, `Value` |
| `59e0b89a-e487-49f8-bab8-b5bab16be14c` | Panel | `Text`, `IsInput` |
| `2e78987b-9dfb-42a2-8b76-3923ac8bd91a` | Boolean Toggle | `Value` |
| `a8b97322-2d53-47cd-905e-b932c3ccd74e` | Button | (none) |
| `3e8ca6be-fda8-4aaf-b5c0-3c54c8bb7312` | Number Input | `Value` |

## Benefits

1. **Compact**: No need to embed full component definitions
2. **Maintainable**: Component info stays in sync with database
3. **Readable**: Clear structure with minimal nesting
4. **Flexible**: Parameters can be referenced by name or index

## Backward Compatibility

The parser automatically detects the format:
- **Simplified format**: Has `nodes` and `links` fields
- **Old format**: Has `componentInstances` and `connections` fields

Both formats are fully supported.

## Example: Test-Script-1.json

See `frontend/src/data/Test-Script-1.json` for a complete example using the simplified format.
