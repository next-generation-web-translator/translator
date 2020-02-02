import {
  cloneAndWrapText,
  DomProcessor,
  gatherSentences,
  mergeResultBack,
  nodeCloneMap,
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
  let custom: HTMLUnknownElement;
  beforeAll(() => {
    dom = document.createElement('div');
    dom.innerHTML = `<p>Two</p>\
<div>Three<span>Four</span>Five</div>\
<h1>One<span>1<strong>2<!----></strong>3</span><!----></h1>\
<app-custom><p>Six</p></app-custom>
`;
    document.body.append(dom);
    h1 = dom.querySelector('h1');
    div = dom.querySelector('div');
    p = dom.querySelector('p');
    custom = dom.querySelector('app-custom');
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
    const cloned = cloneAndWrapText(div) as Element;
    expect(cloned.innerHTML).toEqual(`<span __text="" __ngwt-node-index="0">Three</span><span __ngwt-node-index="1">Four</span><span __text="" __ngwt-node-index="2">Five</span>`);
  });

  it('should clone and wrap all elements', () => {
    const cloned = cloneAndWrapText(dom) as Element;
    expect(cloned.innerHTML).toEqual(`<p __ngwt-node-index="0">Two</p><div __ngwt-node-index="1"><span __text="" __ngwt-node-index="0">Three</span><span __ngwt-node-index="1">Four</span><span __text="" __ngwt-node-index="2">Five</span></div><h1 __ngwt-node-index="2"><span __text="" __ngwt-node-index="0">One</span><span __ngwt-node-index="1"><span __text="" __ngwt-node-index="0">1</span><strong __ngwt-node-index="1">2<!----></strong><span __text="" __ngwt-node-index="2">3</span></span><!----></h1><app-custom __ngwt-node-index="3"><p __ngwt-node-index="0">Six</p></app-custom>
`);
    expect(nodeCloneMap.items.map(it => (it.original as Element).outerHTML)).toEqual([
      '<p>Two</p>',
      '<div>Three<span>Four</span>Five</div>',
      '<div><p>Two</p><div>Three<span>Four</span>Five</div><h1>One<span>1<strong>2<!----></strong>3</span><!----></h1><app-custom><p>Six</p></app-custom>\n</div>',
      '<h1>One<span>1<strong>2<!----></strong>3</span><!----></h1>',
      '<app-custom><p>Six</p></app-custom>',
      '<p>Six</p>',
    ]);
  });

  it('split by block level', () => {
    expect(gatherSentences(cloneAndWrapText(parseHtml('<!----><div>o<b>n</b>e<div>two</div>three</div><!---->'))).map(it => it.innerHTML)).toStrictEqual([
      '<span __text="" __ngwt-node-index="0">o</span><b __ngwt-node-index="1">n</b><span __text="" __ngwt-node-index="2">e</span>',
      'two',
      '<span __text="" __ngwt-node-index="4">three</span>',
    ]);
  });

  it('should find all sentences', () => {
    const cloned = cloneAndWrapText(dom) as Element;
    const elements = gatherSentences(cloned);
    expect(elements.map(it => it.outerHTML)).toEqual([
      '<div>Two</div>',
      '<div><span __text="" __ngwt-node-index="0">Three</span><span __ngwt-node-index="1">Four</span><span __text="" __ngwt-node-index="2">Five</span></div>',
      '<div><span __text="" __ngwt-node-index="0">One</span><span __ngwt-node-index="1"><span __text="" __ngwt-node-index="0">1</span><strong __ngwt-node-index="1">2<!----></strong><span __text="" __ngwt-node-index="2">3</span></span><!----></div>',
      '<div>Six</div>',
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
      expect(div.innerHTML).toEqual('中Three<span>中Four</span>中Five');
      expect(custom.innerHTML).toEqual('<p>中Six</p>');
      done();
    }, 100);
  });
});
