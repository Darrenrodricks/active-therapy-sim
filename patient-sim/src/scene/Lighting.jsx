/**
 * Lighting. We want soft, even illumination with a subtle warm/cool contrast.
 * No hard shadows — this is meant to feel like dawn light through a curtain,
 * not a stage spotlight.
 */
export function Lighting() {
  return (
    <>
      {/* Soft fill so nothing goes pitch black. */}
      <ambientLight intensity={0.35} color="#a8c5e0" />

      {/* Cool key from above-left. */}
      <directionalLight
        position={[-3, 4, 2]}
        intensity={0.6}
        color="#cfe3f5"
      />

      {/* Warm rim from behind-right to separate the sphere from the background. */}
      <pointLight
        position={[3, -1, -2]}
        intensity={0.5}
        color="#f5b896"
        distance={10}
      />

      {/* Subtle bottom bounce. */}
      <pointLight
        position={[0, -3, 1]}
        intensity={0.25}
        color="#4a7ba8"
        distance={6}
      />
    </>
  );
}
