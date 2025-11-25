import { computed, Signal, signal } from '@angular/core';
import { MineType } from './mine';
import { liar, mineSum } from '../util/modifiers';
import { addMineConfig, configFromNumber } from '../util/mineFn';

export enum CellState {
  Flagged,
  Revealed,
  Hidden,
}

export class Cell {
  readonly coordinates: ReadonlyArray<number>;
  private readonly removeFlaggedMine: Signal<boolean>;
  private readonly playing: Signal<boolean>;
  readonly mineType = signal<MineType | null>(null);
  readonly adjacentCells = signal<Cell[]>([]);
  readonly hovered = signal(false);
  readonly state = signal<CellState>(CellState.Hidden);
  readonly isMine = computed(() => this.mineType() !== null);
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
    const sum = liar(this.adjacentCells(), this.coordinates);
    return sum === null
      ? null
      : this.removeFlaggedMine()
      ? addMineConfig(sum, configFromNumber(-this.flaggedNeighbors().length))
      : sum;
  });
  readonly highlight = computed(() => this.adjacentCells().some((cell) => cell.hovered()));

  readonly symbol = computed(() => {
    if (this.isFlagged()) {
      return '🚩';
    }
    if (!this.isRevealed()) {
      return !this.playing() && this.isMine() ? '💣' : '';
    }
    if (this.isMine()) {
      return '💣';
    }
    const hint = this.hint();
    return hint === null ? '?' : hint.number.toString();
  });
  readonly color = computed(() => {
    const hint = this.hint();
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
        return hint === null
          ? 'text-gray-400'
          : hint.colorNumber < 0
          ? 'text-red-800'
          : 'text-white';
    }
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
    options: { removeFlaggedMine: Signal<boolean>; playing: Signal<boolean> }
  ) {
    this.coordinates = coordinates;
    this.removeFlaggedMine = options.removeFlaggedMine;
    this.playing = options.playing;
  }
}

export type MineField = Cell | MineField[];
