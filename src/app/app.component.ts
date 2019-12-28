import { Component, OnInit } from '@angular/core';
import { DomProcessor } from './translator/dom-processor.service';
import { TranslateEngine } from './translator/translate-engine.service';
import { FakeTranslateEngine } from './translator/fake-translate-engine';
import { Translator } from './translator/translator.service';

@Component({
  selector: 'ngwt-translator',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [
    DomProcessor,
    Translator,
    { provide: TranslateEngine, useClass: FakeTranslateEngine },
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
