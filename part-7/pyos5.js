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
  /** @type {Task} */
  task = null
  /** @type {Scheduler} */
  sched = null
  handle() { }
}
class GetTid extends SystemCall {
  handle() {
    this.task.sendval = this.task.tid
    this.sched.schedule(this.task)
  }
}
class NewTask extends SystemCall {
  constructor(target) {
    super()
    this.target = target
  }
  handle() {
    let tid = this.sched.new(this.target)
    this.task.sendval = tid
    this.sched.schedule(this.task)
  }
}
class KillTask extends SystemCall {
  constructor(tid) {
    super()
    this.tid = tid
  }
  handle() {
    let task = this.sched.taskmap.get(this.tid)
    if (task) {
      task.target.return()
      this.task.sendval = true
    } else {
      this.task.sendval = false
    }
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
    return task.tid
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
  while (true) {
    console.log("I'm foo", tid)
    yield
  }
}
function* main() {
  let child = yield new NewTask(foo())
  for (let i = 0; i < 5; i++) {
    yield
  }
  yield new KillTask(child)
  console.log('main done')
}

let sched = new Scheduler()
sched.new(main())
sched.mainloop()
