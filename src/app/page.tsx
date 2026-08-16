import { Hero } from "@/components/hero/hero";
import { ExperienceSection } from "@/components/experience/experience-section";
import { ProjectsSection } from "@/components/projects/projects-section";
import { ContactSection } from "@/components/contact/contact-section";
import { pageGridClassName } from "@/components/layout/content-row";

export default function Home() {
  return (
    <main className="mx-auto max-w-screen-md px-4 py-32">
      <div className={pageGridClassName}>
        <Hero />
        <ExperienceSection />
        <ProjectsSection />
        <ContactSection />
      </div>
    </main>
  );
}
