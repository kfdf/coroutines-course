function* grep(pattern) {
  console.log('looking for', pattern)
  while (true) {
    let line = yield
    if (line.includes(pattern)) {
      console.log(line)
    }
  }
}
let g = grep('python')
g.next()
g.next('Yeah, but no, but yeah, but no')
g.next('A series of tubes')
g.next('python generators rock!')