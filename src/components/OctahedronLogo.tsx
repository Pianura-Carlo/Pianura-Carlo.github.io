import React, { useState, useEffect, useRef } from 'react';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

const VERTICES: Point3D[] = [
  { x: 0, y: -1.3, z: 0 },  // 0: top apex
  { x: 0, y: 1.3, z: 0 },   // 1: bottom apex
  { x: 1, y: 0, z: 1 },    // 2: front-right corner
  { x: -1, y: 0, z: 1 },   // 3: front-left corner
  { x: -1, y: 0, z: -1 },  // 4: back-left corner
  { x: 1, y: 0, z: -1 },   // 5: back-right corner
];

// 8 triangular faces
// Winding order determines visibility (normal pointing outwards)
const FACES = [
  // Top half
  { v: [0, 2, 3], baseColor: { r: 244, g: 114, b: 182 }, label: 'pink-front-left' },     // top-front-left (light bright pink)
  { v: [0, 5, 2], baseColor: { r: 236, g: 72, b: 153 }, label: 'pink-front-right' },    // top-front-right (vibrant core pink)
  { v: [0, 4, 5], baseColor: { r: 219, g: 39, b: 119 }, label: 'pink-back-right' },     // top-back-right (deep pink)
  { v: [0, 3, 4], baseColor: { r: 190, g: 24, b: 93 }, label: 'pink-back-left' },       // top-back-left (rose pink)
  
  // Bottom half
  { v: [1, 3, 2], baseColor: { r: 219, g: 39, b: 119 }, label: 'pink-bottom-front-left' },  // bottom-front-left (deep pink)
  { v: [1, 2, 5], baseColor: { r: 190, g: 24, b: 93 }, label: 'pink-bottom-front-right' }, // bottom-front-right (rose pink)
  { v: [1, 5, 4], baseColor: { r: 157, g: 23, b: 77 }, label: 'pink-bottom-back-right' },  // bottom-back-right (dark ruby pink)
  { v: [1, 4, 3], baseColor: { r: 131, g: 24, b: 67 }, label: 'pink-bottom-back-left' },   // bottom-back-left (shadowed deep pink)
];

export default function OctahedronLogo() {
  const [angleX, setAngleX] = useState(0.4);
  const [angleY, setAngleY] = useState(0.5);
  const [isHovered, setIsHovered] = useState(false);
  const isDragging = useRef(false);
  const previousMouse = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Rotation logic
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

  // Continuous auto-rotation when not dragging
  useEffect(() => {
    const animate = () => {
      if (!isDragging.current) {
        setAngleY((prev) => (prev + (isHovered ? 0.005 : 0.015)) % (Math.PI * 2));
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isHovered]);

  // Drag interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    previousMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - previousMouse.current.x;
    const deltaY = e.clientY - previousMouse.current.y;
    
    setAngleY((prev) => (prev + deltaX * 0.015) % (Math.PI * 2));
    setAngleX((prev) => Math.max(-Math.PI / 3, Math.min(Math.PI / 3, prev + deltaY * 0.015)));
    
    previousMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
  };

  // Touch handlers for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    previousMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.touches[0].clientX - previousMouse.current.x;
    const deltaY = e.touches[0].clientY - previousMouse.current.y;
    
    setAngleY((prev) => (prev + deltaX * 0.015) % (Math.PI * 2));
    setAngleX((prev) => Math.max(-Math.PI / 3, Math.min(Math.PI / 3, prev + deltaY * 0.015)));
    
    previousMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  // Light source placed at top-front-right (1.5, -1.5, 2)
  const lightSource = { x: 1, y: -1, z: 1.5 };
  // Normalize light source vector
  const len = Math.sqrt(lightSource.x ** 2 + lightSource.y ** 2 + lightSource.z ** 2);
  const lightNorm = { x: lightSource.x / len, y: lightSource.y / len, z: lightSource.z / len };

  // Project vertices
  const scale = 135;
  const cx = 210;
  const cy = 210;

  const rotatedVertices = VERTICES.map((v) => {
    // 1. Rotate Y, 2. Rotate X
    const ry = rotateY(v, angleY);
    const rx = rotateX(ry, angleX);
    return rx;
  });

  const projectedVertices = rotatedVertices.map((v) => ({
    x: cx + v.x * scale,
    y: cy + v.y * scale,
    z: v.z,
  }));

  // Render and shade faces
  const renderedFaces = FACES.map((face, index) => {
    const v0 = rotatedVertices[face.v[0]];
    const v1 = rotatedVertices[face.v[1]];
    const v2 = rotatedVertices[face.v[2]];

    const p0 = projectedVertices[face.v[0]];
    const p1 = projectedVertices[face.v[1]];
    const p2 = projectedVertices[face.v[2]];

    // Cross product to get surface normal
    const ab = { x: v1.x - v0.x, y: v1.y - v0.y, z: v1.z - v0.z };
    const ac = { x: v2.x - v0.x, y: v2.y - v0.y, z: v2.z - v0.z };
    
    const normal = {
      x: ab.y * ac.z - ab.z * ac.y,
      y: ab.z * ac.x - ab.x * ac.z,
      z: ab.x * ac.y - ab.y * ac.x,
    };

    // Normalize normal vector
    const nLen = Math.sqrt(normal.x ** 2 + normal.y ** 2 + normal.z ** 2);
    const norm = { x: normal.x / nLen, y: normal.y / nLen, z: normal.z / nLen };

    // Visible if z is positive (pointing towards screen)
    const isVisible = norm.z > 0;

    // Dot product with light source for shading
    const dot = norm.x * lightNorm.x + norm.y * lightNorm.y + norm.z * lightNorm.z;
    const intensity = Math.max(0.4, Math.min(1.0, (dot + 1) / 2)); // map -1..1 to 0.4..1.0

    // Shade color
    const r = Math.round(face.baseColor.r * intensity);
    const g = Math.round(face.baseColor.g * intensity);
    const b = Math.round(face.baseColor.b * intensity);
    const colorHex = `rgb(${r}, ${g}, ${b})`;

    return {
      index,
      isVisible,
      colorHex,
      pointsStr: `${p0.x},${p0.y} ${p1.x},${p1.y} ${p2.x},${p2.y}`,
      normZ: norm.z,
      avgZ: (p0.z + p1.z + p2.z) / 3, // for sorting Z-buffer if needed
    };
  });

  // Sort visible faces by average Z-depth so they draw in correct order (though backface culling does most of the work)
  const visibleFaces = renderedFaces.filter(f => f.isVisible).sort((a, b) => b.avgZ - a.avgZ);

  return (
    <div 
      id="octahedron-logo-container"
      ref={containerRef}
      className={`relative w-[380px] h-[380px] cursor-grab active:cursor-grabbing transition-transform duration-500 ease-out ${
        isHovered ? 'scale-105' : 'scale-100'
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUpOrLeave}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        handleMouseUpOrLeave();
      }}
    >
      {/* Glow Effect behind */}
      <div className="absolute inset-0 rounded-full bg-pink-500/10 blur-3xl -z-10 animate-pulse duration-4000 pointer-events-none" />

      {/* SVG Container */}
      <svg 
        id="octahedron-logo-svg"
        viewBox="0 0 420 420" 
        className="w-full h-full select-none overflow-visible"
      >
        <defs>
          {/* Subtle drop shadow under the octahedron edges */}
          <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="3" dy="5" stdDeviation="8" floodColor="#d946ef" floodOpacity="0.15" />
          </filter>
        </defs>

        <g filter="url(#soft-shadow)">
          {/* Render face polygons */}
          {visibleFaces.map((face) => (
            <g key={face.index}>
              {/* Triangular Facet */}
              <polygon
                points={face.pointsStr}
                fill={face.colorHex}
                stroke="#111827" // deep charcoal edge line
                strokeWidth="2.5"
                strokeLinejoin="round"
                className="transition-all duration-75"
              />
            </g>
          ))}
        </g>
      </svg>

      {/* Helper text tooltip fading in */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-gray-900/80 text-white text-[10px] tracking-widest uppercase font-mono px-3 py-1 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none select-none border border-pink-500/20 backdrop-blur-sm">
        Drag to Spin
      </div>
    </div>
  );
}
