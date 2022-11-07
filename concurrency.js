
import { buffers, channel } from "redux-saga";
import { all, call, fork, put, take } from "redux-saga/effects";

/**
 * creates a queue
 *
 * @param {GeneratorFunction} [handler] request handler
 * @param {number} [workersCount=1] number of workers
 */
function* createConcurrentTaskQueue(handler, workersCount = 1) {
  
  // a channel to queue incoming action
  const queueChannel = yield call(channel, buffers.expanding());
  
  function* watcher() {
    // a channel to queue incoming tasks
    const workersChannel = yield call(channel, buffers.expanding());

    // create n worker 'threads'
    yield all(Array(workersCount).fill(fork(worker, workersChannel)));

    // wait for a tasks
    while (true) {
      // incoming task
      const { payload } = yield take(queueChannel);
      // assign the task to one of the workers
      yield put(workersChannel, payload);
    }
  }
  
  // a single worker
  function* worker(chan) {
    while (true) {
      // incoming task
      const payload = yield take(chan);
      // handle it with the given handler arg
      yield handler(payload);
    }
  }
  
  return {
    watcher,
    queueChannel,
  };
}

export default createConcurrentTaskQueue;