import { Canvas } from '@react-three/fiber';
import { BreathingSphere, HaloSphere } from './BreathingSphere.jsx';
import { Lighting } from './Lighting.jsx';

/**
 * The 3D therapy scene. Built into a fixed-position div so the UI overlays
 * float above it cleanly.
 */
export function Scene({ breathScale, stress, opacity }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        // Deep, warm-shadowed gradient — calmer than pure black, less clinical.
        background:
          'radial-gradient(ellipse at 50% 40%, #1a2f44 0%, #0e1a28 45%, #060d14 100%)',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <Lighting />
        <HaloSphere opacity={opacity} />
        <BreathingSphere
          breathScale={breathScale}
          stress={stress}
          opacity={opacity}
        />
      </Canvas>
    </div>
  );
}
