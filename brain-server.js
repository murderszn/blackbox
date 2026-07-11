#!/usr/bin/env node
/**
 * BLACKBOX Brain Mathematics Viewer.
 * Serves the Obsidian brain vault on http://localhost:4444
 * with an interactive WebGL 3D Force-Directed Graph and glassmorphic markdown drawer.
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 4444;
const BRAIN_DIR = path.join(__dirname, 'brain');

// Recursive markdown file finder
function getBrainFiles(dir, baseDir = dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        if (file === '.obsidian' || file === 'assets' || file.startsWith('.')) return;
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getBrainFiles(filePath, baseDir));
        } else if (file.endsWith('.md')) {
            const relPath = path.relative(baseDir, filePath);
            results.push({
                path: relPath,
                name: file.slice(0, -3),
                dir: path.dirname(relPath) === '.' ? 'General' : path.dirname(relPath)
            });
        }
    });
    return results;
}

// Generate graph nodes and links parsed from wikilinks
function getGraphData(dir, baseDir = dir) {
    const files = getBrainFiles(dir, baseDir);
    const nodes = [];
    const nameToPath = {};

    files.forEach(f => {
        nameToPath[f.name.toLowerCase()] = f.path;
        nodes.push({
            id: f.path,
            name: f.name,
            dir: f.dir,
            val: f.name === 'Home' ? 3 : 1.5 // Home is visually larger
        });
    });

    const links = [];
    files.forEach(f => {
        const fullPath = path.join(dir, f.path);
        const content = fs.readFileSync(fullPath, 'utf8');
        // Find wikilinks
        const matches = [...content.matchAll(/\[\[(.*?)\]\]/g)].map(m => m[1].trim());
        matches.forEach(noteName => {
            const targetPath = nameToPath[noteName.toLowerCase()];
            if (targetPath && targetPath !== f.path) {
                // Prevent duplicate links in same direction
                const exists = links.some(l => l.source === f.path && l.target === targetPath);
                if (!exists) {
                    links.push({
                        source: f.path,
                        target: targetPath
                    });
                }
            }
        });
    });

    return { nodes, links };
}

const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BLACKBOX · 3D Brain Map</title>
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet">
    <!-- KaTeX CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
    <!-- Prism Theme for Code syntax highlighting -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-tomorrow.min.css">
    
    <style>
        :root {
            --bg-dark: #000000;
            --bg-card: rgba(12, 10, 8, 0.45);
            --border-color: rgba(232, 213, 163, 0.15);
            --gold-accent: #e8d5a3;
            --gold-soft: #c9a86c;
            --text-main: #f4efe6;
            --text-muted: rgba(244, 239, 230, 0.55);
            --text-quiet: rgba(244, 239, 230, 0.3);
            --font-ui: 'Outfit', system-ui, sans-serif;
            --font-mono: 'JetBrains Mono', monospace;
            --font-syne: 'Syne', sans-serif;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            background-color: var(--bg-dark);
            color: var(--text-main);
            font-family: var(--font-ui);
            height: 100vh;
            overflow: hidden;
            -webkit-font-smoothing: antialiased;
            position: relative;
        }

        /* 3D Canvas container */
        #3d-graph {
            width: 100%;
            height: 100%;
            background: radial-gradient(ellipse at center, rgba(8,6,4,1) 0%, #000000 100%);
            position: absolute;
            top: 0;
            left: 0;
            z-index: 1;
        }

        /* Floating Dashboard Header */
        .glass-header {
            position: absolute;
            top: 24px;
            left: 24px;
            z-index: 10;
            background: var(--bg-card);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid var(--border-color);
            padding: 20px 24px;
            border-radius: 12px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.8);
            width: 320px;
            pointer-events: auto;
        }

        .header-title {
            font-family: var(--font-syne);
            font-size: 1.15rem;
            font-weight: 800;
            letter-spacing: 0.12em;
            color: var(--gold-accent);
            text-transform: uppercase;
            margin-bottom: 2px;
        }

        .header-subtitle {
            font-size: 0.7rem;
            color: var(--text-muted);
            font-family: var(--font-mono);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 12px;
            display: block;
        }

        .search-bar {
            width: 100%;
            background: rgba(0, 0, 0, 0.6);
            border: 1px solid rgba(232, 213, 163, 0.2);
            padding: 10px 14px;
            border-radius: 6px;
            color: var(--text-main);
            font-family: var(--font-ui);
            font-size: 0.85rem;
            outline: none;
            transition: all 0.2s ease;
        }

        .search-bar:focus {
            border-color: var(--gold-soft);
            box-shadow: 0 0 10px rgba(201, 168, 108, 0.15);
        }

        /* Stats HUD */
        .hud-panel {
            position: absolute;
            bottom: 24px;
            left: 24px;
            z-index: 10;
            background: var(--bg-card);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid var(--border-color);
            padding: 16px 20px;
            border-radius: 8px;
            width: 320px;
            font-family: var(--font-mono);
            font-size: 0.72rem;
            color: var(--text-muted);
            display: flex;
            flex-direction: column;
            gap: 6px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.6);
        }

        .hud-row {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid rgba(232, 213, 163, 0.05);
            padding-bottom: 4px;
        }

        .hud-row:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }

        .hud-val {
            color: var(--gold-soft);
            font-weight: 500;
        }

        /* Controls Panel */
        .controls-panel {
            position: absolute;
            top: 24px;
            right: 24px;
            z-index: 10;
            display: flex;
            gap: 10px;
        }

        .control-btn {
            background: var(--bg-card);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid var(--border-color);
            padding: 10px 16px;
            border-radius: 6px;
            color: var(--gold-soft);
            font-family: var(--font-mono);
            font-size: 0.75rem;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            transition: all 0.2s ease;
        }

        .control-btn:hover {
            color: var(--gold-accent);
            border-color: var(--gold-accent);
            background: rgba(232, 213, 163, 0.05);
        }

        /* Glassmorphic Slide Drawer */
        .drawer {
            position: absolute;
            top: 0;
            right: 0;
            width: 580px;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(35px);
            -webkit-backdrop-filter: blur(35px);
            border-left: 1px solid var(--border-color);
            z-index: 100;
            transform: translateX(100%);
            transition: transform 0.45s cubic-bezier(0.25, 0.8, 0.25, 1);
            display: flex;
            flex-direction: column;
            box-shadow: -20px 0 60px rgba(0,0,0,0.9);
        }

        .drawer.open {
            transform: translateX(0);
        }

        .drawer-header {
            padding: 24px 40px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-shrink: 0;
        }

        .drawer-path {
            font-family: var(--font-mono);
            font-size: 0.7rem;
            color: var(--text-quiet);
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }

        .close-btn {
            background: transparent;
            border: 1px solid rgba(232, 213, 163, 0.3);
            width: 32px;
            height: 32px;
            border-radius: 50%;
            color: var(--gold-soft);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 0.8rem;
            transition: all 0.25s ease;
        }

        .close-btn:hover {
            border-color: var(--gold-accent);
            color: var(--gold-accent);
            transform: scale(1.08);
            background: rgba(232, 213, 163, 0.05);
        }

        .drawer-body {
            flex: 1;
            overflow-y: auto;
            padding: 40px 48px;
        }

        /* Markdown Typography Styles inside Drawer */
        .markdown-content {
            line-height: 1.65;
            font-size: 1.02rem;
            color: rgba(244, 239, 230, 0.9);
        }

        .markdown-content h1 {
            font-family: var(--font-syne);
            font-size: 1.95rem;
            color: var(--gold-accent);
            margin-bottom: 24px;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 10px;
            font-weight: 800;
        }

        .markdown-content h2 {
            font-family: var(--font-ui);
            font-size: 1.35rem;
            color: var(--gold-soft);
            margin-top: 32px;
            margin-bottom: 14px;
            font-weight: 600;
        }

        .markdown-content h3 {
            font-size: 1.1rem;
            color: var(--text-main);
            margin-top: 20px;
            margin-bottom: 10px;
            font-weight: 600;
        }

        .markdown-content p {
            margin-bottom: 18px;
        }

        .markdown-content ul, .markdown-content ol {
            margin-bottom: 18px;
            padding-left: 20px;
        }

        .markdown-content li {
            margin-bottom: 6px;
        }

        .markdown-content code {
            font-family: var(--font-mono);
            background-color: rgba(232, 213, 163, 0.04);
            border: 1px solid rgba(232, 213, 163, 0.08);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.9em;
            color: #d4c4a0;
        }

        .markdown-content pre {
            background-color: rgba(0, 0, 0, 0.5) !important;
            border: 1px solid var(--border-color);
            padding: 16px;
            border-radius: 6px;
            overflow-x: auto;
            margin-bottom: 20px;
        }

        .markdown-content pre code {
            background-color: transparent;
            border: none;
            padding: 0;
            color: inherit;
            font-size: 0.86rem;
        }

        .markdown-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 0.92rem;
            border: 1px solid var(--border-color);
        }

        .markdown-content th {
            background-color: rgba(232, 213, 163, 0.04);
            color: var(--gold-soft);
            text-align: left;
            padding: 10px 14px;
            font-weight: 600;
            border-bottom: 1px solid var(--border-color);
            font-size: 0.72rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .markdown-content td {
            padding: 10px 14px;
            border-bottom: 1px solid rgba(232, 213, 163, 0.05);
        }

        .markdown-content tr:last-child td {
            border-bottom: none;
        }

        .markdown-content blockquote {
            border-left: 3px solid var(--gold-soft);
            padding: 10px 18px;
            margin: 20px 0;
            color: var(--text-muted);
            font-style: italic;
            background: rgba(232, 213, 163, 0.01);
            border-radius: 0 4px 4px 0;
        }

        /* 3D Graph interactive custom tooltip override */
        .graph-tooltip {
            background: rgba(0, 0, 0, 0.95) !important;
            border: 1px solid var(--border-color) !important;
            color: var(--text-main) !important;
            padding: 8px 12px !important;
            border-radius: 6px !important;
            font-family: var(--font-ui) !important;
            font-size: 0.8rem !important;
            box-shadow: 0 10px 30px rgba(0,0,0,0.8) !important;
        }

        .graph-tooltip b {
            color: var(--gold-accent);
            font-weight: 600;
        }

        .wikilink {
            color: var(--gold-soft);
            text-decoration: none;
            border-bottom: 1px dashed rgba(201, 168, 108, 0.4);
            cursor: pointer;
        }

        .wikilink:hover {
            color: var(--gold-accent);
            border-bottom-color: var(--gold-accent);
            background: rgba(232, 213, 163, 0.05);
        }

        .bridge-status {
            position: fixed;
            left: 50%;
            bottom: 26px;
            z-index: 30;
            transform: translateX(-50%);
            padding: 12px 18px;
            border-radius: 999px;
            border: 1px solid rgba(0, 229, 255, 0.5);
            background: rgba(0, 0, 0, 0.82);
            color: #00e5ff;
            font-family: var(--font-ui);
            font-size: 0.78rem;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            box-shadow: 0 0 30px rgba(0, 229, 255, 0.45), 0 0 80px rgba(255, 45, 247, 0.2);
            opacity: 0;
            pointer-events: none;
            transition: opacity 180ms ease, transform 180ms ease;
        }

        .bridge-status.visible {
            opacity: 1;
            transform: translateX(-50%) translateY(-8px);
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
            width: 6px;
        }
        ::-webkit-scrollbar-track {
            background: transparent;
        }
        ::-webkit-scrollbar-thumb {
            background: rgba(232, 213, 163, 0.12);
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: rgba(232, 213, 163, 0.22);
        }
    </style>
</head>
<body>

    <!-- 3D WebGL Canvas -->
    <div id="3d-graph"></div>

    <!-- Floating Branding & Search -->
    <header class="glass-header">
        <h1 class="header-title">BLACKBOX</h1>
        <span class="header-subtitle">Cognitive 3D Brainmap</span>
        <input type="text" class="search-bar" id="searchBar" placeholder="Search cognitive nodes...">
    </header>

    <!-- Stats HUD -->
    <section class="hud-panel">
        <div class="hud-row">
            <span>Graph Dimension</span>
            <span class="hud-val">3D Force-Directed</span>
        </div>
        <div class="hud-row">
            <span>Total Nodes</span>
            <span class="hud-val" id="hudNodes">0</span>
        </div>
        <div class="hud-row">
            <span>Total Connections</span>
            <span class="hud-val" id="hudLinks">0</span>
        </div>
        <div class="hud-row">
            <span>Focus Mode</span>
            <span class="hud-val" id="hudFocus">None</span>
        </div>
    </section>

    <!-- Controls -->
    <section class="controls-panel">
        <button class="control-btn" id="rotateBtn">Auto Rotate: On</button>
        <button class="control-btn" id="resetBtn">Reset Cam</button>
    </section>

    <div class="bridge-status" id="bridgeStatus">Brain bridge waiting…</div>

    <!-- Slide drawer for note inspection -->
    <div class="drawer" id="sideDrawer">
        <div class="drawer-header">
            <span class="drawer-path" id="drawerPath">00 Maps · Home</span>
            <button class="close-btn" id="closeDrawer" aria-label="Close drawer">✕</button>
        </div>
        <div class="drawer-body">
            <article class="markdown-content" id="drawerContent">
                <!-- Dynamically populated -->
            </article>
        </div>
    </div>

    <!-- WebGL & Content Rendering CDNs -->
    <script src="https://unpkg.com/3d-force-graph@1.73.4"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/prism.min.js"></script>

    <script>
        let graphData = null;
        let Graph = null;
        let activeNode = null;
        let autoRotate = true;
        let searchHighlight = "";
        let usedNodeIds = new Set();
        let activePulseUntil = 0;
        let styleRefreshTimer = null;

        const nodeColors = {
            idle: '#ffffff',
            used: '#39ff88',
            active: '#00e5ff',
            activePulse: '#ff2df7',
            search: '#faad14'
        };

        function getNodeVisual(node) {
            if (activeNode && node.id === activeNode.id) {
                const pulsing = Date.now() < activePulseUntil;
                return {
                    color: pulsing && Math.floor(Date.now() / 180) % 2 === 0 ? nodeColors.activePulse : nodeColors.active,
                    radius: pulsing && Math.floor(Date.now() / 180) % 2 === 0 ? 9 : 6.5,
                    emissive: pulsing && Math.floor(Date.now() / 180) % 2 === 0 ? nodeColors.activePulse : nodeColors.active
                };
            }
            if (searchHighlight && node.name.toLowerCase().includes(searchHighlight.toLowerCase())) {
                return { color: nodeColors.search, radius: 5, emissive: nodeColors.search };
            }
            if (usedNodeIds.has(node.id)) {
                return { color: nodeColors.used, radius: 4.5, emissive: nodeColors.used };
            }
            return { color: nodeColors.idle, radius: Math.max(2.4, node.val || 3), emissive: '#111111' };
        }

        function makeNodeObject(node) {
            const visual = getNodeVisual(node);
            if (!window.THREE) return null;
            const geometry = new THREE.SphereGeometry(visual.radius, 24, 24);
            const material = new THREE.MeshLambertMaterial({
                color: visual.color,
                emissive: visual.emissive,
                emissiveIntensity: activeNode && node.id === activeNode.id ? 1.35 : usedNodeIds.has(node.id) ? 0.75 : 0.18
            });
            const sphere = new THREE.Mesh(geometry, material);
            if (activeNode && node.id === activeNode.id) {
                const glow = new THREE.Mesh(
                    new THREE.SphereGeometry(visual.radius * 1.75, 24, 24),
                    new THREE.MeshBasicMaterial({ color: visual.color, transparent: true, opacity: 0.28 })
                );
                const group = new THREE.Group();
                group.add(glow);
                group.add(sphere);
                return group;
            }
            return sphere;
        }

        function refreshNodeStyles() {
            if (!Graph) return;
            Graph.nodeColor(Graph.nodeColor());
            Graph.nodeVal(Graph.nodeVal());
            Graph.nodeThreeObject(Graph.nodeThreeObject());
        }

        function flashBridgeStatus(message, isError = false) {
            const el = document.getElementById('bridgeStatus');
            if (!el) return;
            el.textContent = message;
            el.style.color = isError ? '#ff4d4f' : '#00e5ff';
            el.style.borderColor = isError ? 'rgba(255, 77, 79, 0.7)' : 'rgba(0, 229, 255, 0.6)';
            el.classList.add('visible');
            clearTimeout(el._hideTimer);
            el._hideTimer = setTimeout(() => el.classList.remove('visible'), 5000);
        }

        function startActivePulse() {
            activePulseUntil = Date.now() + 8000;
            if (!styleRefreshTimer) {
                styleRefreshTimer = setInterval(() => {
                    refreshNodeStyles();
                    if (Date.now() > activePulseUntil) {
                        clearInterval(styleRefreshTimer);
                        styleRefreshTimer = null;
                        refreshNodeStyles();
                    }
                }, 180);
            }
            refreshNodeStyles();
        }

        // Initialize 3D Graph and fetch vault nodes
        async function init() {
            try {
                const res = await fetch('/api/graph');
                graphData = await res.json();
                
                document.getElementById('hudNodes').innerText = graphData.nodes.length;
                document.getElementById('hudLinks').innerText = graphData.links.length;

                render3DGraph();

                // Replay bridge events that arrived before the graph was ready
                flushPendingBridgeEvents();

                // Load Home note initially in background hash or if hash is present
                const initialHash = location.hash.substring(1);
                if (initialHash) {
                    openDrawer(decodeURIComponent(initialHash));
                }
            } catch (err) {
                console.error("Failed to load graph data:", err);
            }
        }

        // Build 3D Force-Directed Graph
        function render3DGraph() {
            Graph = ForceGraph3D()(document.getElementById('3d-graph'))
                .graphData(graphData)
                .backgroundColor('#000000')
                .showNavInfo(false)
                
                // White idle nodes; used nodes stay green; active node pulses cyan/magenta.
                .nodeThreeObject(node => makeNodeObject(node))
                .nodeColor(node => getNodeVisual(node).color)
                .nodeVal(node => getNodeVisual(node).radius)
                .nodeLabel(node => "<b>" + node.name + "</b> <span style='font-size: 10px; color: #8c8c8c;'>(" + node.dir + ")</span>")
                
                // Crackling electric lightning connections
                .linkColor(() => {
                    return Math.random() < 0.12 ? 'rgba(255, 255, 255, 0.38)' : 'rgba(232, 213, 163, 0.08)';
                })
                .linkWidth(() => Math.random() * 1.6 + 0.6)
                .linkDirectionalParticles(2)
                .linkDirectionalParticleWidth(() => Math.random() * 2.6 + 0.8)
                .linkDirectionalParticleSpeed(() => Math.random() * 0.002 + 0.002)
                .linkDirectionalParticleColor(() => '#e8d5a3')
                
                // Interaction events
                .onNodeClick(node => {
                    location.hash = "#" + encodeURIComponent(node.id);
                    focusOnNode(node);
                    openDrawer(node.id);
                })
                .onEngineStop(() => {
                    Graph.zoomToFit(800, 35);
                });

            // Enable OrbitControls auto-rotation
            const controls = Graph.controls();
            if (controls) {
                controls.autoRotate = autoRotate;
                controls.autoRotateSpeed = 0.6;
            }

            // Progressive fit-to-screen as layout spreads
            setTimeout(() => {
                if (Graph) Graph.zoomToFit(800, 35);
            }, 600);

            setTimeout(() => {
                if (Graph) Graph.zoomToFit(1000, 35);
            }, 1800);
        }

        // Smooth camera transition to node
        function focusOnNode(node) {
            activeNode = node;
            usedNodeIds.add(node.id);
            document.getElementById('hudFocus').innerText = node.name;
            
            // Highlight active node with an obvious pulse.
            startActivePulse();

            // Disable auto rotation while focused
            if (Graph.controls()) {
                Graph.controls().autoRotate = false;
            }

            // Smooth orbit transition
            const distance = 80;
            const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
            Graph.cameraPosition(
                { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // position
                node, // lookAt
                2000 // duration ms
            );
        }

        // Drawer open logic
        async function openDrawer(pathId) {
            const drawer = document.getElementById('sideDrawer');
            const drawerPath = document.getElementById('drawerPath');
            const drawerContent = document.getElementById('drawerContent');

            drawerPath.innerText = pathId.split("/").join(" · ");
            drawer.classList.add('open');

            try {
                const res = await fetch(\`/api/file?path=\${encodeURIComponent(pathId)}\`);
                if (!res.ok) throw new Error("File not found");
                const rawMarkdown = await res.text();

                // Convert wikilinks to drawer navigations
                let parsedMarkdown = rawMarkdown;
                while (parsedMarkdown.includes("[[")) {
                    const startIdx = parsedMarkdown.indexOf("[[");
                    const endIdx = parsedMarkdown.indexOf("]]", startIdx);
                    if (endIdx === -1) break;
                    const noteName = parsedMarkdown.substring(startIdx + 2, endIdx);
                    const trimmed = noteName.trim();
                    const targetFile = graphData.nodes.find(n => n.name.toLowerCase() === trimmed.toLowerCase());
                    const replacement = targetFile 
                        ? '<span class="wikilink" onclick="openDrawer(' + "'" + targetFile.id + "'" + ')">' + trimmed + '</span>'
                        : '<span class="wikilink-broken">' + trimmed + '</span>';
                    parsedMarkdown = parsedMarkdown.substring(0, startIdx) + replacement + parsedMarkdown.substring(endIdx + 2);
                }

                // Render markdown
                drawerContent.innerHTML = marked.parse(parsedMarkdown);

                // Render LaTeX formulas via KaTeX
                renderMathInElement(drawerContent, {
                    delimiters: [
                        {left: '$$', right: '$$', display: true},
                        {left: '$', right: '$', display: false},
                        {left: '\\(', right: '\\)', display: false},
                        {left: '\\[', right: '\\]', display: true}
                    ],
                    throwOnError: false
                });

                // Syntax highlighting
                Prism.highlightAllUnder(drawerContent);
                drawer.querySelector('.drawer-body').scrollTop = 0;

                // Sync graph focus
                const matchedNode = graphData.nodes.find(n => n.id === pathId);
                if (matchedNode && Graph) {
                    focusOnNode(matchedNode);
                }
            } catch (err) {
                drawerContent.innerHTML = '<h1>Failed to load note</h1><p>' + err.message + '</p>';
            }
        }

        // Close Drawer logic
        document.getElementById('closeDrawer').onclick = () => {
            document.getElementById('sideDrawer').classList.remove('open');
            activeNode = null;
            document.getElementById('hudFocus').innerText = "None";
            if (Graph) {
                refreshNodeStyles();
                if (Graph.controls()) {
                    Graph.controls().autoRotate = autoRotate;
                }
            }
            location.hash = "";
        };

        // Reset camera control
        document.getElementById('resetBtn').onclick = () => {
            activeNode = null;
            if (Graph) {
                refreshNodeStyles();
                Graph.zoomToFit(1500, 35);
                if (Graph.controls()) {
                    Graph.controls().autoRotate = autoRotate;
                }
            }
            document.getElementById('hudFocus').innerText = "None";
            document.getElementById('sideDrawer').classList.remove('open');
            location.hash = "";
        };

        // Auto rotate control
        document.getElementById('rotateBtn').onclick = (e) => {
            autoRotate = !autoRotate;
            e.target.innerText = "Auto Rotate: " + (autoRotate ? 'On' : 'Off');
            if (Graph && Graph.controls()) {
                Graph.controls().autoRotate = autoRotate;
            }
        };

        // Search highlight control
        document.getElementById('searchBar').addEventListener('input', (e) => {
            searchHighlight = e.target.value;
            if (Graph) {
                // Trigger node color/size updates
                refreshNodeStyles();
                
                // If there's a unique match, focus on it
                if (searchHighlight) {
                    const match = graphData.nodes.find(n => n.name.toLowerCase() === searchHighlight.toLowerCase().trim());
                    if (match) {
                        focusOnNode(match);
                        openDrawer(match.id);
                    }
                }
            }
        });

        // Listen for back/forward hash navigations
        window.addEventListener('hashchange', () => {
            const currentHash = location.hash.substring(1);
            if (currentHash) {
                openDrawer(decodeURIComponent(currentHash));
            }
        });

        // Animation loop to update OrbitControls auto-rotation
        function animate() {
            requestAnimationFrame(animate);
            if (Graph) {
                const controls = Graph.controls();
                if (controls) {
                    controls.update();
                }
            }
        }
        animate();

        // Listen for Server-Sent Events from the local agent bridge
        const pendingBridgeEvents = [];
        function handleBridgeEvent(data) {
            if (!graphData || !Graph) {
                // Graph not ready yet; replay once init() finishes.
                pendingBridgeEvents.push(data);
                return;
            }
            if (data.path) {
                const cleanPath = data.path;
                const matchedNode = graphData.nodes.find(n =>
                    n.id === cleanPath ||
                    n.id.toLowerCase().endsWith(cleanPath.toLowerCase()) ||
                    n.name.toLowerCase() === cleanPath.toLowerCase().replace(".md", "")
                );
                if (matchedNode) {
                    console.log('[brain bridge] lighting node:', matchedNode.id);
                    flashBridgeStatus('Lighting: ' + matchedNode.name);
                    focusOnNode(matchedNode);
                    openDrawer(matchedNode.id);
                } else {
                    console.warn('[brain bridge] no matching node for:', cleanPath);
                    flashBridgeStatus('No matching node: ' + cleanPath, true);
                }
            }
        }

        function flushPendingBridgeEvents() {
            while (pendingBridgeEvents.length && graphData && Graph) {
                handleBridgeEvent(pendingBridgeEvents.shift());
            }
        }

        function initEventBridge() {
            const eventSource = new EventSource('/api/events');

            eventSource.onmessage = (event) => {
                try {
                    handleBridgeEvent(JSON.parse(event.data));
                } catch (e) {
                    console.error("Event bridge parse error:", e);
                }
            };

            eventSource.onopen = () => {
                console.log('[brain bridge] connected');
            };

            eventSource.onerror = () => {
                eventSource.close();
                setTimeout(initEventBridge, 5000);
            };
        }
        initEventBridge();

        // Initialize WebGL Application
        init();
    </script>
</body>
</html>`;

const sseClients = [];

const server = http.createServer((req, res) => {
    const url = req.url || '/';

    // API to serve graph nodes and parsed links
    if (url === '/api/graph') {
        const data = getGraphData(BRAIN_DIR);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(data));
    }

    // SSE client connection registration
    if (url === '/api/events') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        res.write('\n');
        sseClients.push(res);
        // Heartbeat comment keeps the connection from being reaped as idle.
        const heartbeat = setInterval(() => {
            res.write(': ping\n\n');
        }, 25000);
        req.on('close', () => {
            clearInterval(heartbeat);
            const index = sseClients.indexOf(res);
            if (index !== -1) {
                sseClients.splice(index, 1);
            }
        });
        return;
    }

    // API to set active focused node from Claude / CLI
    if (url === '/api/active-node' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const parsed = JSON.parse(body);
                const targetPath = parsed.path;
                if (targetPath) {
                    const eventData = JSON.stringify({ path: targetPath });
                    sseClients.forEach(client => {
                        client.write(`data: ${eventData}\n\n`);
                    });
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'broadcasted', path: targetPath }));
                } else {
                    res.writeHead(400);
                    res.end('Missing path');
                }
            } catch (err) {
                res.writeHead(400);
                res.end('Invalid JSON');
            }
        });
        return;
    }

    // API to fetch specific markdown file contents
    if (url.startsWith('/api/file')) {
        const queryParams = new URL(req.url, `http://${req.headers.host}`).searchParams;
        const targetPath = queryParams.get('path');

        if (!targetPath) {
            res.writeHead(400);
            return res.end('Path parameter is required');
        }

        const safePath = path.normalize(targetPath).replace(/^(\.\.[/\\])+/, '');
        const fullPath = path.join(BRAIN_DIR, safePath);

        if (!fullPath.startsWith(BRAIN_DIR)) {
            res.writeHead(403);
            return res.end('Access denied');
        }

        if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
            res.writeHead(404);
            return res.end('File not found');
        }

        fs.readFile(fullPath, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500);
                return res.end('Error reading file');
            }
            res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8' });
            res.end(data);
        });
        return;
    }

    // Default: serve the WebGL 3D Brainmap frontend
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(htmlTemplate);
});

// ── Claude transcript watcher: spawned and supervised by this server ──
const WATCHER_SCRIPT = path.join(BRAIN_DIR, 'watch-claude-brain.sh');
const WATCHER_LOG = '/tmp/blackbox-brain-watch.log';
let watcherProc = null;
let watcherStartedAt = 0;
let shuttingDown = false;

function startWatcher() {
    if (shuttingDown) return;
    if (!fs.existsSync(WATCHER_SCRIPT)) {
        console.warn(`  Watcher script not found, nodes will not auto-light: ${WATCHER_SCRIPT}`);
        return;
    }

    // Take over watchers started manually or orphaned by a previous server,
    // so the graph doesn't receive duplicate events.
    try {
        execSync("pkill -f watch-claude-brain.sh; pkill -f 'localhost:4444/api/active-node'", { stdio: 'ignore' });
    } catch { /* nothing was running */ }

    const logFd = fs.openSync(WATCHER_LOG, 'a');
    watcherStartedAt = Date.now();
    watcherProc = spawn('/bin/bash', [WATCHER_SCRIPT], {
        cwd: __dirname,
        detached: true, // own process group so the python child dies with it
        stdio: ['ignore', logFd, logFd]
    });
    fs.closeSync(logFd);
    console.log(`  Transcript watcher running (pid ${watcherProc.pid}, log: ${WATCHER_LOG})`);

    watcherProc.on('exit', (code, signal) => {
        watcherProc = null;
        if (shuttingDown) return;
        const uptime = Date.now() - watcherStartedAt;
        const delay = uptime < 5000 ? 30000 : 3000; // back off if it dies immediately
        console.warn(`  Watcher exited (${signal || code}), restarting in ${delay / 1000}s`);
        setTimeout(startWatcher, delay).unref();
    });
}

function stopWatcher() {
    shuttingDown = true;
    if (watcherProc) {
        try { process.kill(-watcherProc.pid, 'SIGTERM'); } catch { /* already gone */ }
        watcherProc = null;
    }
}

['SIGINT', 'SIGTERM'].forEach(sig => process.on(sig, () => {
    stopWatcher();
    process.exit(0);
}));
process.on('exit', stopWatcher);

server.listen(PORT, () => {
    console.log(`\n  BLACKBOX 3D Brainmap active at http://localhost:${PORT}\n`);
    startWatcher();
});
