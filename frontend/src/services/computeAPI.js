import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * computeAPI - Service for communicating with backend compute server
 */

/**
 * Send graph definition to backend for computation
 * @param {Object} graphDefinition - Graph definition with nodes and edges
 * @param {Object} settings - Computation settings (e.g., tolerance)
 * @returns {Promise<Object>} Geometry results from backend
 */
export async function computeGraph(graphDefinition, settings = {}) {
  console.log('computeGraph called with:', {
    API_BASE_URL,
    nodeCount: graphDefinition?.nodes?.length || 0,
    edgeCount: graphDefinition?.edges?.length || 0
  });
  
  try {
    const url = `${API_BASE_URL}/api/compute`;
    const payload = {
      graph: graphDefinition,
      settings: {
        tolerance: 0.01,
        ...settings,
      },
    };
    
    console.log('Sending POST request to:', url);
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    // Log circle node inputs specifically
    const circleNodes = graphDefinition.nodes?.filter(n => n.type === 'circle');
    if (circleNodes && circleNodes.length > 0) {
      console.log('Circle nodes in payload:');
      circleNodes.forEach(node => {
        console.log(`  Node ${node.id}:`, {
          inputs: node.data?.inputs,
          hasCenter: !!node.data?.inputs?.center,
          centerValue: node.data?.inputs?.center,
          hasX: !!node.data?.inputs?.x,
          xValue: node.data?.inputs?.x,
        });
      });
    }
    
    // Add request interceptor to log the actual request
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (config.url && config.url.includes('/api/compute')) {
          console.log('Axios POST request intercepted:', {
            method: config.method,
            url: config.url,
            data: config.data
          });
        }
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );
    
    const response = await axios.post(url, payload);
    
    // Remove interceptor after request
    axios.interceptors.request.eject(requestInterceptor);
    
    console.log('Response received:', {
      status: response.status,
      geometryCount: response.data?.geometry?.length || 0,
      errorCount: response.data?.errors?.length || 0
    });
    
    return response.data;
  } catch (error) {
    console.error('Compute API error:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url
    });
    throw error;
  }
}

/**
 * Health check for backend server
 * @returns {Promise<boolean>} True if backend is available
 */
export async function checkBackendHealth() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/health`);
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

