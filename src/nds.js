// Cabecera NDS: solo lo necesario para validar el archivo y decir qué juego es.
const str = (b, off, len) =>
  String.fromCharCode(...b.subarray(off, off + len)).replace(/\0/g, '').trim()

/** @param headerBuf primeros 512 bytes del archivo @param fileSize tamaño total */
export function readNdsHeader(headerBuf, fileSize) {
  if (headerBuf.byteLength < 0x200) throw new Error('El archivo es demasiado pequeño para ser una ROM de NDS.')
  const b = new Uint8Array(headerBuf)
  const gameCode = str(b, 0x0c, 4)
  if (!/^[A-Z0-9]{4}$/.test(gameCode)) throw new Error('No parece una ROM de NDS: cabecera inválida.')
  const usedBytes = new DataView(headerBuf).getUint32(0x80, true)
  if (fileSize < usedBytes) throw new Error('La ROM está truncada: faltan datos al final del archivo.')
  return { title: str(b, 0, 12), gameCode, usedBytes }
}
