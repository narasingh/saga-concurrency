import createConcurrentTaskQueue from './concurrency';
import handler from './handler';

const QUEUE_CONCURRENT = 5

const { watcher, queueChannel } = yield createConcurrentTaskQueue(
      handler,
      QUEUE_CONCURRENT
);

const watcherTask = yield fork(watcher)


const segmentsCount = segments.length

// transform the segments list to an action list
const actions = segments.map((segment, index) =>
    put(queueChannel, { payload: { uri: segment.uri, index, segmentsCount } })
)

// fire them all together
yield all(actions);

// the first to fire between "all done" and "cancel"
const { cancelDownload, allDone } = yield race({
    allDone: take(allDoneChannel),
    cancelDownload: take("CANCEL_DOWNLOAD")
});
  
// stop the queue manager
yield cancel(watcherTask);

// in case of cancellation just return;
if (cancelDownload){
    return;
}
// in case of "all done" create a  link and put a new action
if (allDone) {
    const link = URL.createObjectURL(blobBuilder.build());
    yield put(downloadFinished({ id, link }));
    return;
}