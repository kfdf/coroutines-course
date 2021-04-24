function* add(x, y) {
  yield x + y
}
function* main() {
  yield add(2, 2)
  yield
}

let m = main()
let sub = m.next().value
let result = sub.next().value
m.next(result)
