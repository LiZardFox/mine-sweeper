import { Cell } from './field';
import { MineConfig } from './mine';

export type HintFn = (
  adjacentCells: ReadonlyArray<Cell>,
  coordinates: ReadonlyArray<number>,
  prev: MineConfig | null | '?'
) => MineConfig | null | '?';

export type HintFnChain = {
  fn: HintFn;
  next?: HintFnChain | null;
};
