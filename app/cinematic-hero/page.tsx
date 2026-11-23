import type { Metadata } from "next";
import { CinematicHero } from "@/components/ui/cinematic-landing-hero";

export const metadata: Metadata = {
  title: "Cinematic Hero Demo",
  description:
    "A light-theme cinematic product story for Commun.dev, built with GSAP ScrollTrigger and Tailwind CSS.",
};

export default function CinematicHeroDemoPage() {
  return (
    <div className="overflow-x-hidden w-[100%] min-h-screen">
      <CinematicHero />
    </div>
  );
}
