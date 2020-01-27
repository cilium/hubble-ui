// Copyright 2019 Authors of Hubble
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import { v4 as uuid } from "uuid";
import { createAction, Dispatch } from "../../../state";
import { Notification, NotificationType } from "./types";

export const flashNotification = createAction<{ notification: Notification }>(
  "➕ Add notification"
);

export const showNotification = createAction<{ notificationId: string }>(
  "⚡️ Show notification"
);

export const hideNotification = createAction<{ notificationId: string }>(
  "➖ Hide notification"
);

export const flushError = (
  dispatch: Dispatch,
  description: string,
  error: {
    level: "critical" | "default";
    error: Error;
  }
) => {
  let text = description;
  // if (process.env.NODE_ENV === "development") {
  // console.error(error);
  text = `${text}: ${error.error}`;
  // }
  flush(dispatch, buildErrorNotification(text), error.level === "critical");
};

export const flushOk = (dispatch: Dispatch, text: string) =>
  flush(dispatch, buildSuccessNotification(text));

// HELPERS
const buildNotification = (
  type: NotificationType,
  text: string
): Notification => ({
  text,
  type,
  id: uuid()
});

const buildErrorNotification = (text: string): Notification =>
  buildNotification(NotificationType.ERROR, text);

const buildSuccessNotification = (text: string): Notification =>
  buildNotification(NotificationType.SUCCESS, text);

const flush = (
  dispatch: Dispatch,
  notification: Notification,
  permanent: boolean = false,
  timeout: number = 3000
) => {
  notification.timerId = setTimeout(
    () => {
      dispatch(
        hideNotification({
          notificationId: notification.id
        })
      );
    },
    permanent ? 25000 : timeout
  );
  dispatch(flashNotification({ notification }));
};

export interface NotificationMethods {
  flushError: typeof flushError;
  flushOk: typeof flushOk;
}
