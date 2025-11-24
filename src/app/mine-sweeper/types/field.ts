import { computed, Signal, signal } from '@angular/core';

export enum FieldState {
  Flagged,
  Revealed,
  Hidden,
}

export class Field {
  readonly coordinates: ReadonlyArray<number>;
  readonly isMine = signal(false);
  readonly state = signal<FieldState>(FieldState.Hidden);
  readonly isFlagged = computed(() => this.state() === FieldState.Flagged);
  readonly isRevealed = computed(() => this.state() === FieldState.Revealed);
  readonly isHidden = computed(() => this.state() === FieldState.Hidden);
  readonly adjacentFields = signal<Field[]>([]);
  readonly hovered = signal(false);
  readonly revealedNeighbors = computed(() =>
    this.adjacentFields().filter((field) => field.isRevealed())
  );
  readonly hiddenNeighbors = computed(() =>
    this.adjacentFields().filter((field) => field.isHidden())
  );
  readonly flaggedNeighbors = computed(() =>
    this.adjacentFields().filter((field) => field.isFlagged())
  );
  readonly adjacentMines = computed(() => this.adjacentFields().filter((field) => field.isMine()));
  readonly hint = computed(() =>
    this.removeFlaggedMine()
      ? this.adjacentMines().length - this.flaggedNeighbors().length
      : this.adjacentMines().length
  );
  readonly highlight = computed(() => this.adjacentFields().some((field) => field.hovered()));

  readonly removeFlaggedMine: Signal<boolean>;

  constructor(coordinates: number[], options: { removeFlaggedMine: Signal<boolean> }) {
    this.coordinates = coordinates;
    this.removeFlaggedMine = options.removeFlaggedMine;
  }
}

export type MineField = Field | MineField[];
