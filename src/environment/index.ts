export class Environment {
  public static new() {
    return new Environment();
  }

  public get isTesting(): boolean {
    const nenv = this.var('NODE_ENV');
    const e2eTestMode = this.var('E2E_TEST_MODE') === 'true';

    return nenv?.startsWith('test') || nenv?.startsWith('e2e') || e2eTestMode;
  }

  public get isDev(): boolean {
    const nenv = this.var('NODE_ENV') || 'dev';
    return nenv.startsWith('dev');
  }

  public var(name: string): string | undefined {
    return process.env[name];
  }
}
