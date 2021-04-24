function* foo() {
  console.log('foo', yield 'b')
  console.log('foo', yield 'c')
  return 'foo result'
}
function* bar() {
  console.log('bar', yield 'a')
  // console.log(yield* foo())
  let it = foo()
  let { done, value } = it.next()
  while (!done) {
    ({ done, value } = it.next(yield value))
  }
  console.log(value)
  console.log('bar', yield 'd')
}

let it = bar()
console.log(it.next())
console.log(it.next(1))
console.log(it.next(2))
console.log(it.next(3))
console.log(it.next(4))
