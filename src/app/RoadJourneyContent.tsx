/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import Image from 'next/image';
import Link from 'next/link';

/* ============================================================
   تعريف الألوان المطلوبة (AppColors)
   ============================================================ */
export const AppColors = {
  primaryRose: '#D81B60',
  lightPinkBg: '#FFF0F5',
  surfaceWhite: '#FFFFFF',
  softPink: '#F06292',
  deepRose: '#880E4F',
  textDark: '#2D1520',
  textMuted: '#885E73',
};

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
    '0 0 12px rgba(216,27,96,0.95), 0 0 30px rgba(216,27,96,0.65), 0 0 60px rgba(136,14,79,0.45), 0 3px 8px rgba(0,0,0,0.95)',
} as const;
const softGlow = {
  textShadow:
    '0 0 8px rgba(216,27,96,0.8), 0 0 20px rgba(136,14,79,0.4), 0 2px 6px rgba(0,0,0,0.95)',
} as const;

/* ============================================================
   CenterZoom — محسن للأداء الخارق (إزالة الـ blur الثقيل واستخدام GPU)
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

      // تحسين حساب النسبة لتكون خفيفة وسريعة
      let p = last ? (vh - rect.top) / vh : (vh - rect.top) / (rect.height + vh);
      p = p < 0 ? 0 : p > 1 ? 1 : p;

      let scale: number;
      let opacity: number;
      let rotY = 0;

      if (last) {
        const eased = p * p * (3 - 2 * p);
        scale = startScale + eased * (1 - startScale);
        opacity = startOpacity + eased * 1.4;
        if (opacity > 1) opacity = 1;
      } else if (p < holdStart) {
        const t = p / holdStart;
        const eased = t * t * (3 - 2 * t);
        scale = startScale + eased * (1 - startScale);
        opacity = startOpacity + eased * 1.4;
        if (opacity > 1) opacity = 1;
        if (spin) rotY = -spin / 2 + eased * (spin / 2);
      } else if (p < holdEnd) {
        scale = 1;
        opacity = 1;
        rotY = 0;
      } else {
        const t = (p - holdEnd) / (1 - holdEnd);
        const eased = t * t;
        scale = 1 + eased * (maxScale - 1);
        opacity = 1 - eased * 1.6;
        if (opacity < 0) opacity = 0;
        if (spin) rotY = eased * (spin / 2);
      }

      // تطبيق التحديثات دفعة واحدة باستخدام تحويلات تسريع العتاد (GPU Acceleration) فقط بدون blur
      card.style.transform = `translate3d(0,0,0) scale(${scale.toFixed(3)})`;
      card.style.opacity = opacity.toFixed(2);

      if (spinEl) {
        spinEl.style.transform = `rotateY(${rotY.toFixed(1)}deg)`;
      }

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
    window.addEventListener('resize', onScroll, { passive: true });

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
            willChange: 'transform, opacity',
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
            transform: `translate3d(0,0,0) scale(${startScale})`,
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

  /* Three.js Scene — محسنة بالكامل لتخفيف الضغط على المعالج */
  useEffect(() => {
    const canvas = canvasRef.current;
    const scroller = scrollRef.current;
    if (!canvas || !scroller) return;

    const ROAD_LENGTH = 6000;
    const ROAD_CENTER_Z = -ROAD_LENGTH / 2 + 100;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(AppColors.textDark);
    scene.fog = new THREE.FogExp2(AppColors.textDark, 0.009);

    const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 4000);
    camera.position.set(0, 3, 8);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // تقليل الـ pixel ratio لزيادة الـ FPS
    setReady(true);

    // تقليل عدد النجوم والجبال قليلاً لتخفيف الحمل دون تأثير على الشكل الجمالي
    const starCount = 1200;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 1200;
      starPos[i * 3 + 1] = Math.random() * 260 + 15;
      starPos[i * 3 + 2] = -Math.random() * 4500;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: AppColors.lightPinkBg, size: 1.1, transparent: true, opacity: 0.85, sizeAttenuation: true,
    }));
    scene.add(stars);

    const moonPos = new THREE.Vector3(70, 90, -900);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(9, 16, 16), new THREE.MeshBasicMaterial({ color: AppColors.lightPinkBg }));
    moon.position.copy(moonPos);
    scene.add(moon);

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(18, 16, 16),
      new THREE.MeshBasicMaterial({ color: AppColors.softPink, transparent: true, opacity: 0.14 })
    );
    halo.position.copy(moonPos);
    scene.add(halo);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(800, ROAD_LENGTH + 400),
      new THREE.MeshBasicMaterial({ color: AppColors.textDark })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.05, ROAD_CENTER_Z);
    scene.add(ground);

    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(16, ROAD_LENGTH),
      new THREE.MeshBasicMaterial({ color: AppColors.deepRose })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, ROAD_CENTER_Z);
    scene.add(road);

    const roadGrid = new THREE.Mesh(
      new THREE.PlaneGeometry(16, ROAD_LENGTH, 6, 400),
      new THREE.MeshBasicMaterial({ color: AppColors.primaryRose, wireframe: true, transparent: true, opacity: 0.3 })
    );
    roadGrid.rotation.x = -Math.PI / 2;
    roadGrid.position.set(0, 0.01, ROAD_CENTER_Z);
    scene.add(roadGrid);

    const edgeMeshes: THREE.Mesh[] = [];
    [-8, 8].forEach((x) => {
      const edge = new THREE.Mesh(
        new THREE.PlaneGeometry(0.4, ROAD_LENGTH),
        new THREE.MeshBasicMaterial({ color: AppColors.primaryRose, transparent: true, opacity: 0.9 })
      );
      edge.rotation.x = -Math.PI / 2;
      edge.position.set(x, 0.02, ROAD_CENTER_Z);
      scene.add(edge);
      edgeMeshes.push(edge);
    });

    const dashMat = new THREE.MeshBasicMaterial({ color: AppColors.softPink, transparent: true, opacity: 0.9 });
    const dashGeo = new THREE.PlaneGeometry(0.4, 4);
    for (let i = 0; i < 300; i++) {
      const dash = new THREE.Mesh(dashGeo, dashMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, 0.02, -i * 18);
      scene.add(dash);
    }

    const mountainGeo = new THREE.ConeGeometry(11, 28, 3);
    const mountainMat = new THREE.MeshBasicMaterial({ color: AppColors.deepRose, wireframe: true, transparent: true, opacity: 0.75 });
    for (let i = 0; i < 80; i++) {
      const l = new THREE.Mesh(mountainGeo, mountainMat);
      l.position.set(-22 - Math.random() * 14, 13 + Math.random() * 5, -i * 44);
      scene.add(l);
      const r = new THREE.Mesh(mountainGeo, mountainMat);
      r.position.set(22 + Math.random() * 14, 13 + Math.random() * 5, -i * 44);
      scene.add(r);
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

      currentScroll += (scrollTarget - currentScroll) * 0.08;

      const zPos = Math.max(8 - currentScroll, -ROAD_LENGTH + 400);
      camera.position.z = zPos;
      camera.position.x = Math.sin(currentScroll * 0.035) * 1.6;
      camera.position.y = 3;

      stars.rotation.y = t * 0.005;

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize, { passive: true });

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
      className="relative w-full h-screen overflow-y-scroll overflow-x-hidden text-white"
      style={{ backgroundColor: AppColors.textDark, scrollBehavior: 'auto' }}
    >
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ opacity: ready ? 1 : 0, transition: 'opacity 1.2s ease' }}
      />

      <div className="fixed top-0 left-0 right-0 h-[3px] z-50 bg-white/5">
        <div ref={barRef} className="h-full origin-right"
             style={{ transform: 'scaleX(0)', transition: 'transform .1s linear', backgroundColor: AppColors.primaryRose }} />
      </div>

      <div className="fixed bottom-[5px] left-0 right-0 z-40 text-center pointer-events-auto">
        <p className="text-[11px] font-bold" style={{ color: AppColors.lightPinkBg, ...softGlow }}>
          جميع الحقوق محفوظة © 2026 zubaida-beauty
        </p>
        <p className="text-[11px] font-black mt-0.5" style={{ color: AppColors.softPink, ...softGlow }}>
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
          <div className="relative w-32 h-32 sm:w-40 sm:h-40" style={{ filter: `drop-shadow(0 0 30px ${AppColors.primaryRose})` }}>
            <Image src="/logo.png" alt="Zubaida Beauty" fill sizes="(max-width: 640px) 128px, 160px" priority className="object-contain" />
          </div>
          <span className="text-[11px] font-black tracking-[0.35em]" style={{ color: AppColors.softPink, ...softGlow }}>
            تأسست عام 2021
          </span>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text leading-tight" 
              style={{ backgroundImage: `linear-gradient(to right, ${AppColors.lightPinkBg}, ${AppColors.softPink}, ${AppColors.surfaceWhite})`, ...glow }}>
            شركة زُبيدة بيوتي
          </h1>
          <p className="text-sm sm:text-base font-bold leading-relaxed max-w-xl" style={{ color: AppColors.lightPinkBg, ...softGlow }}>
            تأسست على يد خبيرة حاصلة على دبلوم البورد الأوروبي وأكاديمية جابر بن حيان،
            لتقديم أرقى مستحضرات التجميل والعناية الطبيعية.
          </p>
        </div>
      </CenterZoom>

      {/* 2) المنتجات المميزة */}
      {products.length === 0 && (
        <CenterZoom height="80vh" holdStart={0.35} holdEnd={0.65}>
          <p className="font-black text-lg" style={{ color: AppColors.softPink, ...glow }}>
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
                  backfaceVisibility: 'hidden',
                  willChange: 'transform',
                  filter: `drop-shadow(0 0 35px ${AppColors.primaryRose})`,
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
              <h3 className="text-3xl sm:text-4xl font-black" style={{ color: AppColors.surfaceWhite, ...glow }}>
                {item.name}
              </h3>
              {item.description && (
                <p className="text-xs sm:text-sm font-bold leading-relaxed max-w-md text-center" style={{ color: AppColors.lightPinkBg, ...softGlow }}>
                  {item.description}
                </p>
              )}
              {item.price > 0 && (
                <span className="text-2xl font-black mt-1" style={{ color: AppColors.softPink, ...glow }}>
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
          <span className="inline-block text-[11px] font-black tracking-[0.35em]" style={{ color: AppColors.softPink, ...softGlow }}>من نحن</span>
          <h2 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text" 
              style={{ backgroundImage: `linear-gradient(to right, ${AppColors.lightPinkBg}, ${AppColors.softPink})`, ...glow }}>
            حكاية بدأت بشغف الجمال
          </h2>
          <p className="text-sm sm:text-base leading-loose font-bold" style={{ color: AppColors.lightPinkBg, ...softGlow }}>
            انطلقت <span className="font-black" style={{ color: AppColors.softPink }}>زُبيدة بيوتي</span> عام 2021
            من رؤية بسيطة: أن يحصل كل شخص على مستحضرات عناية صادقة، طبيعية، وفعّالة.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
            {[{ n: '2021', l: 'سنة التأسيس' }, { n: '+40', l: 'منتج طبيعي' }, { n: '+5000', l: 'عميل سعيد' }, { n: '100%', l: 'مكوّنات طبيعية' }].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl sm:text-4xl font-black" style={{ color: AppColors.softPink, ...glow }}>{s.n}</div>
                <div className="text-[10px] font-bold mt-1 tracking-wider" style={{ color: AppColors.lightPinkBg, ...softGlow }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </CenterZoom>

      {/* 5) الشهادات */}
      <CenterZoom height="120vh" maxScale={5} holdStart={0.32} holdEnd={0.58}>
        <div className="w-[92vw] sm:w-[760px] max-w-[92vw] text-center space-y-4">
          <span className="inline-block text-[11px] font-black tracking-[0.35em]" style={{ color: AppColors.softPink, ...softGlow }}>موثّق رسمياً</span>
          <h2 className="text-2xl sm:text-4xl font-black" style={{ color: AppColors.surfaceWhite, ...glow }}>
            الشهادات والاعتمادات الرسمية
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center justify-center">
            {[
              { src: '/uk.jpg', alt: 'European Board', title: 'البورد الأوروبي للتطوير والتدريب القيادي (UK)' },
              { src: '/ar.jpg', alt: 'Gaber Academy', title: 'أكاديمية جابر بن حيان للطب النبوي وعلوم الأعشاب' },
            ].map((c, i) => (
              <div key={i} className="space-y-2 flex flex-col items-center">
                <div className="relative w-[280px] h-[190px] sm:w-[320px] sm:h-[210px]" style={{ filter: `drop-shadow(0 0 20px ${AppColors.primaryRose})` }}>
                  <Image src={c.src} alt={c.alt} fill sizes="(max-width: 640px) 280px, 320px" className="object-fill rounded-xl" />
                </div>
                <p className="font-black text-[11px] sm:text-xs" style={{ color: AppColors.surfaceWhite, ...softGlow }}>{c.title}</p>
              </div>
            ))}
          </div>
        </div>
      </CenterZoom>

      {/* 6) التواصل الاجتماعي */}
      <CenterZoom height="110vh" maxScale={5} holdStart={0.32} holdEnd={0.6}>
        <div className="w-[92vw] sm:w-[720px] max-w-[92vw] space-y-5 text-center">
          <span className="inline-block text-[11px] font-black tracking-[0.35em]" style={{ color: AppColors.softPink, ...softGlow }}>
            ننتظرك
          </span>
          <h2 className="text-3xl sm:text-5xl font-black" style={{ color: AppColors.surfaceWhite, ...glow }}>
            تواصل معنا عبر منصاتنا
          </h2>
          <p className="text-sm font-bold" style={{ color: AppColors.lightPinkBg, ...softGlow }}>
            سوريا • قدسيا، دمشق
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-2">
            {/* واتساب */}
            <a
              href="https://wa.me/966XXXXXXXXX"
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto flex items-center gap-2 text-sm font-black text-white hover:text-green-400 transition-colors"
              style={softGlow}
            >
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
              </svg>
              <span>واتساب</span>
            </a>

            {/* إنستغرام */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto flex items-center gap-2 text-sm font-black text-white hover:text-pink-400 transition-colors"
              style={softGlow}
            >
              <svg className="w-5 h-5 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span>إنستغرام</span>
            </a>

            {/* ثريدز */}
            <a
              href="https://threads.net"
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto flex items-center gap-2 text-sm font-black text-white hover:text-purple-300 transition-colors"
              style={softGlow}
            >
              <svg className="w-5 h-5 text-purple-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.186 24.007c-3.328 0-6.125-1.15-8.087-3.326C2.23 18.602 1.3 15.602 1.3 12.008c0-3.594.93-6.594 2.799-8.673C6.061 1.158 8.858.008 12.186.008c3.27 0 6.028 1.122 7.973 3.243 1.83 1.996 2.752 4.872 2.742 8.55v.231h-3.385v-.231c.007-2.766-.642-4.887-1.928-6.304-1.378-1.517-3.38-2.316-5.402-2.316-2.33 0-4.321.841-5.608 2.368-1.282 1.522-1.932 3.753-1.932 6.452 0 2.7.65 4.93 1.932 6.452 1.287 1.527 3.278 2.368 5.608 2.368 2.022 0 4.024-.799 5.402-2.316 1.286-1.417 1.935-3.538 1.928-6.304H12.186v-3.23h8.318c.092 1.135.138 2.333.138 3.534 0 4.398-1.22 7.842-3.626 10.237-2.315 2.304-5.46 3.538-8.83 3.538z" />
              </svg>
              <span>ثريدز</span>
            </a>

            {/* فيسبوك */}
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto flex items-center gap-2 text-sm font-black text-white hover:text-blue-400 transition-colors"
              style={softGlow}
            >
              <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>فيسبوك</span>
            </a>
          </div>
        </div>
      </CenterZoom>

      {/* 7) الخاتمة */}
      <CenterZoom last height="120vh" startScale={0.05} startOpacity={0}>
        <div className="w-[90vw] sm:w-[640px] max-w-[90vw] text-center space-y-6">
          <h2 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text leading-tight" 
              style={{ backgroundImage: `linear-gradient(to right, ${AppColors.lightPinkBg}, ${AppColors.softPink}, ${AppColors.surfaceWhite})`, ...glow }}>
            جمالك يبدأ من هنا
          </h2>
          <div className="pt-4">
            <Link href="/home"
              className="pointer-events-auto inline-flex items-center gap-3 px-8 py-4 rounded-3xl text-white text-sm font-black shadow-2xl hover:scale-105 active:scale-95 transition"
              style={{ backgroundImage: `linear-gradient(to left, ${AppColors.deepRose}, ${AppColors.primaryRose})`, boxShadow: `0 25px 50px -12px rgba(216,27,96,0.5)` }}>
              <span>ابدأ التسوّق الآن</span>
            </Link>
          </div>
        </div>
      </CenterZoom>
    </div>
  );
}