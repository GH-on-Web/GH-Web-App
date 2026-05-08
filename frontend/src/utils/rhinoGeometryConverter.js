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
  console.log('[rhinoConverter] Raw item structure:', {
    type: item.type,
    dataType: typeof item.data,
    dataPreview: typeof item.data === 'string' ? item.data.substring(0, 100) : item.data
  });

  try {
    // Check if item.data is already an object or a string
    let payload;
    if (typeof item.data === 'string') {
      console.log('[rhinoConverter] Parsing item.data as JSON...');
      payload = JSON.parse(item.data);
    } else {
      console.log('[rhinoConverter] item.data is already an object');
      payload = item.data;
    }

    console.log('[rhinoConverter] Payload structure:', {
      keys: Object.keys(payload),
      hasData: 'data' in payload,
      dataType: typeof payload.data,
      dataLength: payload.data?.length
    });

    // The payload.data should be the base64 OpenNURBS data
    const base64 = payload.data;

    if (!base64) {
      console.error('[rhinoConverter] No data field in payload');
      return null;
    }

    console.log('[rhinoConverter] Base64 data length:', base64.length);
    console.log('[rhinoConverter] Base64 preview:', base64.substring(0, 50) + '...');

    // Decode to bytes
    const binary = atob(base64);
    console.log('[rhinoConverter] Decoded binary length:', binary.length);

    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    console.log('[rhinoConverter] Byte array created, length:', bytes.length);
    console.log('[rhinoConverter] First 20 bytes:', Array.from(bytes.slice(0, 20)));

    // Use File3dm.fromByteArray to read the serialized data
    console.log('[rhinoConverter] Calling File3dm.fromByteArray...');
    const doc = rhino.File3dm.fromByteArray(bytes);

    if (!doc) {
      console.error('[rhinoConverter] File3dm.fromByteArray returned null');
      console.error('[rhinoConverter] This usually means the data is not in 3dm file format');
      console.error('[rhinoConverter] Trying alternative: direct geometry decode...');

      // Try decoding as a raw geometry object instead of a file
      try {
        // Rhino Compute returns individual geometry objects with version/archive3dm metadata
        // We need to use the decode method from the geometry class itself

        console.log('[rhinoConverter] Available rhino object methods:', Object.keys(rhino).filter(k => k.includes('decode') || k.includes('Decode')));

        // Try using the type-specific decoder first (e.g., Brep.decode)
        const geometryType = item.type.split('.').pop(); // Get 'Brep' from 'Rhino.Geometry.Brep'
        console.log('[rhinoConverter] Trying type-specific decoder for:', geometryType);

        if (rhino[geometryType]) {
          console.log(`[rhinoConverter] ${geometryType} class available`);
          console.log(`[rhinoConverter] ${geometryType} methods:`, Object.getOwnPropertyNames(rhino[geometryType]));

          if (typeof rhino[geometryType].decode === 'function') {
            console.log(`[rhinoConverter] Attempting ${geometryType}.decode with payload object...`);
            console.log('[rhinoConverter] Payload being passed:', payload);

            try {
              const geomObject = rhino[geometryType].decode(payload);

              if (geomObject) {
                console.log(`[rhinoConverter] Successfully decoded as ${geometryType}:`, geomObject.constructor.name);

                // Create a temporary document and add the object to it
                const tempDoc = new rhino.File3dm();
                const attributes = new rhino.ObjectAttributes();
                tempDoc.objects().add(geomObject, attributes);

                console.log('[rhinoConverter] Created temporary document with geometry');
                return tempDoc;
              } else {
                console.error(`[rhinoConverter] ${geometryType}.decode returned null`);
              }
            } catch (decodeErr) {
              console.error(`[rhinoConverter] ${geometryType}.decode threw error:`, decodeErr);
            }
          } else {
            console.error(`[rhinoConverter] ${geometryType}.decode is not available`);
          }
        } else {
          console.error(`[rhinoConverter] ${geometryType} class not found on rhino object`);
          console.log('[rhinoConverter] Available rhino geometry classes:', Object.keys(rhino).filter(k => k.match(/^[A-Z]/)));
        }

        // Try CommonObject.decode as fallback
        if (rhino.CommonObject && typeof rhino.CommonObject.decode === 'function') {
          console.log('[rhinoConverter] Attempting CommonObject.decode with payload object...');
          try {
            const geomObject = rhino.CommonObject.decode(payload);

            if (geomObject) {
              console.log('[rhinoConverter] Successfully decoded as CommonObject:', geomObject.constructor.name);

              // Create a temporary document and add the object to it
              const tempDoc = new rhino.File3dm();
              const attributes = new rhino.ObjectAttributes();
              tempDoc.objects().add(geomObject, attributes);

              console.log('[rhinoConverter] Created temporary document with geometry');
              return tempDoc;
            } else {
              console.error('[rhinoConverter] CommonObject.decode returned null');
            }
          } catch (commonObjErr) {
            console.error('[rhinoConverter] CommonObject.decode threw error:', commonObjErr);
          }
        }

      } catch (e) {
        console.error('[rhinoConverter] Could not decode geometry:', e);
        console.error('[rhinoConverter] Error stack:', e.stack);
      }

      return null;
    }

    console.log('[rhinoConverter] File3dm successfully created');
    return doc;

  } catch (err) {
    console.error('[rhinoConverter] Error in decodeRhinoGeometry:', err);
    console.error('[rhinoConverter] Stack:', err.stack);
    return null;
  }
};

/**
 * Converts Rhino.Compute solve result to ThreeViewer geometry format
 * @param {Object} solveResult - Response from Rhino.Compute /grasshopper endpoint
 * @returns {Promise<Array>} Array of geometry objects with vertices and faces
 */
export const convertRhinoComputeToThreeViewer = async (solveResult) => {
  console.log('[rhinoConverter] === STARTING CONVERSION ===');
  console.log('[rhinoConverter] Solve result structure:', {
    hasValues: !!solveResult?.values,
    valuesLength: solveResult?.values?.length,
    valuesPreview: solveResult?.values?.map(v => ({
      ParamName: v.ParamName,
      hasInnerTree: !!v.InnerTree,
      InnerTreeKeys: v.InnerTree ? Object.keys(v.InnerTree) : []
    }))
  });

  if (!solveResult || !solveResult.values) {
    console.warn('[rhinoConverter] Invalid solve result');
    return [];
  }

  const rhino = await initRhino();
  const geometries = [];

  for (const param of solveResult.values) {
    console.log('[rhinoConverter] Processing parameter:', param.ParamName);

    if (!param.InnerTree) {
      console.log('[rhinoConverter] No InnerTree for', param.ParamName);
      continue;
    }

    for (const key in param.InnerTree) {
      const items = param.InnerTree[key];
      console.log(`[rhinoConverter] InnerTree key: ${key}, items count: ${items.length}`);

      for (const item of items) {
        console.log('[rhinoConverter] Item:', {
          type: item.type,
          hasData: !!item.data,
          dataType: typeof item.data
        });

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
                console.log('[rhinoConverter] Converting Brep to mesh using face render meshes');

                // Extract render meshes from Brep faces
                // Note: rhino.Mesh.createFromBrep() does NOT exist in rhino3dm.js
                // rhino3dm cannot perform meshing operations - we need to extract embedded render meshes
                const meshes = [];
                const faces = geom.faces();

                for (let f = 0; f < faces.count; f++) {
                  const face = faces.get(f);
                  // Try to get the render mesh for this face
                  const mesh = face.getMesh(rhino.MeshType.Any);

                  if (mesh) {
                    meshes.push(mesh);
                  }
                }

                if (meshes.length > 0) {
                  console.log('[rhinoConverter] Extracted', meshes.length, 'render meshes from Brep faces');

                  for (const mesh of meshes) {
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
                } else {
                  console.warn('[rhinoConverter] No render meshes found in Brep.');
                  console.warn('[rhinoConverter] SOLUTION: Add a Mesh component in Grasshopper before the output component to convert Breps to meshes.');
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

    // Log first few vertices to debug structure
    if (i < 5) {
      console.log(`[rhinoConverter] Vertex ${i}:`, v, `-> [${v[0]}, ${v[1]}, ${v[2]}]`);
    }

    // rhino3dm vertices might be accessed as array indices [0], [1], [2] instead of .x, .y, .z
    const x = v[0] !== undefined ? v[0] : v.x;
    const y = v[1] !== undefined ? v[1] : v.y;
    const z = v[2] !== undefined ? v[2] : v.z;

    vertices.push(x, y, z);
  }
  
  // Extract faces
  for (let i = 0; i < rhinoMesh.faces().count; i++) {
    const face = rhinoMesh.faces().get(i);

    // Log first few faces to debug structure
    if (i < 3) {
      console.log(`[rhinoConverter] Face ${i}:`, face, `-> [${face[0]}, ${face[1]}, ${face[2]}, ${face[3]}]`);
    }

    // Faces are arrays [a, b, c, d] where d might equal c for triangles
    const a = face[0];
    const b = face[1];
    const c = face[2];
    const d = face[3];

    // Check if it's a triangle (d equals c) or quad
    if (c === d) {
      // Triangle
      indices.push(a, b, c);
    } else {
      // Quad - split into two triangles
      indices.push(a, b, c);
      indices.push(a, c, d);
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
