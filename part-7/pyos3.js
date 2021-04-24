class Task {
  static taskid = 0
  constructor(target) {
    this.tid = ++Task.taskid
    this.target = target
    this.sendval = undefined
  }
  run() {
    return this.target.next(this.sendval)
  }
}
class Scheduler {
  constructor() {
    /** @type{Task[]} */
    this.queue = []
    this.taskmap = new Map()
  }
  new(target) {
    let task = new Task(target)
    this.taskmap.set(task.tid, task)
    this.schedule(task)
  }
  schedule(task) {
    this.queue.unshift(task)
  }
  exit(task) {
    console.log('task', task.tid, 'terminated')
    this.taskmap.delete(task.tid)
  }
  mainloop() {
    while (this.taskmap.size) {
      let task = this.queue.pop()
      let { done } = task.run()
      if (done) {
        this.exit(task)
      } else {
        this.schedule(task)
      }
    }
  }
}
function* foo() {
  for (let i = 0; i < 3; i++) {
    console.log("I'm foo", i)
    yield
  }
}
function* bar() {
  for (let i = 0; i < 5; i++) {
    console.log("I'm bar", i)
    yield
  }
}

let sched = new Scheduler()
sched.new(foo())
sched.new(bar())
sched.mainloop()
