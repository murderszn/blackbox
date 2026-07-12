#!/bin/bash
# Watch Claude Code transcripts for brain/ file references and notify the 3D Brainmap.
# Auto-started and supervised by brain/server.js — no need to run it manually.
# Manual usage (if the server isn't running): ./brain/watch-claude-brain.sh

PROJECT_SLUG="-Users-jahflyx-blackbox"
CLAUDE_PROJECT_DIR="$HOME/.claude/projects/$PROJECT_SLUG"
BRAIN_SERVER="http://localhost:4444/api/active-node"

mkdir -p /tmp
LOG_FILE="/tmp/blackbox-brain-watch.log"

python3 - "$CLAUDE_PROJECT_DIR" "$BRAIN_SERVER" <<'PY'
import glob
import json
import os
import re
import sys
import time
import urllib.request

claude_project_dir = sys.argv[1]
endpoint = sys.argv[2]
brain_root = "/Users/jahflyx/blackbox/brain/"

# Matches absolute paths and project-relative paths ending in .md under brain/.
patterns = [
    re.compile(r"/Users/jahflyx/blackbox/brain/([^\"'<>|\n\r]+?\.md)"),
    re.compile(r"(?:^|[\s\"'`])brain/([^\"'<>|\n\r]+?\.md)"),
]

seen_events = set()
positions = {}
last_notice = {}


def notify(relpath):
    relpath = relpath.strip().replace('\\', '/')
    if not relpath or relpath in last_notice and time.time() - last_notice[relpath] < 1.0:
        return
    last_notice[relpath] = time.time()
    payload = json.dumps({"path": relpath}).encode("utf-8")
    req = urllib.request.Request(endpoint, data=payload, headers={"Content-Type": "application/json"}, method="POST")
    try:
        urllib.request.urlopen(req, timeout=0.8).read()
        print(f"[{time.strftime('%H:%M:%S')}] lit {relpath}", flush=True)
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] notify failed for {relpath}: {e}", flush=True)


def scan_text(text):
    found = []
    for pat in patterns:
        for match in pat.findall(text):
            rel = match.strip().replace('\\', '/')
            # Trim common JSON/string punctuation that can trail regex matches.
            rel = re.sub(r"[\\\\]*[\"'`),.\]}]+$", "", rel)
            if rel.endswith('.md'):
                found.append(rel)
    return found


def scan_file(path):
    size = os.path.getsize(path)
    pos = positions.get(path)
    if pos is None:
        # On first run, start at the end so restarts don't replay old activity.
        pos = size
    if size < pos:
        pos = 0
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        f.seek(pos)
        chunk = f.read()
        positions[path] = f.tell()
    for rel in scan_text(chunk):
        notify(rel)

print(f"Watching Claude transcripts in {claude_project_dir}", flush=True)
print("Open http://localhost:4444 and keep this watcher running.", flush=True)
while True:
    for path in glob.glob(os.path.join(claude_project_dir, '*.jsonl')):
        try:
            scan_file(path)
        except FileNotFoundError:
            positions.pop(path, None)
        except Exception as e:
            print(f"watch error {path}: {e}", flush=True)
    time.sleep(0.7)
PY
