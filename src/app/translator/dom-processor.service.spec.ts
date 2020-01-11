import { DomProcessor } from './dom-processor.service';
import { TestBed } from '@angular/core/testing';
import { MockTranslator } from './mock-translator.service';
import { Translator } from './translator.service';

describe('DomProcessor', () => {
  let dom: HTMLDivElement;
  let h1: HTMLHeadingElement;
  let p: HTMLParagraphElement;
  beforeAll(() => {
    dom = document.createElement('div');
    dom.innerHTML = `<h1>One<span>1<strong>2<!----></strong>3</span><!----></h1>
<p>Two</p>
<div>Three <span>Four</span> Five</div>`;
    document.body.append(dom);
    h1 = dom.querySelector('h1');
    p = dom.querySelector('p');
  });

  let service: DomProcessor;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DomProcessor,
        { provide: Translator, useClass: MockTranslator },
      ],
    });
    service = TestBed.inject(DomProcessor);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should find all sentences', () => {
    const elements = service.findSentences(dom);
    expect(elements.map(it => it.innerHTML)).toEqual([
      'One<span __index="_1">1<strong __index="1">2<!----></strong>3</span>',
      'Two',
      'Three <span __index="_1">Four</span> Five',
    ]);
  });

  it('translate', (done) => {
    service.setup(dom);
    setTimeout(() => {
      expect(h1.innerHTML).toEqual('中One<span>中1<strong>中2</strong>中3</span><!---->');
      expect(p.innerHTML).toEqual('中Two');
      done();
    }, 100);
  });

});
