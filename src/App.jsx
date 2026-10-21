import { useEffect, useRef, useState } from 'react'
import { readNdsHeader } from './nds.js'

// Núcleo DS real (melonDS) ya compilado a WebAssembly. El otro disponible, desmume2015,
// tiene el heap fijo en 128 MB y no puede cargar una ROM de 1 Gbit (pantalla en blanco).
const CORE = 'melonds'
// Servido desde public/emulatorjs: sin CDN ni JS de terceros en tiempo de ejecución.
const EJS_DATA = `${import.meta.env.BASE_URL}emulatorjs/`

export default function App() {
  const [rom, setRom] = useState(null)
  const [error, setError] = useState('')

  async function pick(file) {
    if (!file) return
    try {
      // Solo leemos la cabecera: la ROM (128 MB) va al emulador por URL, sin copiarla en memoria.
      const header = readNdsHeader(await file.slice(0, 0x200).arrayBuffer(), file.size)
      setError('')
      setRom({ header, name: file.name, url: URL.createObjectURL(file) })
    } catch (e) {
      setError(e.message)
      setRom(null)
    }
  }

  if (rom) return <Emulator rom={rom} />

  return (
    <main
      className="picker"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]) }}
    >
      <h1>Emulador de Nintendo DS</h1>
      <p>Elige tu ROM <code>.nds</code>. Se ejecuta en tu dispositivo: el archivo no se sube a ningún sitio.</p>
      <label className="btn">
        Elegir ROM
        <input type="file" accept=".nds,.zip" onChange={(e) => pick(e.target.files[0])} hidden />
      </label>
      <p className="hint">En PC también puedes arrastrar el archivo aquí.</p>
      {error && <p className="error">{error}</p>}
    </main>
  )
}

function Emulator({ rom }) {
  const mounted = useRef(false)

  useEffect(() => {
    if (mounted.current) return // StrictMode monta dos veces; EmulatorJS no es reentrante
    mounted.current = true
    Object.assign(window, {
      EJS_player: '#game',
      EJS_core: CORE,
      EJS_pathtodata: EJS_DATA,
      EJS_gameUrl: rom.url,
      EJS_gameName: rom.header.title || rom.name,
      EJS_startOnLoaded: true,
      // lockMouse: EmulatorJS captura el puntero al hacer clic porque el core declara ratón.
      // save-save-interval: el .sav va a IndexedDB (/data/saves, IDBFS autoPersist); 30s en vez de 300.
      // melonds_touch_mode: el core viene en 'Mouse' (ratón relativo, que es lo que exige la captura);
      // 'Touch' es posición absoluta, que es lo que mandan el dedo y el puente ratón->touch de abajo.
      EJS_defaultOptions: { lockMouse: 'disabled', 'save-save-interval': '30', melonds_touch_mode: 'Touch' },
    })
    const script = document.createElement('script')
    script.src = `${EJS_DATA}loader.js`
    document.body.append(script)
  }, [rom])

  // El core recibe el stylus solo por eventos touch: en PC hay que traducirle el ratón.
  // shortcut: Safari no deja construir TouchEvent, ahí el ratón no hará de stylus.
  useEffect(() => {
    if (!window.TouchEvent) return
    let target = null
    let downAt = 0
    let pending = null
    const relay = (type, el, e) => {
      // Emscripten sitúa el stylus con pageX/pageY: sin ellos el toque entra en la esquina
      const touch = new Touch({
        identifier: 1, target: el,
        clientX: e.clientX, clientY: e.clientY,
        pageX: e.pageX, pageY: e.pageY,
        screenX: e.screenX, screenY: e.screenY,
      })
      const touches = type === 'touchend' ? [] : [touch]
      const init = { bubbles: true, cancelable: true, touches, targetTouches: touches, changedTouches: [touch] }
      el.dispatchEvent(new TouchEvent(type, init))
    }
    const release = () => {
      if (!pending) return
      clearTimeout(pending.timer)
      relay('touchend', pending.el, pending.e)
      pending = null
    }
    const onDown = (e) => {
      // en pantallas táctiles el navegador ya emite touch + un ratón de compatibilidad: no duplicar
      if (e.button || e.sourceCapabilities?.firesTouchEvents || e.target.tagName !== 'CANVAS') return
      release() // un toque pendiente se cierra antes de empezar el siguiente
      target = e.target
      downAt = e.timeStamp
      relay('touchstart', target, e)
    }
    const onMove = (e) => target && relay('touchmove', target, e)
    const onUp = (e) => {
      if (!target) return
      const el = target
      target = null
      // un clic rápido dura menos que un frame y el core no llega a leerlo: estiramos el toque
      pending = { el, e, timer: setTimeout(release, Math.max(0, 60 - (e.timeStamp - downAt))) }
    }
    addEventListener('mousedown', onDown)
    addEventListener('mousemove', onMove)
    addEventListener('mouseup', onUp)
    return () => {
      removeEventListener('mousedown', onDown)
      removeEventListener('mousemove', onMove)
      removeEventListener('mouseup', onUp)
    }
  }, [])

  return (
    <>
      <header className="bar">
        <span>{rom.header.title} · {rom.header.gameCode}</span>
        {/* shortcut: EmulatorJS no tiene destroy fiable, así que cambiar de ROM recarga la página */}
        <button onClick={() => location.reload()}>Cambiar ROM</button>
      </header>
      <div id="game" />
    </>
  )
}
