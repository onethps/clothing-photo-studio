import { Icon } from "@/components/ui/icon";

export function FeaturesRibbon() {
  return (
    <section className="features-ribbon">
      <div className="feature-item">
        <span className="feature-icon">
          <Icon name="check" size={16} />
        </span>
        <div>
          <strong>Wrinkle-Free Steam</strong>
          <p>Eliminates temporary fold lines, creases, and crumpled fabric.</p>
        </div>
      </div>
      <div className="feature-item">
        <span className="feature-icon">
          <Icon name="check" size={16} />
        </span>
        <div>
          <strong>Rich Floor Contrast</strong>
          <p>Preserves deep wood plank seams, grain depth, and natural tones.</p>
        </div>
      </div>
      <div className="feature-item">
        <span className="feature-icon">
          <Icon name="check" size={16} />
        </span>
        <div>
          <strong>Zero Inventions</strong>
          <p>Authentic logos, brand graphics, and true wear are 100% preserved.</p>
        </div>
      </div>
    </section>
  );
}
