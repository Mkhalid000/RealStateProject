import {useEffect, useRef} from 'react';
import * as THREE from 'three';

/**
 * Interactive faceted gold crystal — a luxury centerpiece. Auto-rotates and
 * tilts toward the pointer; a thin wireframe shell counter-rotates. Raw three.js.
 */
export function Gem3D() {
  const mount = useRef(null);

  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);

    // faceted gem
    const geo = new THREE.IcosahedronGeometry(1.7, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xf2a65a,
      metalness: 1,
      roughness: 0.28,
      flatShading: true,
    });
    const gem = new THREE.Mesh(geo, mat);
    scene.add(gem);

    // wireframe shell
    const wire = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(2.15, 1)),
      new THREE.LineBasicMaterial({color: 0xf6b978, transparent: true, opacity: 0.28}),
    );
    scene.add(wire);

    // lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const key = new THREE.DirectionalLight(0xfff0d0, 2.2);
    key.position.set(4, 5, 6);
    scene.add(key);
    const rim = new THREE.PointLight(0xf2a65a, 3, 30);
    rim.position.set(-5, -2, 3);
    scene.add(rim);

    const mouse = {x: 0, y: 0};
    const onMove = e => {
      const r = el.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      mouse.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
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
    let raf;
    let running = true;
    const render = () => {
      if (!running) return;
      const t = reduce ? 0 : clock.getElapsedTime();
      gem.rotation.y = t * 0.35 + mouse.x * 0.6;
      gem.rotation.x = Math.sin(t * 0.3) * 0.15 + mouse.y * 0.4;
      gem.position.y = Math.sin(t * 0.6) * 0.12;
      wire.rotation.y = -t * 0.2 + mouse.x * 0.3;
      wire.rotation.x = mouse.y * 0.2;
      wire.position.copy(gem.position);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };
    render();

    const onVis = () => {
      running = !document.hidden;
      if (running) render();
      else cancelAnimationFrame(raf);
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
      wire.geometry.dispose();
      wire.material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mount} className="h-full w-full" aria-hidden />;
}
