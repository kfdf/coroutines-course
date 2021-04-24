class Task {
  static taskid = 0
  constructor(target) {
    this.tid = ++Task.taskid
    this.target = target
    this.sendval = undefined
  }
  run() {
    if (this.sendval instanceof Error) {
      return this.target.throw(this.sendval)
    } else {
      return this.target.next(this.sendval)
    }
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

class Listener {
  constructor(listener) {
    this.listener = listener
  }
  * accept() {
    let conn = yield new WaitPromise(this.listener.accept())
    return new Connection(conn)
  }
}
class Connection {
  constructor(conn) {
    /** 
    @private
    @type {Deno.Conn} */
    this.conn = conn
  }
  get remoteAddr() {
    return this.conn.remoteAddr
  }
  * send(buf) {
    while (buf.length) {
      let len = yield new WaitPromise(this.conn.write(buf))
      buf = buf.subarray(len)
    }
  }
  * receive(buf) {
    return yield new WaitPromise(this.conn.read(buf))
  }
  * close() {
    this.conn.close()
  }
}
/** @param {Connection} conn */
function* handleClient(conn) {
  let { hostname, port } = conn.remoteAddr
  try {
    console.log('connection from', hostname, port)
    let buffer = new Uint8Array(4096)
    while (true) {
      let bytesRead = yield* conn.receive(buffer)
      if (bytesRead == null) break
      yield* conn.send(buffer.subarray(0, bytesRead))
    }
  } catch (err) {
    console.log(hostname, port, err.message)
  } finally {
    conn.close()
    console.log(hostname, port, 'closed')
  }
}
function* main(port) {
  try {
    console.log('server starting')
    let listener = new Listener(Deno.listen({ port }))
    while (true) {
      let conn = yield* listener.accept()
      if (conn == null) break
      yield new NewTask(handleClient(conn))
    }
  } catch (err) {
    console.log('server', err.message)
  }
}
let sched = new Scheduler()
sched.new(main(45000))
sched.mainloop()
