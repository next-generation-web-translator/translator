import { TestBed } from '@angular/core/testing';
import { Translator } from './translator.service';
import { MockTranslator } from './mock-translator.service';

describe('TranslatorService', () => {
  let service: Translator;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: Translator, useClass: MockTranslator },
      ],
    });
    service = TestBed.inject(Translator);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
