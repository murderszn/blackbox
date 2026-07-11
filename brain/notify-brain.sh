#!/bin/bash
# BLACKBOX Brain Visualizer Hook
# Usage: ./brain/notify-brain.sh "08 Finance/Health Score.md"
#
# Sends a POST to the 3D Brainmap server to light up
# the corresponding node in the WebGL viewer.
# Fails silently if the server is not running.

BRAIN_SERVER="http://localhost:4444"
FILE_PATH="$1"

if [ -z "$FILE_PATH" ]; then
  echo "Usage: notify-brain.sh <relative-path-to-brain-file>"
  exit 1
fi

curl -s -X POST "${BRAIN_SERVER}/api/active-node" \
  -H "Content-Type: application/json" \
  -d "{\"path\": \"${FILE_PATH}\"}" \
  > /dev/null 2>&1 || true
