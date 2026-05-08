import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import rhino3dm from 'rhino3dm';

/**
 * ThreeViewerRhino - Visualizes Rhino geometry using rhino3dm and Three.js
 * @param {Object} props
 * @param {Object} props.solveResult - The solve result from RhinoCompute (Grasshopper)
 */
const ThreeViewerRhino = ({ solveResult }) => {
  const mountRef = useRef();
  const rhinoRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    let rhinoInstance;
    let scene, renderer, camera, frameId;

    // Initialize rhino3dm and Three.js scene
    rhino3dm().then(rhino => {
      if (!mounted) return;
      rhinoRef.current = rhino;
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf5f5f5);
      camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
      camera.position.set(10, 10, 10);
      camera.lookAt(0, 0, 0);
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(400, 400);
      mountRef.current.appendChild(renderer.domElement);
      sceneRef.current = scene;
      rendererRef.current = renderer;
      cameraRef.current = camera;

      // Parse geometry from solveResult
      if (solveResult && solveResult.values) {
        for (const param of solveResult.values) {
          for (const key in param.InnerTree) {
            for (const item of param.InnerTree[key]) {
              if (item.type && item.data && item.type.startsWith('Rhino.Geometry')) {
                const buffer = Uint8Array.from(atob(item.data), c => c.charCodeAt(0));
                const obj = rhino.CommonObject.decode(buffer.buffer);
                if (obj) {
                  // Convert Rhino geometry to Three.js and add to scene
                  const mesh = rhinoToThree(obj, rhino, THREE);
                  if (mesh) scene.add(mesh);
                }
              }
            }
          }
        }
      }

      // Render loop
      const animate = () => {
        renderer.render(scene, camera);
        frameId = requestAnimationFrame(animate);
      };
      animate();
    });

    return () => {
      mounted = false;
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current.forceContextLoss();
        rendererRef.current.domElement.remove();
      }
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [solveResult]);

  // Helper: Convert Rhino geometry to Three.js mesh
  function rhinoToThree(obj, rhino, THREE) {
    if (obj instanceof rhino.Point3d) {
      const geometry = new THREE.SphereGeometry(0.1, 16, 16);
      geometry.translate(obj.x, obj.y, obj.z);
      const material = new THREE.MeshStandardMaterial({ color: 0x2196f3 });
      return new THREE.Mesh(geometry, material);
    }
    if (obj instanceof rhino.Mesh) {
      const geometry = new THREE.BufferGeometry();
      const vertices = [];
      for (let i = 0; i < obj.vertices().count; i++) {
        const pt = obj.vertices().get(i);
        vertices.push(pt.x, pt.y, pt.z);
      }
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      const faces = [];
      for (let i = 0; i < obj.faces().count; i++) {
        const f = obj.faces().get(i);
        if (f.IsTriangle) {
          faces.push(f.A, f.B, f.C);
        } else {
          faces.push(f.A, f.B, f.C);
          faces.push(f.A, f.C, f.D);
        }
      }
      geometry.setIndex(faces);
      geometry.computeVertexNormals();
      const material = new THREE.MeshStandardMaterial({ color: 0x4caf50, side: THREE.DoubleSide });
      return new THREE.Mesh(geometry, material);
    }
    // Add more geometry types as needed
    return null;
  }

  return <div ref={mountRef} style={{ width: 400, height: 400 }} />;
};

export default ThreeViewerRhino;
