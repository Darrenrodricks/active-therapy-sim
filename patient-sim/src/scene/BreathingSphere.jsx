import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

/**
 * The breathing sphere. It does three things:
 *  1. Slowly expands and contracts on a sine wave to mimic deep breathing.
 *  2. Pulses faster when the simulated heart rate climbs.
 *  3. Distorts organically, like a slow-moving liquid surface.
 *
 * The visual is intentionally soft — no hard edges, no sharp highlights.
 * It should feel like something a person could fall asleep watching.
 */
export function BreathingSphere({ heartRate = 72, stress = 20, opacity = 1 }) {
  const meshRef = useRef();
  const materialRef = useRef();

  // Breathing frequency: ~6 breaths/min at rest = ~0.1 Hz. We scale slightly
  // with heart rate so anxious patients see a faster pulse (which the
  // ramp-up will then walk down — visual biofeedback).
  const breathingHz = useMemo(() => {
    const baseline = 0.1; // 6 cycles/min
    const hrFactor = Math.max(0.6, Math.min(1.8, heartRate / 72));
    return baseline * hrFactor;
  }, [heartRate]);

  useFrame((state) => {
    if (!meshRef.current) return;

    const t = state.clock.elapsedTime;

    // The expand/contract sine wave. Range is roughly 0.92..1.08 of base scale.
    const breath = 1 + Math.sin(t * breathingHz * Math.PI * 2) * 0.08;
    meshRef.current.scale.setScalar(breath);

    // Slow drift rotation so the surface doesn't look static.
    meshRef.current.rotation.y = t * 0.04;
    meshRef.current.rotation.x = Math.sin(t * 0.03) * 0.1;

    // Distortion amplitude tracks stress — calm = smooth, stressed = turbulent.
    if (materialRef.current) {
      const targetDistort = 0.15 + (stress / 100) * 0.25;
      materialRef.current.distort = THREE.MathUtils.lerp(
        materialRef.current.distort,
        targetDistort,
        0.02,
      );
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.4, 128, 128]} />
      <MeshDistortMaterial
        ref={materialRef}
        color="#5fa8d3"
        emissive="#1e3a5f"
        emissiveIntensity={0.4}
        roughness={0.35}
        metalness={0.1}
        distort={0.18}
        speed={0.6}
        transparent
        opacity={opacity}
      />
    </mesh>
  );
}

/**
 * A second, larger, slower sphere behind the main one for atmospheric depth.
 * It catches the light differently and creates a halo effect.
 */
export function HaloSphere({ opacity = 1 }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    const breath = 1 + Math.sin(t * 0.08 * Math.PI * 2 + Math.PI / 3) * 0.04;
    meshRef.current.scale.setScalar(breath * 1.8);
    meshRef.current.rotation.y = -t * 0.02;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.4, 64, 64]} />
      <meshBasicMaterial
        color="#2a5a85"
        transparent
        opacity={opacity * 0.12}
        side={THREE.BackSide}
      />
    </mesh>
  );
}
