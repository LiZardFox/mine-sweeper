export type MineType = null | MineFn;

export type CreateMineFn = (coordinates: ReadonlyArray<number>) => MineFn;
export type MineFn = (neighborCoordinates: ReadonlyArray<number>) => MineConfig;
export type MineConfig = {
  number: number;
  colorNumber: number;
};
