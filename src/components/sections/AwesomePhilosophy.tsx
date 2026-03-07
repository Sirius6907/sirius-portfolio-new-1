import React, { useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import Emitter from "@/utils/Emitter";
import Ticker from "@/utils/Ticker";

gsap.registerPlugin(useGSAP);

interface ObjInstance {
  el: HTMLElement;
  parent: SectionInstance;
  index: number;
  s: number;
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  vz: number;
  vx: number;
  vy: number;
  vrx: number;
  vry: number;
  isWaiting: boolean;
  isDragging: boolean;
  isVanishing: boolean;
  vanishStart: number;
  vanishDelay: number;
  set: (fromScratch?: boolean) => void;
  move: (time: number) => void;
}

interface SectionInstance {
  el: HTMLElement | null;
  svg: SVGElement | null;
  objectsWrapper: HTMLElement | null;
  ruler: HTMLElement | null;
  objects: ObjInstance[];
  canThrow: boolean;
  lastThrow: number;
  throwDelay: number;
  thrownObjects: ObjInstance[];
  draggedObject: ObjInstance | null;
  smiley: {
    el: HTMLElement | null;
    bounding: DOMRect | null;
    rel: { x: number; y: number };
  };
  lines: {
    circularPath: SVGPathElement | null;
    lines: Array<{ p1: { x: number; y: number }; p2: { x: number; y: number } }>;
  };
  mouse: { x: number; y: number; oy: number; sx: number; sy: number; d: number; set: boolean };
  isPaused: boolean;
  observer?: IntersectionObserver;
  bounding: { left: number; top: number; width: number; height: number };
  scroll: { start: number; end: number; p: number; sp: number };
  lastTouch: number;
  init: () => void;
  bindEvents: () => void;
  onMouseMove: (x: number, y: number) => void;
  onTouchMove: (e: any) => void;
  updateMousePosition: (x: number, y: number) => void;
  onResize: () => void;
  onScroll: (scrollY: number) => void;
  setSize: () => void;
  setScroll: () => void;
  setLines: () => void;
  drawLines: () => void;
  throwObject: () => void;
  firstObjects: () => void;
  objectMoveEnd: (object: ObjInstance) => void;
  objectDragStart: (e: MouseEvent | TouchEvent) => void;
  objectDragEnd: () => void;
  tick: (time: number) => void;
  destroy: () => void;
}

export const AwesomePhilosophy = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const frames = [
    { caption: 'Late night coding sessions', src: '/frames/art-1987.jpg' },
    { caption: 'React component architecture', src: '/frames/art-dtyw.jpg' },
    { caption: 'When the code finally compiles', src: '/frames/roar.jpg' },
    { caption: 'First time deploying to AWS', src: '/frames/setup-2006.jpg' },
    { caption: 'My developer setup', src: '/frames/setup-2016.jpg' },
    { caption: 'Debugging in production', src: '/frames/setup-2020.jpg' },
    { caption: 'Building the next big thing', src: '/frames/portfolio-2014.jpg' },
    { caption: 'Mastering SAP ABAP Cloud', src: '/frames/portfolio-2011.jpg' },
    { caption: 'Optimizing MERN stack apps', src: '/frames/portfolio-2017.jpg' },
    { caption: 'Refactoring legacy code', src: '/frames/portfolio-2021.jpg' },
    { caption: 'Building scalable microservices', src: '/frames/legos.jpg' },
    { caption: 'Tinkering with GSAP animations', src: '/frames/waaark.png' }
  ];

  useGSAP(() => {
    class Section implements SectionInstance {
      el!: HTMLElement;
      svg!: SVGElement;
      objectsWrapper!: HTMLElement;
      ruler!: HTMLElement;
      objects!: ObjInstance[];
      canThrow!: boolean;
      lastThrow!: number;
      throwDelay!: number;
      thrownObjects!: ObjInstance[];
      draggedObject!: ObjInstance | null;
      smiley!: {
        el: HTMLElement | null;
        bounding: DOMRect | null;
        rel: { x: number; y: number };
      };
      lines!: {
        circularPath: SVGPathElement | null;
        lines: Array<{ p1: { x: number; y: number }; p2: { x: number; y: number } }>;
      };
      mouse!: { x: number; y: number; oy: number; sx: number; sy: number; d: number; set: boolean };
      isPaused!: boolean;
      observer?: IntersectionObserver;
      bounding!: { left: number; top: number; width: number; height: number };
      scroll!: { start: number; end: number; p: number; sp: number };
      lastTouch!: number;

      constructor() {
        const currentEl = containerRef.current;
        if (!currentEl) return;
        this.el = currentEl;

        this.svg = this.el.querySelector('.js-svg') as SVGElement;
        this.objectsWrapper = this.el.querySelector('.js-objects') as HTMLElement;
        this.ruler = this.el.querySelector('.js-ruler') as HTMLElement;

        this.objects = [];
        if (this.objectsWrapper) {
          Array.from(this.objectsWrapper.querySelectorAll('.a-object')).forEach((el) => {
            this.objects.push(new Obj(el as HTMLElement, this));
          });
        }

        this.canThrow = false;
        this.lastThrow = 0;
        this.throwDelay = 2000;
        this.thrownObjects = [];
        this.draggedObject = null;

        this.smiley = {
          el: this.el.querySelector('.js-smiley'),
          bounding: null,
          rel: { x: 0, y: 0 },
        };

        this.lines = {
          circularPath: this.el.querySelector('.js-lines-circular-path') as SVGPathElement,
          lines: [],
        };

        this.mouse = { x: 0, y: 0, oy: 0, sx: 0, sy: 0, d: 0, set: false };
        this.isPaused = true;
        this.bounding = { left: 0, top: 0, width: 0, height: 0 };
        this.scroll = { start: 0, end: 0, p: 0, sp: 0 };
        this.lastTouch = 0;

        setTimeout(() => this.init(), 100);
      }

      init() {
        this.setSize();
        this.setScroll();
        this.setLines();
        this.bindEvents();
        this.firstObjects();
      }

      bindEvents() {
        Emitter.on('mousemove', this.onMouseMove, this);
        Emitter.on('resize', this.onResize, this);
        Emitter.on('scroll', this.onScroll, this);

        this.objects.forEach((object) => {
          object.el.addEventListener('mousedown', this.objectDragStart.bind(this));
          object.el.addEventListener('touchstart', this.objectDragStart.bind(this), { passive: false });
        });

        window.addEventListener('mouseup', this.objectDragEnd.bind(this));
        window.addEventListener('touchend', this.objectDragEnd.bind(this));

        this.objectsWrapper.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });

        this.observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            this.isPaused = !entry.isIntersecting;
            this.canThrow = entry.isIntersecting;
            if (!this.isPaused) {
              this.thrownObjects.forEach((o) => { o.isWaiting = false; });
            }
          });
        });
        this.observer.observe(this.el);
      }

      onMouseMove(x: number, y: number) {
        this.updateMousePosition(x, y);
      }

      onTouchMove(e: any) {
        const delta = performance.now() - this.lastTouch;
        if (delta < Ticker.delta) return;
        const touch = e.touches ? (e.touches[0] as Touch) : (e as MouseEvent);
        if (touch) this.updateMousePosition(touch.clientX, touch.clientY);
        this.lastTouch = performance.now();
      }

      updateMousePosition(x: number, y: number) {
        this.mouse.x = x - this.bounding.left;
        this.mouse.y = y - this.mouse.oy + window.scrollY;
        if (!this.mouse.set) {
          this.mouse.sx = this.mouse.x;
          this.mouse.sy = this.mouse.y;
          this.mouse.set = true;
        }
      }

      onResize() {
        this.setSize();
        this.setScroll();
        this.setLines();
      }

      onScroll(scrollY: number) {
        const trigger = scrollY + window.innerHeight;
        if (trigger < this.scroll.start) {
          this.scroll.p = 0;
        } else if (trigger > this.scroll.end) {
          this.scroll.p = 1;
        } else {
          this.scroll.p = (trigger - this.scroll.start) / (this.scroll.end - this.scroll.start);
        }
      }

      setSize() {
        const bounding = this.el.getBoundingClientRect();
        this.bounding = { left: bounding.left, top: bounding.top, width: bounding.width, height: bounding.height };
        this.svg.style.width = this.bounding.width + 'px';
        this.svg.style.height = this.bounding.height + 'px';
        if (this.smiley.el) {
          this.smiley.bounding = this.smiley.el.getBoundingClientRect();
          this.smiley.rel.x = this.smiley.bounding.left - this.bounding.left + this.smiley.bounding.width / 2;
          this.smiley.rel.y = this.smiley.bounding.top - this.bounding.top + this.smiley.bounding.height / 2;
        }
        this.mouse.oy = this.bounding.top + window.scrollY;

        const pOriginY = this.ruler.clientHeight || 0;
        this.objectsWrapper.style.perspectiveOrigin = `50% ${pOriginY}px`;
      }

      setScroll() {
        this.scroll = {
          start: this.bounding.top + window.scrollY,
          end: this.bounding.top + window.scrollY + this.bounding.height + window.innerHeight,
          p: 0,
          sp: 0,
        };
        this.onScroll(window.scrollY);
        this.scroll.sp = this.scroll.p;
      }

      setLines() {
        this.lines.lines = [];
        const vLines = window.innerWidth > 767 ? 12 : 8;
        const gapX = this.bounding.width / vLines;

        for (let i = 0; i <= vLines; i++) {
          this.lines.lines.push({ p1: { x: gapX * i, y: 0 }, p2: { x: this.smiley.rel.x, y: this.smiley.rel.y } });
          this.lines.lines.push({ p1: { x: gapX * i, y: this.bounding.height }, p2: { x: this.smiley.rel.x, y: this.smiley.rel.y } });
        }

        const dx = this.bounding.width;
        const dy = (this.bounding.height - this.smiley.rel.y) / 2;
        this.el.style.setProperty('--distortion', String(Math.hypot(dx, dy) * 0.14));

        const hLines = vLines;
        const gapY = this.bounding.height / hLines;
        const offsetY = (this.bounding.height - gapY * hLines) / 2;

        for (let i = 1; i < hLines; i++) {
          this.lines.lines.push({ p1: { x: 0, y: offsetY + gapY * i }, p2: { x: this.smiley.rel.x, y: this.smiley.rel.y } });
          this.lines.lines.push({ p1: { x: this.bounding.width, y: offsetY + gapY * i }, p2: { x: this.smiley.rel.x, y: this.smiley.rel.y } });
        }
        this.drawLines();
      }

      drawLines() {
        let d = `M 0 ${this.bounding.height} L ${this.bounding.width} ${this.bounding.height} `;
        this.lines.lines.forEach((line) => {
          d += `M ${line.p1.x} ${line.p1.y} L ${line.p2.x} ${line.p2.y} `;
        });
        if (this.lines.circularPath) this.lines.circularPath.setAttribute('d', d);
      }

      throwObject() {
        if (this.objects.length > 0) {
          const obj = this.objects.splice(Math.floor(Math.random() * this.objects.length), 1)[0];
          obj.set();
          this.thrownObjects.push(obj);
        }
        this.lastThrow = performance.now();
        const rate = window.innerWidth > 767 ? 1 : 2;
        this.throwDelay = (500 + Math.random() * 500) * rate;
      }

      firstObjects() {
        const totalObjects = Math.max(Math.min(Math.round(window.innerWidth * 0.025), 5), 2);
        for (let i = 0; i < totalObjects; i++) {
          const obj = this.objects.splice(Math.floor(Math.random() * this.objects.length), 1)[0];
          if (obj) {
            obj.set(false);
            this.thrownObjects.push(obj);
          }
        }
      }

      objectMoveEnd(object: ObjInstance) {
        this.thrownObjects.splice(this.thrownObjects.indexOf(object), 1);
        this.objects.push(object);
      }

      objectDragStart(e: any) {
        this.lastTouch = performance.now();
        if (!(e instanceof MouseEvent)) {
          this.onTouchMove(e);
        }
        const el = e.currentTarget as HTMLElement;
        const obj = this.thrownObjects.find((o) => o.el === el);
        if (obj && !obj.isDragging && !obj.isVanishing) {
          this.draggedObject = obj;
          obj.isDragging = true;
          el.classList.add('is-dragging');
        }
      }

      objectDragEnd() {
        const obj = this.draggedObject;
        if (obj) {
          obj.isDragging = false;
          obj.el.classList.remove('is-dragging');
          obj.isVanishing = true;
          obj.el.classList.add('is-vanishing');
          obj.vanishStart = performance.now();
          this.draggedObject = null;
        }
      }

      tick(time: number) {
        this.mouse.sx += (this.mouse.x - this.mouse.sx) * 0.1;
        this.mouse.sy += (this.mouse.y - this.mouse.sy) * 0.1;
        this.mouse.d = Math.hypot(this.mouse.x - this.mouse.sx, this.mouse.y - this.mouse.sy);

        this.scroll.sp += (this.scroll.p - this.scroll.sp) * 0.1;
        this.el.style.setProperty('--scroll-progress', String(this.scroll.sp));

        this.thrownObjects.forEach((obj) => obj.move(time));

        if (this.isPaused) return;
        if (this.canThrow && time - this.lastThrow > this.throwDelay) {
          this.throwObject();
        }
      }

      destroy() {
        if (this.observer) this.observer.disconnect();
        window.removeEventListener('mouseup', this.objectDragEnd);
        window.removeEventListener('touchend', this.objectDragEnd);
      }
    }

    class Obj implements ObjInstance {
      el: HTMLElement;
      parent: SectionInstance;
      index: number;
      s!: number;
      x!: number;
      y!: number;
      z!: number;
      rx!: number;
      ry!: number;
      rz!: number;
      vz!: number;
      vx!: number;
      vy!: number;
      vrx!: number;
      vry!: number;
      isWaiting!: boolean;
      isDragging!: boolean;
      isVanishing!: boolean;
      vanishStart!: number;
      vanishDelay!: number;

      constructor(el: HTMLElement, parent: SectionInstance) {
        this.parent = parent;
        this.el = el;
        this.index = Array.from(this.el.parentElement?.children || []).indexOf(this.el);
        this.set(true);
      }

      set(fromScratch = true) {
        this.el.style.setProperty('--size', String(0.5 + Math.random() * 0.5));
        this.s = 0;
        this.x = 0;
        this.y = 0;
        this.z = -20000;
        this.rx = 90;
        this.ry = Math.random() * 2 - 1;
        this.rz = 0;
        this.vz = 40 + Math.random() * 10;
        this.vx = Math.random() * window.innerWidth * 0.0025 * (this.index % 2 ? -1 : 1);
        this.vy = Math.random() * window.innerHeight * 0.0025 * (this.index % 3 ? -1 : 1);
        this.vrx = 0.25 + Math.random() * 1;
        this.vry = 0.25 + Math.random() * 1;
        this.isWaiting = false;
        this.isDragging = false;
        this.isVanishing = false;
        this.el.classList.remove('is-waiting', 'is-dragging', 'is-vanishing');
        this.vanishStart = 0;
        this.vanishDelay = 1000;

        if (!fromScratch) {
          this.isWaiting = true;
          this.s = 1;
          this.x = this.vx * Math.random() * 200;
          this.y = this.vy * Math.random() * 200;
          this.rx = Math.random() * 360;
          this.ry = Math.random() * 360;
          this.z = Math.random() * -20000;
        }
        this.el.style.setProperty('--s', String(this.s));
      }

      move(time: number) {
        if (this.isWaiting) return;

        if (this.isDragging) {
          const x = this.parent.mouse.x - this.parent.smiley.rel.x;
          const y = this.parent.mouse.y - this.parent.smiley.rel.y * 1.5;
          this.vx += (x - this.x) * 0.075;
          this.vy += (y - this.y) * 0.075;
          this.vz += (0 - this.z) * 0.3;
          this.ry = this.vx * 0.15;
          this.rx = this.vy * -0.15;
          this.rz = this.ry + this.rx;
          this.vx *= 0.9;
          this.vy *= 0.9;
          this.vz *= 0.75;
          this.x += this.vx * 0.5;
          this.y += this.vy * 0.5;
          this.z += this.vz * 0.25;
          this.z = Math.min(this.z, 500);
          this.s += (1 - this.s) * 0.5;
        } else if (this.isVanishing) {
          this.vy += 0.5;
          this.x += this.vx;
          this.y += this.vy;
          this.rx += this.vrx;
          this.ry += this.vry;
          if (time - this.vanishStart > this.vanishDelay) {
            this.isWaiting = true;
            this.el.classList.add('is-waiting');
            this.parent.objectMoveEnd(this);
          }
        } else {
          if (this.z > 1000) {
            this.isWaiting = true;
            this.el.classList.add('is-waiting');
            this.parent.objectMoveEnd(this);
          } else {
            this.s += 0.005;
            this.s = Math.min(this.s, 1);
            this.z += this.vz;
            this.x += this.vx;
            this.y += this.vy;
            this.rx += this.vrx;
            this.ry += this.vry;
          }
        }

        this.el.style.setProperty('--x', this.x + 'px');
        this.el.style.setProperty('--y', this.y + 'px');
        this.el.style.setProperty('--z', this.z + 'px');
        this.el.style.setProperty('--rx', String(this.rx));
        this.el.style.setProperty('--ry', String(this.ry));
        this.el.style.setProperty('--rz', String(this.rz));
        this.el.style.setProperty('--s', String(this.s));
      }
    }

    // Global event listeners for mock Emitter/Ticker native bindings
    const handleScroll = () => Emitter.emit('scroll', window.scrollY);
    const handleMouseMove = (e: MouseEvent) => Emitter.emit('mousemove', e.clientX, e.clientY);
    const handleResize = () => Emitter.emit('resize', window.innerWidth, window.innerHeight);

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', (e: MouseEvent) => handleMouseMove(e), { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    let animationFrameId: number;
    const sysTick = (time: number) => {
      Ticker.tick(time);
      Emitter.emit('tick', time);
      animationFrameId = requestAnimationFrame(sysTick);
    };
    animationFrameId = requestAnimationFrame(sysTick);

    const instance = new Section();

    return () => {
      instance.destroy();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, { scope: containerRef });

  return (
    <div className="relative overflow-hidden w-full backdrop-blur-3xl glass-card rounded-3xl mt-12 mb-24">
      <section className="s-my-way" data-intersect ref={containerRef}>
        <svg
          className="s__smiley js-smiley"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 77.8 77.8"
          xmlSpace="preserve"
        >
          <circle cx="38.9" cy="38.9" r="38.9"></circle>
          <path d="M38.9 77.8c-2 0-4.1-.2-6.2-.5C11.6 73.9-2.9 53.9.5 32.8 2.1 22.5 7.7 13.5 16.1 7.4c8.4-6.1 18.7-8.5 29-6.9 10.3 1.6 19.3 7.2 25.4 15.6 6.1 8.4 8.5 18.7 6.9 29-3.1 19.1-19.7 32.7-38.5 32.7zM38.8 1c-7.9 0-15.6 2.5-22.1 7.2C8.5 14.1 3.1 22.9 1.5 32.9-1.8 53.5 12.3 73 32.9 76.3 53.5 79.6 73 65.5 76.3 44.9l.5.1-.5-.1c1.6-10-.8-20-6.7-28.2S54.9 3.1 44.9 1.5c-2-.3-4.1-.5-6.1-.5zM25.5 23.1c-1.9 0-3.5 2-4.1 5.1l-.1.3 3 2.2-2.9 2.2.1.3c.6 2.5 1.5 5.1 4.1 5.1 2.4 0 4.2-3.3 4.2-7.6s-2.4-7.6-4.3-7.6zm26.6 0c-1.9 0-3.5 2-4.1 5.1v.3l3 2.2-3 2.2.1.3c.6 2.5 1.5 5.1 4.1 5.1 2.4 0 4.2-3.3 4.2-7.6s-2.3-7.6-4.3-7.6zM62 39c0-.3-.2-.5-.5-.5s-.5.2-.5.5c0 12.2-9.9 22.1-22.1 22.1-12.2 0-22.1-9.9-22.1-22.1 0-.3-.2-.5-.5-.5s-.5.2-.5.5c0 12.7 10.4 23.1 23.1 23.1S62 51.7 62 39z"></path>
        </svg>

        <div className="s__objects js-objects">
          {frames.map((frame, index) => (
            <div key={index} className="a-object a-object--frame">
              <figure className="a__inner">
                <Image src={frame.src} alt={frame.caption} width={400} height={300} className="a__img" unoptimized />
                <figcaption className="a__caption" dangerouslySetInnerHTML={{ __html: frame.caption }} />
              </figure>
              <div className="a__side a__side--vertical" />
              <div className="a__side a__side--horizontal" />
            </div>
          ))}

          {Array(10).fill(0).map((_, index) => (
            <div key={`star-${index}`} className="a-object a-object--star">
              <div className="a__side a__side--top-left" />
              <div className="a__side a__side--top-right" />
              <div className="a__side a__side--bottom-left" />
              <div className="a__side a__side--bottom-right" />
            </div>
          ))}

          <div className="s__ruler js-ruler"></div>
        </div>

        <div className="s__catcher">
          <div className="s__catcher__distorted-wrapper">
            <div className="s__catcher__distorted">
              <div className="s__catcher__text s__catcher__text--distorted">
                Code<br />Build<br />Ship<br />Repeat
              </div>
            </div>
          </div>
          <div className="s__catcher__normal-wrapper">
            <div className="s__catcher__normal">
              <div className="s__catcher__text s__catcher__text--normal">
                Code<br />Build<br />Ship<br />Repeat
              </div>
            </div>
          </div>
        </div>

        <svg className="s__svg js-svg">
          <path className="s__svg__circular-path js-lines-circular-path" d=""></path>
        </svg>
      </section>
    </div>
  );
};
