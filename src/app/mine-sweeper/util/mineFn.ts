import { CreateMineFn, MineConfig, MineFn } from '../types/mine';

export const addMineConfig = (a: MineConfig, b: MineConfig): MineConfig => {
  return {
    number: a.number + b.number,
    colorNumber: a.colorNumber + b.colorNumber,
  };
};
export const configFromNumber = (n: number): MineConfig => {
  return { number: n, colorNumber: n };
};

export const regular: MineFn = () => configFromNumber(1);
export const big: MineFn = () => configFromNumber(2);
export const cardinal: CreateMineFn = (coordinates) => {
  return (neighborCoordinates) => {
    const deltas = coordinates.map((coord, index) => neighborCoordinates[index] - coord);
    const isCardinal = deltas.some(
      (delta, index) => delta !== 0 && deltas.every((d, i) => i === index || d === 0)
    );
    return configFromNumber(isCardinal ? 1 : 0);
  };
};
export const diagonal: CreateMineFn = (coordinates) => {
  return (neighborCoordinates) => {
    const deltas = coordinates.map((coord, index) => neighborCoordinates[index] - coord);
    const isDiagonal = deltas.every((delta) => delta !== 0);
    return configFromNumber(isDiagonal ? 1 : 0);
  };
};
export const numberMine: MineFn = () => ({ number: 1, colorNumber: 0 });
export const colorMine: MineFn = () => ({ number: 0, colorNumber: 1 });

export const MineType = {
  regular,
  big,
  cardinal,
  diagonal,
  numberMine,
  colorMine,
};
