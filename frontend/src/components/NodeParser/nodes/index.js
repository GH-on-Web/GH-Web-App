// Interactive Node Components for Grasshopper-style inputs
export { default as NumberSliderNode } from './NumberSliderNode';
export { default as PanelNode } from './PanelNode';
export { 
  BooleanToggleNode, 
  ButtonNode, 
  NumberInputNode 
} from './InteractiveInputNodes';

// Helper to create node data for each type
export const createSliderNodeData = (options = {}) => ({
  type: 'numberSlider',
  nickname: options.nickname || 'Slider',
  min: options.min || 0,
  max: options.max || 100,
  step: options.step || 1,
  value: options.value || options.min || 0,
  onChange: options.onChange
});

export const createPanelNodeData = (options = {}) => ({
  type: 'panel',
  nickname: options.nickname || 'Panel',
  text: options.text || '',
  isInput: options.isInput || false,
  onChange: options.onChange
});

export const createBooleanToggleData = (options = {}) => ({
  type: 'booleanToggle',
  nickname: options.nickname || 'Toggle',
  value: options.value !== undefined ? options.value : false,
  onChange: options.onChange
});

export const createButtonData = (options = {}) => ({
  type: 'button',
  nickname: options.nickname || 'Button',
  onClick: options.onClick
});

export const createNumberInputData = (options = {}) => ({
  type: 'numberInput',
  nickname: options.nickname || 'Number',
  value: options.value || 0,
  onChange: options.onChange
});
