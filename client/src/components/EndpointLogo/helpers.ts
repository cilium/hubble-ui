import { Endpoint, ApplicationKind } from '~/domain/endpoint';

export enum LogoType {
  PROTOCOL = 'logo',
  EMOJI = 'emoji',
}

export interface Logo {
  id: string;
  type: LogoType;
}

export const extractLogo = (ep: Endpoint): Logo => {
  if (ep.isCovalentRelated) {
    return {
      id: 'covalent',
      type: LogoType.PROTOCOL,
    };
  }

  if (ep.isWorld || ep.isDNS) {
    return {
      id: 'world',
      type: LogoType.PROTOCOL,
    };
  }

  if (ep.isHost) {
    return {
      id: 'host',
      type: LogoType.PROTOCOL,
    };
  }

  if (ep.isCIDR && ep.isAWS) {
    return {
      id: 'aws',
      type: LogoType.PROTOCOL,
    };
  }

  const appProto = ep.appProtocol || 'kubernetes';
  return {
    id: appProto,
    type: LogoType.PROTOCOL,
  };
};
