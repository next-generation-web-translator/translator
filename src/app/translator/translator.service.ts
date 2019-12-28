import { from, Observable } from 'rxjs';
import { switchMap, toArray } from 'rxjs/operators';
import { TranslationEntry } from './models/translation-entry';
import { TranslationResult } from './models/translation-result';

export abstract class Translator {
  translate(entries: TranslationEntry[]): Observable<TranslationResult[]> {
    return from(entries).pipe(
        switchMap(({ id, content }) => this.translateOne(id, content)),
        toArray(),
    );
  }

  protected abstract translateOne(id: string, html: string): Observable<TranslationResult>;
}
