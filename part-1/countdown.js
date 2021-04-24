function* countdown(n) {
  console.log('Counting down from', n)
  while (n > 0) {
    yield n--
  }
  console.log('Done counting down')
}
for (let i of countdown(10)) {
  console.log(i)
}