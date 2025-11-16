/**
 * Utility to convert Rhino.Compute geometry responses to ThreeViewer format
 * Uses rhino3dm to decode OpenNURBS serialized objects
 */

import * as THREE from 'three';

// Initialize rhino3dm from CDN
let rhinoModule = null;
let rhinoPromise = null;

const initRhino = async () => {
  if (rhinoModule) return rhinoModule;
  if (rhinoPromise) return rhinoPromise;
  
  rhinoPromise = (async () => {
    try {
      console.log('[rhinoConverter] Loading rhino3dm from CDN...');
      
      // Load rhino3dm script from CDN if not already loaded
      if (!window.rhino3dm) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/rhino3dm@8.4.0/rhino3dm.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      
      // Initialize the module
      console.log('[rhinoConverter] Initializing rhino3dm module...');
      rhinoModule = await window.rhino3dm();
      console.log('[rhinoConverter] rhino3dm initialized successfully');
      return rhinoModule;
    } catch (err) {
      console.error('[rhinoConverter] Failed to initialize rhino3dm:', err);
      rhinoPromise = null;
      throw err;
    }
  })();
  
  return rhinoPromise;
};

/**
 * Decodes OpenNURBS geometry from Rhino Compute response
 */
const decodeRhinoGeometry = (rhino, item) => {
  // Parse the inner JSON string to get the payload
  const payload = JSON.parse(item.data);
  
  // The payload.data is the base64 OpenNURBS data
  const base64 = payload.data;
  
  // Decode to bytes
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  
  // Use File3dm.fromByteArray to read the serialized data
  const doc = rhino.File3dm.fromByteArray(bytes);
  
  if (!doc) {
    console.error('[rhinoConverter] File3dm.fromByteArray returned null');
    return null;
  }
  
  return doc;
};

/**
 * Converts Rhino.Compute solve result to ThreeViewer geometry format
 * @param {Object} solveResult - Response from Rhino.Compute /grasshopper endpoint
 * @returns {Promise<Array>} Array of geometry objects with vertices and faces
 */
export const convertRhinoComputeToThreeViewer = async (solveResult) => {
  if (!solveResult || !solveResult.values) {
    console.warn('[rhinoConverter] Invalid solve result');
    return [];
  }

  const rhino = await initRhino();
  const geometries = [];

  for (const param of solveResult.values) {
    if (!param.InnerTree) continue;

    for (const key in param.InnerTree) {
      const items = param.InnerTree[key];
      
      for (const item of items) {
        // Check if this is Rhino geometry
        if (item.type && item.data && item.type.startsWith('Rhino.Geometry')) {
          try {
            console.log(`[rhinoConverter] Processing ${param.ParamName} (${item.type})`);
            
            // Decode the OpenNURBS serialized geometry
            const doc = decodeRhinoGeometry(rhino, item);
            
            if (!doc) {
              console.error('[rhinoConverter] Failed to decode geometry');
              continue;
            }
            
            console.log('[rhinoConverter] Document objects count:', doc.objects().count);
            
            // Extract all objects from the document and convert to Three.js meshes
            for (let i = 0; i < doc.objects().count; i++) {
              const rhinoObject = doc.objects().get(i);
              const geom = rhinoObject.geometry();
              
              if (!geom) continue;
              
              console.log('[rhinoConverter] Object', i, 'type:', geom.constructor.name);
              
              // Convert to mesh if it's a Brep
              if (geom.constructor.name === 'Brep') {
                const meshes = rhino.Mesh.createFromBrep(geom);
                if (meshes && meshes.length > 0) {
                  console.log('[rhinoConverter] Converted Brep to', meshes.length, 'meshes');
                  
                  for (let m = 0; m < meshes.length; m++) {
                    const mesh = meshes[m];
                    const threeGeom = convertRhinoMeshToThree(mesh);
                    if (threeGeom) {
                      geometries.push({
                        type: 'three-object',
                        object: new THREE.Mesh(
                          threeGeom,
                          new THREE.MeshStandardMaterial({ color: 0x4CAF50, side: THREE.DoubleSide })
                        ),
                        name: param.ParamName
                      });
                    }
                  }
                }
              } else if (geom.constructor.name === 'Mesh') {
                const threeGeom = convertRhinoMeshToThree(geom);
                if (threeGeom) {
                  geometries.push({
                    type: 'three-object',
                    object: new THREE.Mesh(
                      threeGeom,
                      new THREE.MeshStandardMaterial({ color: 0x4CAF50, side: THREE.DoubleSide })
                    ),
                    name: param.ParamName
                  });
                }
              }
            }
            
            doc.delete();
            
          } catch (err) {
            console.error('[rhinoConverter] Failed to process geometry:', err);
          }
        }
      }
    }
  }

  if (geometries.length === 0) {
    console.warn('[rhinoConverter] No geometries were successfully converted');
  }
  
  return geometries;
};

/**
 * Converts Rhino Mesh to Three.js BufferGeometry
 */
const convertRhinoMeshToThree = (rhinoMesh) => {
  const vertices = [];
  const indices = [];
  
  // Extract vertices
  for (let i = 0; i < rhinoMesh.vertices().count; i++) {
    const v = rhinoMesh.vertices().get(i);
    vertices.push(v.x, v.y, v.z);
  }
  
  // Extract faces
  for (let i = 0; i < rhinoMesh.faces().count; i++) {
    const face = rhinoMesh.faces().get(i);
    
    if (face.isTriangle) {
      indices.push(face.a, face.b, face.c);
    } else {
      // Quad - split into two triangles
      indices.push(face.a, face.b, face.c);
      indices.push(face.a, face.c, face.d);
    }
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  
  console.log('[rhinoConverter] Created Three.js geometry:', vertices.length / 3, 'vertices,', indices.length / 3, 'faces');
  
  return geometry;
};

/**
 * Converts Three.js Object3D (from Rhino3dmLoader) to ThreeViewer format
 * @param {THREE.Object3D} object3d - Parsed Three.js object
 * @param {string} name - Geometry name
 * @returns {Object|null} Geometry object for ThreeViewer
 */
const convertThreeObjectToGeometry = (object3d, name) => {
  if (!object3d) return null;
  
  // Return the Three.js object directly - ThreeViewer should be able to handle it
  // Or extract mesh data if needed
  const meshes = [];
  object3d.traverse((child) => {
    if (child.isMesh && child.geometry) {
      meshes.push(child);
    }
  });
  
  if (meshes.length > 0) {
    console.log(`[rhinoConverter] Found ${meshes.length} meshes in object`);
    // Return the first mesh's geometry data or the whole object
    return {
      type: 'three-object',
      object: object3d,
      name: name
    };
  }
  
  return null;
};

/**
 * DEPRECATED: Old method using rhino3dm directly
 * Converts a single Rhino object to ThreeViewer geometry format
 * @param {Object} rhinoObj - Decoded Rhino geometry object
 * @param {Object} rhino - rhino3dm instance
 * @returns {Object|null} Geometry with vertices and faces arrays
 */
const convertRhinoObjectToGeometry = (rhinoObj, rhino) => {
  // Handle Mesh
  if (rhinoObj instanceof rhino.Mesh) {
    const vertices = [];
    const faces = [];

    // Extract vertices
    for (let i = 0; i < rhinoObj.vertices().count; i++) {
      const pt = rhinoObj.vertices().get(i);
      vertices.push([pt.x, pt.y, pt.z]);
    }

    // Extract faces
    for (let i = 0; i < rhinoObj.faces().count; i++) {
      const face = rhinoObj.faces().get(i);
      
      if (face.isTriangle) {
        // Triangle face
        faces.push([face.a, face.b, face.c]);
      } else {
        // Quad face - split into two triangles
        faces.push([face.a, face.b, face.c]);
        faces.push([face.a, face.c, face.d]);
      }
    }

    return { vertices, faces };
  }

  // Handle Brep (convert to mesh first)
  if (rhinoObj instanceof rhino.Brep) {
    const meshes = rhinoObj.createMesh(rhino.MeshType.Default);
    if (meshes && meshes.count > 0) {
      // For multiple meshes, merge them
      const allVertices = [];
      const allFaces = [];
      let vertexOffset = 0;

      for (let m = 0; m < meshes.count; m++) {
        const mesh = meshes.get(m);
        
        // Extract vertices
        for (let i = 0; i < mesh.vertices().count; i++) {
          const pt = mesh.vertices().get(i);
          allVertices.push([pt.x, pt.y, pt.z]);
        }

        // Extract faces with vertex offset
        for (let i = 0; i < mesh.faces().count; i++) {
          const face = mesh.faces().get(i);
          
          if (face.isTriangle) {
            allFaces.push([
              face.a + vertexOffset,
              face.b + vertexOffset,
              face.c + vertexOffset
            ]);
          } else {
            allFaces.push([
              face.a + vertexOffset,
              face.b + vertexOffset,
              face.c + vertexOffset
            ]);
            allFaces.push([
              face.a + vertexOffset,
              face.c + vertexOffset,
              face.d + vertexOffset
            ]);
          }
        }

        vertexOffset += mesh.vertices().count;
      }

      return { vertices: allVertices, faces: allFaces };
    }
  }

  // Handle Curve (convert to polyline)
  if (rhinoObj instanceof rhino.Curve) {
    // Sample points along curve and create line segments
    const pointCount = 50;
    const vertices = [];
    const faces = []; // Lines don't have faces in this format
    
    for (let i = 0; i <= pointCount; i++) {
      const t = i / pointCount;
      const pt = rhinoObj.pointAt(rhinoObj.domain.min + t * (rhinoObj.domain.max - rhinoObj.domain.min));
      vertices.push([pt[0], pt[1], pt[2]]);
    }

    // For curves, we could create a tube mesh or just return points
    // For now, return null as ThreeViewer expects meshes
    console.warn('Curve geometry not yet supported for visualization');
    return null;
  }

  console.warn('Unsupported Rhino geometry type:', rhinoObj.constructor.name);
  return null;
};

export default convertRhinoComputeToThreeViewer;
