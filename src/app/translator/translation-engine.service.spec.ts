import { TestBed } from '@angular/core/testing';

import { TranslationEngine } from './translation-engine.service';
import { MockTranslationEngine } from './mock-translation-engine.service';

describe('TranslationEngineService', () => {
  let service: TranslationEngine;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: TranslationEngine, useClass: MockTranslationEngine },
      ],
    });
    service = TestBed.inject(TranslationEngine);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
