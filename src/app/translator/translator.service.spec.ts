import { TestBed } from '@angular/core/testing';
import { Translator } from './translator.service';
import { TranslationEngine } from './translation-engine.service';
import { MockTranslationEngine } from './mock-translation-engine.service';

describe('TranslatorService', () => {
  let service: Translator;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: TranslationEngine, useClass: MockTranslationEngine },
        Translator,
      ],
    });
    service = TestBed.inject(Translator);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
