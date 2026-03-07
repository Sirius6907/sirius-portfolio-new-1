"use client";

import { Fragment, useState, useEffect } from "react";

import { Navbar, Footer } from "@/components/common";
import {
  Hero,
  About,
  Skills,
  Education,
  SkillsProgress,
  Experience,
  AwesomeWork,
  AwesomePhilosophy,
  Certifications,
  Achievements,
  Contact,
} from "@/components/sections";
import { PreLoader, Background } from "@/components/common";

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTimer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(loadTimer);
  }, []);

  if (loading) return <PreLoader />;

  return (
    <div className="min-h-screen relative">
      <Background />
      <Fragment>
        <Navbar />
        <Hero />
        <About />
        <Education />
        <SkillsProgress />
        <Skills />
        <Experience />
        <AwesomeWork />
        <AwesomePhilosophy />
        <Certifications />
        <Achievements />
        <Contact />
        <Footer />
      </Fragment>

      {/* Content */}
    </div>
  );
}
