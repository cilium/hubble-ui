export class Environment {
  public static new() {
    return new Environment();
  }

  public get isDev(): boolean {
    const nenv = process.env.NODE_ENV || 'dev';
    return nenv.startsWith('dev');
  }
}
