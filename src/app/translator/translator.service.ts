import { from, Observable, of, zip } from 'rxjs';
import { map, switchMap, toArray } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { TranslateEngine } from './translate-engine.service';

@Injectable()
export class Translator {
  constructor(private engine: TranslateEngine) {
  }

  translate(entries: TranslateEntry[]): Observable<TranslateResult[]> {
    return from(entries).pipe(
        switchMap(({id, content}) => zip(of(id), this.engine.translateHtml(content))),
        map(([id, content]) => ({id, type: TranslatorType.ai, content})),
        toArray(),
    );
  }
}

export interface TranslateEntry {
  id: string;
  url: string;
  paths: string[];
  content: string;
}

export enum TranslatorType {
  lookup = 'lookup',
  ai = 'ai',
}

export interface TranslateResult {
  id: string;
  type: TranslatorType;
  content: string;
}
