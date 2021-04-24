import { co, openBusRoutesFile, parseXml } from '../helpers.js'
export class EventHandler {
  constructor(target) {
    this.target = target
  }
  start(name) {
    this.target.next(['start', name])
  }
  end(name) {
    this.target.next(['end', name])
  }
  text(content) {
    this.target.next(['text', content])
  }
}
const printer = co(function* () {
  while (true) {
    console.log(yield)
  }
})
let busfile = await openBusRoutesFile()
await parseXml(busfile, new EventHandler(printer()))
