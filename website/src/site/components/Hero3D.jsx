import {useEffect, useRef} from 'react';
import * as THREE from 'three';

/**
 * Ambient floating golden dust — sparse glowing particles drifting in 3D with
 * gentle mouse parallax. Subtle and elegant (sits over the hero image).
 */
export function Hero3D() {
  const mount = useRef(null);

  useEffect(() => {
    const el = mount.current;
    if (!el) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      62,
      el.clientWidth / el.clientHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0, 7);

    const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);

    // soft round golden sprite
    const sprite = (() => {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const ctx = c.getContext('2d');
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(240,220,168,1)');
      g.addColorStop(0.35, 'rgba(203,164,94,0.7)');
      g.addColorStop(1, 'rgba(203,164,94,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    })();

    // particles in a volume
    const COUNT = 420;
    const positions = new Float32Array(COUNT * 3);
    const speeds = new Float32Array(COUNT);
    const phase = new Float32Array(COUNT);
    const SPREAD_X = 16;
    const SPREAD_Y = 9;
    const SPREAD_Z = 7;
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * SPREAD_X;
      positions[i * 3 + 1] = (Math.random() - 0.5) * SPREAD_Y;
      positions[i * 3 + 2] = (Math.random() - 0.5) * SPREAD_Z;
      speeds[i] = 0.05 + Math.random() * 0.12;
      phase[i] = Math.random() * Math.PI * 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.13,
      map: sprite,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.95,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    const mouse = {x: 0, y: 0};
    const onMove = e => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('pointermove', onMove);

    const onResize = () => {
      if (!el.clientWidth) return;
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    const pos = geo.attributes.position.array;
    let raf;
    let running = true;

    const render = () => {
      if (!running) return;
      const t = reduce ? 0 : clock.getElapsedTime();
      const dt = reduce ? 0 : clock.getDelta();

      for (let i = 0; i < COUNT; i++) {
        // gentle upward drift + sideways sway
        pos[i * 3 + 1] += speeds[i] * dt;
        pos[i * 3] += Math.sin(t * 0.3 + phase[i]) * 0.0015;
        if (pos[i * 3 + 1] > SPREAD_Y / 2) pos[i * 3 + 1] = -SPREAD_Y / 2;
      }
      geo.attributes.position.needsUpdate = true;

      // whole field breathes + mouse parallax
      points.rotation.y = Math.sin(t * 0.05) * 0.15 + mouse.x * 0.12;
      points.rotation.x = -mouse.y * 0.08;
      camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.03;
      camera.position.y += (-mouse.y * 0.3 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };
    clock.getDelta();
    render();

    const onVis = () => {
      running = !document.hidden;
      if (running) {
        clock.getDelta();
        render();
      } else cancelAnimationFrame(raf);
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
      geo.dispose();
      mat.dispose();
      sprite.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mount} className="absolute inset-0 h-full w-full" aria-hidden />;
}
