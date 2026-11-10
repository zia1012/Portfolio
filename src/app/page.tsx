import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Projects } from "@/components/sections/Projects";
import { Experience } from "@/components/sections/Experience";
import { Skills } from "@/components/sections/Skills";
import { Contact } from "@/components/sections/Contact";
import { BootIntro } from "@/components/ui/BootIntro";
import { SceneLayer } from "@/components/three/SceneLayer";

export default function Home() {
  return (
    <>
      <BootIntro />
      <SceneLayer />
      <main id="main" className="relative z-10 flex-1">
        <Hero />
        <About />
        <Projects />
        <Experience />
        <Skills />
        <Contact />
      </main>
    </>
  );
}
