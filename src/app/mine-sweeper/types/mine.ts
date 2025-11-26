export type Mine = null | {
  fn: MineFn;
  type: MineType;
};

export enum MineType {
  REGULAR = 'regular',
  BIG = 'big',
  CARDINAL = 'cardinal',
  DIAGONAL = 'diagonal',
  NUMBER = 'number',
  COLOR = 'color',
}

export type CreateMineFn = (coordinates: ReadonlyArray<number>) => MineFn;
export type MineFn = (neighborCoordinates: ReadonlyArray<number>) => MineConfig | number;
export type MineConfig = {
  number: number;
  colorNumber: number;
};
