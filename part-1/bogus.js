function* countdown(n) {
  while (n > 0) {
    let newN = yield n
    if (typeof newN === 'number') {
      n = newN
    } else {
      n--
    }
  }
}
let it = countdown(5)
for (let i of it) {
  console.log(i)
  if (i == 5) it.next(3)
}
