import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';

// Importing directly from the library src directory
// This ends up rolling the library into the app code, so not ideal
// but it seems this is the only way to make ng serve work smoothly
// for now
import { NgxHexInputModule } from 'projects/ngx-hex-input/src/public_api';
// import { NgxHexInputModule } from 'ngx-hex-input';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    NgxHexInputModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
