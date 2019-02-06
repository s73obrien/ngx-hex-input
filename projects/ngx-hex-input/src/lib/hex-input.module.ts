import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScrollingModule } from './scrolling';

import { NgxHexInputComponent } from './viewport.component';
import { NgxHexLineComponent } from './line.component';
import { NgxHexRulerComponent } from './ruler.component';
import { SelectionBoxComponent } from './selection-box.component';

@NgModule({
  imports: [
    FormsModule,
    CommonModule,
    ScrollingModule
  ],
  declarations: [
    NgxHexInputComponent,
    NgxHexLineComponent,
    NgxHexRulerComponent,
    SelectionBoxComponent,
  ],
  exports: [
    NgxHexInputComponent,
  ]
})
export class NgxHexInputModule { }
