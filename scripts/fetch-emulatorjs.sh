#!/bin/sh
# Descarga el runtime de EmulatorJS y el core de NDS a public/emulatorjs (ejecutar para actualizar).
set -e
B=https://cdn.emulatorjs.org/stable/data
CORE=${1:-melonds}
cd "$(dirname "$0")/.."
mkdir -p public/emulatorjs/cores/reports public/emulatorjs/compression
for f in loader.js emulator.min.js emulator.min.css version.json \
         compression/extract7z.js compression/extractzip.js \
         compression/libunrar.js compression/libunrar.wasm \
         "cores/$CORE-wasm.data" "cores/reports/$CORE.json"; do
  curl -sfL "$B/$f" -o "public/emulatorjs/$f"
  echo "ok $f"
done
