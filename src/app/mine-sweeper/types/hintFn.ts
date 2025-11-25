import { Cell } from './field';
import { MineConfig } from './mine';

export type HintFn = (
  adjacentCells: Cell[],
  coordinates: ReadonlyArray<number>
) => MineConfig | null;
