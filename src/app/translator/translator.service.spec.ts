import { TestBed } from '@angular/core/testing';
import { Translator } from './translator.service';
import { TranslateEngine } from './translate-engine.service';
import { FakeTranslateEngine } from './fake-translate-engine';

describe('TranslatorService', () => {
  let service: Translator;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {provide: TranslateEngine, useClass: FakeTranslateEngine},
        Translator,
      ],
    });
    service = TestBed.inject(Translator);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
