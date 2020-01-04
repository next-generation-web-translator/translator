import { TranslationType } from './translation-type';

export interface Translation {
  id: string;
  type: TranslationType;
  content: string;
}
