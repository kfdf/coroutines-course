import { co } from '../helpers.js'
export const grep = co(function* (pattern) {
  console.log('looking for', pattern)
  try {
    while (true) {
      let line = yield
      if (line.includes(pattern)) {
        console.log(line)
      }
    }
  } finally {
    console.log('going away, goodbye')
  }
})

let g = grep('python')
g.next('Yeah, but no, but yeah, but no')
g.next('A series of tubes')
g.next('python generators rock!')
g.return()
