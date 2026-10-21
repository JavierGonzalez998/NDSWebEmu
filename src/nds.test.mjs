import { test } from 'node:test'
import assert from 'node:assert/strict'
import { openSync, readSync, statSync } from 'node:fs'
import { readNdsHeader } from './nds.js'

const head = (path) => {
  const buf = Buffer.alloc(0x200)
  readSync(openSync(path, 'r'), buf, 0, 0x200, 0)
  return buf.buffer.slice(0, 0x200)
}

test('lee la cabecera de rom.nds', () => {
  const h = readNdsHeader(head('rom.nds'), statSync('rom.nds').size)
  assert.equal(h.title, 'POKEMON SS')
  assert.equal(h.gameCode, 'IPGJ')
  assert.ok(h.usedBytes > 0 && h.usedBytes <= statSync('rom.nds').size)
})

test('rechaza archivos que no son ROMs', () => {
  assert.throws(() => readNdsHeader(new ArrayBuffer(16), 16), /demasiado pequeño/)
  assert.throws(() => readNdsHeader(new ArrayBuffer(0x200), 0x200), /cabecera inválida/)
  assert.throws(() => readNdsHeader(head('rom.nds'), 1024), /truncada/)
})
