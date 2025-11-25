import { HintFn } from '../types/hintFn';
import { MineConfig } from '../types/mine';
import { addMineConfig, configFromNumber } from './mineFn';

export const mineSum: HintFn = (adjacentCells, coordinates) => {
  return adjacentCells.reduce((acc, val) => {
    const mineType = val.mineType();
    return mineType ? addMineConfig(acc, mineType(coordinates)) : acc;
  }, configFromNumber(0));
};

export const liar: HintFn = (adjacentCells, coordinates) => {
  const sum = mineSum(adjacentCells, coordinates);
  const delta = [-1, 1];
  const offset = delta[Math.floor(Math.random() * delta.length)];
  const randomOffset: MineConfig = {
    number: sum?.number === 0 ? 1 : offset,
    colorNumber: sum?.colorNumber === 0 ? 1 : offset,
  };
  return sum == null ? null : addMineConfig(sum, randomOffset);
};
