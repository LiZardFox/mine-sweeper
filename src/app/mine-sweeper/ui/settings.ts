import { Component, effect, inject, signal } from '@angular/core';
import { MinefieldService } from '../data-access/minefield-service';
import { MinefieldSettings, settingsSchema } from '../types/minefield-settings';
import { Field, form, submit } from '@angular/forms/signals';
import { FormError } from './form-error';
import { MineFieldConfiguration } from '../types/minefield-configuration';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'minesweeper-settings',
  template: `
    <div class="bg-gray-700 p-6 rounded shadow-lg flex flex-col gap-4">
      <h2 class="text-2xl font-bold mb-4">Mine Sweeper Settings</h2>
      <div class="flex flex-row gap-4">
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
        <label>Lazy Initialization:</label>
        <input type="checkbox" [field]="settingsForm.lazyInit" />
        <form-error [fieldRef]="settingsForm.lazyInit()"></form-error>
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
  });
  readonly settingsForm = form(this.settings, settingsSchema);
  constructor() {
    effect(() => {
      const [dimensions, wrap, mines, lazyInit] = [
        [...this.mfs.dimensions()].reverse(),
        [...this.mfs.wrap()].reverse(),
        this.mfs.mines(),
        this.mfs.initLazily(),
      ];
      this.settings.set({
        dimensions: dimensions.map((size, idx) => ({ size, wrap: wrap[idx] })),
        mines,
        lazyInit,
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
  }
}
