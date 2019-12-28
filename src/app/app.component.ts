import { Component, OnInit } from '@angular/core';
import { DomProcessor } from './translator/dom-processor.service';
import { MockTranslator } from './translator/mock-translator.service';
import { Translator } from './translator/translator.service';

@Component({
  selector: 'ngwt-translator',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [
    DomProcessor,
    { provide: Translator, useClass: MockTranslator },
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
