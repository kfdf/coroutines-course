function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

let queueSize = 0
async function* sink() {
  while (true) {
    let value = yield
    await sleep(400)
    console.log('...', value)
    queueSize -= 1
  }
}

let it = sink()
await it.next()
for (let i = 0; i < 20; i++) {
  await sleep(100 + Math.random() * 300)
  console.log(i, '...')
  let ret = it.next(i)
  if (++queueSize > 2) {
    console.log('backpressure')
    await ret // await once(it, 'drain')
    console.log('drained')
  }
}
