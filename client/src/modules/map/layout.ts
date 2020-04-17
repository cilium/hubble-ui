import { MapEndpoint, MapGraph } from './entities';
import { sizes } from './sizes';
import { isEgressEndpoint, isHostEndpoint, isWorldEndpoint } from './utils';

export class MapLayout {
  private readonly _graph: MapGraph;

  private _endpoints: {
    [key: string]: { x: number; y: number; height: number };
  } = {};

  public constructor({ graph }: { graph: MapGraph }) {
    this._graph = graph;
    this.rebuild();
  }

  public get graph() {
    return this._graph;
  }

  public rebuild() {
    this.resetCoords();

    const field: MapEndpoint[][] = [];

    const getRow = (i: number) => {
      let row = field[i];
      if (!row) {
        row = [];
        field[i] = row;
      }
      return row;
    };

    const setCell = (i: number, j: number, endpoint: MapEndpoint) => {
      getRow(i)[j] = endpoint;
    };

    // let egressRows = 0;
    let egressCols = 1;
    const inNamespaceRows = 1;
    let inNamespaceCols = 1;
    this.graph.forEachEndpoint(endpoint => {
      if (isEgressEndpoint(endpoint)) {
        setCell(0, egressCols++, endpoint);
      } else if (isWorldEndpoint(endpoint)) {
        setCell(0, 0, endpoint);
      } else if (isHostEndpoint(endpoint)) {
        setCell(1, 0, endpoint);
      } else {
        setCell(inNamespaceRows, inNamespaceCols++, endpoint);
      }
    });

    for (let i = 0; i <= inNamespaceRows; i += 1) {
      for (let j = 0; j <= Math.max(egressCols, inNamespaceCols); j += 1) {
        const row = field[i];
        if (!row) {
          continue;
        }
        const endpoint = row[j];
        if (!endpoint) {
          continue;
        }
        this.updateEndpoint(endpoint.hash, {
          x: j * sizes['--endpoint-width'] + j * sizes['--endpoint-h-padding'],
          y: i * 200 + i * sizes['--endpoint-v-padding'],
        });
      }
    }
  }

  public mapEachEndpoint(
    callback: (args: {
      endpoint: MapEndpoint;
      x: number;
      y: number;
      height: number;
    }) => JSX.Element,
  ) {
    const elements: JSX.Element[] = [];
    Object.keys(this._endpoints).forEach(hash => {
      const endpoint = this.graph.getEndpoint(hash);
      const { x, y, height } = this._endpoints[hash];
      elements.push(callback({ endpoint, x, y, height }));
    });
    return elements;
  }

  public mapEachLink(
    callback: (args: {
      srcEndpoint: MapEndpoint;
      dstEndpoint: MapEndpoint;
      srcEndpointX: number;
      srcEndpointY: number;
      dstEndpointX: number;
      dstEndpointY: number;
      srcEndpointHeight: number;
      dstEndpointHeight: number;
    }) => JSX.Element,
    direction: 'descendants' | 'ancestors' = 'descendants',
  ) {
    const elements: JSX.Element[] = [];
    Object.keys(this._endpoints).forEach(srcEndpointHash => {
      const srcEndpoint = this.graph.getEndpoint(srcEndpointHash);
      if (!srcEndpoint) {
        throw new Error(
          `src endpoint with hash=${srcEndpointHash} exists in layout coords but not in graph`,
        );
      }
      this.graph.forEndpointEachLink(
        srcEndpoint,
        dstEndpoint => {
          if (!this._endpoints[dstEndpoint.hash]) {
            throw new Error(
              `dst endpoint with hash=${dstEndpoint.hash} exists in graph but not in layout coords`,
            );
          }

          const {
            x: srcEndpointX,
            y: srcEndpointY,
            height: srcEndpointHeight,
          } = this._endpoints[srcEndpoint.hash];
          const {
            x: dstEndpointX,
            y: dstEndpointY,
            height: dstEndpointHeight,
          } = this._endpoints[dstEndpoint.hash];

          elements.push(
            callback({
              srcEndpoint: srcEndpoint,
              dstEndpoint: dstEndpoint,
              srcEndpointX: srcEndpointX,
              srcEndpointY: srcEndpointY,
              dstEndpointX: dstEndpointX,
              dstEndpointY: dstEndpointY,
              srcEndpointHeight: srcEndpointHeight,
              dstEndpointHeight: dstEndpointHeight,
            }),
          );
        },
        direction,
      );
    });
    return elements;
  }

  private updateEndpoint(hash: string, { x, y }: { x?: number; y?: number }) {
    const currentCoord = this._endpoints[hash];
    currentCoord.x = typeof x === 'number' ? x : currentCoord.x;
    currentCoord.y = typeof y === 'number' ? y : currentCoord.y;
  }

  private resetCoords() {
    this._endpoints = {};
    this.graph.forEachEndpoint(endpoint => {
      if (!this._endpoints[endpoint.hash]) {
        this._endpoints[endpoint.hash] = {
          x: 0,
          y: 0,
          height: endpoint.height,
        };
      }
    });
  }
}
