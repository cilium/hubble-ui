import { extractPathname, ltrimSlashes } from '~/router/utils';

export class RoutePathAction {
  public static new(path: string): RoutePathAction {
    return new RoutePathAction(path);
  }

  public readonly path: string;

  constructor(_path: string) {
    const pathname = extractPathname(_path);

    // NOTE: This line makes possible to support relative paths
    this.path = _path.startsWith('/') ? pathname : ltrimSlashes(pathname);
  }
}
