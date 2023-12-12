import { AuthType } from '~/domain/hubble';
import { AuthType as PBAuthType } from '~backend/proto/flow/flow_pb';

export const toString = (at: AuthType | undefined): string => {
  switch (at) {
    case AuthType.Disbaled:
      return '';
    case AuthType.Spire:
      return 'Spire';
    case AuthType.TestAlwaysFail:
      return 'TEST Always Fail';
  }

  return 'Unkown';
};

export const authTypeFromPb = (at: PBAuthType): AuthType => {
  let t = AuthType.Disbaled;

  if (at === PBAuthType.SPIRE) {
    t = AuthType.Spire;
  } else if (at === PBAuthType.TEST_ALWAYS_FAIL) {
    t = AuthType.TestAlwaysFail;
  }

  return t;
};

export const authTypeFromStr = (str: string): AuthType => {
  let t = AuthType.Disbaled;

  if (!str) return t;
  str = str.toLowerCase();

  if (str.startsWith('spire')) t = AuthType.Spire;
  if (str.startsWith('test')) t = AuthType.TestAlwaysFail;

  return t;
};
