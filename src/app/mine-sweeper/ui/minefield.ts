import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Cell, CellSymbol, MineField } from '../types/field';
import { MinefieldService } from '../data-access/minefield-service';
import { MineType } from '../types/mine';

@Component({
  selector: 'minesweeper-cell-mine-icon',
  template: `
    @if (mineType(); as type) { @switch (type) { @case (MineType.REGULAR) {
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-5 w-5 text-black"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2" fill="black" />
    </svg>
    } @case (MineType.BIG) {
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-6 w-6 text-black"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <circle cx="12" cy="12" r="7" stroke="currentColor" stroke-width="2" fill="black" />
    </svg>
    } @case (MineType.CARDINAL) {
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-5 w-5 text-black"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2v20m10-10H2" />
    </svg>
    } @case (MineType.DIAGONAL) {
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-5 w-5 text-black"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M3 3l18 18M21 3L3 21"
      />
    </svg>
    } @case (MineType.NUMBER) {
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-5 w-5 text-black"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <text x="12" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="black">
        #
      </text>
    </svg>
    } @case (MineType.COLOR) {
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-5 w-5 color-mine"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <circle cx="12" cy="12" r="7" stroke-width="0" fill="red">
        <animate
          attributeName="fill"
          values="red;orange;yellow;green;blue;indigo;red"
          dur="5s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
    } } }
  `,
  styles: [],
})
export class CellMineIconComponent {
  protected readonly MineType = MineType;
  readonly mineType = input.required<MineType>();
}

@Component({
  selector: 'minesweeper-cell-content',
  template: `
    @let symbol = cellSymbol(); @if (symbol === 'flag') {<svg
      class="h-5 w-5"
      viewBox="-2.4 -2.4 28.80 28.80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="#000000"
    >
      <g id="SVGRepo_iconCarrier">
        <path
          d="M4 15C4 15 5 14 8 14C11 14 13 16 16 16C19 16 20 15 20 15V4C20 4 19 5 16 5C13 5 11 3 8 3C5 3 4 4 4 4M4 22L4 2"
          stroke="#000000"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          fill="#FF0000"
        ></path>
      </g>
    </svg>
    } @else if(isMineType(symbol)){
    <minesweeper-cell-mine-icon [mineType]="symbol" />
    }@else{
    <span>{{ symbol }}</span>
    }
  `,
  host: {
    class: 'font-bold',
  },
  imports: [CellMineIconComponent],
})
export class CellContentComponent {
  readonly cellSymbol = input.required<CellSymbol>();
  isMineType(symbol: CellSymbol): symbol is MineType {
    return Object.values(MineType).includes(symbol as MineType);
  }
}

@Component({
  selector: 'minesweeper-cell',
  template: `
    @if (cell(); as cell) {
    <div class="w-8 h-8 flex items-center justify-center" [class]="cell.classes()">
      <minesweeper-cell-content [cellSymbol]="cell.symbol()" />
    </div>
    }
  `,
  host: {
    '(click)': 'mfs.evaluateCellClick(cell())',
    '(contextmenu)': 'mfs.evaluateCellFlag(cell()); $event.preventDefault()',
    '(mouseenter)': 'cell().hovered.set(true)',
    '(mouseleave)': 'cell().hovered.set(false)',
  },
  imports: [CellContentComponent],
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
  readonly gaps = ['gap-0', 'gap-2', 'gap-6', 'gap-12', 'gap-20'];
  gap = computed(() => {
    let d = this.dimension();
    let g = 0;
    while (d > 1) {
      g += 1;
      d -= 2;
    }
    return this.gaps[Math.min(g, this.gaps.length - 1)];
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
  host: {
    '[style]': 'zoom()',
    '(wheel)': 'onZoom($event)',
  },
  imports: [MinefieldDimensionComponent],
})
export class MineFieldComponent {
  minefieldService = inject(MinefieldService);
  zoomLevel = signal(1);
  zoom = computed(
    () => `--spacing: ${(5 / this.minefieldService.height()) * this.zoomLevel()}rem;`
  );
  onZoom(event: WheelEvent) {
    if (!event.ctrlKey) return;
    event.preventDefault();
    event.stopPropagation();
    const delta = Math.sign(event.deltaY);
    this.zoomLevel.update((level) => {
      let newLevel = level - delta * 0.1;
      newLevel = Math.min(Math.max(newLevel, 0.5), 3);
      return newLevel;
    });
  }
}
