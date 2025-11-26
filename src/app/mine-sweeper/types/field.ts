import { computed, Signal, signal } from '@angular/core';
import { Mine, MineType } from './mine';
import { executeHintFnChain } from '../util/hint';
import { addMineConfig } from '../util/mineFn';
import { HintFnChain } from './hintFn';

export enum CellState {
  Flagged,
  Revealed,
  Hidden,
}

export type CellSymbol = number | MineType | 'flag' | '?' | null;

export class Cell {
  readonly coordinates: ReadonlyArray<number>;
  readonly hintChain: HintFnChain;
  private readonly removeFlaggedMine: Signal<boolean>;
  private readonly playing: Signal<boolean>;
  readonly mine = signal<Mine | null>(null);
  readonly adjacentCells = signal<Cell[]>([]);
  readonly hovered = signal(false);
  readonly state = signal<CellState>(CellState.Hidden);
  readonly isMine = computed(() => this.mine() !== null);
  readonly isFlagged = computed(() => this.state() === CellState.Flagged);
  readonly isRevealed = computed(() => this.state() === CellState.Revealed);
  readonly isHidden = computed(() => this.state() === CellState.Hidden);
  readonly revealedNeighbors = computed(() =>
    this.adjacentCells().filter((cell) => cell.isRevealed())
  );
  readonly hiddenNeighbors = computed(() => this.adjacentCells().filter((cell) => cell.isHidden()));
  readonly flaggedNeighbors = computed(() =>
    this.adjacentCells().filter((cell) => cell.isFlagged())
  );
  readonly adjacentMines = computed(() => this.adjacentCells().filter((cell) => cell.isMine()));
  readonly hint = computed(() => {
    const sum = executeHintFnChain(this.hintChain, this.adjacentCells(), this.coordinates);
    if (typeof sum === 'object' && sum !== null) {
      if (this.removeFlaggedMine()) {
        const flaggedMinesConf = executeHintFnChain(
          this.hintChain,
          this.flaggedNeighbors(),
          this.coordinates
        );
        return typeof flaggedMinesConf == 'object' && flaggedMinesConf !== null
          ? addMineConfig(sum, {
              number: -flaggedMinesConf.number,
              colorNumber: -flaggedMinesConf.colorNumber,
            })
          : sum;
      }
    }
    return sum;
  });
  readonly highlight = computed(() => this.adjacentCells().some((cell) => cell.hovered()));

  readonly symbol = computed<CellSymbol>(() => {
    if (this.isFlagged()) {
      return 'flag';
    }
    const mine = this.mine();
    if (!this.isRevealed()) {
      return !this.playing() && mine ? mine.type : null;
    }
    if (mine) {
      return mine.type;
    }
    const hint = this.hint();
    return typeof hint === 'object' && hint !== null ? hint.number : hint;
  });
  readonly color = computed(() => {
    const hint = this.hint();
    if (typeof hint === 'object' && hint !== null) {
      if (hint === null || (hint.number === 0 && hint.colorNumber === 0)) {
        return 'text-transparent';
      }
      switch (hint?.colorNumber) {
        case 1:
          return 'text-blue-600';
        case 2:
          return 'text-green-600';
        case 3:
          return 'text-red-600';
        case 4:
          return 'text-purple-600';
        case 5:
          return 'text-orange-600';
        case 6:
          return 'text-cyan-600';
        case 7:
          return 'text-gray-600';
        case 8:
          return 'text-black';
        default:
          return 'text-white';
      }
    }
    return 'text-gray-400';
  });
  readonly backgroundColor = computed(() => {
    const [playing, mine, revealed, flagged] = [
      this.playing(),
      this.isMine(),
      this.isRevealed(),
      this.isFlagged(),
    ];
    if (!playing) {
      if ((mine && revealed) || (flagged && !mine)) {
        return 'bg-red-700';
      }
      if (mine) {
        return 'bg-green-700';
      }
    }
    if (revealed) {
      return 'bg-gray-300';
    }
    return 'bg-gray-500';
  });
  readonly classes = computed(() => {
    const classes = ['border', 'border-gray-700'];
    if (this.highlight() && !this.hovered() && this.playing()) {
      classes.push('border-yellow-300');
    }
    if (this.hovered() && this.playing()) {
      classes.push('border-orange-600');
    }
    classes.push(this.backgroundColor());
    classes.push(this.color());
    if (this.playing() && !this.isRevealed()) {
      classes.push('cursor-pointer');
    }
    return classes;
  });

  constructor(
    coordinates: number[],
    hintChain: HintFnChain,
    removeFlaggedMine: Signal<boolean>,
    playing: Signal<boolean>
  ) {
    this.coordinates = coordinates;
    this.hintChain = hintChain;
    this.removeFlaggedMine = removeFlaggedMine;
    this.playing = playing;
  }
}

export type MineField = Cell | MineField[];
