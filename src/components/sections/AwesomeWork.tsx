import React, { useRef } from "react";
import { gsap } from "gsap";
import { SlowMo } from "gsap/EasePack";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Emitter from "@/utils/Emitter";
import Ticker from "@/utils/Ticker";

import { projectsData } from "@/constant/projects";

gsap.registerPlugin(ScrollTrigger, SlowMo, useGSAP);

interface Work {
  el: HTMLElement;
}

interface Letter {
  el: HTMLElement;
  ghosts: Ghost[];
  width: number;
  height: number;
  top: number;
  left: number;
  freq: number;
  total: number;
}

interface Ghost {
  el: HTMLElement;
  x: number;
  y: number;
  z: number;
  i: number;
  p: number;
  ap: number;
  mx: number;
  my: number;
}

interface Mask {
  width: number;
  height: number;
  maxScale: number;
  lines: Array<{ p1: { x: number; y: number }; p2: { x: number; y: number } }>;
  el: HTMLElement | null;
  svg: SVGSVGElement | null;
  pathOuter: SVGPathElement | null;
  pathInner: SVGPathElement | null;
  pathLines: SVGPathElement | null;
}

interface Point {
  x: number;
  y: number;
  dx: number;
  dy: number;
  m: number;
  flowX: number;
}

interface SectionInstance {
  el: HTMLElement | null;
  container: HTMLElement | null;
  ruler: HTMLElement | null;
  scene: HTMLElement | null;
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  title: HTMLElement | null;
  videos: NodeListOf<HTMLVideoElement> | null;
  mask: Mask;
  letters: Letter[];
  works: Work[];
  points: Point[];
  scrollProgress: number;
  smoothScrollProgress: number;
  state: number;
  last: { animationProgress: number; pointsProgress: number };
  isPaused: boolean;
  loadIsStarted: boolean;
  observer?: IntersectionObserver;
  bounding: { left: number; top: number; width: number; height: number };
  speed: number;
  animationProgress: number;
  pointsProgress: number;
  tl?: gsap.core.Timeline;
  init: () => void;
  bindEvents: () => void;
  onResize: (widthChanged: boolean) => void;
  setCtxStyle: () => void;
  setSize: () => void;
  setMask: () => void;
  setLetters: () => void;
  setWorks: () => void;
  setTimeline: () => void;
  loadNextVideo: () => void;
  videoLoaded: (video: HTMLVideoElement) => void;
  moveLetters: () => void;
  setPoints: () => void;
  movePoints: () => void;
  drawPoints: () => void;
  tick: () => void;
  destroy: () => void;
}

export const AwesomeWork = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter projects to real ones, map to works array format
  const works = projectsData.map((project, i) => ({
    caption: project.name,
    site: project.demo || project.github_link,
    src: i === 0 ? "/works/Dummy.mp4" : `/works/Pen-${i + 3}.mp4`
  }));

  useGSAP(() => {
    class Section implements SectionInstance {
      el!: HTMLElement;
      container!: HTMLElement;
      ruler!: HTMLElement;
      scene!: HTMLElement;
      canvas!: HTMLCanvasElement;
      ctx!: CanvasRenderingContext2D;
      title!: HTMLElement;
      videos!: NodeListOf<HTMLVideoElement>;
      mask!: Mask;
      letters!: Letter[];
      works!: Work[];
      points!: Point[];
      scrollProgress!: number;
      smoothScrollProgress!: number;
      state!: number;
      last!: { animationProgress: number; pointsProgress: number };
      isPaused!: boolean;
      loadIsStarted!: boolean;
      observer?: IntersectionObserver;
      bounding!: { left: number; top: number; width: number; height: number };
      speed!: number;
      animationProgress!: number;
      pointsProgress!: number;
      tl?: gsap.core.Timeline;

      constructor() {
        const currentEl = containerRef.current;
        if (!currentEl) return;
        this.el = currentEl;

        this.container = this.el.querySelector('.js-container') as HTMLElement;
        if (!this.container) return;
        this.ruler = this.el.querySelector('.js-ruler') as HTMLElement;
        this.scene = this.container.querySelector('.js-scene') as HTMLElement;
        this.canvas = this.container.querySelector('.js-canvas') as HTMLCanvasElement;
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.title = this.container.querySelector('.js-title') as HTMLElement;
        this.videos = this.container.querySelectorAll('video');

        // Properties
        this.mask = {
          width: 0,
          height: 0,
          maxScale: 1,
          lines: [],
          el: this.el.querySelector('.js-mask'),
          svg: this.el.querySelector('.js-mask-svg'),
          pathOuter: this.el.querySelector('.js-mask-path-outer'),
          pathInner: this.el.querySelector('.js-mask-path-inner'),
          pathLines: this.el.querySelector('.js-mask-path-lines'),
        };

        this.letters = [];
        if (this.title) {
          this.title.querySelectorAll('.js-letter').forEach((_letter) => {
            this.letters.push({
              el: _letter as HTMLElement,
              ghosts: [],
              width: 0,
              height: 0,
              top: 0,
              left: 0,
              freq: 0,
              total: 0
            });
          });
        }

        this.works = [];
        this.container.querySelectorAll('.js-work').forEach((_work) => {
          this.works.push({ el: _work as HTMLElement });
        });

        this.scrollProgress = 0;
        this.smoothScrollProgress = 0;
        this.state = 0;
        this.animationProgress = 0;
        this.pointsProgress = 0;
        this.bounding = { left: 0, top: 0, width: 0, height: 0 };
        this.speed = 0;
        this.last = {
          animationProgress: 0,
          pointsProgress: 0,
        };
        this.isPaused = true;
        this.loadIsStarted = false;
        this.points = [];

        // Wait array of ticks so DOM size resolves completely (fonts, flexbox, etc)
        setTimeout(() => this.init(), 100);
      }

      init() {
        this.setCtxStyle();
        this.setSize();
        this.setMask();
        this.setPoints();
        this.setLetters();
        this.setWorks();
        this.setTimeline();
        this.bindEvents();
      }

      bindEvents() {
        Emitter.on('contrastchange', this.setCtxStyle, this);
        Emitter.on('resize', this.onResize, this);

        // In React land, IntersectionObserver is usually better setup externally, 
        // but since we want identical behaviour, we mock the custom event or use native.
        this.observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            this.isPaused = !entry.isIntersecting;
            if (this.isPaused) {
              Emitter.off('tick', this.tick, this);
            } else {
              Emitter.on('tick', this.tick, this);
            }

            if (!this.loadIsStarted) {
              this.loadNextVideo();
              this.loadIsStarted = true;
            }
          });
        });

        this.observer.observe(this.el);
      }

      onResize(widthChanged: boolean) {
        if (widthChanged) {
          this.setCtxStyle();
          this.setSize();
          this.setMask();
          this.setPoints();
          this.setLetters();
          this.setWorks();
          this.setTimeline();
        }
      }

      setCtxStyle() {
        // We override the vanilla fetch with a fixed luxury color from the Next.js theme
        Ticker.nextTick(() => {
          this.ctx.strokeStyle = "rgba(147, 112, 219, 0.4)"; // matches next theme accent
        });
      }

      setSize() {
        this.el.style.setProperty('--height', this.works.length * 50 + 'lvh');
        const bounding = this.container.getBoundingClientRect();

        // safeWidth hack fallback for React context
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        this.bounding = {
          left: bounding.left,
          top: bounding.top,
          width: windowWidth,
          height: windowHeight,
        };

        this.canvas.width = this.bounding.width;
        this.canvas.height = this.bounding.height;
        this.speed = Math.hypot(this.bounding.width, this.bounding.height) * 4;
      }

      setMask() {
        const { mask } = this;
        if (!mask.el || !mask.svg || !mask.pathOuter || !mask.pathInner || !mask.pathLines) return;
        const width = mask.el.clientWidth;
        const height = mask.el.clientHeight;

        mask.width = width;
        mask.height = height;
        mask.svg.style.width = mask.width + 'px';
        mask.svg.style.height = mask.height + 'px';

        const elBounding = this.el.getBoundingClientRect();
        const rulerBounding = this.ruler.getBoundingClientRect();
        const rulerWidth = rulerBounding.width;
        const rulerHeight = rulerBounding.height;
        const offsetX = rulerBounding.left - elBounding.left;
        const offsetY = rulerBounding.top - elBounding.top;

        const dOuter = `M -1 0 L ${width + 2} 0 L ${width + 2} ${height} L -1 ${height} Z`;
        const corners = {
          tl: { x: offsetX, y: offsetY },
          tr: { x: offsetX + rulerWidth, y: offsetY },
          br: { x: offsetX + rulerWidth, y: offsetY + rulerHeight },
          bl: { x: offsetX, y: offsetY + rulerHeight },
        };

        let size = (corners.tr.x - corners.tl.x) / 2;
        mask.maxScale = window.innerWidth / size;

        let dInner = `M ${corners.tl.x} ${corners.tl.y + size} A ${size} ${size} 0 0 1 ${corners.tr.x} ${corners.tr.y + size} L ${corners.br.x} ${corners.br.y - size} A ${size} ${size} 0 0 1 ${corners.bl.x} ${corners.bl.y - size} Z`;
        const linesClip = `${dOuter} ${dInner}`;
        mask.pathOuter.setAttribute('d', `${dOuter} ${dInner}`);

        const thickness = window.innerWidth > 767 ? 16 : 8;
        corners.tl.x += thickness; corners.tl.y += thickness;
        corners.tr.x -= thickness; corners.tr.y += thickness;
        corners.br.x -= thickness; corners.br.y -= thickness;
        corners.bl.x += thickness; corners.bl.y -= thickness;

        size = (corners.tr.x - corners.tl.x) / 2;
        dInner = `M ${corners.tl.x} ${corners.tl.y + size} A ${size} ${size} 0 0 1 ${corners.tr.x} ${corners.tr.y + size} L ${corners.br.x} ${corners.br.y - size} A ${size} ${size} 0 0 1 ${corners.bl.x} ${corners.bl.y - size} Z`;
        mask.pathInner.setAttribute('d', `${dOuter} ${dInner}`);

        mask.lines = [];
        const vLines = window.innerWidth > 767 ? 12 : 8;
        const gapX = width / vLines;
        const gapY = height * 0.1;
        const hLines = Math.ceil(height / gapY);

        for (let i = 1; i < vLines; i++) {
          mask.lines.push({ p1: { x: gapX * i, y: 0 }, p2: { x: gapX * i, y: height } });
        }
        for (let i = 0; i < hLines; i++) {
          mask.lines.push({ p1: { x: 0, y: gapY * i }, p2: { x: width, y: gapY * i } });
        }

        let dLines = '';
        mask.lines.forEach((line) => {
          dLines += `M ${line.p1.x} ${line.p1.y} L ${line.p2.x} ${line.p2.y} `;
        });
        mask.pathLines.setAttribute('d', dLines);
        mask.pathLines.style.clipPath = `path(evenodd, '${linesClip}')`;
      }

      setLetters() {
        const { letters, scene } = this;
        letters.forEach((letter, j) => {
          letter.ghosts.forEach((ghost) => { ghost.el.remove(); });
          letter.ghosts = [];

          const bounding = letter.el.getBoundingClientRect();
          letter.width = bounding.width;
          letter.height = bounding.height;
          letter.top = bounding.top - this.bounding.top;
          letter.left = bounding.left;
          letter.freq = 1 + Math.random();

          const multiplier = window.innerWidth > 767 ? 0.75 : 0.5;
          letter.total = Math.round((this.bounding.width / letter.width) * multiplier) + 2;

          for (let i = 0; i < letter.total; i++) {
            const el = document.createElement('span');
            el.classList.add('s__scene__letter', 'js-letter');
            el.innerText = letter.el.innerText;
            scene.appendChild(el);

            const ghost = {
              el,
              x: letter.left,
              y: letter.top,
              z: Math.random() * 100,
              i: i - letter.total * 0.5,
              p: (i / letter.total - 0.5) * 2,
              ap: Math.abs(i / letter.total - 0.5) * 2,
              mx: 0,
              my: 0,
            };

            el.style.top = ghost.y + 'px';
            el.style.left = ghost.x + 'px';
            el.style.zIndex = String(j !== 1 && j !== 2 && (j + letters.length + i) % 5 === 0 ? 3 : 1);
            el.style.setProperty('--ix', String(ghost.i));
            el.style.setProperty('--iy', String(((j + 1) / (letters.length + 1) - 0.5) * 2));
            el.style.setProperty('--ap', String(ghost.ap));
            el.style.setProperty('--p', String(ghost.p));

            letter.ghosts.push(ghost);
          }
        });
      }

      setWorks() {
        this.works.forEach((work, i) => {
          const el = work.el;
          el.style.setProperty('--size', String(0.5 + Math.random() * 0.5));
          el.style.setProperty('--y', String((0.5 + Math.random() * 0.5) * (i % 2 ? -1 : 1)));
        });
      }

      setTimeline() {
        const { el, container, works, scene, mask } = this;
        const worksEl = works.map((work) => work.el);
        let { tl } = this;
        if (tl) tl.kill();

        tl = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: 'top 25%',
            end: 'bottom 75%',
            scrub: 1,
          },
          onUpdate: () => {
            scene.style.setProperty('--state', String(this.state));
          },
        });

        tl.fromTo(mask.el, { scale: 1 }, { scale: mask.maxScale, duration: 0.75, ease: 'power4.in' }, 0);
        tl.fromTo(scene, { scale: 0.75 }, { scale: 1, duration: 0.75, ease: 'power3.in' }, 0);
        tl.fromTo(container, { clipPath: 'inset(0 1rem)' }, { clipPath: 'inset(0 0rem)', duration: 0.75, ease: 'power3.in' }, 0);
        tl.fromTo(this, { pointsProgress: 0 }, { pointsProgress: 1, duration: 1, ease: 'power4.inOut' }, 0);
        tl.fromTo(this, { state: 0 }, { state: 1, duration: 0.75, ease: 'power4.in' }, 0);
        tl.fromTo(worksEl, { attr: { progress: 1 } }, { attr: { progress: -1 }, ease: 'slow(0.15, 0.6)', stagger: 0.25 }, 0.75);
        tl.fromTo(this, { animationProgress: 0 }, { animationProgress: 10000, duration: tl.totalDuration(), ease: 'power1.out' }, 0.75);
        tl.fromTo(this, { state: 1 }, { state: 0, duration: 0.75, ease: 'power4.inOut', immediateRender: false }, '-=1');
        tl.fromTo(mask.el, { scale: mask.maxScale }, { scale: 1, duration: 0.75, ease: 'power4.inOut', immediateRender: false }, '-=1');
        tl.fromTo(scene, { scale: 1 }, { scale: 0.75, duration: 0.75, ease: 'power3.inOut', immediateRender: false }, '-=1');
        tl.fromTo(container, { clipPath: 'inset(0 0rem)' }, { clipPath: 'inset(0 1rem)', duration: 0.75, ease: 'power3.inOut', immediateRender: false }, '-=1');
        tl.fromTo(this, { pointsProgress: 1 }, { pointsProgress: 0, duration: 1, ease: 'power4.inOut' }, '-=1');
        this.tl = tl;
      }

      loadNextVideo() {
        const video = Array.from(this.videos).find((v) => !v.classList.contains('is-loaded'));
        if (video) {
          if (video.readyState >= 3) {
            this.videoLoaded(video);
          } else {
            video.addEventListener('canplaythrough', () => this.videoLoaded(video), { once: true });
            const dataSrc = video.getAttribute('data-src');
            if (dataSrc) {
              video.setAttribute('src', dataSrc);
              video.load();
            }
          }
        }
      }

      videoLoaded(video: HTMLVideoElement) {
        video.classList.add('is-loaded');
        this.loadNextVideo();
      }

      moveLetters() {
        const { speed, letters, animationProgress } = this;
        letters.forEach((letter) => {
          const letterSpeed = speed * letter.freq;
          letter.ghosts.forEach((ghost, index) => {
            const progress = (((animationProgress % letterSpeed) / letterSpeed + index / letter.total) % 1) / 0.7 - 0.15;
            ghost.el.style.setProperty('--progress', String(progress));
          });
        });
      }

      setPoints() {
        const { bounding } = this;
        this.points = [];
        const gap = 24;
        const cols = Math.ceil((bounding.width * 1.2) / gap);
        const rows = Math.ceil((bounding.height * 1.2) / gap);
        const offsetX = (bounding.width - cols * gap) * 0.5;
        const offsetY = (bounding.height - rows * gap) * 0.5;
        const hWidth = bounding.width * 0.5;
        const hHeight = bounding.height * 0.5;

        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++) {
            const x = i * gap + offsetX;
            const y = j * gap + offsetY;
            this.points.push({ x, y, dx: hWidth - x, dy: hHeight - y, m: Math.random(), flowX: 0 });
          }
        }
      }

      movePoints() {
        const { points, animationProgress } = this;
        points.forEach((p) => {
          p.flowX = (animationProgress * -0.05) % 24;
        });
      }

      drawPoints() {
        const { bounding, ctx, points, animationProgress, pointsProgress, last } = this;
        const rAnimationProgress = Math.round(animationProgress * 100) / 100;
        const rPointsProgress = Math.round(pointsProgress * 100) / 100;
        if (rPointsProgress === last.pointsProgress && rAnimationProgress === last.animationProgress) return;

        ctx.clearRect(0, 0, bounding.width, bounding.height);
        ctx.beginPath();
        points.forEach((point) => {
          const x = point.x + point.dx * (1 - pointsProgress) * 0.2 + point.flowX;
          const y = point.y + point.dy * (1 - pointsProgress) * 0.2;
          ctx.rect(x, y, 0.5, 0.5);
        });
        ctx.stroke();

        last.pointsProgress = rPointsProgress;
        last.animationProgress = rAnimationProgress;
      }

      tick() {
        this.scrollProgress = Math.max(Math.min(1, ScrollTrigger.positionInViewport(this.el, 'top')), 0) * -1 +
          (1 - Math.max(Math.min(1, ScrollTrigger.positionInViewport(this.el, 'bottom')), 0));
        this.smoothScrollProgress += (this.scrollProgress - this.smoothScrollProgress) * 0.1;
        this.el.style.setProperty('--scroll-progress', String(this.scrollProgress));
        this.movePoints();
        this.moveLetters();
        this.drawPoints();
      }

      destroy() {
        if (this.tl) this.tl.kill();
        if (this.observer) this.observer.disconnect();
        Emitter.off('contrastchange', this.setCtxStyle, this);
        Emitter.off('resize', this.onResize, this);
        Emitter.off('tick', this.tick, this);
        // clear scenes etc.
        if (this.scene) {
          const manualLetters = this.scene.querySelectorAll('.s__scene__letter');
          manualLetters.forEach(l => l.remove());
        }
      }
    }

    // Auto-setup ticker loops
    let animationFrameId: number;
    const sysTick = (time: number) => {
      Ticker.tick(time);
      animationFrameId = requestAnimationFrame(sysTick);
    };
    animationFrameId = requestAnimationFrame(sysTick);

    const instance = new Section();

    return () => {
      instance.destroy();
      cancelAnimationFrame(animationFrameId);
    };
  }, { scope: containerRef });

  return (
    <div className="relative overflow-hidden w-full backdrop-blur-3xl glass-card rounded-3xl" style={{ marginTop: '100px' }}>
      <section id="work" className="s-work" ref={containerRef}>
        <div className="s__outer">
          <div className="s__inner js-container">
            <h2 className="s__title">
              <span className="s__title__inner js-title">
                <span className="s__title__letter js-letter">W</span>
                <span className="s__title__letter js-letter">O</span>
                <span className="s__title__letter js-letter">R</span>
                <span className="s__title__letter js-letter">K</span>
              </span>
            </h2>

            <div className="s__scene js-scene">
              {works.map((work, index) => (
                <div key={work.caption} className="s__scene__work s__scene__work--video js-work a-work">
                  <div className="a__inner">
                    <a href={work.site} target="_blank" rel="noopener noreferrer">
                      <video
                        data-src={work.src}
                        className="a__video js-video"
                        loop
                        muted
                        playsInline
                        width="1082"
                        height="636"
                      ></video>
                      <div className="a__caption">
                        <div className="a__caption__text">{work.caption}</div>
                        <div className="a__caption__key">
                          #{String(index + 1).padStart(4, "0")}
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
              ))}
            </div>
            {/* .s__scene */}

            <canvas className="s__canvas js-canvas"></canvas>
          </div>
          {/* .s__inner */}

          <div className="s__mask-outer">
            <div className="s__mask js-mask">
              <svg className="s__mask__svg js-mask-svg">
                <path className="s__mask__path-inner js-mask-path-inner" d=""></path>
                <path className="s__mask__path-outer js-mask-path-outer" d=""></path>
                <path className="s__mask__path-lines js-mask-path-lines" d=""></path>
              </svg>
            </div>
          </div>
          {/* .s__mask-outer */}

          <div className="s__ruler js-ruler"></div>
        </div>
        {/* .s__outer */}
      </section>
    </div>
  );
};
