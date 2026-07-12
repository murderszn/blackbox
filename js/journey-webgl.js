/**
 * BLACKBOX journey field
 * A restrained, scroll-directed Three.js scene that carries the hero's object
 * language through the financial model. It listens to the semantic journey
 * state published by experience.js; finance/UI logic remains completely
 * independent from WebGL.
 */
import * as THREE from 'three';

const mount = document.getElementById('journeyWebgl');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (mount && !reduced) initJourneyField(mount);
else if (mount) mount.dataset.disabled = 'reduced-motion';

function initJourneyField(container) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
    camera.position.set(0, 0, 12);

    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.82;
    renderer.domElement.className = 'journey-webgl-canvas';
    container.appendChild(renderer.domElement);
    container.hidden = false;
    container.classList.add('is-live');
    container.dataset.disabled = '0';

    const rig = new THREE.Group();
    scene.add(rig);

    const nodeCount = 11;
    const points = Array.from({ length: nodeCount }, (_, i) => {
        const t = i / (nodeCount - 1);
        return new THREE.Vector3(
            Math.sin(t * Math.PI * 3.2) * 2.25,
            (0.5 - t) * 13,
            Math.cos(t * Math.PI * 2.4) * 1.15 - t * 2.2
        );
    });

    const path = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.42);
    const pathMaterial = new THREE.LineBasicMaterial({
        color: 0xc9a86c,
        transparent: true,
        opacity: 0.25,
        depthWrite: false
    });
    const pathLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(path.getPoints(180)),
        pathMaterial
    );
    rig.add(pathLine);

    const nodeGeometry = new THREE.IcosahedronGeometry(0.105, 1);
    const haloGeometry = new THREE.RingGeometry(0.16, 0.185, 32);
    const nodes = points.map((point, i) => {
        const group = new THREE.Group();
        group.position.copy(point);
        const core = new THREE.Mesh(
            nodeGeometry,
            new THREE.MeshBasicMaterial({
                color: i === 0 ? 0xf0dfae : 0xc9a86c,
                transparent: true,
                opacity: 0.52
            })
        );
        const halo = new THREE.Mesh(
            haloGeometry,
            new THREE.MeshBasicMaterial({
                color: 0xe8d5a3,
                transparent: true,
                opacity: 0.12,
                side: THREE.DoubleSide,
                depthWrite: false
            })
        );
        group.add(core, halo);
        rig.add(group);
        return { group, core, halo };
    });

    // Dust is intentionally sparse: atmosphere, not a starfield.
    const dustPositions = new Float32Array(90 * 3);
    for (let i = 0; i < 90; i++) {
        dustPositions[i * 3] = (Math.random() - 0.5) * 14;
        dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 20;
        dustPositions[i * 3 + 2] = -2 - Math.random() * 8;
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMaterial = new THREE.PointsMaterial({
        color: 0xc9a86c,
        size: 0.018,
        transparent: true,
        opacity: 0.2,
        depthWrite: false
    });
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dust);

    let targetProgress = 0;
    let progress = 0;
    let pointerX = 0;
    let pointerY = 0;
    let visible = !document.hidden;

    const readJourney = (state = window.__bbJourney) => {
        if (!state) return;
        const next = Number(state.progress);
        if (Number.isFinite(next)) targetProgress = THREE.MathUtils.clamp(next, 0, 1);
    };
    window.addEventListener('bb:journey', (event) => readJourney(event.detail));
    window.addEventListener('pointermove', (event) => {
        pointerX = (event.clientX / Math.max(1, innerWidth) - 0.5) * 2;
        pointerY = (event.clientY / Math.max(1, innerHeight) - 0.5) * 2;
    }, { passive: true });
    document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

    function resize() {
        const width = container.clientWidth || innerWidth;
        const height = container.clientHeight || innerHeight;
        camera.aspect = width / Math.max(1, height);
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const clock = new THREE.Clock();
    let raf = 0;
    function frame() {
        raf = requestAnimationFrame(frame);
        if (!visible) return;
        const dt = Math.min(clock.getDelta(), 0.05);
        progress = THREE.MathUtils.damp(progress, targetProgress, 4.5, dt);
        const focus = path.getPointAt(THREE.MathUtils.clamp(progress, 0.001, 0.999));
        const tangent = path.getTangentAt(THREE.MathUtils.clamp(progress, 0.001, 0.999));

        camera.position.x = THREE.MathUtils.damp(camera.position.x, focus.x + 4.7 + pointerX * 0.18, 2.8, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, focus.y + pointerY * -0.12, 2.8, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, focus.z + 9.2, 2.8, dt);
        camera.lookAt(focus.x - 0.45, focus.y + tangent.y * 0.7, focus.z);

        const active = Math.round(progress * (nodeCount - 1));
        nodes.forEach(({ group, core, halo }, i) => {
            const distance = Math.abs(i - active);
            const energy = Math.max(0, 1 - distance * 0.55);
            const pulse = 1 + energy * (0.7 + Math.sin(performance.now() * 0.0025) * 0.08);
            group.scale.setScalar(THREE.MathUtils.damp(group.scale.x, pulse, 6, dt));
            core.material.opacity = 0.18 + energy * 0.74;
            halo.material.opacity = 0.03 + energy * 0.26;
            halo.lookAt(camera.position);
        });

        rig.rotation.y = THREE.MathUtils.damp(rig.rotation.y, pointerX * 0.025, 2.2, dt);
        dust.rotation.y += dt * 0.006;
        pathMaterial.opacity = 0.12 + progress * 0.12;
        renderer.render(scene, camera);
    }
    readJourney();
    raf = requestAnimationFrame(frame);

    window.__blackboxJourneyDispose = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
        nodeGeometry.dispose();
        haloGeometry.dispose();
        pathLine.geometry.dispose();
        pathMaterial.dispose();
        dustGeometry.dispose();
        dustMaterial.dispose();
        nodes.forEach(({ core, halo }) => {
            core.material.dispose();
            halo.material.dispose();
        });
        renderer.dispose();
        renderer.domElement.remove();
    };
}
