import { Component, inject, Pipe, PipeTransform } from '@angular/core';
import { MinefieldService } from '../data-access/minefield-service';
import { interval, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Pipe({
  name: 'time',
  pure: true,
})
export class TimePipe implements PipeTransform {
  transform(value: number): string {
    const minutes = Math.floor(value / 60000);
    const seconds = Math.floor((value % 60000) / 1000);
    const milliseconds = value % 1000;
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}s`;
  }
}

@Component({
  selector: 'minesweeper-timer',
  template: `
    <div class="font-mono">Time Elapsed: {{ elapsedTime() | time }}</div>
  `,
  imports: [TimePipe],
})
export class Timer {
  readonly mfs = inject(MinefieldService);
  readonly #elapsedTime$ = interval(10).pipe(
    map(() => {
      const time = this.mfs.time();
      if (time === null) {
        return 0;
      }
      if (time.end) {
        return time.end - time.start;
      }
      return Date.now() - time.start;
    }),
  );
  readonly elapsedTime = toSignal(this.#elapsedTime$, { initialValue: 0 });
}
