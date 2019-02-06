import {
  Component,
  OnInit,
  Input,
  ChangeDetectionStrategy,
  OnDestroy,
  ChangeDetectorRef,
  HostBinding
} from '@angular/core';

import { Subject, combineLatest, BehaviorSubject } from 'rxjs';
import { takeUntil, tap, withLatestFrom } from 'rxjs/operators';

import { fastHex } from './fast-hex';
import { NgxHexDataService } from './data.service';
import { NgxHexMetricsService } from './metrics.service';
import { hex } from './hex';
import { convertToIndex } from './convert';
import { NgxHexSelectionService } from './selection.service';

@Component({
  selector: 'ngx-hex-line',
  template: `<span class='line-numbers' [style.width.ch]='metricsService.maxLabelSize | async'>
  {{ labelString }}
</span>
<span class='cells'>{{ cellString }}</span>`,
  styles: [
    `:host {
      display: flex;
      white-space: nowrap;
      pointer-events: none;
    }`,
    `:host.selected { border: solid 1px #000 }`,
    `.line-numbers {
      background-color: #336699;
      color: #FFF;
      padding: 0px 1ch;
      box-sizing: content-box;
    }`,
    `span {
      display: inline-block;
      text-align: center;
    }`,
    `.selected {
      color: #FFF;
      background-color: #336699;
    }`,
    `.cells {
      padding: 0 .5ch;
    }`
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxHexLineComponent implements OnInit, OnDestroy {
  @HostBinding('style.line-height.px')
  @HostBinding('style.height.px')
  cellHeight: number;

  labelString: string;

  private _row = new BehaviorSubject<number>(0);
  @Input('row')
  set row(r: number) {
    this._row.next(r);
  }

  offset: number;
  cells: string[];
  cellString: string;

  private _destroyed = new Subject();

  constructor(
    private cd: ChangeDetectorRef,
    private dataService: NgxHexDataService,
    public metricsService: NgxHexMetricsService,
    private selectionService: NgxHexSelectionService
  ) { }

  ngOnInit() {
    this.metricsService.cell.pipe(takeUntil(this._destroyed)).subscribe(cell => {
      this.cellHeight = cell.height;
    });

    this.dataService.dataChanges.pipe(
      withLatestFrom(
        this.selectionService.currentCell,
        this.dataService.data,
        this.metricsService.stride
      ),
      takeUntil(this._destroyed),
    ).subscribe(([edit, currentCell, data, stride]) => {
      if (currentCell.row === this._row.value) {
        this.renderCells(stride, data);
        this.cd.markForCheck();
      }
    });

    combineLatest(
      this._row,
      this.dataService.data,
      this.metricsService.stride.pipe(
        tap(stride => this.cells = new Array(stride))
      ),
      this.metricsService.maxLabelSize
    ).pipe(takeUntil(this._destroyed)).subscribe(([row, data, stride, labelSize]) => {
      this.offset = convertToIndex({ row: row, column: 0 }, stride);
      this.labelString = hex(this.offset, labelSize);
      this.cells.fill('');

      this.renderCells(stride, data);
      this.cd.markForCheck();
    });
  }

  renderCells(stride: number, data: Uint8Array) {
    for (
      let index = this.offset;
      (index < this.offset + stride) && (index < data.byteLength);
      index++) {
      this.cells[index - this.offset] = fastHex(data[index]);
    }

    this.cellString = this.cells.join(' ');
  }

  ngOnDestroy() {
    this._destroyed.next();
    this._destroyed.complete();
  }
}
