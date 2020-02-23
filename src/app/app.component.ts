import { Component, OnInit } from '@angular/core';
import { DomProcessor } from './translator/dom-processor.service';
import { Translator } from './translator/translator.service';

@Component({
  selector: 'ngwt-translator',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [
    Translator,
    DomProcessor,
  ],
})
export class AppComponent implements OnInit {
  constructor(private translator: DomProcessor) {
  }

  ngOnInit(): void {
    this.translator.setup();
  }
}
