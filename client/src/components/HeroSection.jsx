import React from "react";

export default function HeroSection({ title, subtitle, eyebrow, children, className = "" }) {
  return <section className={`hero-section${className ? ` ${className}` : ""}`}>
    <div className="hero-section-content">
      {eyebrow && <span className="hero-section-eyebrow">{eyebrow}</span>}
      <h1 className="hero-section-title">{title}</h1>
      <p className="hero-section-subtitle">{subtitle}</p>
      {children && <div className="hero-section-extra">{children}</div>}
    </div>
  </section>;
}
