import { Injectable, OnDestroy } from '@angular/core';
import { NgxHexDataService } from './data.service';
import { map, takeUntil, withLatestFrom } from 'rxjs/operators';
import { combineLatest, BehaviorSubject, Subject, Observer } from 'rxjs';
import { convertToIndex, convertFromIndex } from './convert';
import { NgxHexMetricsService } from './metrics.service';

@Injectable()
export class NgxHexSelectionService implements OnDestroy {
  private _destroyed = new Subject();

  private _keyStrokes = new Subject<KeyboardEvent>();
  public keyStrokes = this._keyStrokes as Observer<KeyboardEvent>;

  private _clicks = new Subject<{x: number, y: number}>();
  public clicks = this._clicks as Observer<{x: number, y: number}>;

  private _highNibble = new BehaviorSubject<boolean>(true);
  public highNibble = this._highNibble.asObservable();

  private _currentIndex = new BehaviorSubject<number>(0);
  public currentIndex = combineLatest(
    this._currentIndex,
    this.dataService.data
  ).pipe(
    map(([index, data]) => Math.min(Math.max(index, 0), data.byteLength))
  );

  public currentCell = combineLatest(
    this.currentIndex,
    this.metricsService.stride
  ).pipe(
    map(([index, stride]) => convertFromIndex(index, stride))
  );

  selectIndex(index: number) {
    this._currentIndex.next(index);
  }

  selectCell(p: { row: number, column: number }, stride: number) {
    this.selectIndex(convertToIndex(p, stride));
  }

  public setHighNibble(value: boolean) {
    this._highNibble.next(value);
  }

  constructor(
    private dataService: NgxHexDataService,
    private metricsService: NgxHexMetricsService
  ) {
    this._keyStrokes.pipe(
      withLatestFrom(
        this.currentCell,
        this.currentIndex,
        this.highNibble,
        this.metricsService.cell,
        this.metricsService.viewport,
        this.metricsService.stride,
        this.dataService.data
      ),
      takeUntil(this._destroyed),
    ).subscribe(([
      event,
      currentCell,
      currentIndex,
      highNibble,
      cell,
      viewport,
      stride,
      data
    ]) => {
      switch (event.key) {
        case 'ArrowUp':
          this.selectCell({
            row: currentCell.row - 1,
            column: currentCell.column
          }, stride);
          break;

        case 'ArrowDown':
          this.selectCell({
            row: currentCell.row + 1,
            column: currentCell.column
          }, stride);
          break;

        case 'ArrowLeft':
          if (highNibble) {
            if (currentIndex > 0) {
              this.selectCell({
                row: currentCell.row,
                column: currentCell.column - 1
              }, stride);
              this.setHighNibble(false);
            }
          } else {
            this.setHighNibble(true);
          }
          break;

        case 'ArrowRight':
          if (!highNibble) {
            if (currentIndex < data.byteLength) {
              this.selectCell({
                row: currentCell.row,
                column: currentCell.column + 1
              }, stride);
              this.setHighNibble(true);
            }
          } else {
            this.setHighNibble(false);
          }
          break;

        case 'PageDown':
          this.selectCell({
            row: currentCell.row + Math.floor(viewport.height / cell.height),
            column: currentCell.column
          }, stride);
          break;

        case 'PageUp':
          this.selectCell({
            row: currentCell.row - Math.floor(viewport.height / cell.height),
            column: currentCell.column
          }, stride);
          break;
      }
    });

    this._clicks.pipe(withLatestFrom(
      this.metricsService.cell,
      this.metricsService.label,
      this.metricsService.stride),
      takeUntil(this._destroyed))
      .subscribe(([position, cell, label, stride]) => {
        const column = Math.floor((position.x - label.width) / cell.width);
        const row = Math.floor(position.y / cell.height);
        this.selectCell({ row: row, column: column }, stride);
      });
  }

  ngOnDestroy() {
    this._destroyed.next();
    this._destroyed.complete();
  }
}
