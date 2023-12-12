export interface EventParams {
  flow?: boolean;
  flows?: boolean;
  namespaces?: boolean;
  services?: boolean;
  serviceLinks?: boolean;
  status?: boolean;
}

export const EventParamsSet = {
  EventStream: {
    flow: false,
    flows: true,
    namespaces: false,
    services: true,
    serviceLinks: true,
    status: false,
  },
};
