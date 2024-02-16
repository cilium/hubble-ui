import { Timer } from '~/utils/timer';
import type { HandlerTypes } from '~/utils/emitter';

import { Stream, Options, PollControl } from './stream';

export type OneshotOptions = Options & {};

export class Oneshot<H extends HandlerTypes = {}> extends Stream<H> {
  constructor(opts: OneshotOptions) {
    super(opts);
  }

  public run(): this {
    if (this.timer == null) {
      this.timer = Timer.new(0);
    } else {
      return this;
    }

    this.timer
      .onTimeout(async () => {
        const isFirst = this.channelIdPromise == null;
        const [pollControl, resp] = await this.send(
          msg => {
            // NOTE: IsNotReady set to true means that this is simple Poll request
            if (!isFirst) msg.setIsNotReady(true);

            return this.messageBuilder(msg, isFirst);
          },
          req => {
            this.pendingRequests.add(req);

            return () => {
              this.pendingRequests.delete(req);
            };
          },
        );

        switch (pollControl) {
          case PollControl.Continue: {
            if (resp != null && resp.hasPayload) {
              this.terminate();
              return;
            }

            this.timer?.reset(resp?.pollDelay || 0);
            break;
          }
          case PollControl.Terminate: {
            await this.stop();
            break;
          }
          case PollControl.Finalized: {
            this.terminate();
            return;
          }
        }
      })
      .start();

    return this;
  }
}
