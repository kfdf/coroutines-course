import { sleep, createLineReader, openLiveLogFile } from '../helpers.js'

/** @param {Deno.File} file */
export async function* follow(file) {
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

let logfile = await openLiveLogFile()
for await (let line of follow(logfile)) {
  console.log(line)
}