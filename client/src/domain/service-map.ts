import { IEndpoint } from '~/domain/endpoint';
import { L34Protocol } from '~/domain/mocked-data';

export interface ServiceMap {
  endpoints: Array<IEndpoint>;
  links: Array<Link>;
}

export interface Link {
  sourceIdentity: string;
  destinationIdentity: string;
  verdict?: any;
  destinationPort: number;
  l34Protocol: L34Protocol;
}
