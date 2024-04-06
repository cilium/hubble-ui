export enum Application {
  ServiceMap = 'service-map',
}

export const APPLICATION_NAMES = new Set<string>(Object.values(Application));

export const getApplicationName = (app: Application): string => {
  return {
    [Application.ServiceMap]: 'Service Map',
  }[app];
};

export enum Order {
  Ascending = 'ascending',
  Descending = 'descending',
}

export enum Direction {
  Source = 'source',
  Destination = 'destination',
}
