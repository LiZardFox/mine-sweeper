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
  regular: { type: MineType.REGULAR, fn: regular },
  big: { type: MineType.BIG, fn: big },
  cardinal: { type: MineType.CARDINAL, fn: cardinal },
  diagonal: { type: MineType.DIAGONAL, fn: diagonal },
  number: { type: MineType.NUMBER, fn: numberMine },
  color: { type: MineType.COLOR, fn: colorMine },
} as const;
