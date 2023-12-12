import { LocationState } from '~/router/state';
import { StateParamsMap } from '~/router/transaction';
import { StateParamValue } from '~/router/actions/state-param';

type TestDescriptor = {
  state: LocationState;
  expected?: {
    serialized?: any;
  };
};

const runTests = (tds: TestDescriptor[]) => {
  tds.forEach((td, idx) => runTest(td, idx));
};

const runTest = (td: TestDescriptor, idx: number) => {
  if (td.expected?.serialized != null) {
    test(`serialization ${idx}`, () => {
      const ser = td.state.asSerializable();

      expect(ser).toEqual(td.expected?.serialized);
    });
  }
};

const TEST_ID = 'LOCATION_STATE_42';
const allTypesParams: StateParamsMap = new Map<string, StateParamValue>([
  ['param1', null],
  ['param2', 2],
  ['param3', undefined],
  ['param4', '123'],
]);

describe('LocationState', () => {
  runTests([
    {
      state: LocationState.empty().setId(TEST_ID),
      expected: {
        serialized: {
          id: TEST_ID,
        },
      },
    },
    {
      state: LocationState.empty().setId(TEST_ID).setParams(allTypesParams),
      expected: {
        serialized: {
          id: TEST_ID,
          params: {
            param1: null,
            param2: 2,
            param3: null,
            param4: '123',
          },
        },
      },
    },
  ]);
});
