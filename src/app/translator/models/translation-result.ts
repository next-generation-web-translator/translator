import { TranslationType } from './translation.type';

export interface TranslationResult {
  id: string;
  type: TranslationType;
  content: string;
}
