import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function Bunny() {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh castShadow receiveShadow position={[-0.25, 0.9, 0.2]} rotation={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.07, 0.04, 0.5, 16]} />
        <meshStandardMaterial color="#ffb6c1" />
      </mesh>
      <mesh castShadow receiveShadow position={[0.25, 0.9, 0.2]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.07, 0.04, 0.5, 16]} />
        <meshStandardMaterial color="#ffb6c1" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.05, 0.2]}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh castShadow receiveShadow position={[-0.12, 0.55, 0.5]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh castShadow receiveShadow position={[0.12, 0.55, 0.5]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.45, 0.55]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#ff69b4" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, -0.1, -0.1]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh castShadow receiveShadow position={[-0.18, -0.3, 0.05]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh castShadow receiveShadow position={[0.18, -0.3, 0.05]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, -0.5, -0.15]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

function BunnyPage() {
  return (
    <Container sx={{ py: 4 }} maxWidth="md">
      <Typography variant="h4" gutterBottom>
        3D Bunny
      </Typography>
      <Typography variant="body1" gutterBottom>
        Drag, rotate, and zoom to explore the bunny in 3D.
      </Typography>
      <Box
        sx={{
          mt: 3,
          height: 400,
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          background:
            'radial-gradient(circle at top, #fdfbfb 0%, #ebedee 45%, #dde1e7 100%)',
        }}
      >
        <Canvas
          shadows
          camera={{ position: [2.5, 2, 3], fov: 45 }}
          style={{ width: '100%', height: '100%' }}
        >
          <color attach="background" args={[0xf0f0f0]} />
          <ambientLight intensity={0.4} />
          <directionalLight
            castShadow
            position={[4, 6, 4]}
            intensity={0.9}
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <group position={[0, -0.4, 0]}>
            <Bunny />
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]}>
              <circleGeometry args={[2.2, 64]} />
              <meshStandardMaterial color="#f5f5f5" />
            </mesh>
          </group>
          <OrbitControls enableDamping dampingFactor={0.1} maxPolarAngle={Math.PI - 0.9} />
        </Canvas>
      </Box>
    </Container>
  );
}

export default BunnyPage;
