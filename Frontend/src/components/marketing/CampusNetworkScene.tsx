import { useEffect, useRef } from "react";
import * as THREE from "three";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

type BuildingDefinition = {
  position: [number, number];
  size: [number, number, number];
  tone: "cool" | "warm" | "neutral" | "mint" | "violet";
};

type HubDefinition = {
  position: [number, number];
  color: string;
  scale: number;
};

type RoadDefinition = {
  points: Array<[number, number]>;
  color: string;
  speed: number;
  offset: number;
};

const BUILDINGS: BuildingDefinition[] = [
  { position: [-5.8, -3.2], size: [1.2, 1.15, 1.0], tone: "cool" },
  { position: [-4.4, -2.7], size: [0.9, 0.85, 0.9], tone: "mint" },
  { position: [-3.1, -3.4], size: [1.0, 1.6, 0.95], tone: "warm" },
  { position: [-5.2, 2.9], size: [1.0, 1.28, 0.95], tone: "violet" },
  { position: [-3.8, 2.2], size: [1.15, 1.9, 1.0], tone: "cool" },
  { position: [-1.8, 2.9], size: [1.05, 1.2, 0.9], tone: "neutral" },
  { position: [-2.0, 1.2], size: [1.1, 2.45, 1.05], tone: "mint" },
  { position: [-0.1, 1.8], size: [0.95, 1.05, 0.8], tone: "warm" },
  { position: [0.9, 0.4], size: [1.3, 2.7, 1.15], tone: "cool" },
  { position: [1.9, 2.3], size: [1.1, 1.7, 0.95], tone: "violet" },
  { position: [3.4, 1.6], size: [1.15, 1.4, 1.0], tone: "neutral" },
  { position: [4.8, 0.5], size: [1.25, 2.1, 1.05], tone: "cool" },
  { position: [5.8, -1.1], size: [0.95, 1.0, 0.85], tone: "warm" },
  { position: [4.2, -2.5], size: [1.1, 1.45, 0.95], tone: "mint" },
  { position: [2.5, -2.9], size: [1.3, 1.95, 1.1], tone: "cool" },
  { position: [0.2, -2.4], size: [1.15, 1.25, 0.95], tone: "warm" },
  { position: [-1.6, -1.9], size: [0.85, 0.9, 0.8], tone: "neutral" },
  { position: [3.0, -0.6], size: [0.9, 0.95, 0.85], tone: "violet" },
  { position: [-4.7, 0.2], size: [1.0, 1.25, 0.95], tone: "warm" },
  { position: [-0.5, -0.2], size: [0.95, 1.15, 0.85], tone: "mint" },
];

const HUBS: HubDefinition[] = [
  { position: [-3.0, 1.1], color: "#4c76ff", scale: 1.1 },
  { position: [1.0, 0.2], color: "#ff7a5c", scale: 1.2 },
  { position: [4.8, 0.4], color: "#7c68ff", scale: 1.0 },
  { position: [2.4, -2.2], color: "#26c6a5", scale: 0.95 },
];

const ROADS: RoadDefinition[] = [
  {
    points: [
      [-6.3, -2.8],
      [-4.5, -1.9],
      [-2.0, -0.9],
      [0.8, 0.0],
      [3.8, 0.8],
      [6.2, 1.7],
    ],
    color: "#7b97ff",
    speed: 0.065,
    offset: 0.12,
  },
  {
    points: [
      [-5.8, 3.2],
      [-3.4, 2.1],
      [-0.7, 1.5],
      [2.2, 1.6],
      [4.9, 0.8],
      [6.0, -0.1],
    ],
    color: "#ff8f76",
    speed: 0.058,
    offset: 0.48,
  },
  {
    points: [
      [-5.0, -3.7],
      [-2.4, -3.0],
      [0.4, -2.7],
      [2.6, -2.2],
      [5.4, -1.0],
    ],
    color: "#29c7b0",
    speed: 0.072,
    offset: 0.28,
  },
  {
    points: [
      [-2.9, 3.3],
      [-2.6, 1.8],
      [-2.0, 0.2],
      [-1.1, -1.6],
      [-0.4, -3.1],
    ],
    color: "#a77dff",
    speed: 0.061,
    offset: 0.81,
  },
  {
    points: [
      [1.5, 3.0],
      [1.2, 1.9],
      [1.2, 0.4],
      [1.9, -1.1],
      [3.1, -2.9],
    ],
    color: "#ffd166",
    speed: 0.069,
    offset: 0.37,
  },
  {
    points: [
      [-1.5, 0.9],
      [0.3, 0.5],
      [2.1, 0.2],
      [4.0, 0.2],
      [5.8, 0.5],
    ],
    color: "#4c76ff",
    speed: 0.055,
    offset: 0.6,
  },
];

function createRadialTexture(stops: Array<[number, string]>) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas context unavailable");

  const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
  stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));

  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createVerticalTexture(stops: Array<[number, string]>) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 256;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas context unavailable");

  const gradient = context.createLinearGradient(0, 0, 0, 256);
  stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));

  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function toCurve(points: Array<[number, number]>, y = 0.43) {
  return new THREE.CatmullRomCurve3(
    points.map(([x, z]) => new THREE.Vector3(x, y, z)),
    false,
    "catmullrom",
    0.18,
  );
}

export function CampusNetworkScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog("#f5f7ff", 12, 32);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);

    const root = new THREE.Group();
    scene.add(root);

    const ambient = new THREE.HemisphereLight("#f8fbff", "#dce2fb", 1.45);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight("#ffffff", 1.3);
    keyLight.position.set(-8, 12, 8);
    scene.add(keyLight);

    const coolLight = new THREE.PointLight("#7f9bff", 11, 24, 2);
    coolLight.position.set(7.5, 5.5, 5.5);
    scene.add(coolLight);

    const warmLight = new THREE.PointLight("#ffb08d", 9, 18, 2);
    warmLight.position.set(0.5, 4.5, -6);
    scene.add(warmLight);

    const mintLight = new THREE.PointLight("#6be7c7", 7, 18, 2);
    mintLight.position.set(3.4, 3.8, -1.8);
    scene.add(mintLight);

    const violetLight = new THREE.PointLight("#9f8bff", 7, 16, 2);
    violetLight.position.set(-2.2, 4.8, 4.2);
    scene.add(violetLight);

    const shadowTexture = createRadialTexture([
      [0, "rgba(44,66,120,0.28)"],
      [0.45, "rgba(76,118,255,0.12)"],
      [1, "rgba(255,255,255,0)"],
    ]);
    const beaconTexture = createVerticalTexture([
      [0, "rgba(255,255,255,0)"],
      [0.22, "rgba(255,255,255,0.32)"],
      [0.55, "rgba(124,152,255,0.74)"],
      [0.72, "rgba(162,132,255,0.42)"],
      [0.84, "rgba(255,122,92,0.3)"],
      [1, "rgba(255,255,255,0)"],
    ]);
    const pulseTexture = createRadialTexture([
      [0, "rgba(255,255,255,1)"],
      [0.24, "rgba(255,255,255,0.95)"],
      [0.44, "rgba(109,232,196,0.28)"],
      [0.6, "rgba(255,122,92,0.34)"],
      [1, "rgba(255,255,255,0)"],
    ]);
    const dustTexture = createRadialTexture([
      [0, "rgba(255,255,255,1)"],
      [0.35, "rgba(255,255,255,0.72)"],
      [1, "rgba(255,255,255,0)"],
    ]);

    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(18.5, 12.5),
      new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
      }),
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.62;
    root.add(shadowPlane);

    const slabBase = new THREE.Mesh(
      new THREE.BoxGeometry(15.4, 0.72, 9.9),
      new THREE.MeshStandardMaterial({
        color: "#e9efff",
        roughness: 0.92,
        metalness: 0.08,
      }),
    );
    slabBase.position.y = -0.1;
    root.add(slabBase);

    const slabTop = new THREE.Mesh(
      new THREE.BoxGeometry(14.9, 0.22, 9.3),
      new THREE.MeshStandardMaterial({
        color: "#fbfcff",
        roughness: 0.86,
        metalness: 0.05,
      }),
    );
    slabTop.position.y = 0.38;
    root.add(slabTop);

    const slabEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(15.4, 0.72, 9.9)),
      new THREE.LineBasicMaterial({
        color: "#dbe4ff",
        transparent: true,
        opacity: 0.8,
      }),
    );
    slabEdges.position.copy(slabBase.position);
    root.add(slabEdges);

    const districtBlocks: Array<[number, number, number, number]> = [
      [-4.9, 2.3, 3.1, 2.4],
      [-4.8, -2.5, 3.5, 2.6],
      [-0.1, 2.0, 4.2, 2.5],
      [1.1, -2.4, 4.8, 2.6],
      [5.0, 0.3, 2.6, 4.8],
      [-0.7, -0.2, 3.0, 1.6],
    ];

    districtBlocks.forEach(([x, z, width, depth], index) => {
      const block = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.08, depth),
        new THREE.MeshStandardMaterial({
          color:
            index % 3 === 0 ? "#f6f8ff" : index % 3 === 1 ? "#f7fbff" : "#fff9f6",
          roughness: 1,
          metalness: 0.02,
        }),
      );
      block.position.set(x, 0.53, z);
      root.add(block);
    });

    const roadGlowMaterial = new THREE.MeshBasicMaterial({
      color: "#86a1ff",
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const roadMaterial = new THREE.MeshBasicMaterial({
      color: "#ffffff",
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const roadCurves = ROADS.map((road) => toCurve(road.points));
    roadCurves.forEach((curve, index) => {
      const glow = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 90, 0.082, 10, false),
        roadGlowMaterial.clone(),
      );
      glow.material.color = new THREE.Color(ROADS[index].color);
      root.add(glow);

      const road = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 90, 0.021, 8, false),
        roadMaterial.clone(),
      );
      root.add(road);
    });

    const buildingBodyCool = new THREE.MeshStandardMaterial({
      color: "#f8fbff",
      roughness: 0.84,
      metalness: 0.1,
      emissive: "#6c89ff",
      emissiveIntensity: 0.06,
    });
    const buildingBodyWarm = new THREE.MeshStandardMaterial({
      color: "#fff8f5",
      roughness: 0.86,
      metalness: 0.08,
      emissive: "#ff8c6e",
      emissiveIntensity: 0.06,
    });
    const buildingBodyNeutral = new THREE.MeshStandardMaterial({
      color: "#f5f7ff",
      roughness: 0.9,
      metalness: 0.06,
      emissive: "#dae4ff",
      emissiveIntensity: 0.04,
    });
    const buildingBodyMint = new THREE.MeshStandardMaterial({
      color: "#f4fffb",
      roughness: 0.88,
      metalness: 0.08,
      emissive: "#52dcb8",
      emissiveIntensity: 0.07,
    });
    const buildingBodyViolet = new THREE.MeshStandardMaterial({
      color: "#faf8ff",
      roughness: 0.86,
      metalness: 0.08,
      emissive: "#8e79ff",
      emissiveIntensity: 0.07,
    });

    const unitBox = new THREE.BoxGeometry(1, 1, 1);
    const unitPlane = new THREE.PlaneGeometry(1, 1);

    const buildings: Array<{
      mesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
      roof: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
      baseY: number;
      phase: number;
    }> = [];

    BUILDINGS.forEach((definition, index) => {
      const [width, height, depth] = definition.size;
      const bodyMaterial =
        definition.tone === "cool"
          ? buildingBodyCool.clone()
          : definition.tone === "warm"
            ? buildingBodyWarm.clone()
            : definition.tone === "mint"
              ? buildingBodyMint.clone()
              : definition.tone === "violet"
                ? buildingBodyViolet.clone()
                : buildingBodyNeutral.clone();

      const mesh = new THREE.Mesh(unitBox, bodyMaterial);
      mesh.scale.set(width, height, depth);
      mesh.position.set(definition.position[0], 0.53 + height / 2, definition.position[1]);
      root.add(mesh);

      const roof = new THREE.Mesh(
        unitPlane,
        new THREE.MeshBasicMaterial({
          color:
            definition.tone === "warm"
              ? "#ff9b81"
              : definition.tone === "mint"
                ? "#51d7bc"
                : definition.tone === "violet"
                  ? "#9b84ff"
                  : "#86a1ff",
          transparent: true,
          opacity: 0.2,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      roof.rotation.x = -Math.PI / 2;
      roof.scale.set(width * 0.78, depth * 0.78, 1);
      roof.position.set(definition.position[0], 0.55 + height, definition.position[1]);
      root.add(roof);

      buildings.push({
        mesh,
        roof,
        baseY: mesh.position.y,
        phase: index * 0.42,
      });
    });

    const hubRingGeometry = new THREE.TorusGeometry(0.42, 0.035, 18, 64);
    const hubPulseGeometry = new THREE.TorusGeometry(0.68, 0.022, 16, 64);

    const hubs: Array<{
      ring: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
      pulse: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
      beam: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
      marker: THREE.Sprite;
      phase: number;
      scale: number;
    }> = [];

    HUBS.forEach((hub, index) => {
      const ring = new THREE.Mesh(
        hubRingGeometry,
        new THREE.MeshBasicMaterial({
          color: hub.color,
          transparent: true,
          opacity: 0.66,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(hub.position[0], 0.58, hub.position[1]);
      root.add(ring);

      const pulse = new THREE.Mesh(
        hubPulseGeometry,
        new THREE.MeshBasicMaterial({
          color: hub.color,
          transparent: true,
          opacity: 0.3,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      pulse.rotation.x = Math.PI / 2;
      pulse.position.copy(ring.position);
      root.add(pulse);

      const beam = new THREE.Mesh(
        new THREE.PlaneGeometry(0.62, 3.4),
        new THREE.MeshBasicMaterial({
          map: beaconTexture,
          color: hub.color,
          transparent: true,
          opacity: 0.44,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      beam.position.set(hub.position[0], 2.2, hub.position[1]);
      root.add(beam);

      const marker = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: pulseTexture,
          color: hub.color,
          transparent: true,
          opacity: 0.95,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      marker.position.set(hub.position[0], 0.9, hub.position[1]);
      marker.scale.setScalar(0.68 * hub.scale);
      root.add(marker);

      hubs.push({
        ring,
        pulse,
        beam,
        marker,
        phase: index * 0.8,
        scale: hub.scale,
      });
    });

    const roadPulses = roadCurves.map((curve, index) => {
      const pulse = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: pulseTexture,
          color: ROADS[index].color,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      pulse.scale.set(0.54, 0.54, 0.54);
      root.add(pulse);
      return pulse;
    });

    const dustGeometry = new THREE.BufferGeometry();
    const particleCount = 84;
    const dustPositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i += 1) {
      const index = i * 3;
      dustPositions[index] = (Math.random() - 0.5) * 18 + 3.2;
      dustPositions[index + 1] = Math.random() * 5.6 + 0.2;
      dustPositions[index + 2] = (Math.random() - 0.5) * 12;
    }

    dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));

    const dust = new THREE.Points(
      dustGeometry,
      new THREE.PointsMaterial({
        map: dustTexture,
        color: "#bfd0ff",
        size: 0.12,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    scene.add(dust);

    const haze = new THREE.Mesh(
      new THREE.PlaneGeometry(28, 16),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform float uTime;

          void main() {
            vec2 uv = vUv;
            float glowA = smoothstep(0.92, 0.18, distance(uv, vec2(0.82, 0.48)));
            float glowB = smoothstep(0.92, 0.22, distance(uv, vec2(0.68, 0.24)));
            float stripe = smoothstep(0.0, 0.72, 1.0 - abs(uv.y - (0.2 + uv.x * 0.32 + sin(uTime * 0.24) * 0.02)));
            vec3 cool = vec3(0.30, 0.47, 1.0);
            vec3 violet = vec3(0.60, 0.49, 1.0);
            vec3 mint = vec3(0.25, 0.82, 0.70);
            vec3 warm = vec3(1.0, 0.46, 0.33);
            vec3 band = mix(cool, violet, smoothstep(0.18, 0.58, uv.x));
            vec3 band2 = mix(mint, warm, smoothstep(0.52, 0.92, uv.x));
            vec3 color = mix(band, band2, smoothstep(0.46, 0.78, uv.x));
            float alpha = glowA * 0.05 + glowB * 0.03 + stripe * 0.02;
            gl_FragColor = vec4(color, alpha);
          }
        `,
      }),
    );
    haze.position.set(3.3, 1.4, -7.5);
    scene.add(haze);

    const onResize = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width === 0 || height === 0) return;

      const compact = width < 900;

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, compact ? 1.2 : 1.7));
      renderer.setSize(width, height, false);

      camera.aspect = width / height;
      camera.position.set(compact ? -0.2 : -1.1, compact ? 8.8 : 7.6, compact ? 17.4 : 15.1);
      camera.lookAt(compact ? 2.4 : 3.5, 0.75, 0.15);
      camera.updateProjectionMatrix();

      root.position.set(compact ? 2.55 : 3.65, compact ? -1.32 : -1.0, 0);
      root.scale.setScalar(compact ? 0.84 : 1);

      dust.material.opacity = compact ? 0.1 : 0.18;
      haze.position.x = compact ? 2.4 : 3.3;
      haze.scale.setScalar(compact ? 0.9 : 1);
    };

    onResize();
    window.addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    let frame = 0;

    const animate = () => {
      const elapsed = clock.getElapsedTime();

      root.rotation.y = -0.26 + Math.sin(elapsed * 0.14) * 0.03;
      root.rotation.x = Math.sin(elapsed * 0.1) * 0.012;
      root.position.y += (Math.sin(elapsed * 0.22) * 0.05 - (root.position.y - root.position.y)) * 0;

      camera.position.x += Math.sin(elapsed * 0.11) * 0.004;
      camera.position.y += Math.cos(elapsed * 0.09) * 0.002;
      camera.lookAt(root.position.x - 0.25, 0.76, 0.15);

      buildings.forEach((building) => {
        const hover = Math.sin(elapsed * 0.7 + building.phase) * 0.03;
        building.mesh.position.y = building.baseY + hover;
        building.roof.position.y = 0.55 + building.mesh.scale.y + hover;
        building.roof.material.opacity = 0.16 + (Math.sin(elapsed * 1.2 + building.phase) * 0.5 + 0.5) * 0.1;
      });

      hubs.forEach((hub) => {
        const pulse = Math.sin(elapsed * 1.6 + hub.phase) * 0.5 + 0.5;
        hub.ring.scale.setScalar(1 + pulse * 0.08);
        hub.pulse.scale.setScalar(1 + pulse * 0.22);
        hub.pulse.material.opacity = 0.18 + pulse * 0.2;
        hub.beam.material.opacity = 0.26 + pulse * 0.16;
        hub.marker.scale.setScalar((0.62 + pulse * 0.16) * hub.scale);
      });

      roadPulses.forEach((pulse, index) => {
        const road = ROADS[index];
        const progress = (elapsed * road.speed + road.offset) % 1;
        pulse.position.copy(roadCurves[index].getPointAt(progress));
        const scale = 0.46 + Math.sin(elapsed * 2.0 + index) * 0.05;
        pulse.scale.set(scale, scale, scale);
      });

      dust.rotation.y = elapsed * 0.012;
      haze.material.uniforms.uTime.value = elapsed;

      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);

      renderer.dispose();

      shadowTexture.dispose();
      beaconTexture.dispose();
      pulseTexture.dispose();
      dustTexture.dispose();

      slabBase.geometry.dispose();
      slabTop.geometry.dispose();
      slabEdges.geometry.dispose();
      shadowPlane.geometry.dispose();
      haze.geometry.dispose();
      dustGeometry.dispose();
      unitBox.dispose();
      unitPlane.dispose();
      hubRingGeometry.dispose();
      hubPulseGeometry.dispose();

      shadowPlane.material.dispose();
      slabBase.material.dispose();
      slabTop.material.dispose();
      slabEdges.material.dispose();
      roadGlowMaterial.dispose();
      roadMaterial.dispose();
      buildingBodyCool.dispose();
      buildingBodyWarm.dispose();
      buildingBodyNeutral.dispose();
      buildingBodyMint.dispose();
      buildingBodyViolet.dispose();
      dust.material.dispose();
      haze.material.dispose();

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else if (
            object !== slabBase &&
            object !== slabTop &&
            object !== shadowPlane &&
            object !== haze
          ) {
            object.material.dispose();
          }
        }

        if (object instanceof THREE.Sprite) {
          object.material.dispose();
        }
      });

      scene.clear();
    };
  }, [prefersReducedMotion]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.985)_0%,rgba(255,255,255,0.95)_24%,rgba(252,252,255,0.84)_44%,rgba(246,248,255,0.58)_66%,rgba(242,245,255,0.76)_100%)]" />
      <div className="absolute inset-y-0 right-0 w-full md:w-[76%] lg:w-[72%]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_48%,rgba(124,152,255,0.14),transparent_28%),radial-gradient(circle_at_86%_24%,rgba(255,122,92,0.15),transparent_22%),radial-gradient(circle_at_68%_78%,rgba(81,215,188,0.12),transparent_20%),radial-gradient(circle_at_92%_58%,rgba(155,132,255,0.12),transparent_18%)]" />
        {!prefersReducedMotion ? (
          <canvas ref={canvasRef} className="size-full" aria-hidden="true" />
        ) : (
          <div className="absolute inset-[14%_4%_10%_20%] rounded-[42px] border border-white/60 bg-[linear-gradient(160deg,rgba(255,255,255,0.72),rgba(240,245,255,0.52))] shadow-[0_40px_90px_rgba(83,109,181,0.16)] backdrop-blur-xl" />
        )}
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(246,248,255,0.4))]" />
    </div>
  );
}
