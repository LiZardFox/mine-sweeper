import { computed, signal } from '@angular/core';

export class Field {
  readonly isMine = signal(false);
  readonly isRevealed = signal(false);
  readonly isFlagged = signal(false);
  readonly adjacentFields = signal<Field[]>([]);
  readonly hovered = signal(false);
  readonly revealedNeighbors = computed(() =>
    this.adjacentFields().filter((field) => field.isRevealed()),
  );
  readonly untouchedNeighbors = computed(() =>
    this.adjacentFields().filter(
      (field) => !field.isRevealed() && !field.isFlagged(),
    ),
  );
  readonly unrevealedNeighbors = computed(() =>
    this.adjacentFields().filter((field) => !field.isRevealed()),
  );
  readonly flaggedNeighbors = computed(() =>
    this.adjacentFields().filter((field) => field.isFlagged()),
  );
  readonly adjacentMines = computed(
    () => this.adjacentFields().filter((field) => field.isMine()).length,
  );
  readonly highlight = computed(() =>
    this.adjacentFields().some((field) => field.hovered()),
  );
}

export type MineField = Field | MineField[];
