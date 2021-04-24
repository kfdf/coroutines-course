import { co, sleep, createLineReader, openLiveLogFile } from '../helpers.js'
/** 
@param {Deno.File} file
@param {Generator<string>} */
async function follow(file, target) {
  await file.seek(0, Deno.SeekMode.End)
  let readLines = createLineReader(file)
  while (true) {
    let lines = await readLines()
    if (lines == null) {
      await sleep(100)
      continue
    }
    for (let line of lines) {
      target.next(line)
    }
  }
}
const grep = co(function* (pattern, target) {
  while (true) {
    let line = yield
    if (line.includes(pattern)) {
      target.next(line)
    }
  }
})
const printer = co(function* () {
  while (true) {
    console.log(yield)
  }
})

let logfile = await openLiveLogFile()
follow(logfile, grep('python', printer()))