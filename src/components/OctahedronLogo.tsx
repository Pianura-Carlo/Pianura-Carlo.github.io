import React, { useEffect, useRef, useState } from 'react';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface ProjectedPoint extends Point3D {
  perspective: number;
}

interface Face {
  v: [number, number, number];
  baseColor: { r: number; g: number; b: number };
}

const VERTICES: Point3D[] = [
  { x: 0, y: -1.3, z: 0 },
  { x: 0, y: 1.3, z: 0 },
  { x: 1, y: 0, z: 1 },
  { x: -1, y: 0, z: 1 },
  { x: -1, y: 0, z: -1 },
  { x: 1, y: 0, z: -1 },
];

const FACES: Face[] = [
  { v: [0, 2, 3], baseColor: { r: 248, g: 113, b: 176 } },
  { v: [0, 5, 2], baseColor: { r: 236, g: 72, b: 153 } },
  { v: [0, 4, 5], baseColor: { r: 219, g: 39, b: 119 } },
  { v: [0, 3, 4], baseColor: { r: 190, g: 24, b: 93 } },
  { v: [1, 3, 2], baseColor: { r: 219, g: 39, b: 119 } },
  { v: [1, 2, 5], baseColor: { r: 190, g: 24, b: 93 } },
  { v: [1, 5, 4], baseColor: { r: 157, g: 23, b: 77 } },
  { v: [1, 4, 3], baseColor: { r: 131, g: 24, b: 67 } },
];

const INITIAL_ROTATION = { x: 0.34, y: 0.42 };
const TWO_PI = Math.PI * 2;
const VIEWBOX_CENTER = 210;
const MODEL_SCALE = 126;
const CAMERA_DISTANCE = 5.2;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const rotateY = (point: Point3D, angle: number): Point3D => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return {
    x: point.x * cos - point.z * sin,
    y: point.y,
    z: point.x * sin + point.z * cos,
  };
};

const rotateX = (point: Point3D, angle: number): Point3D => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return {
    x: point.x,
    y: point.y * cos - point.z * sin,
    z: point.y * sin + point.z * cos,
  };
};

const getNormal = (v0: Point3D, v1: Point3D, v2: Point3D): Point3D => {
  const ab = { x: v1.x - v0.x, y: v1.y - v0.y, z: v1.z - v0.z };
  const ac = { x: v2.x - v0.x, y: v2.y - v0.y, z: v2.z - v0.z };
  const normal = {
    x: ab.y * ac.z - ab.z * ac.y,
    y: ab.z * ac.x - ab.x * ac.z,
    z: ab.x * ac.y - ab.y * ac.x,
  };
  const length = Math.hypot(normal.x, normal.y, normal.z) || 1;

  return {
    x: normal.x / length,
    y: normal.y / length,
    z: normal.z / length,
  };
};

const project = (point: Point3D): ProjectedPoint => {
  const perspective = CAMERA_DISTANCE / (CAMERA_DISTANCE - point.z);

  return {
    x: VIEWBOX_CENTER + point.x * MODEL_SCALE * perspective,
    y: VIEWBOX_CENTER + point.y * MODEL_SCALE * perspective,
    z: point.z,
    perspective,
  };
};

export default function OctahedronLogo() {
  const [rotation, setRotation] = useState(INITIAL_ROTATION);
  const [isHovered, setIsHovered] = useState(false);
  const rotationRef = useRef(INITIAL_ROTATION);
  const velocityXRef = useRef(0.42);
  const previousPointerRef = useRef({ x: 0, y: 0, time: 0 });
  const isDraggingRef = useRef(false);
  const isHoveredRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    isHoveredRef.current = isHovered;
  }, [isHovered]);

  useEffect(() => {
    let lastTime = performance.now();

    const animate = (time: number) => {
      const deltaSeconds = Math.min((time - lastTime) / 1000, 0.04);
      lastTime = time;

      if (!isDraggingRef.current) {
        const targetVelocity = isHoveredRef.current ? 0.18 : 0.38;
        const blend = 1 - Math.exp(-deltaSeconds * 2.4);
        const idleYaw = INITIAL_ROTATION.y + Math.sin(time * 0.00055) * 0.06;

        velocityXRef.current += (targetVelocity - velocityXRef.current) * blend;
        rotationRef.current = {
          x: (rotationRef.current.x + velocityXRef.current * deltaSeconds) % TWO_PI,
          y: rotationRef.current.y + (idleYaw - rotationRef.current.y) * blend,
        };
        setRotation(rotationRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    previousPointerRef.current = {
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) {
      return;
    }

    const currentTime = performance.now();
    const previousPointer = previousPointerRef.current;
    const deltaX = event.clientX - previousPointer.x;
    const deltaY = event.clientY - previousPointer.y;
    const deltaSeconds = Math.max((currentTime - previousPointer.time) / 1000, 0.016);

    velocityXRef.current = clamp((-deltaY * 0.012) / deltaSeconds, -2.4, 2.4);
    rotationRef.current = {
      x: (rotationRef.current.x - deltaY * 0.012) % TWO_PI,
      y: clamp(rotationRef.current.y - deltaX * 0.006, -0.72, 0.72),
    };
    previousPointerRef.current = {
      x: event.clientX,
      y: event.clientY,
      time: currentTime,
    };
    setRotation(rotationRef.current);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const lightSource = { x: 0.75, y: -0.95, z: 1.4 };
  const lightLength = Math.hypot(lightSource.x, lightSource.y, lightSource.z) || 1;
  const light = {
    x: lightSource.x / lightLength,
    y: lightSource.y / lightLength,
    z: lightSource.z / lightLength,
  };

  const rotatedVertices = VERTICES.map((vertex) => rotateX(rotateY(vertex, rotation.y), rotation.x));
  const projectedVertices = rotatedVertices.map(project);

  const renderedFaces = FACES.map((face, index) => {
    const vertex0 = rotatedVertices[face.v[0]];
    const vertex1 = rotatedVertices[face.v[1]];
    const vertex2 = rotatedVertices[face.v[2]];
    const point0 = projectedVertices[face.v[0]];
    const point1 = projectedVertices[face.v[1]];
    const point2 = projectedVertices[face.v[2]];
    const normal = getNormal(vertex0, vertex1, vertex2);
    const lightDot = normal.x * light.x + normal.y * light.y + normal.z * light.z;
    const intensity = clamp(0.44 + Math.max(lightDot, 0) * 0.48 + normal.z * 0.1, 0.36, 1);

    return {
      index,
      pointsString: `${point0.x},${point0.y} ${point1.x},${point1.y} ${point2.x},${point2.y}`,
      avgZ: (vertex0.z + vertex1.z + vertex2.z) / 3,
      isVisible: normal.z > 0.015,
      color: `rgb(${Math.round(face.baseColor.r * intensity)}, ${Math.round(face.baseColor.g * intensity)}, ${Math.round(face.baseColor.b * intensity)})`,
    };
  });

  const visibleFaces = renderedFaces
    .filter((face) => face.isVisible)
    .sort((a, b) => a.avgZ - b.avgZ);

  return (
    <div
      id="octahedron-logo-container"
      className={`group relative h-[330px] w-[330px] cursor-grab select-none transition-transform duration-500 ease-out active:cursor-grabbing sm:h-[380px] sm:w-[380px] ${
        isHovered ? 'scale-[1.03]' : 'scale-100'
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        isDraggingRef.current = false;
      }}
      role="img"
      aria-label="Rotating octahedron logo"
      style={{ touchAction: 'none' }}
    >
      <div className="pointer-events-none absolute inset-6 -z-10 rounded-full bg-pink-500/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-16 -z-10 rounded-full bg-white/50 blur-2xl dark:bg-pink-200/10" />

      <svg
        id="octahedron-logo-svg"
        viewBox="0 0 420 420"
        className="h-full w-full overflow-visible"
      >
        <defs>
          <filter id="octahedron-soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="4" dy="7" stdDeviation="9" floodColor="#831843" floodOpacity="0.24" />
          </filter>
        </defs>

        <g filter="url(#octahedron-soft-shadow)">
          {visibleFaces.map((face) => (
            <g key={face.index}>
              <polygon
                points={face.pointsString}
                fill={face.color}
                stroke="rgba(17, 24, 39, 0.82)"
                strokeWidth="2.25"
                strokeLinejoin="round"
              />
            </g>
          ))}
        </g>
      </svg>

      <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-pink-500/20 bg-gray-950/80 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
        Drag to Spin
      </div>
    </div>
  );
}
