import { Cell } from '../types/field';
import { HintFn, HintFnChain } from '../types/hintFn';
import { MineConfig } from '../types/mine';
import { addMineConfig, configFromNumber } from './mineFn';

export const executeHintFnChain = (
  hintFnChain: HintFnChain,
  adjacentCells: ReadonlyArray<Cell>,
  coordinates: ReadonlyArray<number>
): MineConfig | null | '?' => {
  let currentChain: HintFnChain | null = hintFnChain;
  let result: MineConfig | null | '?' = null;
  while (currentChain) {
    result = currentChain.fn(adjacentCells, coordinates, result);
    currentChain = currentChain.next || null;
  }
  return result;
};

export const sumMines: HintFn = (adjacentCells, coordinates) => {
  return adjacentCells.reduce((acc, val) => {
    const mineType = val.mine();
    return mineType ? addMineConfig(acc, mineType.fn(coordinates)) : acc;
  }, configFromNumber(0));
};

export const liar =
  (lieIndividualy = false): HintFn =>
  (adjacentCells, _, sum) => {
    if (adjacentCells.every((cell) => !cell.isMine())) {
      return null;
    }
    if (sum == null || sum === '?') {
      return sum;
    }
    const delta = [-1, 1];
    const offset = () => delta[Math.floor(Math.random() * delta.length)];
    const randomOffset: MineConfig = lieIndividualy
      ? {
          number: sum.number === 0 ? 1 : offset(),
          colorNumber: sum.colorNumber === 0 ? 1 : offset(),
        }
      : configFromNumber(sum.number === 0 ? 1 : offset());
    return sum == null ? null : addMineConfig(sum, randomOffset);
  };
