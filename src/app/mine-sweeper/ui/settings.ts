import { Component, effect, inject, model, signal } from '@angular/core';
import { MinefieldService } from '../data-access/minefield-service';
import { MinefieldSettings, settingsSchema } from '../types/minefield-settings';
import { Field, form, submit } from '@angular/forms/signals';
import { FormError } from './form-error';
import { MineFieldConfiguration } from '../types/minefield-configuration';
import { Mines } from '../util/mineFn';

@Component({
  selector: 'minesweeper-settings',
  template: `
    <div class="bg-gray-700 p-6 rounded shadow-lg flex flex-col gap-4">
      <h2 class="text-2xl font-bold mb-4">Mine Sweeper Settings</h2>
      <div class="flex flex-row gap-4">
        <button (click)="addDimension(5, false)">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 text-green-500 hover:text-green-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
        @for (dimension of settingsForm.dimensions; track $index) {
        <div class="flex-auto flex flex-col items-center gap-2">
          <input
            class="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
             block py-2 mt-2 text-gray-200 bg-gray-600 border border-gray-700 rounded-md focus:border-blue-500 focus:outline-none focus:ring text-end"
            type="number"
            [field]="dimension.size"
          />
          <form-error [fieldRef]="dimension.size()"></form-error>
          <label>
            <input type="checkbox" [field]="dimension.wrap" />
            Wrap
          </label>
          <form-error [fieldRef]="dimension.wrap()"></form-error>
          <button (click)="removeDimension($index)">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 text-red-500 hover:text-red-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        @if(!$last) {
        <span class="self-center">x</span>
        } }
      </div>
      <div>
        <label>Number of Mines:</label>
        <input
          type="number"
          class="block w-full py-2 mt-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none focus:ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          [field]="settingsForm.mines"
        />
        <div class="max-w-xl mx-auto">
          <input
            [field]="settingsForm.mines"
            id="range"
            type="range"
            class="block w-full py-2 mt-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none focus:ring"
          />
        </div>
        <form-error [fieldRef]="settingsForm.mines()"></form-error>
      </div>
      <div>
        <label>Mines to Place:</label>
        <div
          class="flex flex-col gap-2 max-h-48 overflow-y-auto border border-gray-600 p-2 rounded"
        >
          @for (mine of mines; track mine.type) {
          <div
            class="flex items-center justify-between gap-2"
            [class.bg-gray-600]="!mineSelected(mine.type)"
            [class.bg-green-600]="mineSelected(mine.type)"
            (click)="mineSelected(mine.type) ? removeMine(mine.type) : selectMine(mine.type)"
            class="cursor-pointer p-2 rounded"
          >
            <span>{{ mine.name }}</span>
          </div>
          }
        </div>
        <form-error [fieldRef]="settingsForm.minesToPlace()"></form-error>
      </div>
      <div>
        <label>Lazy Initialization:</label>
        <input type="checkbox" [field]="settingsForm.lazyInit" />
        <form-error [fieldRef]="settingsForm.lazyInit()"></form-error>
      </div>
      <div>
        <label>Chording</label>
        <input type="checkbox" [field]="settingsForm.chording" />
        <form-error [fieldRef]="settingsForm.chording()"></form-error>
      </div>
      <div>
        <label>Fail on Wrong Flag</label>
        <input type="checkbox" [field]="settingsForm.failOnWrongFlag" />
        <form-error [fieldRef]="settingsForm.failOnWrongFlag()"></form-error>
      </div>
      <button class="mt-4 px-4 py-2 bg-blue-500 text-white rounded" (click)="saveSettings()">
        New Game
      </button>
    </div>
  `,
  imports: [FormError, Field],
})
export class MineSweeperSettings {
  readonly mfs = inject(MinefieldService);
  readonly settings = signal<MinefieldSettings>({
    dimensions: [],
    mines: 0,
    lazyInit: false,
    minesToPlace: [],
    chording: false,
    failOnWrongFlag: false,
  });
  readonly settingsForm = form(this.settings, settingsSchema);
  readonly mines = Object.values(Mines);
  constructor() {
    effect(() => {
      const [dimensions, wrap, mines, lazyInit, minesToPlace, failOnWrongFlag, chording] = [
        [...this.mfs.dimensions()].reverse(),
        [...this.mfs.wrap()].reverse(),
        this.mfs.mines(),
        this.mfs.initLazily(),
        this.mfs.minesToPlace(),
        this.mfs.failOnWrongFlag(),
        this.mfs.chording(),
      ];
      this.settings.set({
        dimensions: dimensions.map((size, idx) => ({ size, wrap: wrap[idx] })),
        mines,
        lazyInit,
        minesToPlace,
        failOnWrongFlag,
        chording,
      });
    });
  }

  saveSettings() {
    submit(this.settingsForm, async () => {
      this.setValues();
      this.settingsForm().reset();
      this.mfs.startNewGame();
    });
  }
  setValues() {
    const settings = this.settings();
    const config: MineFieldConfiguration = {
      dimensions: settings.dimensions.map((d) => d.size),
      wrap: settings.dimensions.map((d) => d.wrap),
      mines: settings.mines,
    };
    this.mfs.setConfiguration(config);
    this.mfs.initLazily.set(settings.lazyInit);
    this.mfs.minesToPlace.set(settings.minesToPlace);
    this.mfs.failOnWrongFlag.set(settings.failOnWrongFlag);
    this.mfs.chording.set(settings.chording);
  }

  removeDimension(index: number) {
    this.settings.update((s) => {
      const dimensions = [...s.dimensions];
      dimensions.splice(index, 1);
      return { ...s, dimensions };
    });
  }

  addDimension(size: number, wrap: boolean) {
    this.settings.update((s) => ({
      ...s,
      dimensions: [...s.dimensions, { size, wrap }],
    }));
  }

  mineSelected(mineType: string): boolean {
    return this.settings().minesToPlace.some((m) => m.type === mineType);
  }

  removeMine(mineType: string) {
    this.settings.update((s) => ({
      ...s,
      minesToPlace: s.minesToPlace.filter((m) => m.type !== mineType),
    }));
  }

  selectMine(mineType: string) {
    this.settings.update((s) => ({
      ...s,
      minesToPlace: [...s.minesToPlace, this.mines.find((m) => m.type === mineType)!],
    }));
  }
}
