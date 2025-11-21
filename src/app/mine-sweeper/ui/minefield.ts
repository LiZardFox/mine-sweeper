import { Component, computed, inject, input, output } from '@angular/core';
import { Field, MineField } from '../types/field';
import { MinefieldService } from '../data-access/minefield-service';
import { GameState } from '../types/game-state';

@Component({
  selector: 'minesweeper-adjacent-mines',
  template: `
    @if (mines(); as mines) {
    <span>{{ mines }}</span>
    }
  `,
  host: {
    class: 'font-bold',
    '[class]': 'color()',
  },
})
export class AdjacentMinesDirective {
  mines = input.required<number>();
  color = computed(() => {
    switch (this.mines()) {
      case 1:
        return 'text-blue-500';
      case 2:
        return 'text-green-600';
      case 3:
        return 'text-red-500';
      case 4:
        return 'text-purple-500';
      case 5:
        return 'text-orange-500';
      case 6:
        return 'text-cyan-600';
      case 7:
        return 'text-gray-500';
      case 8:
        return 'text-black';
      default:
        return 'text-white';
    }
  });
}

@Component({
  selector: 'minesweeper-field',
  template: `
    @if (field(); as field) {
    <div
      class="border border-gray-700 w-8 h-8 flex items-center justify-center"
      [class.border-yellow-300]="field.highlight() && !field.hovered() && mfs.playing()"
      [class.border-orange-500]="field.hovered() && mfs.playing()"
      [class.bg-gray-500]="!field.isRevealed()"
      [class.bg-gray-400]="field.isRevealed()"
      [class.bg-green-700]="!mfs.playing() && field.isMine()"
      [class.bg-red-700]="
        !mfs.playing() &&
        ((field.isMine() && field.isRevealed()) || (field.isFlagged() && !field.isMine()))
      "
    >
      @if (field.isRevealed()) { @if (field.isMine()) {
      <span>💣</span>
      } @else {
      <minesweeper-adjacent-mines [mines]="field.adjacentMines()" />
      } } @else if (field.isFlagged()) {
      <span>🚩</span>
      } @else if (!mfs.playing() && field.isMine()) { @if (field.isFlagged()) {
      <span>🚩</span>
      } @else {
      <span>💣</span>
      } }
    </div>
    }
  `,
  host: {
    '(click)': 'mfs.evaluateFieldClick(field())',
    '(contextmenu)': 'mfs.evaluateFieldFlag(field()); $event.preventDefault()',
    '(mouseenter)': 'field().hovered.set(true)',
    '(mouseleave)': 'field().hovered.set(false)',
    '[class.cursor-pointer]': 'mfs.playing() && !field().isRevealed()',
  },
  imports: [AdjacentMinesDirective],
})
export class FieldComponent {
  field = input.required<Field>();
  mfs = inject(MinefieldService);
}

@Component({
  selector: 'minesweeper-minefield-dimension',
  imports: [FieldComponent],
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
      <minesweeper-field [field]="field" />
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
    return this.minefield() as Field[];
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
