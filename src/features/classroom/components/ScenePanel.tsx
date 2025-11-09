import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor, AdaptiveDpr } from '@react-three/drei';

interface Props {
  SceneComponent: React.LazyExoticComponent<any>;
}

export default function ScenePanel({ SceneComponent }: Props) {
  return (
    <Canvas camera={{ position: [0, 1.2, 3], fov: 50 }} dpr={[1, 1.5]} onCreated={(state) => { state.gl.setClearColor('#000000', 0); state.invalidate(); }}>
      <PerformanceMonitor>
        <AdaptiveDpr pixelated />
        <Suspense fallback={null}>
          <SceneComponent />
        </Suspense>
      </PerformanceMonitor>
    </Canvas>
  );
}
