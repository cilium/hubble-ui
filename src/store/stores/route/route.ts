import RouteParser from 'route-parser';

export interface RouteProps {
  path: string;
}

export class Route {
  public readonly name: string;
  private props: RouteProps;
  private route: RouteParser;

  public static new(name: string, props: RouteProps) {
    return new Route(name, props);
  }

  constructor(name: string, props: RouteProps) {
    this.name = name;
    this.props = props;
    this.route = new RouteParser(props.path);
  }

  // Returns boolean or params that were matched
  public matches(url: string): boolean | object {
    return this.route.match(url);
  }

  // Returns url or false if props is not compatible with route params
  public reverse(props: any): string | false {
    return this.route.reverse(props);
  }
}
