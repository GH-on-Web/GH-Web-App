/**
 * Utility to convert Rhino.Compute geometry responses to ThreeViewer format
 */

import rhino3dm from 'rhino3dm';

/**
 * Converts Rhino.Compute solve result to ThreeViewer geometry format
 * @param {Object} solveResult - Response from Rhino.Compute /grasshopper endpoint
 * @returns {Promise<Array>} Array of geometry objects with vertices and faces
 */
export const convertRhinoComputeToThreeViewer = async (solveResult) => {
  if (!solveResult || !solveResult.values) {
    console.warn('Invalid solve result');
    return [];
  }

  try {
    const rhino = await rhino3dm();
    const geometries = [];

    for (const param of solveResult.values) {
      if (!param.InnerTree) continue;

      for (const key in param.InnerTree) {
        const items = param.InnerTree[key];
        
        for (const item of items) {
          // Check if this is Rhino geometry
          if (item.type && item.data && item.type.startsWith('Rhino.Geometry')) {
            try {
              // Decode base64 to binary
              const buffer = Uint8Array.from(atob(item.data), c => c.charCodeAt(0));
              const obj = rhino.CommonObject.decode(buffer.buffer);
              
              if (obj) {
                const geometry = convertRhinoObjectToGeometry(obj, rhino);
                if (geometry) {
                  geometries.push(geometry);
                }
              }
            } catch (err) {
              console.error('Failed to decode Rhino geometry:', err);
            }
          }
        }
      }
    }

    return geometries;
  } catch (err) {
    console.error('Failed to initialize rhino3dm:', err);
    return [];
  }
};

/**
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
