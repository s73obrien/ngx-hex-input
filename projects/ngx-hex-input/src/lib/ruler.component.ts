import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  OnDestroy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  AfterViewInit
} from '@angular/core';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import ResizeSensor from 'css-element-queries/src/ResizeSensor';

import { fastHex } from './fast-hex';
import { NgxHexMetricsService } from './metrics.service';

@Component({
  selector: 'ngx-hex-ruler',
  template: `<span class='line-numbers' #numbers [style.width.ch]='metricsService.maxLabelSize | async'></span>
<span class='cells' #cellSpan>{{cellString}}</span>`,
  styles: [
    ':host { white-space: nowrap; }',
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
    `.cells {
      padding: 0 .5ch;
    }`,
    `.line-numbers {
      height: 1px;
      display: inline-block
    }`
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NgxHexRulerComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('numbers') numbers: ElementRef<HTMLSpanElement>;
  @ViewChild('cellSpan') cellSpan: ElementRef<HTMLSpanElement>;

  cells: string[];
  cellString: string;
  private _destroyed = new Subject();
  numbersResizeSensor: ResizeSensor;
  cellsResizeSensor: ResizeSensor;

  constructor(
    public metricsService: NgxHexMetricsService,
    public cd: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    this.metricsService.stride.pipe(takeUntil(this._destroyed)).subscribe(s => {
      this.cells = new Array(+s).fill(0).map((_, c) => fastHex(c));
      this.cellString = this.cells.join(' ');
      this.cd.markForCheck();
    });
  }

  ngAfterViewInit() {
    this.numbersResizeSensor = new ResizeSensor(this.numbers.nativeElement, s => {
      this.metricsService.labelWidth = s.width;
    });

    this.metricsService.labelWidth = this.numbers.nativeElement.offsetWidth;

    this.cellsResizeSensor = new ResizeSensor(this.cellSpan.nativeElement, s => {
      this.metricsService.cellWidth = (s.width / (this.cellString.length + 1)) * 3;
      this.metricsService.cellHeight = s.height;
    });
  }

  ngOnDestroy() {
    if (this.numbersResizeSensor) {
       this.numbersResizeSensor.detach();
    }

    this._destroyed.next();
    this._destroyed.complete();
  }
}
