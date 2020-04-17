export abstract class MapAbstractEntity {
  public abstract hash: string;
  public abstract height: number;
  public abstract clone(): this;
  public abstract destroy(): void;
}
