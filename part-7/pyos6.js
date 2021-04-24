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
class WaitTask extends SystemCall {
  constructor(tid) {
    super()
    this.tid = tid
  }
  handle() {
    let waiting = this.sched.waitForExit(this.task, this.tid)
    this.task.sendval = waiting
    if (!waiting) this.sched.schedule(this.task)
  }
}
class Scheduler {
  constructor() {
    /** @type{Task[]} */
    this.queue = []
    /** @type{Map<number, Task>} */
    this.taskmap = new Map()
    /** @type{Map<number, Task[]>} */
    this.exitWaiting = new Map()
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
    let tasks = this.exitWaiting.get(task.tid)
    tasks?.forEach(t => this.schedule(t))
  }
  waitForExit(task, taskid) {
    if (!this.taskmap.has(taskid)) return false
    let tasks = this.exitWaiting.get(taskid)
    if (!tasks) {
      tasks = []
      this.exitWaiting.set(taskid, tasks)
    }
    tasks.push(task)
    return true
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
  for (let i = 0; i < 5; i++) {
    console.log("I'm foo", tid)
    yield
  }
}
function* main() {
  let tid = yield new GetTid()
  let child = yield new NewTask(foo())
  console.log('waiting for child', tid)
  yield new WaitTask(child)
  console.log('child done', tid)
}

let sched = new Scheduler()
sched.new(main())
sched.mainloop()
