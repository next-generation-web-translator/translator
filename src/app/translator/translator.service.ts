import { Observable } from 'rxjs';
import { Original } from './models/original';
import { Translation } from './models/translation';

export abstract class Translator {
  abstract translate(entries: Original[]): Observable<Translation[]>;
}
