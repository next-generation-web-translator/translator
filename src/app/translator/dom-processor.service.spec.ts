import {
  attachNodeIndexToData,
  cloneAndWrapText,
  DomProcessor,
  gatherSentences,
  mergeResultBack,
} from './dom-processor.service';
import { TestBed } from '@angular/core/testing';
import { MockTranslator } from './mock-translator.service';
import { Translator } from './translator.service';

// tslint:disable:max-line-length

function parseHtml(html: string): Element {
  const node = document.createElement('div');
  node.innerHTML = html;
  return node.firstElementChild;
}

describe('DomProcessor', () => {
  let dom: HTMLDivElement;
  let h1: HTMLHeadingElement;
  let div: HTMLDivElement;
  let p: HTMLParagraphElement;
  beforeAll(() => {
    dom = document.createElement('div');
    dom.innerHTML = `<p>Two</p>\
<div>Three<span>Four</span>Five</div>\
<h1>One<span>1<strong>2<!----></strong>3</span><!----></h1>\
`;
    document.body.append(dom);
    h1 = dom.querySelector('h1');
    div = dom.querySelector('div');
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

  it('should clone and wrap simple element', () => {
    const cloned = cloneAndWrapText(p) as Element;
    expect(cloned.innerHTML).toEqual('Two');
  });

  it('should clone and wrap complex element', () => {
    attachNodeIndexToData(div);
    const cloned = cloneAndWrapText(div) as Element;
    expect(cloned.innerHTML).toEqual('<span __text="" __ngwt-node-index="0" __ngwt-node-display="inline">Three</span>' +
        '<span __ngwt-node-index="1" __ngwt-node-display="inline">Four</span>' +
        '<span __text="" __ngwt-node-index="2" __ngwt-node-display="inline">Five</span>');
  });

  it('should clone and wrap all elements', () => {
    attachNodeIndexToData(dom);
    const cloned = cloneAndWrapText(dom) as Element;
    expect(cloned.innerHTML).toEqual('<p __ngwt-node-index="0" __ngwt-node-display="block">Two</p>' +
        '<div __ngwt-node-index="1" __ngwt-node-display="block"><span __text="" __ngwt-node-index="0" __ngwt-node-display="inline">Three</span><span __ngwt-node-index="1" __ngwt-node-display="inline">Four</span><span __text="" __ngwt-node-index="2" __ngwt-node-display="inline">Five</span></div>' +
        '<h1 __ngwt-node-index="2" __ngwt-node-display="block"><span __text="" __ngwt-node-index="0" __ngwt-node-display="inline">One</span><span __ngwt-node-index="1" __ngwt-node-display="inline"><span __text="" __ngwt-node-index="0" __ngwt-node-display="inline">1</span><strong __ngwt-node-index="1" __ngwt-node-display="inline">2<!----></strong><span __text="" __ngwt-node-index="2" __ngwt-node-display="inline">3</span></span><!----></h1>');
  });

  it('split by block level', () => {
    expect(gatherSentences(cloneAndWrapText(parseHtml('<!----><div>o<b>n</b>e<div>two</div>three</div><!---->'))).map(it => it.innerHTML)).toStrictEqual([
      '<span __text="" __ngwt-node-index="0" __ngwt-node-display="inline">o</span><b __ngwt-node-index="1" __ngwt-node-display="inline">n</b><span __text="" __ngwt-node-index="2" __ngwt-node-display="inline">e</span>',
      'two',
      '<span __text="" __ngwt-node-index="4" __ngwt-node-display="inline">three</span>',
    ]);
  });

  it('should find all sentences', () => {
    attachNodeIndexToData(dom);
    const cloned = cloneAndWrapText(dom) as Element;
    const elements = gatherSentences(cloned);
    expect(elements.map(it => it.outerHTML)).toEqual([
      '<div __ngwt-marker="4gIqsYbJ8Joe_51rk1G310FK5o0">Two</div>',
      '<div __ngwt-marker="KwOd_-fKUld6BPJ185iZ7LPetmo"><span __text="" __ngwt-node-index="0" __ngwt-node-display="inline">Three</span><span __ngwt-node-index="1" __ngwt-node-display="inline">Four</span><span __text="" __ngwt-node-index="2" __ngwt-node-display="inline">Five</span></div>',
      '<div __ngwt-marker="nhQmXuNw8KrfhXm4h9yDJ2RLU8Y"><span __text="" __ngwt-node-index="0" __ngwt-node-display="inline">One</span><span __ngwt-node-index="1" __ngwt-node-display="inline"><span __text="" __ngwt-node-index="0" __ngwt-node-display="inline">1</span><strong __ngwt-node-index="1" __ngwt-node-display="inline">2<!----></strong><span __text="" __ngwt-node-index="2" __ngwt-node-display="inline">3</span></span><!----></div>',
    ]);
  });

  it('merge dom - simply', () => {
    const original = parseHtml('<h1>One<span>1<strong>2<!----></strong>3</span><!----></h1>');
    const translation = parseHtml(`<div __ngwt-marker="nhQmXuNw8KrfhXm4h9yDJ2RLU8Y"><span __text="" __ngwt-node-index="0" __ngwt-node-display="inline">中One</span><span __ngwt-node-index="1" __ngwt-node-display="inline"><span __text="" __ngwt-node-index="0" __ngwt-node-display="inline">中1</span><strong __ngwt-node-index="1" __ngwt-node-display="inline">中2<!----></strong><span __text="" __ngwt-node-index="2" __ngwt-node-display="inline">中3</span></span><!----></div>`);
    mergeResultBack(original, translation);
    expect(original.outerHTML).toBe('<h1>中One<span>中1<strong>中2<!----></strong>中3</span><!----></h1>');
  });

  it('merge dom - re-ordered', () => {
    const original = parseHtml('<h1>One<span>1<strong>2<!----></strong>3</span><!----></h1>');
    const translation = parseHtml(`<div __ngwt-marker="nhQmXuNw8KrfhXm4h9yDJ2RLU8Y"><span __text="" __ngwt-node-index="0" __ngwt-node-display="inline">中One</span><span __ngwt-node-index="1" __ngwt-node-display="inline"><span __text="" __ngwt-node-index="2" __ngwt-node-display="inline">中3</span><span __text="" __ngwt-node-index="0" __ngwt-node-display="inline">中1</span><strong __ngwt-node-index="1" __ngwt-node-display="inline">中2<!----></strong></span><!----></div>`);
    mergeResultBack(original, translation);
    expect(original.outerHTML).toBe('<h1>中One<span>中1<strong>中2<!----></strong>中3</span><!----></h1>');
  });

  it('translate', (done) => {
    service.setup(dom);
    setTimeout(() => {
      expect(p.innerHTML).toEqual('中Two');
      expect(h1.innerHTML).toEqual('中One<span>中1<strong>中2<!----></strong>中3</span><!---->');
      done();
    }, 100);
  });
});
