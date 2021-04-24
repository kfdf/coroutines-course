import { Scheduler, NewTask } from './pyos8.js'
import { Listener, Connection } from './sockwrap.js'

/** @param {Connection} conn */
function* handleClient(conn) {
  let { hostname, port } = conn.remoteAddr
  try {
    console.log('connection from', hostname, port)
    let buffer = new Uint8Array(4096)
    while (true) {
      let bytesRead = yield conn.receive(buffer)
      if (bytesRead == null) break
      yield conn.send(buffer.subarray(0, bytesRead))
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
      let conn = yield listener.accept()
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
