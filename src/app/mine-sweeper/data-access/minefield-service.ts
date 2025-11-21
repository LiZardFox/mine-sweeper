import { computed, effect, Injectable, signal } from '@angular/core';
import { MineFieldConfiguration } from '../types/minefield-configuration';
import { Field, MineField } from '../types/field';
import { GameState } from '../types/game-state';
import { calculateDenityForDimensions } from '../util/calculate-density';
import { filter, fromEvent } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MinefieldService {
  readonly #minesPlaced = signal(false);
  readonly #dimensions = signal<number[]>([]);
  readonly #wrap = signal<boolean[]>([]);
  readonly #mines = signal(0);
  readonly #mineField = signal<MineField | null>(null);
  readonly #gameState = signal<GameState>('notStarted');
  readonly #time = signal<{ start: number; end: number | null } | null>(null);

  readonly initLazily = signal(true);

  readonly dimensions = this.#dimensions.asReadonly();
  readonly wrap = this.#wrap.asReadonly();
  readonly mines = this.#mines.asReadonly();
  readonly mineField = this.#mineField.asReadonly();
  readonly time = this.#time.asReadonly();
  readonly width = computed(() =>
    [...this.#dimensions()].reverse().reduce((acc, val, index) => {
      if (index % 2 === 0) {
        return acc * val;
      }
      return acc;
    }, 1)
  );
  readonly height = computed(() =>
    [...this.#dimensions()].reverse().reduce((acc, val, index) => {
      if (index % 2 === 1) {
        return acc * val;
      }
      return acc;
    }, 1)
  );
  readonly flattendMinefield = computed(() => this.flattenMinefield(this.#mineField() || []));
  readonly minesLeft = computed(() => {
    const flaggedCount = this.flaggedFields().length;
    return this.#mines() - flaggedCount;
  });
  readonly unrevealedFields = computed(() => {
    const fields = this.flattendMinefield();
    return fields.filter((field) => !field.isRevealed());
  });
  readonly flaggedFields = computed(() => {
    const fields = this.flattendMinefield();
    return fields.filter((field) => field.isFlagged());
  });
  readonly remainingFields = computed(() => {
    const fields = this.flattendMinefield();
    return fields.filter((field) => !field.isRevealed() && !field.isFlagged());
  });
  readonly started = computed(() => this.#gameState() !== 'notStarted');
  readonly playing = computed(() => this.#gameState() === 'inProgress');
  readonly win = computed(() => this.#gameState() === 'won');
  readonly lose = computed(() => this.#gameState() === 'lost');
  readonly paused = computed(() => this.#gameState() === 'paused');

  readonly preDefinedMinefields: ReadonlyArray<MineFieldConfiguration> = [
    { dimensions: [8, 8], mines: 10 },
    { dimensions: [16, 16], mines: 40 },
    { dimensions: [16, 30], mines: 99 },
    { dimensions: [3, 3, 3], mines: 5 },
    { dimensions: [3, 3, 3, 3], mines: 15 },
    {
      mines: 15,
      dimensions: [3, 3, 3, 3, 3, 3],
    },
  ] as const;

  setConfiguration(configuration: MineFieldConfiguration) {
    try {
      this.validateConfiguration(configuration);
    } catch (error) {
      alert((error as Error).message);
      return;
    }
    this.#mines.set(configuration.mines);
    const wrapConfig = configuration.wrap ?? [];
    const wrapSettings = configuration.dimensions.map((_, index) => wrapConfig[index] ?? false);
    this.#dimensions.set(configuration.dimensions.reverse());
    this.#wrap.set(wrapSettings.reverse());
  }

  startNewGame() {
    const minefield = this.createEmptyMinefield(this.#dimensions(), this.#wrap());
    this.#minesPlaced.set(false);
    if (!this.initLazily()) {
      this.plantMines(minefield, this.#mines());
      this.#minesPlaced.set(true);
    }
    this.#mineField.set(minefield);
    this.#gameState.set('inProgress');
    this.#time.set({ start: Date.now(), end: null });
  }

  evaluateFieldClick(field: Field) {
    if (!this.playing || field.isFlagged()) {
      return;
    }
    if (field.isRevealed()) {
      if (field.adjacentMines() === field.flaggedNeighbors().length) {
        const untouchedNeighbors = field.untouchedNeighbors();
        untouchedNeighbors.forEach((f) => this.evaluateFieldClick(f));
      }
      return;
    }
    field.isRevealed.set(true);
    if (!this.#minesPlaced()) {
      const minefield = this.#mineField();
      if (minefield) {
        this.plantMines(minefield, this.#mines());
        this.#minesPlaced.set(true);
      }
    }
    if (!field.isMine() && field.adjacentMines() === 0) {
      this.zeroSpread(field);
    }
    if (field.isMine()) {
      this.gameLost();
      return;
    }
  }

  evaluateFieldFlag(field: Field) {
    if (!this.playing()) {
      return;
    }
    if (field.isRevealed()) {
      const unrevealedNeighbors = field.unrevealedNeighbors();
      if (field.adjacentMines() === unrevealedNeighbors.length) {
        unrevealedNeighbors.filter((f) => !f.isFlagged()).forEach((f) => this.evaluateFieldFlag(f));
      }
      return;
    }
    field.isFlagged.set(!field.isFlagged());
  }

  zeroSpread(field: Field) {
    const queue: Field[] = [field];
    const visited = new Set<Field>();
    while (queue.length > 0) {
      const currentField = queue.shift()!;
      visited.add(currentField);
      currentField.untouchedNeighbors().forEach((neighbor) => {
        if (!visited.has(neighbor) && !neighbor.isMine()) {
          neighbor.isRevealed.set(true);
          if (neighbor.adjacentMines() === 0) {
            queue.push(neighbor);
          }
        }
      });
    }
  }

  constructor() {
    this.setConfiguration(this.preDefinedMinefields[0]);
    fromEvent(document, 'keydown')
      .pipe(
        filter(
          (event) =>
            event instanceof KeyboardEvent &&
            (event.key === 'p' || event.key === 'P' || event.key === 'Escape')
        )
      )
      .subscribe(() => {
        if (this.playing()) {
          this.#gameState.set('paused');
        } else if (this.paused()) {
          this.#gameState.set('inProgress');
        }
      });

    effect(() => {
      if (this.#gameState() === 'inProgress') {
        const [mines, unrevealedFields] = [this.#mines(), this.unrevealedFields().length];
        if (mines === unrevealedFields) {
          this.gameWon();
        }
      }
    });
  }

  private gameWon() {
    this.#gameState.set('won');
    this.gameComplete();
  }

  private gameLost() {
    this.#gameState.set('lost');
    this.gameComplete();
  }

  private gameComplete() {
    this.#time.update((t) => {
      if (t) {
        return { ...t, end: Date.now() };
      }
      return t;
    });
  }

  private validateConfiguration(configuration: MineFieldConfiguration) {
    const totalCells = configuration.dimensions.reduce((acc, val) => acc * val, 1);
    if (configuration.dimensions.length > 6) {
      throw new Error(
        `Too many dimensions: ${configuration.dimensions.length}. Maximum allowed is ${6}.`
      );
    }
    const density = configuration.mines / totalCells;
    const densityConstraints = calculateDenityForDimensions(configuration.dimensions);
    if (density > densityConstraints.max) {
      throw new Error(
        `Mine density too high: ${density.toFixed(2)}. Maximum allowed is ${
          densityConstraints.max
        }.`
      );
    } else if (density < densityConstraints.min) {
      throw new Error(
        `Mine density too low: ${density.toFixed(2)}. Minimum allowed is ${densityConstraints.min}.`
      );
    }
    if ((configuration.wrap?.length || 0) > configuration.dimensions.length) {
      throw new Error(`Wrap configuration dimensions exceed field dimensions.`);
    }
  }

  private plantMines(minefield: MineField, mineCount: number): void {
    let flatEmptyFields = this.flattenMinefield(minefield);
    for (let i = 0; i < mineCount; i++) {
      flatEmptyFields = flatEmptyFields.filter((field) => !field.isMine() && !field.isRevealed());
      if (flatEmptyFields.length === 0) {
        throw new Error('Not enough empty fields to plant all mines.');
      }
      const randomIndex = Math.floor(Math.random() * flatEmptyFields.length);
      const fieldToPlant = flatEmptyFields[randomIndex];
      fieldToPlant.isMine.set(true);
    }
  }

  private createEmptyMinefield(dimensions: number[], wrap: boolean[] = []): MineField {
    wrap = dimensions.map((_, index) => wrap[index] ?? false);
    const createField = (dims: number[], dimIndex: number): any => {
      const size = dims[dimIndex];
      const isLastDimension = dimIndex === dims.length - 1;
      const fieldArray = new Array(size);
      for (let i = 0; i < size; i++) {
        fieldArray[i] = isLastDimension ? new Field() : createField(dims, dimIndex + 1);
      }
      return fieldArray;
    };
    const minefield = createField(dimensions, 0);
    this.linkAdjacentFields(minefield, dimensions, wrap);
    return minefield;
  }
  private linkAdjacentFields(minefield: MineField, dimensions: number[], wrap: boolean[]): void {
    const linkFields = (currentField: any, coords: number[], dimIndex: number) => {
      if (dimIndex === dimensions.length) {
        const field = currentField as Field;
        const adjacentCoords = this.getAdjacentCoordinates(coords, dimensions, wrap);
        for (const adjCoords of adjacentCoords) {
          let adjacentField: any = minefield;
          for (const index of adjCoords) {
            adjacentField = adjacentField[index];
          }
          field.adjacentFields.update((v) => [...v, adjacentField as Field]);
        }
        return;
      }
      for (let i = 0; i < dimensions[dimIndex]; i++) {
        linkFields(currentField[i], [...coords, i], dimIndex + 1);
      }
    };
    linkFields(minefield, [], 0);
  }

  private getAdjacentCoordinates(
    coords: number[],
    dimensions: number[],
    wrap: boolean[]
  ): number[][] {
    const deltas = [-1, 0, 1];
    const adjacentCoords: number[][] = [];
    const generateCoords = (currentCoords: number[], dimIndex: number) => {
      if (dimIndex === dimensions.length) {
        if (!currentCoords.every((val, index) => val === coords[index])) {
          adjacentCoords.push(currentCoords);
        }
        return;
      }
      for (const delta of deltas) {
        let newCoord = coords[dimIndex] + delta;
        if (wrap[dimIndex]) {
          newCoord = (newCoord + dimensions[dimIndex]) % dimensions[dimIndex];
        } else if (newCoord < 0 || newCoord >= dimensions[dimIndex]) {
          continue;
        }
        generateCoords([...currentCoords, newCoord], dimIndex + 1);
      }
    };
    generateCoords([], 0);
    return adjacentCoords;
  }

  private flattenMinefield(minefield: MineField): Field[] {
    const flatList: Field[] = [];
    const flatten = (currentField: MineField) => {
      if (currentField instanceof Field) {
        flatList.push(currentField);
      } else {
        for (const subField of currentField) {
          flatten(subField);
        }
      }
    };
    flatten(minefield);
    return flatList;
  }
}
