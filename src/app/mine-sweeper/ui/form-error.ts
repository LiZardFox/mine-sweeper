import { Component, input } from '@angular/core';
import { FieldState } from '@angular/forms/signals';

@Component({
  selector: 'form-error',
  template: `
    @if(fieldRef().touched()) { @for(error of fieldRef().errors(); track error.kind) {
    <small class="text-red-600">{{ error.message }}</small>
    } }
  `,
})
export class FormError {
  fieldRef = input.required<FieldState<unknown>>();
}
