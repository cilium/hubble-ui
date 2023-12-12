import { RouteAction, RouteParamAction, RoutePathAction } from '~/router/actions';

import { TransactionRunner } from '~/router/transaction';

type TestDescriptor = {
  init: [string] | [string, string];
  steps: RouteAction[];
  expectPath?: string;
  expectSearchParams?: string;
};

const runTests = (tests: TestDescriptor[]) => {
  tests.forEach((testDesc, idx) => {
    const runner = new TransactionRunner(
      {
        pathname: testDesc.init[0],
      },
      testDesc.init.length === 2 ? new URLSearchParams(testDesc.init[1]) : new URLSearchParams(),
    );

    testDesc.steps.forEach(action => {
      runner.do(action);
    });

    const [path, params] = runner.finish();

    if (testDesc.expectPath != null) {
      test(`test ${idx} > path`, () => {
        expect(path).toBe(testDesc.expectPath);
      });
    }

    test(`test ${idx} > search params`, () => {
      expect(params.toString()).toBe(testDesc.expectSearchParams || '');
    });
  });
};

describe('TransactionRunner', () => {
  runTests([
    {
      init: ['/'],
      steps: [RouteAction.path(RoutePathAction.new(''))],
      expectPath: '/',
    },
    {
      init: ['/'],
      steps: [RouteAction.path(RoutePathAction.new('//////'))],
      expectPath: '/',
    },
    {
      init: ['/'],
      steps: [RouteAction.path(RoutePathAction.new('//////??random=1'))],
      expectPath: '/',
    },
    {
      init: ['/'],
      steps: [RouteAction.path(RoutePathAction.new('one'))],
      expectPath: '/one',
    },
    {
      init: ['/'],
      steps: [RouteAction.path(RoutePathAction.new('/one'))],
      expectPath: '/one',
    },
    {
      init: ['/'],
      steps: [RouteAction.path(RoutePathAction.new('/one/two'))],
      expectPath: '/one/two',
    },
    {
      init: ['/'],
      steps: [RouteAction.path(RoutePathAction.new('one/two'))],
      expectPath: '/one/two',
    },
    {
      init: ['/'],
      steps: [RouteAction.path(RoutePathAction.new('one/two/'))],
      expectPath: '/one/two',
    },
    {
      init: ['/'],
      steps: [
        RouteAction.path(RoutePathAction.new('/one')),
        RouteAction.path(RoutePathAction.new('/two')),
      ],
      expectPath: '/two',
    },
    {
      init: ['?a=1&b=2'],
      steps: [
        RouteAction.path(RoutePathAction.new('/one')),
        RouteAction.path(RoutePathAction.new('/two')),
      ],
      expectPath: '/two',
    },
    {
      init: ['/random?with=query'],
      steps: [
        RouteAction.path(RoutePathAction.new('/one')),
        RouteAction.path(RoutePathAction.new('/two')),
      ],
      expectPath: '/two',
    },
    {
      init: ['/'],
      steps: [
        RouteAction.path(RoutePathAction.new('/one')),
        RouteAction.path(RoutePathAction.new('/two/three')),
        RouteAction.path(RoutePathAction.new('four?p=42')),
      ],
      expectPath: '/two/four',
    },
    {
      init: ['/'],
      steps: [
        RouteAction.path(RoutePathAction.new('/one')),
        RouteAction.path(RoutePathAction.new('/two/three')),
        RouteAction.path(RoutePathAction.new('four?p=42')),
      ],
      expectPath: '/two/four',
    },
    {
      init: ['/'],
      steps: [
        RouteAction.path(RoutePathAction.new('/one')),
        RouteAction.path(RoutePathAction.new('/two/three')),
        RouteAction.path(RoutePathAction.new('four?p=42')),
        RouteAction.path(RoutePathAction.new('five/six?p=43')),
      ],
      expectPath: '/two/five/six',
    },
    {
      init: ['/'],
      steps: [
        RouteAction.path(RoutePathAction.new('/one')),
        RouteAction.path(RoutePathAction.new('/two/three')),
        RouteAction.path(RoutePathAction.new('four?p=42')),
        RouteAction.path(RoutePathAction.new('five/six?p=43')),
        RouteAction.path(RoutePathAction.new('/?p=1')),
      ],
      expectPath: '/',
    },
    {
      init: ['/'],
      steps: [
        RouteAction.path(RoutePathAction.new('/one')),
        RouteAction.path(RoutePathAction.new('/two/three')),
        RouteAction.path(RoutePathAction.new('four?p=42')),
        RouteAction.path(RoutePathAction.new('five/six?p=43')),
        RouteAction.path(RoutePathAction.new('')),
      ],
      expectPath: '/two/five/six',
    },
    {
      init: ['/init'],
      steps: [
        RouteAction.path(RoutePathAction.new('/one')),
        RouteAction.path(RoutePathAction.new('/two/three')),
        RouteAction.path(RoutePathAction.new('four?p=42')),
        RouteAction.path(RoutePathAction.new('five/six?p=43')),
        RouteAction.path(RoutePathAction.new('')),
      ],
      expectPath: '/two/five/six',
    },
    {
      init: ['/init1/init2/'],
      steps: [
        RouteAction.path(RoutePathAction.new('/one')),
        RouteAction.path(RoutePathAction.new('/two/three')),
        RouteAction.path(RoutePathAction.new('four?p=42')),
        RouteAction.path(RoutePathAction.new('five/six?p=43')),
        RouteAction.path(RoutePathAction.new('')),
      ],
      expectPath: '/two/five/six',
    },
    {
      init: ['/', 'a=1&b=2'],
      steps: [
        RouteAction.path(RoutePathAction.new('/one')),
        RouteAction.path(RoutePathAction.new('/two/three')),
        RouteAction.path(RoutePathAction.new('four?p=42')),
        RouteAction.path(RoutePathAction.new('five/six?p=43')),
        RouteAction.path(RoutePathAction.new('')),
      ],
      expectPath: '/two/five/six',
      expectSearchParams: 'a=1&b=2',
    },
    {
      init: ['/', 'a=1&b=2'],
      steps: [
        RouteAction.path(RoutePathAction.new('/one')),
        RouteAction.path(RoutePathAction.new('/two/three')),
        RouteAction.path(RoutePathAction.new('four?p=42')),
        RouteAction.path(RoutePathAction.new('five/six?p=43')),
        RouteAction.path(RoutePathAction.new('')),
        RouteAction.param(RouteParamAction.new('c', 3)),
      ],
      expectPath: '/two/five/six',
      expectSearchParams: 'a=1&b=2&c=3',
    },
    {
      init: ['/', 'a=1&b=2'],
      steps: [
        RouteAction.path(RoutePathAction.new('/one')),
        RouteAction.path(RoutePathAction.new('/two/three')),
        RouteAction.path(RoutePathAction.new('four?p=42')),
        RouteAction.path(RoutePathAction.new('five/six?p=43')),
        RouteAction.path(RoutePathAction.new('')),
        RouteAction.param(RouteParamAction.new('c', 3)),
        RouteAction.param(RouteParamAction.new('b', null)),
      ],
      expectPath: '/two/five/six',
      expectSearchParams: 'a=1&c=3',
    },
    {
      init: ['/', 'a=1&b=2'],
      steps: [
        RouteAction.path(RoutePathAction.new('/one')),
        RouteAction.path(RoutePathAction.new('/two/three')),
        RouteAction.path(RoutePathAction.new('four?p=42')),
        RouteAction.path(RoutePathAction.new('five/six?p=43')),
        RouteAction.path(RoutePathAction.new('')),
        RouteAction.param(RouteParamAction.new('b', null)),
        RouteAction.param(RouteParamAction.new('a', null)),
      ],
      expectPath: '/two/five/six',
      expectSearchParams: '',
    },
    {
      init: ['/', 'a=1&b=2'],
      steps: [
        RouteAction.path(RoutePathAction.new('/one')),
        RouteAction.path(RoutePathAction.new('/two/three')),
        RouteAction.path(RoutePathAction.new('four?p=42')),
        RouteAction.path(RoutePathAction.new('five/six?p=43')),
        RouteAction.path(RoutePathAction.new('')),
        RouteAction.dropSearchParams(),
      ],
      expectPath: '/two/five/six',
      expectSearchParams: '',
    },
    {
      init: ['/', 'a=1&b=2'],
      steps: [
        RouteAction.path(RoutePathAction.new('/one')),
        RouteAction.path(RoutePathAction.new('/two/three')),
        RouteAction.path(RoutePathAction.new('four?p=42')),
        RouteAction.path(RoutePathAction.new('five/six?p=43')),
        RouteAction.path(RoutePathAction.new('')),
        RouteAction.dropSearchParams(),
        RouteAction.path(RoutePathAction.new('seven')),
        RouteAction.param(RouteParamAction.new('p', 11)),
      ],
      expectPath: '/two/five/seven',
      expectSearchParams: 'p=11',
    },
  ]);
});
