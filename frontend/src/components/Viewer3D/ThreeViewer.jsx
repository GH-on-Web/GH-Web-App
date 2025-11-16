import React, { Suspense, useMemo, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera } from '@react-three/drei';
import { Box, Typography, useTheme } from '@mui/material';
import * as THREE from 'three';

/**
 * DemoGeometry - Component that renders demo geometry types
 */
function DemoGeometry({ geometry }) {
  const meshRef = useRef();
  
  const twistedBoxGeometry = useMemo(() => {
    if (geometry.type !== 'twisted-box') return null;
    
    const { width = 10, height = 10, depth = 50, twist = Math.PI / 2, segments = 20 } = geometry;
    
    // Create a twisted box by creating a segmented box and rotating each segment
    const geo = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    
    for (let i = 0; i <= segments; i++) {
      const z = (i / segments - 0.5) * depth;
      const rotation = (i / segments) * twist;
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      
      // Four corners of this segment
      const corners = [
        [-width/2, -height/2],
        [width/2, -height/2],
        [width/2, height/2],
        [-width/2, height/2]
      ];
      
      corners.forEach(([x, y]) => {
        // Apply rotation around Z axis
        const rx = x * cos - y * sin;
        const ry = x * sin + y * cos;
        vertices.push(rx, ry, z);
      });
      
      // Create faces between this segment and the previous one
      if (i > 0) {
        const base = (i - 1) * 4;
        const top = i * 4;
        
        // Four faces per segment
        for (let j = 0; j < 4; j++) {
          const next = (j + 1) % 4;
          // Triangle 1
          indices.push(base + j, base + next, top + j);
          // Triangle 2
          indices.push(base + next, top + next, top + j);
        }
      }
    }
    
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    
    return geo;
  }, [geometry]);
  
  if (geometry.type === 'twisted-box' && twistedBoxGeometry) {
    return (
      <mesh ref={meshRef} geometry={twistedBoxGeometry}>
        <meshStandardMaterial 
          color={geometry.color ? new THREE.Color(...geometry.color.slice(0, 3)) : '#4CAF50'} 
          side={THREE.DoubleSide} 
        />
      </mesh>
    );
  }
  
  // Fallback for other demo types
  return (
    <mesh position={geometry.position || [0, 0, 0]}>
      <boxGeometry args={[geometry.width || 2, geometry.height || 2, geometry.depth || 2]} />
      <meshStandardMaterial 
        color={geometry.color ? new THREE.Color(...geometry.color.slice(0, 3)) : '#2196F3'} 
      />
    </mesh>
  );
}

/**
 * MeshGeometry - Component that renders a single mesh from vertices and faces
 */
function MeshGeometry({ vertices, faces }) {
  const geometry = useMemo(() => {
    if (!vertices || !faces) {
      console.warn('MeshGeometry: Missing vertices or faces', { vertices, faces });
      return null;
    }

    console.log('MeshGeometry: Creating geometry', {
      vertexCount: vertices.length,
      faceCount: faces.length,
      firstVertex: vertices[0],
      firstFace: faces[0]
    });

    const geo = new THREE.BufferGeometry();
    
    // Flatten vertices array for Three.js
    const positions = new Float32Array(vertices.length * 3);
    vertices.forEach((vertex, i) => {
      if (!Array.isArray(vertex) || vertex.length < 3) {
        console.error(`Invalid vertex at index ${i}:`, vertex);
        return;
      }
      positions[i * 3] = vertex[0];
      positions[i * 3 + 1] = vertex[1];
      positions[i * 3 + 2] = vertex[2];
    });
    
    // Flatten faces array for Three.js (indices)
    const indices = new Uint32Array(faces.length * 3);
    faces.forEach((face, i) => {
      if (!Array.isArray(face) || face.length < 3) {
        console.error(`Invalid face at index ${i}:`, face);
        return;
      }
      // Validate indices
      if (face[0] >= vertices.length || face[1] >= vertices.length || face[2] >= vertices.length) {
        console.error(`Face ${i} has invalid indices:`, face, `(max vertex index: ${vertices.length - 1})`);
      }
      indices[i * 3] = face[0];
      indices[i * 3 + 1] = face[1];
      indices[i * 3 + 2] = face[2];
    });
    
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    geo.computeVertexNormals();
    
    console.log('MeshGeometry: Geometry created', {
      positionCount: positions.length,
      indexCount: indices.length,
      boundingBox: geo.boundingBox
    });
    
    return geo;
  }, [vertices, faces]);

  if (!geometry) return null;

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#4CAF50" side={THREE.DoubleSide} />
    </mesh>
  );
}

/**
 * ThreeObject - Component that renders a Three.js Object3D from Rhino3dmLoader
 */
function ThreeObject({ object }) {
  if (!object) return null;
  
  // The object is already a Three.js Object3D with meshes
  // We can use primitive to add it directly to the scene
  return <primitive object={object} />;
}

/**
 * SceneContent - Renders all geometry meshes
 */
function SceneContent({ geometry, theme }) {
  if (!geometry) {
    console.log('SceneContent: No geometry provided');
    return null;
  }

  // Check if this is a Three.js object from Rhino3dmLoader
  if (geometry.type === 'three-object' && geometry.object) {
    console.log('SceneContent: Rendering Three.js object from Rhino');
    return (
      <>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        <ThreeObject object={geometry.object} />
        <Grid 
          args={[10, 10]} 
          cellColor={theme?.palette?.mode === 'dark' ? '#6f6f6f' : '#cccccc'} 
          sectionColor={theme?.palette?.mode === 'dark' ? '#9d9d9d' : '#999999'} 
        />
      </>
    );
  }

  // Check if this is demo geometry
  if (geometry.type) {
    console.log('[ThreeViewer] ⚠️ RENDERING DEMO/PLACEHOLDER GEOMETRY ⚠️');
    console.log('[ThreeViewer] Demo geometry type:', geometry.type);
    return (
      <>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        <DemoGeometry geometry={geometry} />
        <Grid 
          args={[10, 10]} 
          cellColor={theme?.palette?.mode === 'dark' ? '#6f6f6f' : '#cccccc'} 
          sectionColor={theme?.palette?.mode === 'dark' ? '#9d9d9d' : '#999999'} 
        />
      </>
    );
  }

  const meshes = Array.isArray(geometry) ? geometry : [geometry];
  // console.log('SceneContent: Rendering', meshes.length, 'mesh(es)');

  // Check if the array contains three-objects
  const hasThreeObjects = meshes.length > 0 && meshes[0].type === 'three-object';

  if (hasThreeObjects) {
    // console.log('SceneContent: Rendering array of Three.js objects');

    // Log details about each object
    meshes.forEach((item, index) => {
      const mesh = item.object;
      if (mesh?.geometry) {
        const positions = mesh.geometry.attributes.position;
        const vertexCount = positions ? positions.count : 0;
        const indexCount = mesh.geometry.index ? mesh.geometry.index.count : 0;
        // console.log(`[ThreeViewer] Object ${index} - Name: "${item.name}", Vertices: ${vertexCount}, Faces: ${indexCount / 3}, Type: ${item.type}`);

        // Log bounding box to check geometry scale
        mesh.geometry.computeBoundingBox();
        const bbox = mesh.geometry.boundingBox;
        // if (bbox) {
        //   console.log(`[ThreeViewer] Object ${index} - BoundingBox min: [${bbox.min.x}, ${bbox.min.y}, ${bbox.min.z}], max: [${bbox.max.x}, ${bbox.max.y}, ${bbox.max.z}]`);
        // } else {
        //   console.log(`[ThreeViewer] Object ${index} - BoundingBox: null`);
        // }
      }
    });

    return (
      <>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />

        {meshes.map((item, index) => (
          <ThreeObject key={index} object={item.object} />
        ))}

        <Grid
          args={[10, 10]}
          cellColor={theme?.palette?.mode === 'dark' ? '#6f6f6f' : '#cccccc'}
          sectionColor={theme?.palette?.mode === 'dark' ? '#9d9d9d' : '#999999'}
        />
      </>
    );
  }

  // Default: handle meshes with vertices and faces
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />

      {meshes.map((mesh, index) => {
        console.log(`SceneContent: Rendering mesh ${index}`, {
          hasVertices: !!mesh.vertices,
          hasFaces: !!mesh.faces,
          vertexCount: mesh.vertices?.length,
          faceCount: mesh.faces?.length
        });
        return (
          <MeshGeometry
            key={index}
            vertices={mesh.vertices}
            faces={mesh.faces}
          />
        );
      })}

      <Grid
        args={[10, 10]}
        cellColor={theme?.palette?.mode === 'dark' ? '#6f6f6f' : '#cccccc'}
        sectionColor={theme?.palette?.mode === 'dark' ? '#9d9d9d' : '#999999'}
      />
    </>
  );
}

/**
 * ThreeViewer - 3D geometry visualization using Three.js
 * Displays computed geometry results from backend
 */
function ThreeViewer({ geometry }) {
  const containerRef = useRef(null);
  const theme = useTheme();

  // Suppress ResizeObserver errors for this component
  useEffect(() => {
    const resizeObserverLoopErrRe = /^[^(]*ResizeObserver loop/;
    const resizeObserverLoopLimitErrRe = /^[^(]*ResizeObserver loop limit exceeded/;
    
    const originalError = window.console.error;
    const originalWarn = window.console.warn;
    
    window.console.error = (...args) => {
      if (
        args.length > 0 &&
        typeof args[0] === 'string' &&
        (resizeObserverLoopErrRe.test(args[0]) || resizeObserverLoopLimitErrRe.test(args[0]))
      ) {
        return;
      }
      originalError.apply(console, args);
    };
    
    window.console.warn = (...args) => {
      if (
        args.length > 0 &&
        typeof args[0] === 'string' &&
        (resizeObserverLoopErrRe.test(args[0]) || resizeObserverLoopLimitErrRe.test(args[0]))
      ) {
        return;
      }
      originalWarn.apply(console, args);
    };

    return () => {
      window.console.error = originalError;
      window.console.warn = originalWarn;
    };
  }, []);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          3D Viewer
        </Typography>
        {geometry && (
          <Typography variant="caption" color="text.secondary">
            {Array.isArray(geometry) ? `${geometry.length} mesh(es)` : '1 mesh'}
          </Typography>
        )}
      </Box>
      
      <Box 
        ref={containerRef}
        sx={{ 
          flexGrow: 1, 
          position: 'relative', 
          bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
          overflow: 'hidden' 
        }}
      >
        {geometry ? (
          <Canvas
            gl={{ antialias: true, alpha: false }}
            onCreated={({ gl }) => {
              gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            }}
            style={{ width: '100%', height: '100%', display: 'block' }}
            dpr={[1, 2]}
            frameloop="always"
          >
            <PerspectiveCamera makeDefault position={[30, 30, 30]} fov={50} up={[0, 0, 1]} />
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={1}
              maxDistance={200}
            />
            <Suspense fallback={null}>
              <SceneContent geometry={geometry} theme={theme} />
            </Suspense>
          </Canvas>
        ) : (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
            }}
          >
            <Typography variant="body2">
              No geometry to display. Click Compute to generate geometry.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default ThreeViewer;

