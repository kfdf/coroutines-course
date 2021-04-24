import { sleep, createLineReader, openLiveLogFile } from '../helpers.js'

/** @param {Deno.File} file */
async function* follow(file) {
  await file.seek(0, Deno.SeekMode.End)
  let readLines = createLineReader(file)
  while (true) {
    let lines = await readLines()
    if (lines == null) {
      await sleep(100)
      continue
    }
    yield* lines
  }
}
/** 
@param {string} pattern
@param {AsyncGenerator<string>} lines */
async function* grep(pattern, lines) {
  for await (let line of lines) {
    if (line.includes(pattern)) {
      yield line
    }
  }
}
let logfile = await openLiveLogFile()
let loglines = follow(logfile)
let pylines = grep('python', loglines)
for await (let pyline of pylines) {
  console.log(pyline)
}