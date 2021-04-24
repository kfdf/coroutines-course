/**
@template T
@param {T} genFunc
@returns {T} */
export function co(genFunc) {
  return function (...args) {
    let it = genFunc(...args)
    it.next()
    return it
  }
}
/** @param {number} n */
export function rand(n) {
  return Math.floor(Math.random() * n)
}
/** @param {number} ms */
export function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}
/** @param {Deno.Reader} file */
export function createLineReader(file) {
  let decoder = new TextDecoder()
  let buffer = new Uint8Array(4096)
  let tail = ''
  return async function readLines() {
    let n = await file.read(buffer)
    if (n == null) return null
    let data = buffer.subarray(0, n)
    let lines = decoder.decode(data).split('\n')
    lines[0] = tail + lines[0]
    tail = lines.pop()
    return lines.length ? lines : null
  }
}
export async function openLiveLogFile() {
  let path = new URL('access-log', import.meta.url)
  let { createLogWriter } = await import('./logsim.js')
  let writeLog = await createLogWriter(path)
  writeLog()
  return await Deno.open(path, { read: true })
}
export async function openBusRoutesFile() {
  let path = new URL('allroutes.xml', import.meta.url)
  return await Deno.open(path, { read: true })
}
/** @param {Deno.File} file */
export async function parseXml(file, handler) {
  let buffer = new Uint8Array(4096)
  let decoder = new TextDecoder()  
  let isTag = false
  let content = ''
  while (true) {
    let n = await file.read(buffer)
    if (n == null) break
    let chunk = decoder.decode(buffer.subarray(0, n))
    while (chunk) {
      let index = chunk.indexOf(isTag ? '>' : '<')
      if (index < 0) {
        content += chunk
        break
      }
      content += chunk.slice(0, index)
      if (!isTag) {
        await handler.text(content)
      } else if (content.startsWith('!')) {
        isTag = true
      } else if (content.startsWith('/')) {
        await handler.end(content.slice(1))
      } else if (content.endsWith('/')) {
        await handler.start(content.slice(0, -1))
      } else {
        await handler.start(content)
      }
      content = ''
      isTag = !isTag
      chunk = chunk.slice(index + 1)
    }
  }
}