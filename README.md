# Emulador NDS en el navegador

React + Vite. El núcleo de emulación es **melonDS compilado a WebAssembly** (core `melonds` de
EmulatorJS), servido desde `public/emulatorjs/`: ni la ROM ni el emulador salen de tu máquina y no
se carga ningún script de terceros en tiempo de ejecución.

```bash
npm install
npm run dev        # --host incluido, para abrirlo también desde el móvil
npm run build      # estático; sirve dist/ donde quieras
npm test           # parser de la cabecera NDS
npm run fetch:core # re-descarga runtime + core a public/ (solo para actualizar)
```

## Uso
Elegir ROM (o arrastrarla en PC) → arranca solo.

- **PC**: teclado (flechas + Z/X/A/S, Enter = Start) y mando USB. El ratón hace de stylus
  mediante un puente ratón->touch (`App.jsx`), porque el core solo lee el stylus por eventos touch.
- **Móvil**: mando virtual en pantalla y toque directo en la pantalla inferior de la DS.
- Guardados y save states: menú del emulador (barra inferior), persistidos en el navegador.

## Notas
- `public/emulatorjs/` son 2,3 MB ya descargados (runtime + core NDS comprimido). Funciona offline.
- `desmume2015` NO sirve para esta ROM: su heap WASM está fijo en 128 MB y una ROM de 1 Gbit no cabe
  (arranca en blanco). melonDS crece hasta ~360 MB.
- Si lo despliegas en un subdirectorio, pon `base` en `vite.config.js`; las rutas ya usan `BASE_URL`.
- Una ROM de 128 MB (ej. Pokémon SoulSilver) pide bastante RAM: en móviles de gama baja puede
  quedarse corto. Si va lento, baja resolución/frameskip en el menú del emulador.
