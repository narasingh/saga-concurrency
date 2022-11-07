/* eslint-disable no-constant-condition */

import { take, put, call, fork, cancel, flush, race } from "redux-saga/effects";
import { channel } from "redux-saga";
import { CANCEL, UPLOAD, INCREMENT } from "../actionTypes";

const action = (type) => ({ type });
let barcodes = [];

function addItem(itemBarcode) {
  console.log("Making async request here.", itemBarcode);
  return new Promise((resolve) => {
    setTimeout(() => resolve(1), 3000);
  });
}

function* itemConcurrencyTask(requestChannel) {
  while (true) {
    const itemBarcode = yield take(requestChannel);

    // process the request
    const res = yield race({
      response: call(addItem, itemBarcode),
      cancel: take(CANCEL)
    });

    if (res.response) {
      // handle network error here
      console.log(res, "item added sucessfully.");
      yield put(action(INCREMENT));
    } else {
      console.log("item not found in the inventory!");
    }
    if (!barcodes.length) {
      console.log("all items scanned.");
    }
  }
}

function* itemScanSaga() {
  const CONCURRENT_SCAN = 2;
  const requestChannel = yield call(channel);
  for (let i = 0; i < CONCURRENT_SCAN; i++) {
    yield fork(itemConcurrencyTask, requestChannel);
  }

  yield fork(function* flushOnCancel() {
    while (true) {
      yield take(CANCEL);
      yield flush(requestChannel);
    }
  });

  while (true) {
    const { barcode } = yield take(UPLOAD);
    yield put(requestChannel, barcode);
  }
}

export default itemScanSaga;
