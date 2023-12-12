export class RetriesFailed extends Error {
  private attemptLimitReached = false;

  public get isAttemptLimitReached() {
    return this.attemptLimitReached;
  }

  public setAttemptLimitReached(e: boolean): this {
    this.attemptLimitReached = e;
    return this;
  }
}
