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
class SystemCall {
  task = null
  sched = null
  handle() { }
}
class GetTid extends SystemCall {
  handle() {
    this.task.sendval = this.task.tid
    this.sched.schedule(this.task)
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
      let { done, value } = task.run()
      if (done) {
        this.exit(task)
      } else if (value instanceof SystemCall) {
        value.task = task
        value.sched = this
        value.handle()
      } else {
        this.schedule(task)
      }
    }
  }
}
function* foo() {
  let tid = yield new GetTid()
  for (let i = 0; i < 3; i++) {
    console.log("I'm foo", tid)
    yield
  }
}
function* bar() {
  let tid = yield new GetTid()
  for (let i = 0; i < 5; i++) {
    console.log("I'm bar", tid)
    yield
  }
}

let sched = new Scheduler()
sched.new(foo())
sched.new(bar())
sched.mainloop()
