// Adds support for promise waiting
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
class WaitPromise extends SystemCall {
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
function error(obj) {
  if (obj instanceof Error) {
    console.log('error', obj.message)
    return true
  } else {
    return false
  }
}
/** @param {Deno.Conn} conn */
function* handleClient(conn) {
  let { hostname, port } = conn.remoteAddr
  console.log('connection from', hostname, port)
  let buffer = new Uint8Array(4096)
  outer:
  while (true) {
    let bytesRead = yield new WaitPromise(conn.read(buffer))
    if (bytesRead == null || error(bytesRead)) break
    let buf = buffer.subarray(0, bytesRead)
    while (buf.length) {
      let len = yield new WaitPromise(conn.write(buf))
      if (error(len)) break outer
      buf = buf.subarray(len)
    }
  }
  conn.close()
  console.log('client closed')
}
function* main(port) {
  console.log('server starting')
  let listener = Deno.listen({ port })
  while (true) {
    /** @type {Deno.Conn} */
    let conn = yield new WaitPromise(listener.accept())
    if (error(conn)) break
    yield new NewTask(handleClient(conn))
  }
}
let sched = new Scheduler()
sched.new(main(45000))
sched.mainloop()
