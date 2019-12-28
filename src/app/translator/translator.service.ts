import { from, Observable } from 'rxjs';
import { switchMap, toArray } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { TranslationEngine } from './translation-engine.service';
import { TranslationEntry } from './models/translation-entry';
import { TranslationResult } from './models/translation-result';

@Injectable()
export class Translator {
  constructor(private engine: TranslationEngine) {
  }

  translate(entries: TranslationEntry[]): Observable<TranslationResult[]> {
    return from(entries).pipe(
        switchMap(({ id, content }) => this.engine.translateHtml(id, content)),
        toArray(),
    );
  }
}
