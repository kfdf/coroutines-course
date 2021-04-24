export class Task {
  static taskid = 0
  constructor(target) {
    this.tid = ++Task.taskid
    this.target = target
    this.sendval = undefined
    this.stack = []
  }
  run() {
    // pretending yield* doesn't exist
    while (true) {
      let r
      try {
        r = this.sendval instanceof Error ?
          this.target.throw(this.sendval) :
          this.target.next(this.sendval)
      } catch (err) {
        if (!this.stack.length) throw err
        r = { done: false, value: err}
      }
      if (!r.done && r.value instanceof SystemCall) {
        return r
      } else if (!r.done && typeof r.value.next == 'function') {
        this.stack.push(this.target)
        this.sendval = undefined
        this.target = r.value
      } else if (this.stack.length) {
        this.sendval = r.value
        this.target = this.stack.pop()
      } else {
        return r
      }
    }
  }
}
export class SystemCall {
  /** @type {Task} */
  task = null
  /** @type {Scheduler} */
  sched = null
  handle() { }
}
export class GetTid extends SystemCall {
  handle() {
    this.task.sendval = this.task.tid
    this.sched.schedule(this.task)
  }
}
export class NewTask extends SystemCall {
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
export class KillTask extends SystemCall {
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
export class WaitTask extends SystemCall {
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
export class WaitPromise extends SystemCall {
  constructor(promise) {
    super()
    this.promise = promise
  }
  handle() {
    let handler = r => {
      this.task.sendval = r
      this.sched.schedule(this.task)
    }
    this.promise.then(handler, handler)
  }
}
export class Scheduler {
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
      if (this.queue.length == 0) {
        // scheduling the scheduler...
        setTimeout(() => this.mainloop())
        break
      }      
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



