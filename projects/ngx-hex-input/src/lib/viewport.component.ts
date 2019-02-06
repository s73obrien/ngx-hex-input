import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy,
  OnDestroy,
  Input,
  AfterViewInit,
} from '@angular/core';
import { CdkVirtualScrollViewport } from './scrolling';

import { Subject, combineLatest, fromEvent } from 'rxjs';
import { takeUntil, filter, tap, withLatestFrom, map, share } from 'rxjs/operators';
import ResizeSensor from 'css-element-queries/src/ResizeSensor';

import { NgxHexDataService } from './data.service';
import { NgxHexMetricsService } from './metrics.service';
import { NgxHexSelectionService } from './selection.service';
import { NgxHexEditingService } from './editing.service';

@Component({
  selector: 'ngx-hex-input',
  template: `<ngx-hex-ruler></ngx-hex-ruler>
  <cdk-virtual-scroll-viewport [maxBufferPx]='maxBuffer' [minBufferPx]='minBuffer'
  class='editor' #viewport [itemSize]='(metricsService.cell | async).height' tabindex='0'>
  <ngx-selection-box [contentTransform]='viewport.onRenderedContentTransformChanged'></ngx-selection-box>
    <ngx-hex-line [class.odd]='odd' [row]='row'
      *cdkVirtualFor='let i of (metricsService.rows | async); let odd = odd; let row = index;'>
    </ngx-hex-line>
    <div [style.height.px]='bottomBarHeight' style='width: 1px;'></div>
  </cdk-virtual-scroll-viewport>
`,
  styles: [
    `:host {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }`,
    `* {
      font-family: monospace;
      font-kerning: none;
      letter-spacing: 0px;
      word-spacing: 0px;
    }`,
    `.editor {
      outline: none;
      position: relative;
      overflow-y: auto;
      overflow-x: hidden;
      flex-grow: 1;
      flex-basis: auto;
    }`,
    `.editor::-webkit-scrollbar-track {
      -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
      box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
      background-color: #F5F5F5;
    }.editor::-webkit-scrollbar {
      width: 10px;
      height: 10px;
      background-color: #F5F5F5;
    }
    .editor::-webkit-scrollbar-thumb {
      background-color: #336699;
    }
    .editor::-webkit-scrollbar-thumb:hover {
      background-color: #336699;
    }`,
    `.odd {
      background-color: #99BBEE;
    }`,
    `ngx-hex-ruler {
      color: #FFF;
      background-color: #336699;
    }`,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    NgxHexSelectionService,
    NgxHexEditingService,
    NgxHexDataService,
    NgxHexMetricsService,
  ]
})
export class NgxHexInputComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('viewport') viewport: CdkVirtualScrollViewport;

  resizeSensor: ResizeSensor;

  _destroyed = new Subject();

  maxBuffer = 500;
  minBuffer = 400;

  bottomBarHeight = 0;

  @Input()
  set value(v: Uint8Array) {
    this.dataService.currentData = v;
  }

  get value(): Uint8Array {
    return this.dataService.currentData;
  }


  constructor(
    private selectionService: NgxHexSelectionService,
    private editingService: NgxHexEditingService,
    private dataService: NgxHexDataService,
    public metricsService: NgxHexMetricsService,
  ) { }

  ngOnInit() {
    combineLatest(
      this.metricsService.stride,
      this.dataService.data,
      this.metricsService.cell,
    ).pipe(takeUntil(this._destroyed)).subscribe(([stride, data, cell]) => {
      if (data.byteLength % stride === 0) {
        this.bottomBarHeight = cell.height + 1;
      } else {
        this.bottomBarHeight = 1;
      }
    });

    // When the stride/data/currently selected cell/cell dimensions/viewport dimensions change, we
    // need to make sure that our currently selected cell is in the viewport.
    combineLatest(
      this.metricsService.stride,
      this.dataService.data,
      this.selectionService.currentCell,
      this.metricsService.cell,
      this.metricsService.viewport
    )
      .pipe(takeUntil(this._destroyed)).subscribe(
        ([stride, data, currentCell, cell, viewport]) => {
          // find the current viewport position
          const vpStart = this.viewport.elementRef.nativeElement.scrollTop;
          const vpEnd = vpStart + viewport.height;

          // find the position of the selectee
          const sStart = currentCell.row * cell.height;
          const sEnd = (currentCell.row + 1) * cell.height;

          if (sStart < vpStart) {
            // if currently selected cell is higher than the start of the viewport,
            // scroll to the top of the currently selected cell
            this.viewport.elementRef.nativeElement.scrollTo({ top: sStart });
          } else if (sEnd > vpEnd) {
            // if currently selected cell is lower than the bottom of the viewport,
            // scroll to a viewport's height above the bottom of the currently selected cell
            this.viewport.elementRef.nativeElement.scrollTo({ top: sEnd - viewport.height + 1 });
          }
        });
  }

  ngAfterViewInit() {
    // report that our viewport changed to the metricsService
    this.resizeSensor = new ResizeSensor(this.viewport.elementRef.nativeElement, (size) => {
      this.metricsService.viewportWidth = size.width;
      this.metricsService.viewportHeight = size.height;
    });

    // We need two change detection cycles for this: one for the size of the viewport
    // and one for the data layout, etc.
    setTimeout(() => {
      this.metricsService.viewportWidth = this.viewport.elementRef.nativeElement.clientWidth;
      this.metricsService.viewportHeight = this.viewport.elementRef.nativeElement.clientHeight;
    });

    // Filter out the keyboard events to include only those whose key property matches one of the
    // functions in this.command.  Take the event data along with the currently selected cell and
    // pass it on to the command function.
    const keydownEvent = fromEvent<KeyboardEvent>(this.viewport.elementRef.nativeElement, 'keydown')
      .pipe(share());

    keydownEvent.pipe(
      filter(v => [
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'PageUp',
        'PageDown',
      ].includes(v.key)),
      tap(v => {
        v.stopPropagation();
        v.preventDefault();
      }),
      takeUntil(this._destroyed))
      .subscribe(this.selectionService.keyStrokes);

      keydownEvent.pipe(
        filter(v => /^[a-fA-F0-9]{1}$/.test(v.key) || [
          'Insert',
          'Delete',
          'Backspace'
        ].includes(v.key)),
        tap(v => {
          v.stopPropagation();
          v.preventDefault();
        }),
        takeUntil(this._destroyed))
        .subscribe(this.editingService.keyStrokes);

      fromEvent<MouseEvent>(this.viewport.elementRef.nativeElement, 'click')
        .pipe(
          withLatestFrom(this.viewport.onRenderedContentTransformChanged),
          map(([mouse, contentTransform]) => {
            const mat = new DOMMatrix(contentTransform);
            return {
              x: mouse.offsetX,
              y: mouse.offsetY + mat.m42
            };
          }),
          takeUntil(this._destroyed)
        ).subscribe(this.selectionService.clicks);
  }

  ngOnDestroy() {
    if (this.resizeSensor) {
      this.resizeSensor.detach();
    }

    this._destroyed.next();
    this._destroyed.complete();
  }
}
