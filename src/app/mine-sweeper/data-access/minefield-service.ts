import { computed, effect, Injectable, signal } from '@angular/core';
import { MineFieldConfiguration } from '../types/minefield-configuration';
import { Cell, CellState, MineField } from '../types/field';
import { GameState } from '../types/game-state';
import { calculateDenityForDimensions } from '../util/calculate-density';
import { filter, fromEvent } from 'rxjs';
import { Mines } from '../util/mineFn';
import { Mine, MineDef } from '../types/mine';
import { sumMines } from '../util/hint';

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

  readonly failOnWrongFlag = signal(true);
  readonly removeFlaggedMines = signal(false);
  readonly initLazily = signal(true);
  readonly minesToPlace = signal<MineDef[]>([Mines.regular]);
  readonly chording = signal(true);

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
    const flaggedCount = this.flaggedCells().length;
    return this.#mines() - flaggedCount;
  });
  readonly unrevealedCells = computed(() => {
    const cells = this.flattendMinefield();
    return cells.filter((cell) => !cell.isRevealed());
  });
  readonly flaggedCells = computed(() => {
    const cells = this.flattendMinefield();
    return cells.filter((cell) => cell.isFlagged());
  });
  readonly remainingCells = computed(() => {
    const cells = this.flattendMinefield();
    return cells.filter((cell) => !cell.isRevealed() && !cell.isFlagged());
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
    { dimensions: [3, 3, 3, 3], mines: 10 },
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

  evaluateCellClick(cell: Cell) {
    if (!this.playing() || cell.isFlagged()) {
      return;
    }
    if (cell.isRevealed() && this.chording()) {
      if (cell.adjacentMines().length === cell.flaggedNeighbors().length) {
        const hiddenNeighbors = cell.hiddenNeighbors();
        hiddenNeighbors.forEach((f) => this.evaluateCellClick(f));
      }
      return;
    }
    cell.state.set(CellState.Revealed);
    if (!this.#minesPlaced()) {
      const minefield = this.#mineField();
      if (minefield) {
        this.plantMines(minefield, this.#mines());
        this.#minesPlaced.set(true);
      }
    }
    if (!cell.isMine() && cell.adjacentMines().length === 0) {
      this.zeroSpread(cell);
    }
    if (cell.isMine()) {
      this.gameLost();
      return;
    }
  }

  evaluateCellFlag(cell: Cell) {
    if (!this.playing()) {
      return;
    }
    if (cell.isRevealed()) {
      const hiddenNeighbors = cell.hiddenNeighbors();
      if (
        this.chording() &&
        cell.adjacentMines().length === hiddenNeighbors.length + cell.flaggedNeighbors().length
      ) {
        hiddenNeighbors.forEach((f) => this.evaluateCellFlag(f));
      }
      return;
    }
    cell.state.update((v) => (v === CellState.Hidden ? CellState.Flagged : CellState.Hidden));
    if (this.failOnWrongFlag() && !cell.isMine()) {
      this.gameLost();
      return;
    }
  }

  zeroSpread(cell: Cell) {
    const queue: Cell[] = [cell];
    const visited = new Set<Cell>();
    while (queue.length > 0) {
      const currentCell = queue.shift()!;
      visited.add(currentCell);
      currentCell.hiddenNeighbors().forEach((neighbor) => {
        if (!visited.has(neighbor) && !neighbor.isMine()) {
          neighbor.state.set(CellState.Revealed);
          if (neighbor.adjacentMines().length === 0) {
            queue.push(neighbor);
          }
        }
      });
    }
  }

  constructor() {
    this.setConfiguration(this.preDefinedMinefields[5]);
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
        const [mines, unrevealedFields] = [this.#mines(), this.unrevealedCells().length];
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
    console.log(configuration);

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
      fieldToPlant.mine.set(this.randomMine(fieldToPlant.coordinates));
    }
  }

  private randomMine(coordinates: ReadonlyArray<number>): Mine {
    const mines = this.minesToPlace();
    const randomIndex = Math.floor(Math.random() * mines.length);
    const mine = mines[randomIndex];
    if (!mine) {
      throw new Error('No mines available to plant.');
    }
    return { type: mine.type, fn: mine.fn(coordinates) };
  }

  private createEmptyMinefield(dimensions: number[], wrap: boolean[] = []): MineField {
    wrap = dimensions.map((_, index) => wrap[index] ?? false);
    const createField = (dims: number[], dimIndex: number, coordinates: number[] = []): any => {
      const size = dims[dimIndex];
      const isLastDimension = dimIndex === dims.length - 1;
      const fieldArray = new Array(size);
      for (let i = 0; i < size; i++) {
        isLastDimension;
        fieldArray[i] = isLastDimension
          ? new Cell(
              [...coordinates, i],
              {
                fn: sumMines,
              },
              this.removeFlaggedMines,
              this.playing
            )
          : createField(dims, dimIndex + 1, [...coordinates, i]);
      }
      return fieldArray;
    };
    const minefield = createField(dimensions, 0);
    this.linkAdjacentFields(minefield, dimensions, wrap);
    console.log('created the field', minefield);

    return minefield;
  }
  private linkAdjacentFields(minefield: MineField, dimensions: number[], wrap: boolean[]): void {
    const flatFields = this.flattenMinefield(minefield);
    const coordToCellMap = new Map<string, Cell>();
    flatFields.forEach((field) => {
      coordToCellMap.set(field.coordinates.join(','), field);
    });
    flatFields.forEach((field) => {
      const adjacentCoords = this.getAdjacentCoordinates(field.coordinates, dimensions, wrap);
      const adjacentCells: Cell[] = [];
      adjacentCoords.forEach((coords) => {
        const key = coords.join(',');
        const adjacentCell = coordToCellMap.get(key);
        if (adjacentCell) {
          adjacentCells.push(adjacentCell);
        }
      });
      field.adjacentCells.set(adjacentCells);
    });
  }

  private getAdjacentCoordinates(
    coords: Readonly<ReadonlyArray<number>>,
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

  private flattenMinefield(minefield: MineField): Cell[] {
    const flatList: Cell[] = [];
    const flatten = (currentCell: MineField) => {
      if (currentCell instanceof Cell) {
        flatList.push(currentCell);
      } else {
        for (const subField of currentCell) {
          flatten(subField);
        }
      }
    };
    flatten(minefield);
    return flatList;
  }
}
