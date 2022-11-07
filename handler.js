function* handler({ uri, index, segmentsCount }) {
    // get the data
    const res = yield call(fetch, uri);
    const blob = yield res.blob();
    
    // report to the store
    yield put({ type: "CHUNK_DONE", payload: { index, blob } })
    
    // check if all the chunk are ready
    const currentChunkCount = yield select(currentChunkCountSelector)
    if (currentChunkCount === segmentsCount) {
      yield allDoneChannel.put({ type: "DONE" });
    }
};

export default handler;