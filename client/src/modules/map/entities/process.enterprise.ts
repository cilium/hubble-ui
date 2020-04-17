import { sizes } from '../sizes.enterprise';
import { MapEndpoint } from './endpoint.enterprise';
import { MapAbstractEntity } from './entity.abstract';
import { MapProtocol } from './protocol.enterprise';

export class MapProcess extends MapAbstractEntity {
  private readonly _hash: string;
  private readonly _endpoint: MapEndpoint;
  private readonly _protocols: ReadonlyArray<MapProtocol>;
  private readonly _bin: string;
  private readonly _args: string;

  public constructor(params: {
    endpoint: MapEndpoint;
    bin: string;
    args: string;
  }) {
    super();
    this._endpoint = params.endpoint;
    this._bin = params.bin;
    this._args = params.args;
    this._protocols = [];
    this._hash = this.calcHash();
  }

  public get graph() {
    return this.endpoint.graph;
  }

  public get endpoint() {
    return this._endpoint;
  }

  public get protocols() {
    return this._protocols;
  }

  public get hash() {
    return this._hash;
  }

  public get bin() {
    return this._bin;
  }

  public get args() {
    return this._args;
  }

  public get height() {
    return this.calcHeight();
  }

  public clone() {
    return this;
  }

  public destroy() {
    return void 0;
  }

  private calcHash() {
    return `${this.endpoint.hash};process:${this.bin}:${this.args}`;
  }

  private calcHeight() {
    return sizes['--endpoint-process-height'];
  }
}
