import { DomProcessor } from './dom-processor.service';
import { TestBed } from '@angular/core/testing';
import { TranslateEngine } from './translate-engine.service';
import { FakeTranslateEngine } from './fake-translate-engine';
import { Translator } from './translator.service';

describe('DomProcessor', () => {
  let dom: HTMLDivElement;
  let h1: HTMLHeadingElement;
  let p: HTMLParagraphElement;
  beforeAll(() => {
    dom = document.createElement('div');
    dom.innerHTML = `<h1>One<span>1<strong>2</strong>3</span></h1>
<p>Two</p>`;
    document.body.append(dom);
    h1 = dom.querySelector('h1');
    p = dom.querySelector('p');
  });

  let service: DomProcessor;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DomProcessor,
        Translator,
        {provide: TranslateEngine, useClass: FakeTranslateEngine},
      ],
    });
    service = TestBed.inject(DomProcessor);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  it('should wrap text node', () => {
    const node = document.createElement('div');
    node.innerHTML = '1<p><a>2</a>3</p>4';
    service.wrapTextNodes(node);
    expect(node.innerHTML).toEqual('<span>1</span><p><a>2</a><span>3</span></p><span>4</span>');
  });
  it('translate', (done) => {
    service.setup(dom);
    setTimeout(() => {
      expect(h1.innerText).toEqual('一一');
      done();
    }, 1000);
  });
});
