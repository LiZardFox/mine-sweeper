import { CreateMineFn, MineConfig, MineFn, MineType } from '../types/mine';

export const addMineConfig = (a: MineConfig | number, b: MineConfig | number): MineConfig => {
  return typeof a === 'number' && typeof b === 'number'
    ? configFromNumber(a + b)
    : typeof a === 'number' && typeof b === 'object'
    ? {
        number: a + b.number,
        colorNumber: a + b.colorNumber,
      }
    : typeof b === 'number' && typeof a === 'object'
    ? {
        number: a.number + b,
        colorNumber: a.colorNumber + b,
      }
    : typeof a === 'object' && typeof b === 'object'
    ? {
        number: a.number + b.number,
        colorNumber: a.colorNumber + b.colorNumber,
      }
    : configFromNumber(0);
};
export const configFromNumber = (n: number): MineConfig => {
  return { number: n, colorNumber: n };
};

export const regular: MineFn = () => 1;
export const big: MineFn = () => 2;
export const cardinal: CreateMineFn = (coordinates) => {
  return (neighborCoordinates) => {
    const deltas = coordinates.map((coord, index) => neighborCoordinates[index] - coord);
    const isCardinal = deltas.some(
      (delta, index) => delta !== 0 && deltas.every((d, i) => i === index || d === 0)
    );
    return isCardinal ? 1 : 0;
  };
};
export const diagonal: CreateMineFn = (coordinates) => {
  return (neighborCoordinates) => {
    const deltas = coordinates.map((coord, index) => neighborCoordinates[index] - coord);
    const isDiagonal = deltas.every((delta) => delta !== 0);
    return isDiagonal ? 1 : 0;
  };
};
export const numberMine: MineFn = () => ({ number: 1, colorNumber: 0 });
export const colorMine: MineFn = () => ({ number: 0, colorNumber: 1 });

export const Mines = {
  regular: {
    type: MineType.REGULAR,
    fn: () => regular,
    name: 'Regular Mine',
    description: 'A standard mine that increases the mine count by 1.',
  },
  big: {
    type: MineType.BIG,
    fn: () => big,
    name: 'Big Mine',
    description: 'A big mine that increases the mine count by 2.',
  },
  cardinal: {
    type: MineType.CARDINAL,
    fn: cardinal,
    name: 'Cardinal Mine',
    description: 'A mine that affects only cardinal (N, S, E, W) neighbors.',
  },
  diagonal: {
    type: MineType.DIAGONAL,
    fn: diagonal,
    name: 'Diagonal Mine',
    description: 'A mine that affects only diagonal neighbors.',
  },
  number: {
    type: MineType.NUMBER,
    fn: () => numberMine,
    name: 'Number Mine',
    description: 'A mine that increases the numeric mine count by 1.',
  },
  color: {
    type: MineType.COLOR,
    fn: () => colorMine,
    name: 'Color Mine',
    description: 'A mine that increases the color mine count by 1.',
    hint: 'color',
  },
} as const;
