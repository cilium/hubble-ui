export abstract class AbstractAccessPoint {
  public abstract get id(): string;
}

export abstract class AbstractCard {
  public abstract get accessPoints(): Map<string, AbstractAccessPoint>;
  public abstract get id(): string;
}
