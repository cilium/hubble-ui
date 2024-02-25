export const isTestingEnv = () => {
  const nenv = process.env.NODE_ENV;
  const e2eTestMode = process.env.E2E_TEST_MODE === 'true';
  const mockModeParam = new URLSearchParams(document.location.search).get('e2e');

  return (
    nenv?.startsWith('test') || nenv?.startsWith('e2e') || e2eTestMode || mockModeParam != null
  );
};

export const isDev = () => {
  const nenv = process.env.NODE_ENV || 'dev';
  return nenv.startsWith('dev');
};

export class Environment {
  public static new() {
    return new Environment();
  }

  public get isTesting(): boolean {
    return isTestingEnv();
  }

  public get isDev(): boolean {
    return isDev();
  }
}
