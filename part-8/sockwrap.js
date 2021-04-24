import { WaitPromise } from './pyos8.js'

export class Listener {
  /** @param {Deno.Listener} listener */
  constructor(listener) {
    /** @private */
    this.listener = listener
  }
  * accept() {
    let conn = yield new WaitPromise(this.listener.accept())
    yield new Connection(conn)
  }
}
export class Connection {
  /** @param {Deno.Conn} conn */
  constructor(conn) {
    /** @private */
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
    let n = yield new WaitPromise(this.conn.read(buf))
    yield n
  }
  * close() {
    this.conn.close()
  }
}
