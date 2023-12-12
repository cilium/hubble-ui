export const numberWithCommas = (x: string | number): string => {
  const str = x.toString();
  const len = str.length;
  const commaIndex = len % 3;
  let formatted = '';
  for (let i = 0; i < len; i++) {
    if (i > 0 && i % 3 === commaIndex) {
      formatted += ',';
    }
    formatted += str[i];
  }
  return formatted;
};

export enum Units {
  BytesMetric = 'bytes-metric', // NOTE: Use 10^n factors
  BytesIEC = 'bytes-iec', // NOTE: Use 2^n factors
  Metric = 'metric',
}

// NOTE: The code below was taken from Stackoverflow with a little refactor
// NOTE: to exploit TypeScript advantages and decomposition
export const metricByteUnits = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
export const iecByteUnits = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
export const metricUnits = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];

export const toHumanString = (
  num: number,
  unit: Units = Units.Metric,
  nFloatDigits = 2,
): string => {
  const thresh = unit === Units.BytesIEC ? 1024 : 1000;
  const units =
    unit === Units.BytesMetric
      ? metricByteUnits
      : unit === Units.BytesIEC
        ? iecByteUnits
        : metricUnits;

  return toCustomUnitsString(num, thresh, units, nFloatDigits);
};

export const toCustomUnitsString = (
  num: number,
  thresh: number,
  units: string[],
  nFloatDigits = 2,
): string => {
  if (Math.abs(num) < thresh) return num + ` ${units[0]}`;
  const r = Math.pow(10, nFloatDigits);
  let unitIdx = 0;

  do {
    num /= thresh;
    ++unitIdx;
  } while (Math.round(Math.abs(num) * r) / r >= thresh && unitIdx < units.length - 1);

  const unitPostfix = units[unitIdx];
  const fixedNum = num.toFixed(nFloatDigits);

  if (unitPostfix.length > 0) return `${fixedNum} ${unitPostfix}`;
  return fixedNum;
};
