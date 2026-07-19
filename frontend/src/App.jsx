import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import './App.css';

// --- WATER ANIMATION BACKGROUND COMPONENT (WebGL Shader) ---
const WaterShaderBackground = () => {
  const meshRef = useRef();

  // Simple, high-performance custom fragment shader for premium organic fluid motion
  const CustomWaterShader = {
    uniforms: {
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float u_time;
      uniform vec2 u_resolution;
      varying vec2 vUv;

      void main() {
        vec2 coord = 6.0 * gl_FragCoord.xy / u_resolution.xy;
        for(int n = 1; n < 6; n++){
          float i = float(n);
          coord += vec2(sin(coord.y + u_time + i * 0.3) + 0.3, cos(coord.x - u_time + i * 0.2) + 0.4);
        }
        // Soft pearl-lotion fluid palette
        vec3 color = vec3(
          0.97 + 0.01 * sin(coord.x + coord.y),
          0.97 + 0.01 * cos(coord.x - coord.y),
          0.98 + 0.01 * sin(coord.y * 0.5)
        );
        gl_FragColor = vec4(color, 0.98);
      }
    `
  };

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.u_time.value = state.clock.getElapsedTime() * 0.4;
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial args={[CustomWaterShader]} />
    </mesh>
  );
};

// --- MAIN PORTFOLIO COMPONENT ---
export default function App() {
  const [formData, setFormData] = useState({ name: '', email: '', scope: '$4,500 – $7,500', message: '' });
  const [status, setStatus] = useState('');
  const autoScrollRef = useRef({ active: false, rafId: null, direction: 0 });
  const lastMouseY = useRef(0);
  const SCROLL_THRESHOLD = 0.15;
  const trailEl = useRef(null);
  const trailGlowEl = useRef(null);
  const trailTarget = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const trailPos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const trailGlowPos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const trailRAF = useRef(null);
  const trailStopTimer = useRef(null);
  const trailActive = useRef(false);
  const trailOpacity = useRef(0);

  const pulseTrail = (clientX, clientY) => {
    updateTrailTarget(clientX, clientY);
    if (trailEl.current) {
      trailEl.current.classList.remove('active');
      // force reflow
      // eslint-disable-next-line no-unused-expressions
      trailEl.current.offsetWidth;
      trailEl.current.classList.add('active');
    }
  };

  const startAutoScroll = (direction) => {
    if (autoScrollRef.current.active && autoScrollRef.current.direction === direction) return;
    autoScrollRef.current.active = true;
    autoScrollRef.current.direction = direction;

    const step = () => {
      if (!autoScrollRef.current.active) return;

      const h = window.innerHeight;
      const scrollTop = window.scrollY;
      const maxScrollTop = document.documentElement.scrollHeight - h;
      const canScrollUp = scrollTop > 0;
      const canScrollDown = scrollTop < maxScrollTop;

      if (direction < 0 && canScrollUp) {
        const distanceFromTop = Math.max(0, lastMouseY.current);
        const speed = 5 + Math.min(18, (SCROLL_THRESHOLD * h - distanceFromTop) / (SCROLL_THRESHOLD * h) * 18);
        window.scrollTo({ top: scrollTop - Math.max(2, Math.round(speed)), left: 0, behavior: 'auto' });
      } else if (direction > 0 && canScrollDown) {
        const distanceFromBottom = Math.max(0, h - (lastMouseY.current - h * (1 - SCROLL_THRESHOLD)));
        const speed = 5 + Math.min(18, Math.max(0, distanceFromBottom / (SCROLL_THRESHOLD * h)) * 18);
        window.scrollTo({ top: scrollTop + Math.max(2, Math.round(speed)), left: 0, behavior: 'auto' });
      } else {
        stopAutoScroll();
        return;
      }

      autoScrollRef.current.rafId = window.requestAnimationFrame(step);
    };

    autoScrollRef.current.rafId = window.requestAnimationFrame(step);
  };

  const stopAutoScroll = () => {
    if (autoScrollRef.current.rafId) {
      window.cancelAnimationFrame(autoScrollRef.current.rafId);
      autoScrollRef.current.rafId = null;
    }
    autoScrollRef.current.active = false;
    autoScrollRef.current.direction = 0;
  };

  const handleAutoScroll = (clientY) => {
    lastMouseY.current = clientY;
    const h = window.innerHeight;
    if (clientY < h * SCROLL_THRESHOLD) {
      startAutoScroll(-1);
    } else if (clientY > h * (1 - SCROLL_THRESHOLD)) {
      startAutoScroll(1);
    } else {
      stopAutoScroll();
    }
  };

  const handleCursorInteraction = (clientX, clientY) => {
    updateTrailTarget(clientX, clientY);
    handleAutoScroll(clientY);
  };

  const startTrailLoop = () => {
    if (trailRAF.current) return;
    const step = () => {
      trailPos.current.x += (trailTarget.current.x - trailPos.current.x) * 0.18;
      trailPos.current.y += (trailTarget.current.y - trailPos.current.y) * 0.18;
      trailGlowPos.current.x += (trailTarget.current.x - trailGlowPos.current.x) * 0.06;
      trailGlowPos.current.y += (trailTarget.current.y - trailGlowPos.current.y) * 0.06;
      if (trailEl.current) {
        trailEl.current.style.left = `${Math.round(trailPos.current.x)}px`;
        trailEl.current.style.top = `${Math.round(trailPos.current.y)}px`;
      }
      if (trailGlowEl.current) {
        trailGlowEl.current.style.left = `${Math.round(trailGlowPos.current.x)}px`;
        trailGlowEl.current.style.top = `${Math.round(trailGlowPos.current.y)}px`;
      }

      if (trailActive.current) {
        trailOpacity.current = Math.min(1, trailOpacity.current + 0.16);
      } else {
        trailOpacity.current = Math.max(0, trailOpacity.current - 0.12);
      }

      if (trailEl.current) {
        trailEl.current.style.opacity = `${trailOpacity.current}`;
      }
      if (trailGlowEl.current) {
        trailGlowEl.current.style.opacity = `${Math.max(0.18, trailOpacity.current * 0.5)}`;
      }

      const dx = Math.abs(trailTarget.current.x - trailPos.current.x);
      const dy = Math.abs(trailTarget.current.y - trailPos.current.y);
      if (!trailActive.current && dx < 0.5 && dy < 0.5 && trailOpacity.current <= 0.01) {
        if (trailRAF.current) {
          window.cancelAnimationFrame(trailRAF.current);
          trailRAF.current = null;
        }
        return;
      }
      trailRAF.current = window.requestAnimationFrame(step);
    };
    trailRAF.current = window.requestAnimationFrame(step);
  };

  const updateTrailTarget = (clientX, clientY) => {
    trailTarget.current = { x: clientX, y: clientY };
    if (!trailRAF.current) {
      trailPos.current = { x: clientX, y: clientY };
      if (trailEl.current) {
        trailEl.current.style.left = `${clientX}px`;
        trailEl.current.style.top = `${clientY}px`;
      }
      startTrailLoop();
    }
    trailActive.current = true;
    trailOpacity.current = 1;
    if (trailEl.current) {
      trailEl.current.classList.add('active');
      trailEl.current.style.opacity = '1';
    }
    if (trailStopTimer.current) {
      window.clearTimeout(trailStopTimer.current);
    }
    trailStopTimer.current = window.setTimeout(() => {
      trailActive.current = false;
      if (trailEl.current) trailEl.current.classList.remove('active');
      trailStopTimer.current = null;
    }, 90);
  };

  useEffect(() => {
    const handleGlobalPointerMove = (event) => {
      handleCursorInteraction(event.clientX, event.clientY);
    };

    const handleGlobalPointerLeave = () => {
      stopAutoScroll();
    };

    window.addEventListener('mousemove', handleGlobalPointerMove);
    window.addEventListener('mouseleave', handleGlobalPointerLeave);

    return () => {
      window.removeEventListener('mousemove', handleGlobalPointerMove);
      window.removeEventListener('mouseleave', handleGlobalPointerLeave);
      if (trailRAF.current) {
        window.cancelAnimationFrame(trailRAF.current);
        trailRAF.current = null;
      }
      if (trailStopTimer.current) {
        window.clearTimeout(trailStopTimer.current);
        trailStopTimer.current = null;
      }
      trailOpacity.current = 0;
      if (trailEl.current) {
        trailEl.current.style.opacity = '0';
      }
      if (trailGlowEl.current) {
        trailGlowEl.current.style.opacity = '0';
      }
      if (autoScrollRef.current.rafId) {
        window.cancelAnimationFrame(autoScrollRef.current.rafId);
        autoScrollRef.current.rafId = null;
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Transmitting...');
    try {
      const response = await fetch('https://formspree.io/f/mvzjdnjk', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setStatus('Brief Transmitted Successfully.');
        setFormData({ name: '', email: '', scope: '₹5,500 – ₹15,000', message: '' });
      } else {
        setStatus('Transmission error.');
      }
    } catch (err) {
      setStatus('Could not connect to secure server.');
    }
  };

  return (
    <div
      className="relative min-h-screen text-[#1f1c0f] selection:bg-[#1f1f1f] selection:text-white antialiased bg-gradient-to-br from-[#fbf5ee] via-[#f3e8d9] to-[#e8dcd0] overflow-x-hidden"
      onMouseMove={(event) => { handleCursorInteraction(event.clientX, event.clientY); }}
      onMouseDown={(event) => { pulseTrail(event.clientX, event.clientY); handleAutoScroll(event.clientY); }}
      onMouseLeave={() => { stopAutoScroll(); }}
      onMouseUp={() => { stopAutoScroll(); }}
    >
      <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
        <span ref={trailGlowEl} className="cursor-glow" style={{ left: 0, top: 0 }} />
        <span ref={trailEl} className="cursor-trail" style={{ left: 0, top: 0 }}>
          <span className="trail-ring" />
        </span>
      </div>

      {/* Immersive WebGL Water Canvas */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-80">
        <Canvas camera={{ position: [0, 0, 1] }}>
          <WaterShaderBackground />
        </Canvas>
      </div>

      {/* Content Layout Stack */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 md:px-12 flex justify-between items-center bg-white/12 backdrop-blur-xl border-b border-white/15 shadow-[0_24px_60px_-32px_rgba(33,28,22,0.28)]">
          <a href="#" className="text-xl font-medium tracking-tight font-mono text-[#1f1b18]">LIL HOMIES</a>
          <div className="flex gap-6 md:gap-8 text-sm uppercase tracking-widest text-[#4a433d]">
            <a href="#projects" className="hover:text-[#171717] transition-colors">Projects</a>
            <a href="#pricing" className="hover:text-[#171717] transition-colors">Pricing</a>
            <a href="#contact" className="hover:text-[#171717] text-[#171717] border-b border-[#171717] pb-1">Inquire</a>
          </div>
        </nav>

        {/* Hero Section */}
        <header className="site-section header-sticky glass-panel flex min-h-[30vh] flex-col justify-between px-4 py-8 md:px-10 md:py-10 max-w-7xl mx-auto rounded-[24px]">
          <div></div>
          <div className="max-w-5xl flex flex-col items-center text-center mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl tracking-tight leading-[0.9] font-light font-serif text-[#171717]">
              LIL HOMIES
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-sm text-neutral-500 font-mono pt-10">
            <div className="text-[#625a53]">EST. 2026 // ORGANIC PROJECT DESIGNERS</div>
            <a href="#intro" className="text-[#171717] uppercase tracking-wider text-xs flex items-center gap-1">
              Explore Index ↓
            </a>
          </div>


        <section id="intro" className="site-section glass-panel px-6 py-24 md:px-12 max-w-7xl mx-auto flex items-center justify-center rounded-[24px]">
          <div className="max-w-4xl text-center">
            <h2 className="text-4xl sm:text-5xl md:text-6xl leading-[0.95] font-light font-serif text-[#171717]">
              Websites built with
              <br />
              <span className="italic text-[#6f665f]">fluid mathematics</span>
              <br />
              WITH UNBORING ARCHITECTURE.
            </h2>
            <p className="mt-8 text-base sm:text-lg md:text-xl text-[#5d564f] max-w-2xl font-light leading-relaxed text-center mx-auto">
              We are LIL HOMIES STUDIO. A family-powered digital collective scaling bespoke Electronics and Communication Engineering and Computer Science Engineering for brands that refuse to blend into the noise.
            </p>
          </div>
        </section>
        </header>
        {/* Pricing Layout Block */}
        {/* Projects Section */}
        <section id="projects" className="site-section projects-section">
          <div className="max-w-5xl mx-auto text-left">
            <h3 className="text-3xl font-serif font-light text-[#171717]">Projects</h3>
            <p className="text-[#5d564f] mt-2">Selected work and explorations.</p>
            <div className="projects-grid">
              <div className="project-card">
                <img src="img1.png" alt="Project 1" />
                <h4 className="mt-3 font-mono text-sm text-[#3f3a36]">Project One</h4>
                <p className="text-[#6b6662] text-sm mt-1">Design system and performant frontend for a boutique brand.</p>
              </div>
              <div className="project-card">
                <img src="img2.png" alt="Project 2" />
                <h4 className="mt-3 font-mono text-sm text-[#3f3a36]">Project Two</h4>
                <p className="text-[#6b6662] text-sm mt-1">E‑commerce platform with custom CMS integrations.</p>
              </div>
              <div className="project-card">
                <img src="img3.png" alt="Project 3" />
                <h4 className="mt-3 font-mono text-sm text-[#3f3a36]">Project Three</h4>
                <p className="text-[#6b6662] text-sm mt-1">Interactive product experience with WebGL layers.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Image Gallery Section */}
        <section id="gallery" className="site-section py-16 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="max-w-5xl mx-auto text-left">
            <h3 className="text-3xl font-serif font-light text-[#171717]">Image Gallery</h3>
            <p className="text-[#5d564f] mt-2">A quick visual tour.</p>
            <div className="gallery-grid">
              <img className="gallery-img" src="https://images.unsplash.com/photo-1507238691740-187a5b1d37b8/800x600?sig=101" alt="gallery 1" />
              <img className="gallery-img" src="https://images.unsplash.com/photo-1457305237443-44c3d5a30b89/800x600?sig=102" alt="gallery 2" />
              <img className="gallery-img" src="https://images.unsplash.com/photo-1631378297854-185cff6b0986/800x600?sig=103" alt="gallery 3" />
              <img className="gallery-img" src="https://images.unsplash.com/photo-1682971829405-42b40b5f0895/800x600?sig=104" alt="gallery 4" />
              <img className="gallery-img" src="https://images.unsplash.com/photo-1605379399642-870262d3d051/800x600?sig=105" alt="gallery 5" />
              <img className="gallery-img" src="https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2/800x600?sig=106" alt="gallery 6" />
            </div>
          </div>
        </section>
        <section id="pricing" className="site-section py-24 px-6 md:px-12 max-w-4xl mx-auto">
          <div className="border border-neutral-800/60 bg-neutral-950/40 backdrop-blur-md p-8 md:p-12 rounded-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-neutral-900 pb-8">
              <div>
                <h3 className="text-2xl font-light font-mono text-white">Digital Foundation</h3>
                <p class="text-sm text-neutral-400 mt-1"><font color="white">Complete system design layout and fluid React production.</font></p>
              </div>
              <div>
                <div className="text-xs font-mono uppercase text-neutral-500 mb-3"><font color="black">Investment from</font></div>
                <div className="text-2xl font-light font-mono text-white leading-tight">ELECTRONICS: ₹1,200</div>
                <div className="text-2xl font-light font-mono text-white leading-tight">WEBSITE: ₹5,500</div>
              </div>
            </div>
            <div className="mt-8 text-center">
              <a href="#contact" className="inline-block w-full md:w-auto px-8 py-4 bg-white text-black font-medium text-sm uppercase tracking-wider hover:bg-neutral-200 transition-colors">
                Initiate Project Briefing
              </a>
            </div>
          </div>
        </section>

        {/* Contact Pipeline Architecture */}
        <footer id="contact" className="site-section py-24 px-6 md:px-12 bg-white/80 backdrop-blur-md border-t border-black/10">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <h2 className="text-4xl md:text-5xl font-serif font-light text-[#171717] leading-tight">
                  Ready to secure <br />your <span class="italic text-[#7a726a]">digital edge</span>?
                </h2>
              </div>
              <div className="text-xs font-mono text-neutral-600 mt-12">
                © 2026 LIL HOMIESSTUDIO // ALL RIGHTS RESERVED
              </div>
            </div>

            <div className="lg:col-span-7">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-widest text-neutral-400 font-mono">Identity / Company</label>
                    <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-neutral-900/60 border border-neutral-800 p-4 text-white focus:outline-none focus:border-neutral-500 text-sm" type="text" required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-widest text-neutral-400 font-mono">Secure Email Channel</label>
                    <input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-neutral-900/60 border border-neutral-800 p-4 text-white focus:outline-none focus:border-neutral-500 text-sm" type="email" required />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest text-neutral-400 font-mono">Project Parameters Brief</label>
                  <textarea value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full bg-neutral-900/60 border border-neutral-800 p-4 text-white focus:outline-none focus:border-neutral-500 text-sm h-32 resize-none" required></textarea>
                </div>

                <button type="submit" class="w-full py-4 border border-neutral-700 hover:border-white text-neutral-300 hover:text-white font-mono text-xs uppercase tracking-widest transition-colors">
                  Transmit Brief ↓
                </button>
                {status && <p className="text-xs font-mono text-neutral-400 mt-2">{status}</p>}
              </form>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
