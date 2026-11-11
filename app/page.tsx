import { About } from '@/components/sections/About/About';
import { Capabilities } from '@/components/sections/Capabilities/Capabilities';
import { Contact } from '@/components/sections/Contact/Contact';
import { Experience } from '@/components/sections/Experience/Experience';
import { Hero } from '@/components/sections/Hero/Hero';
import { Work } from '@/components/sections/Work/Work';

/** The portfolio: one page, in reading order. The hero carries the headline figures; the one career timeline is Experience's. */
export default function Home() {
  return (
    <>
      <Hero />
      <Experience />
      <Work />
      <Capabilities />
      <About />
      <Contact />
    </>
  );
}
