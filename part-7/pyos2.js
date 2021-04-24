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
class Scheduler {
  constructor() {
    /** @type{Task[]} */
    this.queue = []
  }
  new(target) {
    let task = new Task(target)
    this.schedule(task)
  }
  schedule(task) {
    this.queue.unshift(task)
  }
  mainloop() {
    while (true) {
      let task = this.queue.pop()
      task.run()
      this.schedule(task)
    }
  }
}
function* foo() {
  while (true) {
    console.log("I'm foo")
    yield
  }
}
function* bar() {
  while (true) {
    console.log("I'm bar")
    yield
  }
}

let sched = new Scheduler()
sched.new(foo())
sched.new(bar())
sched.mainloop()
