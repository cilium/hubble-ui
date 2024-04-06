import _ from 'lodash';

export type Time = {
  seconds: number;
  nanos: number;
};

export enum DateShortcut {
  Now = 'now',
  Minutes5 = '5-mins',
  Minutes30 = '30-mins',
  Hour1 = '1-hour',
  Day1 = '1-day',
  Week1 = '1-week',
  Month1 = '1-month',
}

export type DateOrShortcut = DateShortcut | Date;

export class TimeDuration {
  private _milliseconds: number;

  constructor(milliseconds: number) {
    this._milliseconds = milliseconds;
  }

  get milliseconds(): number {
    return this._milliseconds;
  }

  get seconds(): number {
    return this.milliseconds / 1000;
  }

  toString(): string {
    return `${this.milliseconds}ms`;
  }
}

export class TimeDurationRange {
  private _min: TimeDuration;
  private _max: TimeDuration;

  constructor(min: TimeDuration, max: TimeDuration) {
    this._min = min;
    this._max = max;
  }

  covered(duration: TimeDuration, { includeMin = true, includeMax = true } = {}): boolean {
    let left = false;
    let right = false;
    if (includeMin) {
      left = duration.milliseconds >= this._min.milliseconds;
    } else {
      left = duration.milliseconds > this._min.milliseconds;
    }
    if (includeMax) {
      right = duration.milliseconds <= this._max.milliseconds;
    } else {
      right = duration.milliseconds < this._max.milliseconds;
    }
    return left && right;
  }

  toString(): string {
    return `${this._min} - ${this._max}`;
  }
}
