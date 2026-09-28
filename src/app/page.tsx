import { Hero } from "@/components/hero/hero";
import { StackColumns } from "@/components/sections/stack-columns";
import { NowSection } from "@/components/sections/now-section";
import { Footer } from "@/components/footer/footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <main className="mx-auto w-full max-w-[640px] px-6 sm:px-0 pt-28 pb-16">
        <Hero />
        <StackColumns />
        <NowSection />
      </main>
      <Footer />
    </div>
  );
}
