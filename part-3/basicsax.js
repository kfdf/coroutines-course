import { parseXml, openBusRoutesFile } from '../helpers.js'

class MyHandler {
  start(name) {
    console.log('start', name)
  }
  end(name) {
    console.log('end', name)
  }
  text(content) {
    console.log('text', content)
  }
}
let busfile = await openBusRoutesFile()
await parseXml(busfile, new MyHandler())
