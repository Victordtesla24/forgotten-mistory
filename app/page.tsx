import { About } from '@/components/sections/About/About';
import { Capabilities } from '@/components/sections/Capabilities/Capabilities';
import { Contact } from '@/components/sections/Contact/Contact';
import { Experience } from '@/components/sections/Experience/Experience';
import { Hero } from '@/components/sections/Hero/Hero';
import { Proof } from '@/components/sections/Proof/Proof';
import { Work } from '@/components/sections/Work/Work';

/** The portfolio: one page, seven sections, in reading order. */
export default function Home() {
  return (
    <>
      <Hero />
      <Proof />
      <Work />
      <Experience />
      <Capabilities />
      <About />
      <Contact />
    </>
  );
}
