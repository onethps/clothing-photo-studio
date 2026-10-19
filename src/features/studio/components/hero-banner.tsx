import { Icon } from "@/components/ui/icon";
import { APP_CONFIG } from "@/config/env";

export function HeroBanner() {
  return (
    <section className="hero-banner">
      <div className="hero-tag">
        <Icon name="sparkles" size={14} />
        <span>{APP_CONFIG.tagline}</span>
      </div>
      <h1 className="hero-title">{APP_CONFIG.title}</h1>
      <p className="hero-subtitle">{APP_CONFIG.subtitle}</p>
    </section>
  );
}
