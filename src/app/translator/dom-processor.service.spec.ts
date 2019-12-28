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
        { provide: Translator, useClass: MockTranslator },
      ],
    });
    service = TestBed.inject(DomProcessor);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should wrap text node (single node)', () => {
    const node = document.createElement('div');
    node.innerHTML = '<p>1</p>';
    service.wrapTextNodes(node);
    expect(node.innerHTML).toEqual('<p>1</p>');
  });
  it('should wrap text node (multiple nodes)', () => {
    const node = document.createElement('div');
    node.innerHTML = '1<p><a>2</a>3</p>4';
    service.wrapTextNodes(node);
    expect(node.innerHTML).toEqual('<span __ngwt-node-wrapper="">1</span>' +
        '<p><a>2</a><span __ngwt-node-wrapper="">3</span></p>' +
        '<span __ngwt-node-wrapper="">4</span>');
  });
  it('should add translation markers (one node)', () => {
    const node = document.createElement('div');
    node.innerHTML = '<p>1</p>';
    service.addNodeIndex(node);
    expect(node.innerHTML).toEqual('<p __ngwt-node-index="_0">1</p>');
  });
  it('should add translation markers (multiple nodes)', () => {
    const node = document.createElement('div');
    node.innerHTML = '<span>1</span><p><a>2</a><span>3</span></p><span>4</span>';
    service.addNodeIndex(node);
    expect(node.innerHTML).toEqual('<span __ngwt-node-index="_0">1</span>' +
        '<p __ngwt-node-index="_1"><a __ngwt-node-index="_0">2</a><span __ngwt-node-index="_1">3</span></p>' +
        '<span __ngwt-node-index="_2">4</span>');
  });
  it('translate', (done) => {
    service.setup(dom);
    setTimeout(() => {
      expect(h1.innerHTML).toEqual('中One<span>中1<strong>中2</strong>中3</span>');
      expect(p.innerHTML).toEqual('中Two');
      done();
    }, 1000);
  });
});
