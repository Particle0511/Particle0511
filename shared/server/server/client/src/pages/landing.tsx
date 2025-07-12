import Navigation from "@/components/navigation";
import Hero from "@/components/hero";
import Stats from "@/components/stats";
import FeaturedItems from "@/components/featured-items";
import HowItWorks from "@/components/how-it-works";
import Footer from "@/components/footer";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <Hero />
      <Stats />
      <FeaturedItems />
      <HowItWorks />
      <Footer />
    </div>
  );
}
