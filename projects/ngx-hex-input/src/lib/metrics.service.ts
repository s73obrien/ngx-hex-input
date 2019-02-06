import { Injectable } from '@angular/core';

import { ReplaySubject, combineLatest, BehaviorSubject } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { NgxHexDataService } from './data.service';

@Injectable()
export class NgxHexMetricsService {
  private _viewportHeight = new ReplaySubject<number>(1);
  private _viewportWidth = new ReplaySubject<number>(1);

  public viewport = combineLatest(this._viewportWidth, this._viewportHeight)
    .pipe(map(([width, height]) => ({ width: width, height: height })));

  public set viewportHeight(v: number) {
    this._viewportHeight.next(v);
  }

  public set viewportWidth(v: number) {
    this._viewportWidth.next(v);
  }

  private _cellHeight = new BehaviorSubject<number>(1);
  private _cellWidth = new BehaviorSubject<number>(1);

  public cell = combineLatest(this._cellWidth, this._cellHeight)
    .pipe(map(([width, height]) => ({ width: width, height: height })));

  public set cellHeight(v: number) {
    this._cellHeight.next(v);
  }

  public set cellWidth(v: number) {
    this._cellWidth.next(v);
  }

  private _labelWidth = new ReplaySubject<number>(1);
  public label = combineLatest(
    this._labelWidth,
    this._cellHeight).pipe(
      map(([labelWidth, cellHeight]) => ({ width: labelWidth, height: cellHeight }))
    );

  public set labelWidth(v: number) {
    this._labelWidth.next(v);
  }

  public viewportItems = combineLatest(this._viewportHeight, this._cellHeight)
    .pipe(map(([vp, c]) => Math.floor(vp / c)));

  public stride = combineLatest(
    this.viewport,
    this.label,
    this.cell
  ).pipe(
    map(([vp, l, c]) => {
      const exp =
        Math.floor(((Math.log10(vp.width - l.width) -
          Math.log10(c.width)) / Math.log10(2)) - .001);

      return Math.pow(2, exp);
    }),
    distinctUntilChanged());

  public rows = combineLatest(
    this.dataService.data,
    this.stride)
    .pipe(map(([d, s]) => new Array(Math.ceil(d.byteLength / s))));

  public maxLabelSize = this.dataService.data.pipe(
    map(d => {
      if (d.byteLength === 1 || d.byteLength === 0) {
        return 2;
      } else {
        return Math.ceil((Math.log(d.byteLength) / Math.log(16)) / 2) * 2;
      }
    }),
    distinctUntilChanged());

  constructor(
    private dataService: NgxHexDataService
  ) { }
}
