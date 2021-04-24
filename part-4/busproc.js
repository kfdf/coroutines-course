import { co, createLineReader } from '../helpers.js'

async function createReceiver(file, target) {
  let readLines = createLineReader(file)
  while (true) {
    let lines = await readLines()
    if (lines == null) break
    for (let line of lines) {
      target.next(JSON.parse(line))
    }
  }
  target.return()
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

createReceiver(Deno.stdin, 
  filterOnField('route', '22',
    filterOnField('direction', 'North Bound',
      busLocations())))