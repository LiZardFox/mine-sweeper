import { Component, inject } from '@angular/core';
import { MinefieldService } from './data-access/minefield-service';
import { MineFieldComponent } from './ui/minefield';
import { Timer } from './ui/timer';
import { MineSweeperSettings } from './ui/settings';

@Component({
  selector: 'mine-sweeper-game',
  template: `
    <div class="top-0 bottom-0 right-0 left-0 fixed flex flex-col bg-gray-800 text-white">
      <div class="flex flex-row justify-center">
        <div class="m-4 flex flex-row gap-8">
          <minesweeper-timer />
          <div>
            Remaining Cells / Mines:
            <span>
              <span>
                {{ mineFieldService.remainingCells().length }}
              </span>
              <span>/</span>
              <span>
                {{ mineFieldService.minesLeft() }}
              </span>
            </span>
          </div>
        </div>
      </div>
      <div
        class="flex flex-col w-screen h-screen items-center justify-start gap-10 p-4 overflow-auto"
      >
        <minesweeper-minefield />

        <div>
          <label>Remove Flagged Mines from Hint:</label>
          <input
            type="checkbox"
            (change)="toggleHint()"
            [checked]="mineFieldService.removeFlaggedMines()"
          />
        </div>
        @if(mineFieldService.started()){
        <button
          class="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          (click)="mineFieldService.startNewGame()"
        >
          Quick Reset</button
        >}
      </div>
    </div>
    @if(!mineFieldService.playing()){
    <div
      class="fixed top-0 bottom-0 right-0 left-0 flex flex-col gap-5 justify-center items-center bg-black/50 text-white"
    >
      @if(mineFieldService.win()){
      <span class="text-4xl font-bold">You Won!</span>
      } @else if (mineFieldService.lose()) {
      <span class="text-4xl font-bold">You Lost!</span>
      } @else if (mineFieldService.paused()) {
      <span class="text-4xl font-bold">Game Paused</span>
      }@else {
      <span class="text-4xl font-bold">Welcome to Mine Sweeper!</span>
      }
      <minesweeper-settings />
    </div>
    }
  `,
  imports: [MineFieldComponent, Timer, MineSweeperSettings],
})
export default class MineSweeper {
  mineFieldService = inject(MinefieldService);
  toggleHint() {
    this.mineFieldService.removeFlaggedMines.update((v) => !v);
  }
}
