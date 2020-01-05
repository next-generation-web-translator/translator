import { Component, OnInit } from '@angular/core';
import { DomProcessor } from './translator/dom-processor.service';

@Component({
  selector: 'ngwt-translator',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [
    DomProcessor,
  ],
})
export class AppComponent implements OnInit {
  constructor(private translator: DomProcessor) {
  }

  show = false;

  ngOnInit(): void {
    this.translator.setup();
  }
}
