# ✨ Sirius Portfolio 2025

**A High-Fidelity Technical Demonstration of Modern Frontend Engineering.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![GSAP](https://img.shields.io/badge/Animations-GSAP-green?style=for-the-badge)](https://greensock.com/gsap/)
[![Vercel](https://img.shields.io/badge/Cloud-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/)

---

## ⚡ 30-Second Executive Summary
The Sirius Portfolio is a high-performance interactive brand experience designed to showcase **Next.js 15 App Router** capabilities, **GSAP motion orchestration**, and **WebGL-enhanced** UI patterns. It is a live proof-of-concept for bridging high-end design aesthetics with deterministic engineering.

**Primary Impact**: Demonstrates 90+ Lighthouse scores for Performance, Accessibility, and SEO while maintaining a high-fidelity visual experience.

---

## 🏗️ Engineering Deep Dive (5-Minute Value)

### Architecture & Ownership
I architected this portfolio to prove that visual complexity shouldn't sacrifice performance. Every interaction is choreographed to minimize main-thread blocking and layout shifts.

*   **Motion Orchestration**: Implemented a centralized GSAP timeline manager to sync scroll-triggered animations with UI state transitions.
*   **3D Integration**: Designed custom Three.js/R3F components that utilize deferred loading to maintain high Core Web Vitals.
*   **Type Safety**: Built with strict TypeScript/Next.js conventions to ensure zero runtime hydration errors.

### Technical Challenges Solved
*   **Asset Optimization**: Leveraged Next/Image and intelligent pre-fetching strategies to keep initial bundle sizes low despite high-res assets.
*   **Scroll Normalization**: Integrated Lenis for cross-browser scroll consistency, ensuring the motion feels "premium" regardless of the user's device.

---

## 🛠️ Feature Stack
- **Scroll-Triggered Storytelling**: Centralized animation choreographing.
- **Interactive 3D Elements**: Specialized R3F/Three.js engagement layers.
- **Performance First Architecture**: Optimized for the Next.js 15 App Router lifecycle.

---

## 💻 Installation

### 1. Prerequisites
- Node.js v20+
- pnpm

### 2. Setup
```bash
git clone https://github.com/Sirius6907/sirius-portfolio-new-1.git
cd sirius-portfolio-new-1
pnpm install
```

### 3. Run
```bash
pnpm dev
```

---

## 👔 Engineering Ownership Narrative (Interview Defense)
*   "I designed the motion system using GSAP, prioritizing 60fps fluidity across all device tiers."
*   "I personally architected the Next.js 15 structure to utilize Server Components where possible, minimizing client-side JavaScript overhead."
*   "I implemented the custom WebGL background shaders to add depth without impacting the accessibility of the text layers."

---

*"Where design meets deterministic engineering."*
