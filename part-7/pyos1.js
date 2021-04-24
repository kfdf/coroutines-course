class Task {
  static taskid = 0
  constructor(target) {
    this.tid = ++Task.taskid
    this.target = target
    this.sendval = undefined
  }
  run() {
    this.target.next(this.sendval)
  }
}

function* foo() {
  console.log('part 1')
  yield
  console.log('part 2')
  yield
}

let t1 = new Task(foo())
console.log('running foo')
t1.run()
console.log('resuming foo')
t1.run()

t1.run()
