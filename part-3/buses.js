import { co, parseXml, openBusRoutesFile } from '../helpers.js'

const busesToDicts = co(function *(target) {
  while (true) {
    let [event, value] = yield
    if (event == 'start' && value == 'bus') {
      let bus = {}
      let text, name
      while (true) {
        let [event, value] = yield
        if (event == 'end') {
          if (value == 'bus') break
          bus[name] = text
        } else if (event == 'start') {
          name = value
        } else if (event == 'text') {
          text = value
        }
      }
      target.next(bus)
    }
  }
})
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
const filterOnField = co(function *(name, value, target) {
  while (true) {
    let b = yield
    if (b[name] === value) {
      target.next(b)
    }
  }
}) 
const busLocations = co(function *() {
  while (true) {
    let b = yield
    console.log(b.route, b.id, b.direction, b.latitude, b.longitude)
  }
}) 
let busfile = await openBusRoutesFile()
await parseXml(busfile, 
  new EventHandler(
    busesToDicts(
      filterOnField('route', '22',
        filterOnField('direction', 'North Bound',
          busLocations())))))
