export type MineDef = {
  type: MineType;
  fn: CreateMineFn;
  name: string;
  description: string;
  hint?: HintType;
};

export type Mine = {
  type: MineType;
  fn: MineFn;
} | null;

export type HintType = 'color';
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
