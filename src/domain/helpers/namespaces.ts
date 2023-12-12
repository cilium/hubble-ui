import * as uipb from '~backend/proto/ui/ui_pb';

import { NamespaceDescriptor } from '../namespaces';

export const fromPb = (pb?: uipb.NamespaceDescriptor | null): NamespaceDescriptor | null => {
  if (pb == null) return null;
  // TODO: Id is set to non empty string if namespace exists in relay too
  const relay = !!pb.id;

  return {
    namespace: pb.name,
    relay,
  };
};
