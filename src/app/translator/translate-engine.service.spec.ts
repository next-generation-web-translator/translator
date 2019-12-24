import { TestBed } from '@angular/core/testing';

import { TranslateEngine } from './translate-engine.service';
import { FakeTranslateEngine } from './fake-translate-engine';

describe('TranslateEngineService', () => {
  let service: TranslateEngine;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {provide: TranslateEngine, useClass: FakeTranslateEngine},
      ],
    });
    service = TestBed.inject(TranslateEngine);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
