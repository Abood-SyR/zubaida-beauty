/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import Image from 'next/image';
import Link from 'next/link';

/* ============================================================
   استخراج نص من حقل قد يكون string أو كائن متعدد اللغات
   ============================================================ */
function pickText(value: unknown, lang: 'ar' | 'en' = 'ar'): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    const preferred = obj[lang];
    if (typeof preferred === 'string' && preferred.trim()) return preferred;
    if (typeof obj.en === 'string' && obj.en.trim()) return obj.en;
    for (const key of Object.keys(obj)) {
      const v = obj[key];
      if (typeof v === 'string' && v.trim()) return v;
    }
  }
  return '';
}

interface FeaturedProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  thumbnail_url: string | null;
  images: string[] | null;
  category_id?: string | null;
  is_active: boolean;
}

const glow = {
  textShadow:
    '0 0 12px rgba(236,72,153,0.95), 0 0 30px rgba(236,72,153,0.65), 0 0 60px rgba(168,85,247,0.45), 0 3px 8px rgba(0,0,0,0.95)',
} as const;
const softGlow = {
  textShadow:
    '0 0 8px rgba(236,72,153,0.8), 0 0 20px rgba(168,85,247,0.4), 0 2px 6px rgba(0,0,0,0.95)',
} as const;

/* ============================================================
   CenterZoom — كما هو
   ============================================================ */
function CenterZoom({
  children,
  height = '120vh',
  maxScale = 7,
  holdStart = 0.32,
  holdEnd = 0.58,
  startScale = 0.05,
  startOpacity = 0,
  spin = 0,
  spinSelector,
  last = false,
}: {
  children: ReactNode;
  height?: string;
  maxScale?: number;
  holdStart?: number;
  holdEnd?: number;
  startScale?: number;
  startOpacity?: number;
  spin?: number;
  spinSelector?: string;
  last?: boolean;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const card = cardRef.current;
    if (!section || !card) return;

    const scroller = section.closest('[data-scroller="true"]') as HTMLElement | null;
    const spinEl = spinSelector ? (card.querySelector(spinSelector) as HTMLElement | null) : null;

    let raf = 0;
    let ticking = false;

    const update = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;

      let p: number;
      if (last) {
        p = (vh - rect.top) / vh;
      } else {
        p = (vh - rect.top) / (rect.height + vh);
      }
      p = Math.max(0, Math.min(1, p));

      let scale: number;
      let opacity: number;
      let blur = 0;
      let rotY = 0;

      if (last) {
        const eased = p * p * (3 - 2 * p);
        scale = startScale + eased * (1 - startScale);
        opacity = Math.min(1, startOpacity + eased * 1.4);
        blur = (1 - eased) * 3.5;
      } else if (p < holdStart) {
        const t = p / holdStart;
        const eased = t * t * (3 - 2 * t);
        scale = startScale + eased * (1 - startScale);
        opacity = Math.min(1, startOpacity + eased * 1.4);
        blur = (1 - eased) * 3.5;
        if (spin) rotY = -spin / 2 + eased * (spin / 2);
      } else if (p < holdEnd) {
        scale = 1;
        opacity = 1;
        rotY = 0;
      } else {
        const t = (p - holdEnd) / (1 - holdEnd);
        const eased = t * t;
        scale = 1 + eased * (maxScale - 1);
        opacity = Math.max(0, 1 - eased * 1.6);
        blur = eased * 1.5;
        if (spin) rotY = eased * (spin / 2);
      }

      card.style.transform = `scale(${scale.toFixed(4)})`;
      card.style.opacity = opacity.toFixed(3);
      card.style.filter = blur > 0.1 ? `blur(${blur.toFixed(2)}px)` : 'none';

      if (spinEl) spinEl.style.transform = `rotateY(${rotY.toFixed(2)}deg)`;

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        raf = requestAnimationFrame(update);
      }
    };

    update();
    const target: any = scroller || window;
    target.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      target.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [maxScale, holdStart, holdEnd, startScale, startOpacity, spin, spinSelector, last]);

  return (
    <div ref={sectionRef} className="relative w-full" style={{ height }}>
      <div className="fixed inset-0 z-10 flex items-center justify-center overflow-hidden pointer-events-none">
        <div
          ref={cardRef}
          style={{
            willChange: 'transform, opacity, filter',
            transformStyle: 'preserve-3d',
            transform: `scale(${startScale})`,
            opacity: startOpacity,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default function RoadJourneyContent({ initialProducts = [] }: { initialProducts: any[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  /* معالجة المنتجات القادمة مباشرة من الخادم (مخزنة وسريعة جداً) */
  const products: FeaturedProduct[] = initialProducts.map((p: any) => {
    let images: string[] | null = null;
    if (Array.isArray(p.images)) {
      images = p.images.filter((x: unknown) => typeof x === 'string');
    } else if (p.images && typeof p.images === 'object') {
      const arImgs = (p.images as any).ar;
      const enImgs = (p.images as any).en;
      if (Array.isArray(arImgs)) images = arImgs.filter((x: unknown) => typeof x === 'string');
      else if (Array.isArray(enImgs)) images = enImgs.filter((x: unknown) => typeof x === 'string');
    }

    const thumbRaw = p.thumbnail_url;
    const thumbnail_url = typeof thumbRaw === 'string' ? thumbRaw : pickText(thumbRaw) || null;

    return {
      id: String(p.id),
      name: pickText(p.name) || 'منتج',
      description: pickText(p.description),
      price: Number(p.price ?? 0),
      thumbnail_url,
      images,
      category_id: p.category_id ?? null,
      is_active: p.is_active ?? true,
    };
  });

  /* مشهد Three.js — بدون تغيير */
  useEffect(() => {
    const canvas = canvasRef.current;
    const scroller = scrollRef.current;
    if (!canvas || !scroller) return;

    const ROAD_LENGTH = 6000;
    const ROAD_CENTER_Z = -ROAD_LENGTH / 2 + 100;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d0616);
    scene.fog = new THREE.FogExp2(0x0d0616, 0.009);

    const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 4000);
    camera.position.set(0, 3, 8);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    setReady(true);

    const starCount = 3000;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 1200;
      starPos[i * 3 + 1] = Math.random() * 260 + 15;
      starPos[i * 3 + 2] = -Math.random() * 4500;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xffc2e5, size: 0.9, transparent: true, opacity: 0.85, sizeAttenuation: true,
    }));
    scene.add(stars);

    const moonPos = new THREE.Vector3(70, 90, -900);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(9, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffe3f1 }));
    moon.position.copy(moonPos);
    scene.add(moon);

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(18, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xff4fa3, transparent: true, opacity: 0.14 })
    );
    halo.position.copy(moonPos);
    scene.add(halo);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(800, ROAD_LENGTH + 400),
      new THREE.MeshBasicMaterial({ color: 0x0d0614 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.05, ROAD_CENTER_Z);
    scene.add(ground);

    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(16, ROAD_LENGTH),
      new THREE.MeshBasicMaterial({ color: 0x170a1c })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, ROAD_CENTER_Z);
    scene.add(road);

    const roadGrid = new THREE.Mesh(
      new THREE.PlaneGeometry(16, ROAD_LENGTH, 8, 900),
      new THREE.MeshBasicMaterial({ color: 0x3a1030, wireframe: true, transparent: true, opacity: 0.3 })
    );
    roadGrid.rotation.x = -Math.PI / 2;
    roadGrid.position.set(0, 0.01, ROAD_CENTER_Z);
    scene.add(roadGrid);

    const edgeMeshes: THREE.Mesh[] = [];
    [-8, 8].forEach((x) => {
      const edge = new THREE.Mesh(
        new THREE.PlaneGeometry(0.4, ROAD_LENGTH),
        new THREE.MeshBasicMaterial({ color: 0xff2d95, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending })
      );
      edge.rotation.x = -Math.PI / 2;
      edge.position.set(x, 0.02, ROAD_CENTER_Z);
      scene.add(edge);
      edgeMeshes.push(edge);
    });

    const dashMat = new THREE.MeshBasicMaterial({ color: 0xff9ed2, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
    const dashGeo = new THREE.PlaneGeometry(0.4, 4);
    for (let i = 0; i < 620; i++) {
      const dash = new THREE.Mesh(dashGeo, dashMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, 0.02, -i * 9);
      scene.add(dash);
    }

    const mountainGeo = new THREE.ConeGeometry(11, 28, 4);
    const mountainMat = new THREE.MeshBasicMaterial({ color: 0x451236, wireframe: true, transparent: true, opacity: 0.75 });
    for (let i = 0; i < 160; i++) {
      const l = new THREE.Mesh(mountainGeo, mountainMat);
      l.position.set(-22 - Math.random() * 14, 13 + Math.random() * 5, -i * 22);
      l.rotation.y = Math.random() * Math.PI;
      scene.add(l);
      const r = new THREE.Mesh(mountainGeo, mountainMat);
      r.position.set(22 + Math.random() * 14, 13 + Math.random() * 5, -i * 22);
      r.rotation.y = Math.random() * Math.PI;
      scene.add(r);
    }

    const poleGeo = new THREE.CylinderGeometry(0.12, 0.12, 9, 8);
    const poleMat = new THREE.MeshBasicMaterial({ color: 0xff5eb8 });
    const bulbGeo = new THREE.SphereGeometry(0.5, 12, 12);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffd6ee });
    const beams: THREE.Mesh[] = [];
    const beamGeo = new THREE.ConeGeometry(2.2, 12, 16, 1, true);

    for (let i = 0; i < 110; i++) {
      [-11.5, 11.5].forEach((x) => {
        const g = new THREE.Group();
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 4.5;
        const bulb = new THREE.Mesh(bulbGeo, bulbMat);
        bulb.position.y = 9;
        g.add(pole, bulb);
        const beam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({
          color: 0xff7ec8, transparent: true, opacity: 0.09,
          blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
        }));
        beam.position.y = 15;
        g.add(beam);
        beams.push(beam);
        g.position.set(x, 0, -i * 45 - 20);
        scene.add(g);
      });
    }

    const postGeo = new THREE.CylinderGeometry(0.18, 0.18, 7, 8);
    const boardGeo = new THREE.BoxGeometry(3.4, 2.2, 0.2);
    const signMat = new THREE.MeshBasicMaterial({ color: 0xff2d95, wireframe: true });
    const leftSigns: THREE.Object3D[] = [];
    const rightSigns: THREE.Object3D[] = [];

    for (let i = 0; i < 90; i++) {
      const lg = new THREE.Group();
      lg.add(new THREE.Mesh(postGeo, signMat));
      const lb = new THREE.Mesh(boardGeo, signMat);
      lb.position.y = 3.6;
      lg.add(lb);
      lg.position.set(-9.6, 0, -i * 40 - 25);
      scene.add(lg);
      leftSigns.push(lg);

      const rg = new THREE.Group();
      rg.add(new THREE.Mesh(postGeo, signMat));
      const rb = new THREE.Mesh(boardGeo, signMat);
      rb.position.y = 3.6;
      rg.add(rb);
      rg.position.set(9.6, 0, -i * 40 - 25);
      scene.add(rg);
      rightSigns.push(rg);
    }

    const particleCount = 300;
    const pPositions = new Float32Array(particleCount * 3);
    const pSpeeds = new Float32Array(particleCount);
    const pOffsets = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 13;
      pPositions[i * 3 + 1] = Math.random() * 7 + 0.3;
      pPositions[i * 3 + 2] = -Math.random() * ROAD_LENGTH;
      pSpeeds[i] = 0.006 + Math.random() * 0.02;
      pOffsets[i] = Math.random() * Math.PI * 2;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const particles = new THREE.Points(particleGeo, new THREE.PointsMaterial({
      color: 0xffb8e0, size: 0.4, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, sizeAttenuation: true, depthWrite: false,
    }));
    scene.add(particles);

    type ShootingStar = { line: THREE.Line; head: THREE.Mesh; vx: number; vy: number; life: number; reset: () => void };
    const shootingStars: ShootingStar[] = [];
    const starHeadGeo = new THREE.SphereGeometry(0.35, 10, 10);

    for (let i = 0; i < 9; i++) {
      const trailGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-38, -16, 0),
      ]);
      const line = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({
        color: 0xffd0ec, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending,
      }));
      scene.add(line);
      const head = new THREE.Mesh(starHeadGeo, new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending,
      }));
      scene.add(head);

      const ss: ShootingStar = {
        line, head,
        vx: -(4 + Math.random() * 3),
        vy: -(1.6 + Math.random() * 0.8),
        life: 0,
        reset: () => {
          const x = 120 + Math.random() * 200;
          const y = 100 + Math.random() * 70;
          const z = -400 - Math.random() * 1200;
          line.position.set(x, y, z);
          head.position.set(x, y, z);
          ss.vx = -(4 + Math.random() * 3);
          ss.vy = -(1.6 + Math.random() * 0.8);
          ss.life = 0;
        },
      };
      ss.reset();
      line.position.y += Math.random() * 80;
      head.position.y = line.position.y;
      shootingStars.push(ss);
    }

    let scrollTarget = 0;
    let currentScroll = 0;

    const handleScroll = () => {
      const max = scroller.scrollHeight - scroller.clientHeight;
      const p = max > 0 ? scroller.scrollTop / max : 0;
      scrollTarget = scroller.scrollTop * 0.05;
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
    };
    scroller.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    let raf = 0;
    let t = 0;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      t += 0.016;

      currentScroll += (scrollTarget - currentScroll) * 0.06;

      const zPos = Math.max(8 - currentScroll, -ROAD_LENGTH + 400);
      camera.position.z = zPos;
      camera.position.x = Math.sin(currentScroll * 0.035) * 1.6 + Math.sin(t * 1.7) * 0.06;
      camera.position.y = 3 + Math.sin(t * 3.2) * 0.05;
      camera.rotation.z = Math.sin(currentScroll * 0.035) * 0.02;

      stars.rotation.y = t * 0.008;
      leftSigns.forEach((s) => (s.rotation.y += 0.012));
      rightSigns.forEach((s) => (s.rotation.y -= 0.012));

      const pulse = 1 + Math.sin(t * 1.2) * 0.04;
      halo.scale.setScalar(pulse);
      halo.material.opacity = 0.12 + Math.sin(t * 1.2) * 0.03;

      beams.forEach((b, i) => {
        const m = b.material as THREE.MeshBasicMaterial;
        m.opacity = 0.06 + Math.abs(Math.sin(t * 1.5 + i * 0.7)) * 0.09;
        b.rotation.y += 0.02;
      });

      edgeMeshes.forEach((e, i) => {
        const m = e.material as THREE.MeshBasicMaterial;
        m.opacity = 0.7 + Math.abs(Math.sin(t * 2 + i)) * 0.3;
      });

      const pos = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        pos[i * 3 + 1] += pSpeeds[i];
        pos[i * 3] += Math.sin(t * 0.8 + pOffsets[i]) * 0.004;
        if (pos[i * 3 + 1] > 8) {
          pos[i * 3 + 1] = 0.3;
          pos[i * 3] = (Math.random() - 0.5) * 13;
          pos[i * 3 + 2] = camera.position.z - 200 - Math.random() * 1200;
        }
        if (pos[i * 3 + 2] > camera.position.z + 8) {
          pos[i * 3 + 2] = camera.position.z - 200 - Math.random() * 1200;
          pos[i * 3] = (Math.random() - 0.5) * 13;
          pos[i * 3 + 1] = 0.3;
        }
      }
      particles.geometry.attributes.position.needsUpdate = true;

      shootingStars.forEach((ss) => {
        ss.life += 0.016;
        ss.line.position.x += ss.vx;
        ss.line.position.y += ss.vy;
        ss.head.position.set(ss.line.position.x, ss.line.position.y, ss.line.position.z);
        const trailMat = ss.line.material as THREE.LineBasicMaterial;
        const headMat = ss.head.material as THREE.MeshBasicMaterial;
        trailMat.opacity = Math.max(0, 0.85 - ss.life * 0.6);
        headMat.opacity = Math.max(0, 0.95 - ss.life * 0.6);
        if (ss.life > 1.4 || ss.line.position.x < -250) ss.reset();
      });

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
      scroller.removeEventListener('scroll', handleScroll);
      renderer.dispose();
      scene.traverse((obj) => {
        const m = obj as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        if (m.material) {
          const mat = m.material as THREE.Material | THREE.Material[];
          Array.isArray(mat) ? mat.forEach((x) => x.dispose()) : mat.dispose();
        }
      });
    };
  }, []);

  return (
    <div
      ref={scrollRef}
      data-scroller="true"
      dir="rtl"
      className="relative w-full h-screen overflow-y-scroll overflow-x-hidden bg-[#0d0616] text-white"
      style={{ scrollBehavior: 'smooth' }}
    >
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ opacity: ready ? 1 : 0, transition: 'opacity 1.2s ease' }}
      />

      <div className="fixed top-0 left-0 right-0 h-[3px] z-50 bg-white/5">
        <div ref={barRef} className="h-full origin-right bg-gradient-to-l from-pink-400 via-fuchsia-500 to-violet-500"
             style={{ transform: 'scaleX(0)', transition: 'transform .15s linear' }} />
      </div>

      {/* الحقوق واسم المطور ثابتة في جميع الأقسام بالأسفل */}
      <div className="fixed bottom-[5px] left-0 right-0 z-40 text-center pointer-events-auto">
        <p className="text-[11px] text-pink-200/80 font-bold" style={softGlow}>
          جميع الحقوق محفوظة © 2026 zubaida-beauty
        </p>
        <p className="text-[11px] text-pink-300/90 font-black mt-0.5" style={softGlow}>
          تطوير{' '}
          <a
            href="https://wa.me/966XXXXXXXXX"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white transition"
          >
            Abdullrahman-Abdullah
          </a>
        </p>
      </div>

      {/* 1) القسم الأول */}
      <CenterZoom height="140vh" maxScale={5} holdStart={0.32} holdEnd={0.6}>
        <div className="flex flex-col items-center text-center gap-5 px-4 max-w-3xl">
          <div className="relative w-32 h-32 sm:w-40 sm:h-40" style={{ filter: 'drop-shadow(0 0 40px rgba(236,72,153,0.85))' }}>
            <Image src="/logo.png" alt="Zubaida Beauty" fill sizes="(max-width: 640px) 128px, 160px" priority className="object-contain" />
          </div>
          <span className="text-[11px] font-black tracking-[0.35em] text-pink-300" style={softGlow}>
            تأسست عام 2021
          </span>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-fuchsia-300 to-rose-300 leading-tight" style={glow}>
            شركة زُبيدة بيوتي
          </h1>
          <p className="text-sm sm:text-base text-pink-100/95 font-bold leading-relaxed max-w-xl" style={softGlow}>
            تأسست على يد خبيرة حاصلة على دبلوم البورد الأوروبي وأكاديمية جابر بن حيان،
            لتقديم أرقى مستحضرات التجميل والعناية الطبيعية.
          </p>
        </div>
      </CenterZoom>

      {/* 2) المنتجات المميزة */}
      {products.length === 0 && (
        <CenterZoom height="80vh" holdStart={0.35} holdEnd={0.65}>
          <p className="text-pink-200 font-black text-lg" style={glow}>
            لا توجد منتجات مميزة حالياً
          </p>
        </CenterZoom>
      )}

      {products.map((item, i) => {
        const imgSrc = item.thumbnail_url || (item.images && item.images[0]) || '/logo.png';

        return (
          <CenterZoom
            key={item.id}
            height="110vh"
            maxScale={[8, 7, 9, 7, 8][i % 5]}
            holdStart={0.32}
            holdEnd={0.58}
            startScale={0.04}
            spin={180}
            spinSelector=".spin-target"
          >
            <div className="flex flex-col items-center gap-3 px-4">
              <div
                className="spin-target relative w-[60vw] sm:w-[380px] md:w-[460px] aspect-square"
                style={{
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'visible',
                  willChange: 'transform',
                  filter: 'drop-shadow(0 0 55px rgba(236,72,153,0.75))',
                }}
              >
                <Image
                  src={imgSrc}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 60vw, 460px"
                  className="object-contain"
                />
              </div>
              <h3 className="text-3xl sm:text-4xl font-black text-pink-100" style={glow}>
                {item.name}
              </h3>
              {item.description && (
                <p className="text-xs sm:text-sm text-pink-100/90 font-bold leading-relaxed max-w-md text-center" style={softGlow}>
                  {item.description}
                </p>
              )}
              {item.price > 0 && (
                <span className="text-2xl font-black text-pink-300 mt-1" style={glow}>
                  {item.price.toLocaleString('ar-SY')} ل.س
                </span>
              )}
            </div>
          </CenterZoom>
        );
      })}

      {/* 3) عن الشركة */}
      <CenterZoom height="120vh" maxScale={5} holdStart={0.32} holdEnd={0.58}>
        <div className="w-[90vw] sm:w-[680px] max-w-[90vw] text-center space-y-5">
          <span className="inline-block text-[11px] font-black tracking-[0.35em] text-pink-300" style={softGlow}>من نحن</span>
          <h2 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-200 to-fuchsia-300" style={glow}>
            حكاية بدأت بشغف الجمال
          </h2>
          <p className="text-sm sm:text-base text-pink-100/95 leading-loose font-bold" style={softGlow}>
            انطلقت <span className="text-pink-300 font-black">زُبيدة بيوتي</span> عام 2021
            من رؤية بسيطة: أن يحصل كل شخص على مستحضرات عناية صادقة، طبيعية، وفعّالة.
            بدأنا من مطبخ صغير ووصفات أعشاب موروثة، ووصلنا اليوم إلى منتجات تُصنع
            بمعايير عالمية وتحت إشراف خبيرة معتمدة من البورد الأوروبي وأكاديمية
            جابر بن حيان للطب النبوي.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
            {[{ n: '2021', l: 'سنة التأسيس' }, { n: '+40', l: 'منتج طبيعي' }, { n: '+5000', l: 'عميل سعيد' }, { n: '100%', l: 'مكوّنات طبيعية' }].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl sm:text-4xl font-black text-pink-300" style={glow}>{s.n}</div>
                <div className="text-[10px] text-pink-100/80 font-bold mt-1 tracking-wider" style={softGlow}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </CenterZoom>

      {/* 5) الشهادات */}
      <CenterZoom height="120vh" maxScale={5} holdStart={0.32} holdEnd={0.58}>
        <div className="w-[92vw] sm:w-[760px] max-w-[92vw] text-center space-y-4">
          <span className="inline-block text-[11px] font-black tracking-[0.35em] text-pink-300" style={softGlow}>موثّق رسمياً</span>
          <h2 className="text-2xl sm:text-4xl font-black text-pink-100" style={glow}>
            الشهادات والاعتمادات الرسمية
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center justify-center">
            {[
              { src: '/uk.jpg', alt: 'European Board', title: 'البورد الأوروبي للتطوير والتدريب القيادي (UK)' },
              { src: '/ar.jpg', alt: 'Gaber Academy', title: 'أكاديمية جابر بن حيان للطب النبوي وعلوم الأعشاب' },
            ].map((c, i) => (
              <div key={i} className="space-y-2 flex flex-col items-center">
                <div className="relative w-[280px] h-[190px] sm:w-[320px] sm:h-[210px]" style={{ filter: 'drop-shadow(0 0 30px rgba(236,72,153,0.7))' }}>
                  <Image src={c.src} alt={c.alt} fill sizes="(max-width: 640px) 280px, 320px" className="object-fill rounded-xl" />
                </div>
                <p className="font-black text-[11px] sm:text-xs text-pink-100" style={softGlow}>{c.title}</p>
              </div>
            ))}
          </div>
        </div>
      </CenterZoom>

      {/* 6) التواصل */}
      <CenterZoom height="130vh" maxScale={5} holdStart={0.32} holdEnd={0.6}>
        <div className="w-[92vw] sm:w-[720px] max-w-[92vw] space-y-6 text-center">
          <span className="inline-block text-[11px] font-black tracking-[0.35em] text-pink-300" style={softGlow}>ننتظرك</span>
          <h2 className="text-3xl sm:text-5xl font-black text-pink-100" style={glow}>موقعنا ووسائل التواصل</h2>
          <p className="text-sm text-pink-100/90 font-bold" style={softGlow}>سوريا • قدسيا، دمشق</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2">
            <div className="relative h-52 w-full" style={{ filter: 'drop-shadow(0 0 35px rgba(236,72,153,0.65))' }}>
              <iframe
                title="Qudsaya Map"
                width="100%"
                height="100%"
                className="rounded-2xl"
                style={{ border: 0, filter: 'invert(0.92) hue-rotate(180deg)', pointerEvents: 'none' }}
                loading="lazy"
                src="https://maps.google.com/maps?q=33.5417,36.2167&z=14&output=embed"
              />
              <a
                href="https://maps.google.com/?q=33.5417,36.2167"
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-pink-600/95 hover:bg-pink-500 text-white text-[10px] font-black transition"
              >
                افتح في خرائط جوجل ↗
              </a>
            </div>

            <div className="space-y-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                className="pointer-events-auto flex items-center justify-center gap-3 text-sm font-black text-pink-100 hover:text-white transition"
                style={softGlow}>
                <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                <span>تابعنا على Facebook</span>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                className="pointer-events-auto flex items-center justify-center gap-3 text-sm font-black text-pink-100 hover:text-white transition"
                style={softGlow}>
                <svg className="w-6 h-6 text-pink-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                <span>تابعنا على Instagram</span>
              </a>

              <a
                href="https://www.threads.net/@your_username"
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto flex items-center justify-center gap-3 text-sm font-black text-pink-100 hover:text-white transition"
                style={softGlow}
              >
                <svg className="w-6 h-6 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z"/>
                </svg>
                <span>تابعنا على Threads</span>
              </a>

              <a
                href="https://wa.me/966XXXXXXXXX"
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto flex items-center justify-center gap-3 text-sm font-black text-green-100 hover:text-white transition"
                style={softGlow}
              >
                <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                </svg>
                <span>تواصل معنا على واتساب</span>
              </a>
            </div>
          </div>
        </div>
      </CenterZoom>

      {/* 7) الخاتمة */}
      <CenterZoom last height="120vh" startScale={0.05} startOpacity={0}>
        <div className="w-[90vw] sm:w-[640px] max-w-[90vw] text-center space-y-6">
          <h2 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-fuchsia-300 to-violet-300 leading-tight" style={glow}>
            جمالك يبدأ من هنا
          </h2>
          <p className="text-sm sm:text-base text-pink-100/95 font-bold leading-relaxed max-w-md mx-auto" style={softGlow}>
            شكراً لأنك مشيت معنا حتى نهاية الطريق. ننتظرك في متجرنا لتكتشف
            ما أعددناه لك من كنوز الطبيعة.
          </p>
          <div className="pt-4">
            <Link href="/home"
              className="pointer-events-auto inline-flex items-center gap-3 px-8 py-4 rounded-3xl bg-gradient-to-l from-deepRose to-primaryRose text-white text-sm font-black shadow-2xl shadow-pink-500/50 hover:scale-105 active:scale-95 transition">
              <span>ابدأ التسوّق الآن</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          </div>
        </div>
      </CenterZoom>
    </div>
  );
}