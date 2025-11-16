import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useTheme } from '@mui/material';
import { IconButton, Box } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { RoomProvider } from '@liveblocks/react';
import { NodeParser } from '../components/NodeParser';
import { useGraphCollaboration } from '../hooks/useCollaboration';
import CollaborationStatus from '../components/Collaboration/CollaborationStatus';
import ThreeViewer from '../components/Viewer3D/ThreeViewer';
import ThreeViewerRhino from '../components/Viewer3D/ThreeViewerRhino';
import ErrorBoundary from '../components/ErrorBoundary';
import { POSITION_SCALE_FACTOR } from '../utils/nodeParser';
import exampleData from '../data/exampleGraph.json';
import exampleDataInteractive from '../data/exampleGraphInteractive.json';
import testScript1 from '../data/Test-Script-1.json';
import './NodeParserDemo.css';

// Configure axios to use the backend URL
const BACKEND_URL = process.env.REACT_APP_COMPUTE_GATEWAY_URL || 'http://localhost:4001';
const api = axios.create({
  baseURL: BACKEND_URL,
});

/**
 * Inner component that uses Liveblocks room for real-time collaboration
 */
// Toggle backend save/load for .gh files (Load still uses backend, Save outputs JSON, Run uses fallback 3dm)
const USE_BACKEND_LOAD = false;
const USE_BACKEND_SAVE = false;

const NodeParserDemoContent = ({ roomId }) => {
  const theme = useTheme();
  
  // Collaboration mode toggle
  const [isCollabMode, setIsCollabMode] = useState(false);
  
  // 3D viewer collapse state (following AppLayout pattern)
  const [isViewerCollapsed, setIsViewerCollapsed] = useState(true);
  
  // Sample geometry for demonstration
  const [sampleGeometry, setSampleGeometry] = useState(null);
  
  // Use Liveblocks for collaborative state
  const {
    graphData: currentData,
    updateGraphData,
    updateGraphNodes,
    updateGraphLinks,
    isConnected,
    others
  } = useGraphCollaboration();
  
  const [jsonInput, setJsonInput] = useState(JSON.stringify(currentData, null, 2));
  const [parseError, setParseError] = useState(null);
  const [componentsDatabase, setComponentsDatabase] = useState([]);
  const [isLoadingDatabase, setIsLoadingDatabase] = useState(true);

  // Sync JSON input when currentData changes from Liveblocks
  useEffect(() => {
    setJsonInput(JSON.stringify(currentData, null, 2));
  }, [currentData]);

  // Load the components database
  useEffect(() => {
    const loadDatabase = async () => {
      try {
        const response = await fetch('/gh_components_native.json');
        if (response.ok) {
          const data = await response.json();
          if (data && data.Components) {
            setComponentsDatabase(data.Components);
            console.log(`Loaded ${data.Components.length} components from database`);
          } else {
            console.error('No components found in database');
          }
        } else {
          console.error('Failed to fetch database:', response.statusText);
        }
        setIsLoadingDatabase(false);
      } catch (error) {
        console.error('Failed to load components database:', error);
        setIsLoadingDatabase(false);
      }
    };
    
    loadDatabase();
  }, []);

  const handleLoadFile = () => {
    // Warn if others are connected and collab mode is active
    if (isCollabMode && others.length > 0) {
      const confirmed = window.confirm(
        `${others.length} other user(s) are viewing this workspace. Loading a file will replace their view. Continue?`
      );
      if (!confirmed) return;
    }

    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    // Only allow .gh for backend, .json for local
    input.accept = USE_BACKEND_LOAD ? '.gh' : '.json';

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (USE_BACKEND_LOAD) {
        // Backend logic: read .gh file, convert to base64, send to backend
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            // Convert file to base64
            const arrayBuffer = event.target.result;
            const uint8Array = new Uint8Array(arrayBuffer);
            const ghBase64 = btoa(String.fromCharCode(...uint8Array));
            
            console.log(`[Load] Sending .gh file (${ghBase64.length} chars base64) to backend`);
            
            const response = await api.post('/gh-to-json', {
              ghFileBase64: ghBase64,
              fileName: file.name,
            });
            
            console.log('[Load] Backend response:', response.data);
            
            // The backend returns the full Rhino Compute response
            // We need to extract the JSON from the output parameter
            if (response.data && response.data.values) {
              console.log('[Load] Response has', response.data.values.length, 'output parameters');
              
              // Log all parameter names to help debugging
              response.data.values.forEach((v, idx) => {
                console.log(`[Load] Parameter ${idx}: ${v.ParamName}`);
              });
              
              // Look for the output parameter with the JSON string
              // Try multiple possible parameter names
              const jsonOutput = response.data.values.find(v => 
                v.ParamName && (
                  v.ParamName.includes('json') || 
                  v.ParamName.includes('JSON') ||
                  v.ParamName.includes('Set String') || 
                  v.ParamName.includes('Output') ||
                  v.ParamName.includes('RH_OUT')
                )
              );
              
              if (jsonOutput && jsonOutput.InnerTree) {
                console.log('[Load] Found output parameter:', jsonOutput.ParamName);
                const firstKey = Object.keys(jsonOutput.InnerTree)[0];
                console.log('[Load] InnerTree keys:', Object.keys(jsonOutput.InnerTree));
                
                if (firstKey && jsonOutput.InnerTree[firstKey].length > 0) {
                  const item = jsonOutput.InnerTree[firstKey][0];
                  console.log('[Load] First item type:', item.type);
                  let jsonString = item.data;
                  console.log('[Load] Extracted JSON string length:', jsonString?.length);
                  console.log('[Load] Extracted JSON string (first 300 chars):', jsonString?.substring(0, 300) + '...');
                  
                  // The JSON might be double-encoded (JSON string containing JSON string)
                  // Try parsing once, and if result is still a string, parse again
                  let parsed = JSON.parse(jsonString);
                  console.log('[Load] First parse result type:', typeof parsed);
                  
                  if (typeof parsed === 'string') {
                    console.log('[Load] JSON was double-encoded, parsing again...');
                    parsed = JSON.parse(parsed);
                  }
                  
                  console.log('[Load] Final parsed object:', parsed);
                  console.log('[Load] Parsed has nodes?', !!parsed.nodes);
                  console.log('[Load] Nodes count:', parsed.nodes?.length);
                  console.log('[Load] Parsed has links?', !!parsed.links);
                  console.log('[Load] Links count:', parsed.links?.length);
                  
                  // Log all links to see which ones exist
                  if (parsed.links && parsed.links.length > 0) {
                    console.log('[Load] All links from parsed data:');
                    parsed.links.forEach((link, idx) => {
                      console.log(`  Link ${idx}:`, link);
                    });
                  }
                  
                  updateGraphData(parsed);
                  setParseError(null);
                  console.log('[Load] Successfully loaded graph with', parsed.nodes?.length || 0, 'nodes and', parsed.links?.length || 0, 'links');
                } else {
                  console.error('[Load] InnerTree is empty or missing data');
                  setParseError('Backend response missing JSON data in InnerTree.');
                }
              } else {
                console.error('[Load] Could not find output parameter with JSON');
                console.error('[Load] Available parameters:', response.data.values.map(v => v.ParamName).join(', '));
                setParseError('Backend response missing expected output parameter. Available: ' + 
                  response.data.values.map(v => v.ParamName).join(', '));
              }
            } else {
              setParseError('Backend did not return valid response structure.');
            }
          } catch (err) {
            console.error('[Load] Error:', err);
            setParseError('Failed to load file from backend: ' + (err?.response?.data?.error?.message || err.message));
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        // Old local logic: read and parse JSON file
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const fileContent = event.target.result;
            const parsed = JSON.parse(fileContent);
            updateGraphData(parsed);
            setParseError(null);
          } catch (err) {
            setParseError('Failed to load file: ' + err.message);
          }
        };
        reader.readAsText(file);
      }
    };

    input.click();
  };

  const handleLoadExample = () => {
    if (isCollabMode && others.length > 0) {
      const confirmed = window.confirm(
        `${others.length} other user(s) are viewing this workspace. Loading an example will replace their view. Continue?`
      );
      if (!confirmed) return;
    }
    updateGraphData(testScript1);
    setParseError(null);
  };

  const handleLoadVanillaExample = () => {
    if (isCollabMode && others.length > 0) {
      const confirmed = window.confirm(
        `${others.length} other user(s) are viewing this workspace. Loading an example will replace their view. Continue?`
      );
      if (!confirmed) return;
    }
    updateGraphData(exampleData);
    setParseError(null);
  };
  
  const handleLoadInteractiveExample = () => {
    if (isCollabMode && others.length > 0) {
      const confirmed = window.confirm(
        `${others.length} other user(s) are viewing this workspace. Loading an example will replace their view. Continue?`
      );
      if (!confirmed) return;
    }
    updateGraphData(exampleDataInteractive);
    setParseError(null);
  };

  const handleParseJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      updateGraphData(parsed);
      setParseError(null);
    } catch (err) {
      setParseError('Invalid JSON: ' + err.message);
    }
  };

  const handleClear = () => {
    const emptyData = { nodes: [], links: [] };
    updateGraphData(emptyData);
    setParseError(null);
  };

  const handleConnectionsChange = (newConnections) => {
    // Detect format and update accordingly
    const isSimplifiedFormat = currentData.nodes && currentData.links;
    
    // Convert connections to the appropriate format
    let formattedConnections = newConnections;
    
    if (isSimplifiedFormat) {
      // Convert from React Flow edge format {sourceNodeId: "node-xyz", sourceHandle: "output-0", ...}
      // to simplified format {fromNode: "xyz", fromParam: "0", toNode: "abc", toParam: "A"}
      formattedConnections = newConnections.map(conn => {
        // Remove "node-" prefix from IDs
        const fromNode = conn.sourceNodeId?.replace(/^node-/, '');
        const toNode = conn.targetNodeId?.replace(/^node-/, '');
        
        // Extract param from handle ID (e.g., "output-0" -> "0", "input-A" -> "A")
        const fromParam = conn.sourceHandle?.replace(/^output-/, '') || "0";
        const toParam = conn.targetHandle?.replace(/^input-/, '') || "0";
        
        return {
          fromNode,
          fromParam,
          toNode,
          toParam
        };
      });
    }
    
    // Update links in Liveblocks
    updateGraphLinks(formattedConnections);
  };

  const handleNodesChange = (newNodes, newComponentInstance, deletedNodeIds, isPositionUpdate) => {
    // Detect format
    const isSimplifiedFormat = currentData.nodes && currentData.links;
    
    // If nodes are being deleted
    if (deletedNodeIds && deletedNodeIds.length > 0) {
      if (isSimplifiedFormat) {
        const updatedNodes = currentData.nodes?.filter(
          node => !deletedNodeIds.includes(`node-${node.id}`)
        ) || [];
        
        // Also filter out links connected to deleted nodes
        const updatedLinks = (currentData.links || []).filter(link => {
          const sourceNodeId = `node-${link.fromNode}`;
          const targetNodeId = `node-${link.toNode}`;
          return !deletedNodeIds.includes(sourceNodeId) && !deletedNodeIds.includes(targetNodeId);
        });
        
        // Update both nodes and links
        updateGraphData({
          nodes: updatedNodes,
          links: updatedLinks
        });
      } else {
        const updatedInstances = currentData.componentInstances?.filter(
          inst => !deletedNodeIds.includes(`node-${inst.instanceId}`)
        ) || [];
        
        // Filter out connections to deleted nodes
        const updatedConnections = (currentData.connections || []).filter(conn => {
          return !deletedNodeIds.includes(conn.sourceNodeId) && !deletedNodeIds.includes(conn.targetNodeId);
        });
        
        updateGraphData({
          componentInstances: updatedInstances,
          connections: updatedConnections
        });
      }
      return;
    }
    
    // If a new component instance is being added
    if (newComponentInstance) {
      if (isSimplifiedFormat) {
        // Convert newComponentInstance to simplified format
        const reactFlowNode = newNodes?.find(n => n.id === `node-${newComponentInstance.instanceId}`);
        
        if (reactFlowNode) {
          // Get GUID from component data or from the node data
          const guid = newComponentInstance.component?.guid || 
                       newComponentInstance.component?.Guid || 
                       reactFlowNode.data.guid;
          
          const newSimplifiedNode = {
            id: newComponentInstance.instanceId,
            guid: guid,
            nickname: reactFlowNode.data.nickname || reactFlowNode.data.name,
            x: newComponentInstance.position.x / POSITION_SCALE_FACTOR,
            y: newComponentInstance.position.y / POSITION_SCALE_FACTOR,
            properties: {}
          };
          
          // Add properties for interactive nodes
          if (reactFlowNode.type === 'numberSlider') {
            newSimplifiedNode.properties = {
              Min: reactFlowNode.data.min || 0,
              Max: reactFlowNode.data.max || 100,
              Step: reactFlowNode.data.step || 1,
              Value: reactFlowNode.data.value || 0
            };
          } else if (reactFlowNode.type === 'panel') {
            newSimplifiedNode.properties = {
              Text: reactFlowNode.data.text || '',
              IsInput: reactFlowNode.data.isInput || false
            };
          } else if (reactFlowNode.type === 'booleanToggle') {
            newSimplifiedNode.properties = {
              Value: reactFlowNode.data.value || false
            };
          } else if (reactFlowNode.type === 'numberInput') {
            newSimplifiedNode.properties = {
              Value: reactFlowNode.data.value || 0
            };
          }
          
          const updatedNodes = [...(currentData.nodes || []), newSimplifiedNode];
          updateGraphNodes(updatedNodes);
        }
      } else {
        const updatedInstances = [...(currentData.componentInstances || []), newComponentInstance];
        updateGraphData({
          componentInstances: updatedInstances,
          connections: currentData.links || currentData.connections || []
        });
      }
      return;
    }
    
    // If this is a position update (node drag), update positions without triggering re-parse
    if (isPositionUpdate && newNodes) {
      if (isSimplifiedFormat) {
        const updatedNodes = currentData.nodes?.map(node => {
          const reactFlowNode = newNodes.find(n => n.id === `node-${node.id}`);
          if (reactFlowNode && reactFlowNode.position) {
            return {
              ...node,
              x: reactFlowNode.position.x / POSITION_SCALE_FACTOR,
              y: reactFlowNode.position.y / POSITION_SCALE_FACTOR
            };
          }
          return node;
        }) || [];
        
        updateGraphNodes(updatedNodes);
      } else {
        const updatedInstances = currentData.componentInstances?.map(inst => {
          const node = newNodes.find(n => n.id === `node-${inst.instanceId}`);
          if (node && node.position) {
            return {
              ...inst,
              position: node.position
            };
          }
          return inst;
        }) || [];
        
        updateGraphData({
          componentInstances: updatedInstances,
          connections: currentData.links || currentData.connections || []
        });
      }
      return;
    }
    
    // For other node movements/updates, don't trigger re-parse
    // This prevents the graph from re-parsing and losing edges
  };

  const handleExportConnections = () => {
    const connectionsJson = JSON.stringify(currentData.links || currentData.connections || [], null, 2);
    // Create a downloadable file
    const blob = new Blob([connectionsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'connections.json';
    a.click();
    URL.revokeObjectURL(url);
  };


  // Save button: backend or local logic
  const handleExportGraph = async () => {
    if (USE_BACKEND_SAVE) {
      try {
        // POST to backend /json-to-gh endpoint
        const response = await api.post(
          '/json-to-gh',
          currentData,
          { responseType: 'arraybuffer' }
        );
        // Check for Grasshopper file in response
        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('application/octet-stream') || response.data) {
          // Create a blob and trigger download
          const blob = new Blob([response.data], { type: 'application/octet-stream' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'generated.gh';
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 100);
        } else {
          alert('Backend did not return a valid .gh file.');
        }
      } catch (err) {
        alert('Failed to generate .gh file: ' + (err?.response?.data?.error?.message || err.message));
      }
    } else {
      // Old local save logic (JSON)
      const graphJson = JSON.stringify(currentData, null, 2);
      const blob = new Blob([graphJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'grasshopper-graph.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };


  // Store solve result for later visualization
  const [solveResult, setSolveResult] = useState(null);

  const handleRun = async () => {
    // Always load the local 3dm file as fallback demonstration
    await loadFallback3dm();
  };

  const loadFallback3dm = async () => {
    try {
      // For now, just show a demo geometry instead of trying to load .3dm
      // TODO: Implement proper 3dm file loading when rhino3dm WASM issues are resolved
      const demoGeometry = {
        type: 'twisted-box',
        width: 10,
        height: 10,
        depth: 50,
        twist: Math.PI / 2,
        segments: 20,
        position: [0, 0, 0],
        color: [0.3, 0.7, 1.0, 1.0]
      };
      
      setSampleGeometry(demoGeometry);
      setSolveResult(null); // Clear solve result to use ThreeViewer
      setIsViewerCollapsed(false); // Open the viewer to show the result
      console.log('Loaded demo geometry for demonstration');
    } catch (err) {
      console.error('Failed to load demo geometry:', err);
      alert('Failed to load 3D preview.');
    }
  };

  // Generate sample geometry for demonstration
  const generateSampleGeometry = () => {
    // Create a simple box geometry using Three.js format
    const geometry = {
      type: 'box',
      width: 2,
      height: 2,
      depth: 2,
      position: [0, 0, 0],
      color: [0.2, 0.6, 1.0, 1.0] // Blue color
    };
    
    setSampleGeometry(geometry);
  };

  return (
    <div className={`node-parser-demo ${!isViewerCollapsed ? 'with-3d-viewer' : ''}`} data-theme={theme.palette.mode}>
      {/* Collaboration toggle button */}
      <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 102 }}>
        <button 
          onClick={() => setIsCollabMode(!isCollabMode)}
          className="btn"
          style={{
            backgroundColor: isCollabMode ? '#4caf50' : theme.palette.mode === 'dark' ? '#424242' : '#e0e0e0',
            color: isCollabMode ? 'white' : theme.palette.mode === 'dark' ? 'white' : 'black',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
          title={isCollabMode ? 'Stop collaboration mode' : 'Start collaboration mode'}
        >
          {isCollabMode ? '🛑 Stop Collab' : '🚀 Start Collab'}
        </button>
      </div>

      {/* Collaboration status indicator - only show in collab mode */}
      {isCollabMode && (
        <div style={{ position: 'absolute', top: '70px', left: '20px', zIndex: 101 }}>
          <CollaborationStatus workspaceId={roomId} />
        </div>
      )}
      
      <div className="demo-canvas">
        {isLoadingDatabase ? (
          <div className="loading-message">
            Loading components database...
          </div>
        ) : componentsDatabase.length === 0 ? (
          <div className="loading-message" style={{background: '#fff3cd', color: '#856404'}}>
            ⚠️ Components database not loaded. Some features may not work correctly.
          </div>
        ) : null}
        
        <div className={`canvas-container ${!isViewerCollapsed ? 'with-3d-viewer' : ''}`}>
          <div className="graph-canvas">
            <NodeParser 
              graphData={currentData} 
              onConnectionsChange={handleConnectionsChange}
              onNodesChange={handleNodesChange}
              componentsDatabase={componentsDatabase}
            />
          </div>
          
          {/* 3D Viewer Panel */}
          {!isViewerCollapsed && (
            <>
              <div className="viewer-panel">
                <div style={{ 
                  padding: '8px', 
                  background: theme.palette.mode === 'dark' ? '#333' : '#f0f0f0',
                  borderBottom: '1px solid #ddd',
                  fontSize: '12px',
                  color: theme.palette.mode === 'dark' ? '#ccc' : '#666'
                }}>
                  3D Preview {sampleGeometry ? '(Sample Cube)' : '(No geometry)'}
                </div>
                <ErrorBoundary>
                  {solveResult ? (
                    <ThreeViewerRhino solveResult={solveResult} />
                  ) : (
                    <ThreeViewer geometry={sampleGeometry} />
                  )}
                </ErrorBoundary>
              </div>
              {/* Close button for expanded viewer - now outside the panel */}
              <Box
                sx={{
                  position: 'absolute',
                  left: 'calc(100% - 400px - 30px)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 103,
                  pointerEvents: 'auto',
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => setIsViewerCollapsed(true)}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    border: 1,
                    borderColor: 'divider',
                    boxShadow: 2,
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                    width: '40px',
                    height: '40px',
                  }}
                  title="Hide 3D viewer"
                >
                  <ChevronRight fontSize="medium" />
                </IconButton>
              </Box>
            </>
          )}
        </div>
        
        {/* 3D Viewer Toggle Button - only show when collapsed */}
        {isViewerCollapsed && (
          <Box
            sx={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 103,
            }}
          >
            <IconButton
              size="small"
              onClick={() => setIsViewerCollapsed(false)}
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                border: 1,
                borderColor: 'divider',
                boxShadow: 2,
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
                width: '40px',
                height: '40px',
              }}
              title="Show 3D viewer"
            >
              <ChevronLeft fontSize="medium" />
            </IconButton>
          </Box>
        )}
      </div>

      {/* Floating action buttons */}
      <div className="demo-floating-controls">
        <button onClick={handleExportGraph} className="btn btn-save" title="Save graph as JSON file">
          💾 Save
        </button>
        <button onClick={handleLoadFile} className="btn btn-load" title="Load JSON file">
          📁 Load File
        </button>
        <button onClick={handleClear} className="btn btn-clear" title="Clear canvas">
          🗑️ Clear
        </button>
        <button onClick={handleRun} className="btn btn-run" title="Export and run (coming soon)">
          ▶ Run
        </button>
      </div>
    </div>
  );
};

/**
 * Wrapper component that provides RoomProvider for collaboration
 * Note: LiveblocksProvider is in App.js, so RoomProvider can be used here
 */
const NodeParserDemo = () => {
  const { workspaceId } = useParams();
  const roomId = workspaceId || 'nodeparser-default';

  return (
    <RoomProvider 
      id={roomId}
      initialPresence={{}}
      initialStorage={{
        graphData: testScript1, // Initial data for new rooms
      }}
    >
      <NodeParserDemoContent roomId={roomId} />
    </RoomProvider>
  );
};

export default NodeParserDemo;
