/**
 * Unreal-style polished onyx glass cube.
 * Black-room IBL (white softboxes only) + physical glass coat + mild bloom.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';

const container = document.getElementById('heroTesseract');
if (container) initOnyxCube(container);

/**
 * Pure black studio: void + white/gray area lights only.
 * Reflections stay monochrome — no colorful environment maps.
 */
function buildBlackRoomEnv(renderer) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x000000);

    // Infinite black void
    envScene.add(
        new THREE.Mesh(
            new THREE.SphereGeometry(60, 24, 24),
            new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide })
        )
    );

    // White softboxes only (stack for intensity)
    const plane = new THREE.PlaneGeometry(1, 1);
    const addSoftbox = (x, y, z, w, h, layers = 2) => {
        const mat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
        });
        const g = new THREE.Group();
        for (let i = 0; i < layers; i++) {
            g.add(new THREE.Mesh(plane, mat));
        }
        g.position.set(x, y, z);
        g.scale.set(w, h, 1);
        g.lookAt(0, 0, 0);
        envScene.add(g);
    };

    // Key softbox — large, upper right (many layers = stronger IBL)
    addSoftbox(9, 11, 5, 9, 4.5, 8);
    // Fill strip — left wall
    addSoftbox(-10, 3, 0, 2.5, 11, 5);
    // Top strip
    addSoftbox(0, 14, -2, 14, 3, 6);
    // Back edge light
    addSoftbox(0, 5, -11, 10, 2.5, 5);
    // Floor bounce
    addSoftbox(0, -8, 4, 16, 4, 3);
    // Hard specular pin lights
    addSoftbox(5, 10, 2, 1.6, 1.6, 10);
    addSoftbox(-3, 8, 4, 1.2, 1.2, 8);
    addSoftbox(3, 7, -6, 2, 2, 6);

    const rt = pmrem.fromScene(envScene, 0.03);
    pmrem.dispose();
    plane.dispose();
    return rt;
}

function initOnyxCube(container) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 100);
    // Closer camera = larger cube in frame
    camera.position.set(0, 0.35, 6.4);

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = 'hero-tesseract-canvas';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    container.appendChild(renderer.domElement);

    // Pure white lights only (no tinted fill)
    scene.add(new THREE.AmbientLight(0xffffff, 0.05));

    const key = new THREE.DirectionalLight(0xffffff, 6.5);
    key.position.set(4.5, 10, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 40;
    key.shadow.camera.left = -8;
    key.shadow.camera.right = 8;
    key.shadow.camera.top = 8;
    key.shadow.camera.bottom = -8;
    key.shadow.bias = -0.0003;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xffffff, 0.9);
    fill.position.set(-6, 3, -2);
    scene.add(fill);

    const back = new THREE.DirectionalLight(0xffffff, 0.7);
    back.position.set(0, 4, -8);
    scene.add(back);

    const spot = new THREE.SpotLight(0xffffff, 50, 60, Math.PI / 8, 0.25, 1.6);
    spot.position.set(2.5, 11, 6);
    spot.target.position.set(0, 0, 0);
    scene.add(spot);
    scene.add(spot.target);

    // Black-room environment map — monochrome reflections only
    const envRT = buildBlackRoomEnv(renderer);
    scene.environment = envRT.texture;

    const root = new THREE.Group();
    scene.add(root);

    const size = 3.15;
    const bodyGeo = new THREE.BoxGeometry(size, size, size);

    // Base: polished black onyx — samples black-room softboxes only
    const onyxMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0x08080c),
        metalness: 0.92,
        roughness: 0.055,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        envMapIntensity: 2.4,
        reflectivity: 1.0,
        ior: 1.8,
        specularIntensity: 1.0,
        specularColor: new THREE.Color(0xffffff),
    });

    const body = new THREE.Mesh(bodyGeo, onyxMat);
    body.castShadow = true;
    body.receiveShadow = true;
    root.add(body);

    // Thin refractive glass shell for wet / glassy sheen (neutral gray only)
    const coatGeo = new THREE.BoxGeometry(size * 1.018, size * 1.018, size * 1.018);
    const coatMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0x0a0a0c),
        metalness: 0.0,
        roughness: 0.0,
        transmission: 1.0,
        thickness: 0.35,
        ior: 1.45,
        transparent: true,
        opacity: 1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
        envMapIntensity: 2.8,
        attenuationColor: new THREE.Color(0x030304),
        attenuationDistance: 1.8,
        depthWrite: false,
        side: THREE.FrontSide,
    });
    const coat = new THREE.Mesh(coatGeo, coatMat);
    root.add(coat);

    // Hairline geometric edges (almost invisible)
    const edgesGeo = new THREE.EdgesGeometry(bodyGeo, 1);
    const edgeMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.07,
    });
    const edges = new THREE.LineSegments(edgesGeo, edgeMat);
    edges.scale.setScalar(1.004);
    root.add(edges);

    // Reflective floor
    const ground = new THREE.Mesh(
        new THREE.CircleGeometry(8, 64),
        new THREE.MeshPhysicalMaterial({
            color: 0x000000,
            metalness: 0.95,
            roughness: 0.12,
            envMapIntensity: 0.9,
            clearcoat: 0.5,
            clearcoatRoughness: 0.15,
        })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2.05;
    ground.receiveShadow = true;
    scene.add(ground);

    const blob = new THREE.Mesh(
        new THREE.CircleGeometry(2.0, 48),
        new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
        })
    );
    blob.rotation.x = -Math.PI / 2;
    blob.position.y = -2.02;
    scene.add(blob);

    // Post FX
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.22, 0.4, 0.85);
    composer.addPass(bloom);
    const smaa = new SMAAPass(1, 1);
    composer.addPass(smaa);
    composer.addPass(new OutputPass());

    function resize() {
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        camera.aspect = w / Math.max(h, 1);
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
        composer.setSize(w, h);
        bloom.setSize(w, h);
        const pr = renderer.getPixelRatio();
        smaa.setSize(w * pr, h * pr);
    }
    resize();
    window.addEventListener('resize', resize);

    let targetRX = 0.45;
    let targetRY = 0.68;
    let curRX = 0.45;
    let curRY = 0.68;

    window.addEventListener(
        'pointermove',
        (e) => {
            const nx = (e.clientX / window.innerWidth) * 2 - 1;
            const ny = (e.clientY / window.innerHeight) * 2 - 1;
            targetRY = 0.68 + nx * 0.38;
            targetRX = 0.45 + ny * 0.2;
        },
        { passive: true }
    );

    let last = performance.now();
    let raf = 0;
    let running = true;
    window.addEventListener(
        'scroll',
        () => {
            running = window.scrollY < window.innerHeight * 1.2;
        },
        { passive: true }
    );

    function frame(now) {
        raf = requestAnimationFrame(frame);
        if (!running && now - last < 400) return;
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;

        targetRY += dt * 0.055;
        curRX += (targetRX - curRX) * 0.04;
        curRY += (targetRY - curRY) * 0.04;
        root.rotation.x = curRX;
        root.rotation.y = curRY;
        edgeMat.opacity = 0.04 + Math.abs(Math.sin(curRY)) * 0.06;

        composer.render();
    }
    raf = requestAnimationFrame(frame);

    window.__blackboxHeroTesseractDispose = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
        composer.dispose();
        renderer.dispose();
        bodyGeo.dispose();
        coatGeo.dispose();
        edgesGeo.dispose();
        onyxMat.dispose();
        coatMat.dispose();
        edgeMat.dispose();
        if (renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
    };
}


