import { Component, OnInit } from '@angular/core';
import { DomProcessor } from './translator/dom-processor.service';
import { MockTranslationEngine } from './translator/mock-translation-engine.service';
import { Translator } from './translator/translator.service';
import { TranslationEngine } from './translator/translation-engine.service';

@Component({
  selector: 'ngwt-translator',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [
    DomProcessor,
    Translator,
    { provide: TranslationEngine, useClass: MockTranslationEngine },
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
