import { Cell } from './field';

export enum MineType {
  REGULAR,
}

export type MineCalcFn = (coordinates: ReadonlyArray<number>, adjacentCells: Cell[]) => number;
