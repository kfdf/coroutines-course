function coroutine(genFunc) {
  return function (...args) {
    let it = genFunc(...args)
    it.next()
    return it
  }
}
const grep = coroutine(function* (pattern) {
  while (true) {
    let line = yield
    if (line.includes(pattern)) {
      console.log(line)
    }
  }
})
let g = grep('python')
g.next('Yeah, but no, but yeah, but no')
g.next('A series of tubes')
g.next('python generators rock!')
