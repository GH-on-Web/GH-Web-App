# Interactive Node Components

Custom UI node components that provide interactive controls similar to Grasshopper's input components.

## Available Components

### 1. Number Slider Node
A draggable slider with min/max range and step control.

**Features:**
- Drag slider to change value
- Double-click value to enter precise number
- Visual min/max labels
- Real-time value updates

**Usage:**
```javascript
import { createSliderNodeData } from './components/NodeParser';

const sliderData = createSliderNodeData({
  nickname: 'My Slider',
  min: 0,
  max: 100,
  step: 1,
  value: 50,
  onChange: (nodeId, value) => console.log('Value:', value)
});
```

**Interactions:**
- Drag slider thumb to adjust value
- Double-click value display to type exact number
- Press Enter to confirm, Escape to cancel

---

### 2. Panel Node
Text display/input component for showing or entering multi-line text.

**Features:**
- Displays text content
- Multi-line editing
- Can act as input or display only
- Monospace font for code/data

**Usage:**
```javascript
import { createPanelNodeData } from './components/NodeParser';

const panelData = createPanelNodeData({
  nickname: 'Output Panel',
  text: 'Hello World!\nLine 2',
  isInput: false,
  onChange: (nodeId, text) => console.log('Text:', text)
});
```

**Interactions:**
- Double-click to edit (if not input-only)
- Type multi-line text
- Click outside to finish editing

---

### 3. Boolean Toggle Node
On/Off switch with visual toggle animation.

**Features:**
- Animated toggle switch
- True/False display
- Visual feedback on state
- Color-coded (red=false, green=true)

**Usage:**
```javascript
import { createBooleanToggleData } from './components/NodeParser';

const toggleData = createBooleanToggleData({
  nickname: 'Enable',
  value: false,
  onChange: (nodeId, value) => console.log('State:', value)
});
```

**Interactions:**
- Click anywhere on the toggle to switch state
- Visual animation shows current state

---

### 4. Button Node
Trigger/action button with click counter.

**Features:**
- Click to trigger action
- Visual click count
- Gradient styling
- Press animation

**Usage:**
```javascript
import { createButtonData } from './components/NodeParser';

const buttonData = createButtonData({
  nickname: 'Execute',
  onClick: (nodeId) => console.log('Button clicked!')
});
```

**Interactions:**
- Click to trigger onClick callback
- Counter shows number of clicks

---

### 5. Number Input Node
Simple numeric input with keyboard shortcuts.

**Features:**
- Direct number entry
- Arrow key increment/decrement
- Double-click to edit
- Keyboard shortcuts

**Usage:**
```javascript
import { createNumberInputData } from './components/NodeParser';

const numberData = createNumberInputData({
  nickname: 'Count',
  value: 0,
  onChange: (nodeId, value) => console.log('Number:', value)
});
```

**Interactions:**
- Double-click to edit value
- Arrow Up/Down to increment/decrement
- Enter to confirm, Escape to cancel

---

## Integration with NodeParser

### Adding Interactive Nodes to Graph

```javascript
import { NodeParser } from './components/NodeParser';
import { createSliderNodeData } from './components/NodeParser';

const graphData = {
  componentInstances: [
    {
      instanceId: '1',
      position: { x: 100, y: 100 },
      component: {
        type: 'numberSlider',
        ...createSliderNodeData({
          nickname: 'Size',
          min: 0,
          max: 100,
          value: 50
        })
      }
    }
  ],
  connections: []
};

<NodeParser graphData={graphData} />
```

### Handling Value Changes

All interactive nodes support an `onChange` callback:

```javascript
const handleValueChange = (nodeId, value) => {
  console.log(`Node ${nodeId} changed to:`, value);
  
  // Update your application state
  updateNodeValue(nodeId, value);
  
  // Trigger recalculation
  recalculateGraph();
};

const sliderData = createSliderNodeData({
  nickname: 'Input',
  value: 0,
  onChange: handleValueChange
});
```

## Node Types Reference

| Node Type | Component | Output Type | Interactive |
|-----------|-----------|-------------|-------------|
| `numberSlider` | NumberSliderNode | Number | Yes |
| `panel` | PanelNode | String | Yes |
| `booleanToggle` | BooleanToggleNode | Boolean | Yes |
| `button` | ButtonNode | Event | Yes |
| `numberInput` | NumberInputNode | Number | Yes |
| `grasshopperNode` | GrasshopperNode | Various | No |

## Styling

All interactive nodes use the `InteractiveNodes.css` stylesheet. To customize:

```css
/* Override slider colors */
.slider-input::-webkit-slider-thumb {
  background: #your-color;
}

/* Override toggle colors */
.boolean-toggle.active {
  background: #your-active-color;
}

/* Override button gradient */
.action-button {
  background: linear-gradient(135deg, #color1 0%, #color2 100%);
}
```

## Examples

See the **Interactive Nodes Demo** page at `/interactive` for live examples of all interactive components.

### Example: Creating a Range Selector

```javascript
const rangeSelector = [
  {
    instanceId: '1',
    position: { x: 100, y: 100 },
    component: {
      type: 'numberSlider',
      ...createSliderNodeData({
        nickname: 'Min',
        min: 0,
        max: 100,
        value: 20
      })
    }
  },
  {
    instanceId: '2',
    position: { x: 100, y: 200 },
    component: {
      type: 'numberSlider',
      ...createSliderNodeData({
        nickname: 'Max',
        min: 0,
        max: 100,
        value: 80
      })
    }
  }
];
```

### Example: Interactive Parameter Controller

```javascript
const controller = {
  componentInstances: [
    {
      instanceId: '1',
      position: { x: 50, y: 50 },
      component: {
        type: 'booleanToggle',
        ...createBooleanToggleData({
          nickname: 'Enable',
          value: true
        })
      }
    },
    {
      instanceId: '2',
      position: { x: 50, y: 150 },
      component: {
        type: 'numberSlider',
        ...createSliderNodeData({
          nickname: 'Strength',
          min: 0,
          max: 10,
          step: 0.1,
          value: 5
        })
      }
    },
    {
      instanceId: '3',
      position: { x: 50, y: 250 },
      component: {
        type: 'button',
        ...createButtonData({
          nickname: 'Apply',
          onClick: () => applySettings()
        })
      }
    }
  ]
};
```

## Best Practices

1. **Use Appropriate Types**: Match the input type to your data (slider for ranges, toggle for booleans)
2. **Set Meaningful Nicknames**: Help users understand what each input controls
3. **Handle onChange Events**: Always implement onChange to capture user input
4. **Set Reasonable Limits**: Use min/max on sliders to prevent invalid values
5. **Provide Visual Feedback**: The nodes have built-in animations and feedback

## Keyboard Shortcuts

| Node Type | Shortcut | Action |
|-----------|----------|--------|
| All | Delete/Backspace | Delete selected node |
| Number Slider | Double-click value | Edit exact value |
| Number Input | Arrow Up/Down | Increment/Decrement |
| Number Input | Enter | Confirm edit |
| Panel | Double-click | Edit text |

## Troubleshooting

### Values not updating?
Make sure you're passing the `onChange` callback and updating your graph data state.

### Nodes not appearing?
Verify that the node type matches the registered type in NodeParser's `nodeTypes` object.

### Styling issues?
Ensure `InteractiveNodes.css` is imported in your component.

---

For more examples, visit the `/interactive` demo page in the application.
