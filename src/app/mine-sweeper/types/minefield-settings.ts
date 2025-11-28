import {
  apply,
  applyEach,
  customError,
  max,
  maxLength,
  min,
  minLength,
  schema,
  validate,
} from '@angular/forms/signals';
import { calculateDenityForDimensions } from '../util/calculate-density';
import { MineDef } from './mine';

export type MinefieldSettings = {
  dimensions: { size: number; wrap: boolean }[];
  mines: number;
  lazyInit: boolean;
  minesToPlace: MineDef[];
  chording: boolean;
  failOnWrongFlag: boolean;
};

export const settingsSchema = schema<MinefieldSettings>((path) => {
  apply(path.mines, (minesPath) => {
    min(
      minesPath,
      (ctx) => {
        const dimensions = ctx.valueOf(path.dimensions);
        const cells = dimensions.reduce((acc, dim) => acc * (dim.size > 0 ? dim.size : 1), 1);
        const density = calculateDenityForDimensions(dimensions.map((d) => d.size));
        return Math.ceil(cells * density.min);
      },
      { message: 'Number of mines too low minefield' }
    );
    max(
      minesPath,
      (ctx) => {
        const dimensions = ctx.valueOf(path.dimensions);
        const cells = dimensions.reduce((acc, dim) => acc * (dim.size > 0 ? dim.size : 1), 1);
        const density = calculateDenityForDimensions(dimensions.map((d) => d.size));
        return Math.floor(cells * density.max);
      },
      { message: 'Number of mines too high for minefield' }
    );
  });
  apply(path.minesToPlace, (minesPath) => {
    minLength(minesPath, 1, { message: 'At least one mine type must be selected' });
    validate(minesPath, (ctx) => {
      const mines = ctx.valueOf(path.minesToPlace);
      const uniquMines = new Set(mines.map((m) => m.type));
      return uniquMines.size === mines.length
        ? null
        : customError({ message: 'Duplicate mine types are not allowed', kind: 'unique-mines' });
    });
  });
  apply(path.dimensions, (dimPath) => {
    minLength(dimPath, 1, { message: 'At least one dimension is required' });
    maxLength(dimPath, 6, { message: 'You can set at most 6 Dimensions' });
    validate(dimPath, (ctx) => {
      const sizes = ctx.valueOf(path.dimensions).map((d) => d.size);
      return sizes.some((s) => s >= 3)
        ? null
        : customError({ message: 'At least one dimension must be size 3 or greater' });
    });
    applyEach(dimPath, (dimPath) => {
      min(dimPath.size, 1, { message: 'Dimension size must be at least 1' });
    });
  });
});
