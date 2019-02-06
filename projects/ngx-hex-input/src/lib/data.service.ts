import { Injectable, OnDestroy } from '@angular/core';

import { BehaviorSubject, Subject } from 'rxjs';

export interface NgxHexDataChange {
  index: number;
  newValue: number;
  oldValue: number;
}

@Injectable()
export class NgxHexDataService implements OnDestroy {
  private _destroyed = new Subject();

  private _data = new BehaviorSubject<Uint8Array>(new Uint8Array(0));
  public data = this._data.asObservable();

  private _dataChanges = new Subject<NgxHexDataChange>();
  public dataChanges = this._dataChanges.asObservable();

  public get currentData(): Uint8Array {
    return this._data.value;
  }

  public set currentData(d: Uint8Array) {
    this._data.next(d);
  }

  public mutate(index: number, value: number) {
    let oldValue: number;
    oldValue = this._data.value[index];

    this._data.value[index] = value;

    this._dataChanges.next({
      index,
      oldValue: oldValue,
      newValue: value
    });
  }

  public delete(index: number) {
    if (this._data.value.byteLength
      && index < this._data.value.byteLength
      && index >= 0) {
      const buffer = new Uint8Array(this._data.value.byteLength - 1);
      for (let i = 0; i < index; i++) {
        buffer[i] = this._data.value[i];
      }

      for (let i = index; i < this._data.value.byteLength; i++) {
        buffer[i] = this._data.value[i + 1];
      }

      this._data.next(buffer);
    }
  }

  public insert(index: number, value: number) {
    const buffer = new Uint8Array(this._data.value.byteLength + 1);
    for (let i = 0; i < index; i++) {
      buffer[i] = this._data.value[i];
    }

    buffer[index] = value;

    for (let i = index; i < this._data.value.byteLength + 1; i++) {
      buffer[i + 1] = this._data.value[i];
    }

    this._data.next(buffer);
  }

  ngOnDestroy() {
    this._destroyed.next();
    this._destroyed.complete();
  }

}
