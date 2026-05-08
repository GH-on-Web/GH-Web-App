import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Sphere, Environment } from '@react-three/drei';
import { useMediaQuery, useTheme } from '@mui/material';
import useViewModeStore from '../store/viewModeStore';
import useThemeStore from '../store/themeStore';

function Scene() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* 3D Objects */}
      <Box position={[-2, 0, 0]} args={[1, 1, 1]}>
        <meshStandardMaterial color="#4fc3f7" />
      </Box>

      <Sphere position={[2, 0, 0]} args={[0.7, 32, 32]}>
        <meshStandardMaterial color="#ab47bc" />
      </Sphere>

      <Box position={[0, -1.5, 0]} args={[8, 0.2, 8]}>
        <meshStandardMaterial color="#666666" />
      </Box>

      {/* Camera Controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={20}
      />

      {/* Environment for reflections */}
      <Environment preset="sunset" />
    </>
  );
}

function Scene3D() {
  const { mode: viewMode } = useViewModeStore();
  const muiTheme = useTheme();

  // Use MUI theme's palette mode directly
  const canvasBackground = muiTheme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5';

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: viewMode === '3d' ? 'auto' : 'none',
      }}
    >
      <Canvas
        camera={{ position: [5, 5, 5], fov: 50 }}
        style={{ background: canvasBackground }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}

export default Scene3D;
