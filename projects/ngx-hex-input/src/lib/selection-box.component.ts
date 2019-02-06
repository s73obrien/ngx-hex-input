import { Component, OnInit, HostBinding, OnDestroy, ElementRef, Input, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { NgxHexMetricsService } from './metrics.service';
import { takeUntil, withLatestFrom } from 'rxjs/operators';
import { Subject, combineLatest, Observable, BehaviorSubject } from 'rxjs';
import { NgxHexDataService } from './data.service';
import { fastHex } from './fast-hex';
import { convertToIndex } from './convert';
import { NgxHexSelectionService } from './selection.service';
import { NgxHexEditingService } from './editing.service';

@Component({
  selector: 'ngx-selection-box',
  template: `<span
  [class.selected]='(selectionService.highNibble | async)'
  [class.insert]='(editingService.insertMode | async)'>{{data[0]}}</span>
  <span
  [class.selected]='!(selectionService.highNibble | async)'
  [class.insert]='(editingService.insertMode | async)'>{{data[1]}}</span>`,
  styles: [
    `:host {
      font-weight: bold;
      pointer-events: none;
      text-align: center;
      position: absolute;
    }`,
    `span.selected:not(.insert) {
      color: #FFF;
      background-color: #000;
      animation: blink-square .75s ease-out infinite;
    }
    @keyframes blink-square {
      50% { color: #CCC; }
    }`,
    `span.selected.insert {
      color: #000;
      font-weight: bold;
      animation: blink-empty 1s infinite;
      border-left: transparent solid 1px;
      margin-left: -1px;
    }
    @keyframes blink-empty {
      50% {border-left: 1px solid #333;}
    }`,
    `:host.new-cell {
      outline: 1px solid #336699;
      background-color: #FFF;
      color: #336699;
    }`,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectionBoxComponent implements OnInit, OnDestroy {
  private _destroyed = new Subject();

  @HostBinding('style.left.px')
  left: number;

  @HostBinding('style.top.px')
  top: number;

  @HostBinding('style.width.px')
  width: number;

  @HostBinding('style.height.px')
  height: number;

  @HostBinding('class.new-cell')
  newCell: boolean;

  data: string[] = ['0', '0'];

  @Input() contentTransform: Observable<string>;

  constructor(
    private metricsService: NgxHexMetricsService,
    private dataService: NgxHexDataService,
    private selectionService: NgxHexSelectionService,
    private editingService: NgxHexEditingService,
    private cd: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    // When the currently selected cell/data/metrics change
    // update our coordinates and data accordingly
    combineLatest(
      this.selectionService.currentCell,
      this.metricsService.cell,
      this.dataService.data,
      this.metricsService.stride,
      this.metricsService.label,
      this.contentTransform,
    ).pipe(takeUntil(this._destroyed)).subscribe(([currentCell, cell, data, stride, label, contentTransform]) => {
      const index = convertToIndex(currentCell, stride);
      if (index >= data.byteLength) {
        this.newCell = true;
      } else {
        this.newCell = false;
      }

      this.left = currentCell.column * cell.width + label.width;

      const mat = new DOMMatrix(contentTransform);
      this.top = currentCell.row * cell.height - mat.m42;
      this.height = cell.height;
      this.width = cell.width;

      this.data = fastHex(data[index]).split('');
      this.cd.markForCheck();
    });

    // Catch the changes made by the editing service and update our data
    this.dataService.dataChanges.pipe(
      withLatestFrom(
        this.selectionService.currentIndex,
        this.dataService.data
      )
    ).subscribe(([change, currentIndex, data]) => {
      this.data = fastHex(data[currentIndex]).split('');
      this.cd.markForCheck();
    });
  }

  ngOnDestroy() {
    this._destroyed.next();
    this._destroyed.complete();
  }
}
