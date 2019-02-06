import { Injectable, OnDestroy } from '@angular/core';
import { NgxHexDataService } from './data.service';
import { NgxHexSelectionService } from './selection.service';
import { map, takeUntil, combineLatest, withLatestFrom } from 'rxjs/operators';
import { Subject, Observer, BehaviorSubject } from 'rxjs';

const lookup = {
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
  '8': 8, '9': 9, 'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15,
  'a': 10, 'b': 11, 'c': 12, 'd': 13, 'e': 14, 'f': 15
};

@Injectable()
export class NgxHexEditingService implements OnDestroy {
  private _destroyed = new Subject();

  private _keyStrokes = new Subject<KeyboardEvent>();
  public keyStrokes = this._keyStrokes as Observer<KeyboardEvent>;

  private _clicks = new Subject<MouseEvent>();
  public clicks = this._clicks as Observer<MouseEvent>;

  private _insertMode = new BehaviorSubject<boolean>(true);
  public insertMode = this._insertMode.asObservable();

  private _delete = new Subject();
  public delete = this._delete as Observer<{}>;

  constructor(
    private dataService: NgxHexDataService,
    private selectionService: NgxHexSelectionService
  ) {
    this._keyStrokes.pipe(
      withLatestFrom(
        this.insertMode,
        this.selectionService.highNibble,
        this.selectionService.currentIndex,
        this.dataService.data
      ),
      takeUntil(this._destroyed)
    ).subscribe(([event, insertMode, highNibble, currentIndex, data]) => {
      if (/^[a-fA-F0-9]{1}$/.test(event.key)) {
        let d: number;
        const edit = event.key.toUpperCase();
        if (insertMode && highNibble || currentIndex >= data.byteLength) {
          this.dataService.insert(currentIndex, 0);
          d = 0;
        } else {
          d = data[currentIndex];
        }
        // tslint:disable-next-line:no-bitwise
        d = d & (highNibble ? 0x0F : 0xF0);
        // tslint:disable-next-line:no-bitwise
        d = d | (highNibble ? lookup[edit] << 4 : lookup[edit]);

        this.dataService.mutate(currentIndex, d);
        if (highNibble) {
          this.selectionService.setHighNibble(false);
        } else {
          this.selectionService.setHighNibble(true);
          this.selectionService.selectIndex(currentIndex + 1);
        }
      } else if (event.key === 'Delete') {
        this.dataService.delete(currentIndex);
      } else if (event.key === 'Backspace') {
        this.dataService.delete(currentIndex - 1);
        this.selectionService.selectIndex(currentIndex - 1);
      } else if (event.key === 'Insert') {
        this._insertMode.next(!this._insertMode.value);
      }
    });
  }

  ngOnDestroy() {
    this._destroyed.next();
    this._destroyed.complete();
  }
}
