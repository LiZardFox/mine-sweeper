import { Component, computed, inject, input, output } from '@angular/core';
import { Cell, MineField } from '../types/field';
import { MinefieldService } from '../data-access/minefield-service';

@Component({
  selector: 'minesweeper-cell',
  template: `
    @if (cell(); as cell) {
    <div class="w-8 h-8 flex items-center justify-center" [class]="cell.classes()">
      <span class="font-bold">{{ cell.symbol() }}</span>
    </div>
    }
  `,
  host: {
    '(click)': 'mfs.evaluateCellClick(cell())',
    '(contextmenu)': 'mfs.evaluateCellFlag(cell()); $event.preventDefault()',
    '(mouseenter)': 'cell().hovered.set(true)',
    '(mouseleave)': 'cell().hovered.set(false)',
  },
})
export class CellComponent {
  cell = input.required<Cell>();
  mfs = inject(MinefieldService);
}

@Component({
  selector: 'minesweeper-minefield-dimension',
  imports: [CellComponent],
  template: `
    <div
      class="flex"
      [class.flex-col]="!horizontal()"
      [class.flex-row]="horizontal()"
      [class]="gap()"
    >
      @for (subDimension of subDimensions(); track subDimension) {
      <minesweeper-minefield-dimension [minefield]="subDimension" [dimension]="dimension() - 1" />
      } @if (dimension() === 0) { @for (field of fields(); track field) {
      <minesweeper-cell [cell]="field" />
      } }
    </div>
  `,
})
export class MinefieldDimensionComponent {
  minefield = input.required<MineField>();
  dimension = input.required<number>();
  subDimensions = computed(() => {
    if (this.dimension() === 0) {
      return [];
    }
    return this.minefield() as MineField[];
  });
  fields = computed(() => {
    if (this.dimension() !== 0) {
      return [];
    }
    return this.minefield() as Cell[];
  });
  horizontal = computed(() => this.dimension() % 2 === 0);
  gap = computed(() => {
    let d = this.dimension();
    let g = 0;
    while (d > 1) {
      g += 1;
      d -= 2;
    }
    return `gap-${g}`;
  });
}

@Component({
  selector: 'minesweeper-minefield',
  template: `
    @if (minefieldService.mineField(); as minefield) {
    <div class="flex flex-col gap-1 select-none">
      <minesweeper-minefield-dimension
        [minefield]="minefield"
        [dimension]="minefieldService.dimensions().length - 1"
      />
    </div>
    }
  `,
  imports: [MinefieldDimensionComponent],
})
export class MineFieldComponent {
  minefieldService = inject(MinefieldService);
}
