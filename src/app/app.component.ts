import { Component, ChangeDetectionStrategy, NgZone } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  data = new BehaviorSubject(new Uint8Array(0));
  translated: string;

  constructor(public zone: NgZone) {
    this.generateNewData(10000);
  }

  generateNewData(size: number) {
    const s = +size;

    const v = new Uint8Array(s);

    for (let i = 0; i < s; i++) {
      // v[i] = i % 256;
      v[i] = Math.floor(Math.random() * 0x100);
    }

    this.data.next(v);
  }

  valueChanged(e: Uint8Array) {
    console.log('value changed');
    const b = new Blob([e]);
    const fr = new FileReader();

    fr.onload = v => {
      this.translated = (fr.result as string).replace(/[^\x20-\x7E]/g, '.');
    };

    fr.readAsText(b);
  }
}
