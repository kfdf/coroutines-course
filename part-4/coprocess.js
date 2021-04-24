import { parseXml, openBusRoutesFile } from '../helpers.js'
function asyncCo(genFunc) {
  return async function (...args) {
    let it = genFunc(...args)
    await it.next()
    return it
  }
}
let path = new URL('busproc.js', import.meta.url)
let p = Deno.run({
  cmd: ['deno', 'run', path],
  stdin: 'piped',
})
function* consumeValue(event, value) {
  while (true) {
    let [e, v] = yield
    if (e === event && v === value) break
  }
}
function* consume(...events) {
  while (true) {
    let ret = yield
    if (events.includes(ret[0])) return ret
  }
}
const busesToDicts = asyncCo(async function *(target) {
  try {
    yield* consumeValue('start', 'buses')
    while (true) {
      let [event,] = yield* consume('start', 'end')
      if (event == 'end') break // assert(key == 'buses')
      let bus = { }
      while (true) {
        let [event, key] = yield* consume('start', 'end')
        if (event == 'end') break // assert(key == 'bus')
        let [,value] = yield* consume('text')
        yield* consume('end') // assert(_ == key)
        bus[key] = value
      }
      await target.next(bus)
    }
  } finally {
    await target.return()
  }
})

export class EventHandler {
  constructor(target) {
    this.target = target
  }
  async start(name) {
    await this.target.next(['start', name])
  }
  async end(name) {
    await this.target.next(['end', name])
  }
  async text(content) {
    await this.target.next(['text', content])
  }
}
const createSender = asyncCo(async function *(file) {
  try {
    let encoder = new TextEncoder()
    while (true) {
      let message = yield
      let line = JSON.stringify(message) + '\r\n'
      await file.write(encoder.encode(line))
    }
  } finally {
    await file.close()
  }
}) 

let busfile = await openBusRoutesFile()
await parseXml(busfile, 
  new EventHandler(
    await busesToDicts(
      await createSender(p.stdin))))
await p.status()