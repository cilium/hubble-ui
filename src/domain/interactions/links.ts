import { Link } from '~/domain/service-map';

// { cardId -> { cardId -> { acessPointId : Link }  }
export type ConnectionsMap = Map<string, Map<string, Map<string, Link>>>;

export interface Connections {
  readonly outgoings: ConnectionsMap;
  readonly incomings: ConnectionsMap;
}
