"use client";

import { useEffect, useState, useRef } from "react";
import {
  Truck,
  Package,
  Clock,
  Shield,
  Globe,
  Star,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Send,
  Loader2,
  Menu,
  X,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Users,
  BarChart3,
} from "lucide-react";

// =============================================================================
// Types (identical to haulier-bold.tsx)
// =============================================================================

interface TemplateProps {
  siteName: string;
  config: {
    primary_color: string;
    secondary_color: string;
    font_heading: string;
    font_body: string;
    site_title: string;
    meta_description: string;
    og_image_url: string;
    favicon_url: string;
  };
  sections: {
    hero: {
      is_enabled: boolean;
      content: {
        headline: string;
        subheadline: string;
        cta_text: string;
        cta_link: string;
        logo_url: string;
        images: string[];
      };
    };
    stats: {
      is_enabled: boolean;
      content: {
        stats: {
          value: string;
          label: string;
          prefix?: string;
          suffix?: string;
        }[];
      };
    };
    about: {
      is_enabled: boolean;
      content: {
        heading: string;
        body: string;
        image_url: string;
      };
    };
    services: {
      is_enabled: boolean;
      content: {
        services: {
          icon: string;
          title: string;
          description: string;
        }[];
      };
    };
    calculator: {
      is_enabled: boolean;
      content: {
        heading: string;
        description: string;
        show_map: boolean;
      };
    };
    testimonials: {
      is_enabled: boolean;
      content: {
        testimonials: {
          name: string;
          company: string;
          text: string;
          rating: number;
        }[];
      };
    };
    contact: {
      is_enabled: boolean;
      content: {
        heading: string;
        email: string;
        phone: string;
        address: string;
        map_embed_url: string;
      };
    };
    footer: {
      is_enabled: boolean;
      content: {
        company_name: string;
        copyright_text: string;
        links: { label: string; url: string }[];
      };
    };
  };
  rateTable?: {
    base_rate_per_km: number;
    minimum_fee: number;
    currency: string;
    vehicle_surcharges: { type: string; surcharge: number }[];
  };
  integrations?: {
    ga4_id: string;
    google_place_id: string;
  };
  plan: "starter" | "pro" | "premium";
}

// =============================================================================
// Icon mapping
// =============================================================================

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  truck: Truck,
  package: Package,
  clock: Clock,
  shield: Shield,
  globe: Globe,
};

function ServiceIcon({ icon, className }: { icon: string; className?: string }) {
  const IconComponent = ICON_MAP[icon.toLowerCase()] ?? Truck;
  return <IconComponent className={className} />;
}

// =============================================================================
// Smooth scroll helper
// =============================================================================

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// =============================================================================
// Google Analytics injection
// =============================================================================

function GoogleAnalytics({ ga4Id }: { ga4Id: string }) {
  useEffect(() => {
    if (!ga4Id || typeof window === "undefined") return;

    const script = document.createElement("script");
    script.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`;
    script.async = true;
    document.head.appendChild(script);

    const inline = document.createElement("script");
    inline.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${ga4Id}');
    `;
    document.head.appendChild(inline);

    return () => {
      document.head.removeChild(script);
      document.head.removeChild(inline);
    };
  }, [ga4Id]);

  return null;
}

// =============================================================================
// Animated Counter
// =============================================================================

function AnimatedCounter({
  target,
  suffix = "",
  prefix = "",
  duration = 2000,
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = Date.now();
          const animate = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <div ref={ref} className="text-3xl md:text-4xl font-extrabold text-white">
      {prefix}{count.toLocaleString()}{suffix}
    </div>
  );
}

// =============================================================================
// Star Rating
// =============================================================================

function StarRating({ rating, accentColor }: { rating: number; accentColor?: string }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating
              ? accentColor
                ? ""
                : "fill-yellow-400 text-yellow-400"
              : "fill-gray-600 text-gray-600"
          }`}
          style={
            i < rating && accentColor
              ? { color: accentColor, fill: accentColor }
              : undefined
          }
        />
      ))}
    </div>
  );
}

// =============================================================================
// Hero Section — Split layout with animated stat counters
// =============================================================================

function HeroSection({
  content,
  primaryColor,
  secondaryColor,
  logoUrl,
  siteName,
}: {
  content: TemplateProps["sections"]["hero"]["content"];
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  siteName: string;
}) {
  const heroImage =
    content.images?.[0] ||
    "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1920&q=80";

  return (
    <section id="hero" className="relative overflow-hidden" style={{ backgroundColor: secondaryColor }}>
      {/* Top dark bar with logo */}
      <div className="relative z-10 flex items-center justify-between px-6 md:px-12 lg:px-16 py-5">
        {logoUrl && (
          <img
            src={logoUrl}
            alt="Logo"
            className="h-10 md:h-12 w-auto object-contain brightness-0 invert"
          />
        )}
        {!logoUrl && (
          <span
            className="text-xl font-extrabold text-white tracking-tight"
            style={{ fontFamily: "var(--tp-font-heading)" }}
          >
            {siteName}
          </span>
        )}
      </div>

      {/* Split layout */}
      <div className="relative z-10 grid lg:grid-cols-2 min-h-[600px] lg:min-h-[700px]">
        {/* Left: Text + Stats */}
        <div className="flex flex-col justify-center px-6 md:px-12 lg:px-16 py-12 lg:py-16">
          <div
            className="h-1 w-16 mb-6 rounded-full"
            style={{ backgroundColor: primaryColor }}
          />
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6"
            style={{ fontFamily: "var(--tp-font-heading)" }}
          >
            {content.headline}
          </h1>
          {content.subheadline && (
            <p
              className="text-lg md:text-xl text-gray-300 max-w-xl mb-8 leading-relaxed"
              style={{ fontFamily: "var(--tp-font-body)" }}
            >
              {content.subheadline}
            </p>
          )}
          {content.cta_text && (
            <a
              href={content.cta_link || "#contact"}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg text-white font-bold text-lg shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl w-fit"
              style={{
                backgroundColor: primaryColor,
                fontFamily: "var(--tp-font-body)",
              }}
            >
              {content.cta_text}
              <ArrowRight className="h-5 w-5" />
            </a>
          )}

          {/* Animated stat counters */}
          <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/10">
            <div>
              <AnimatedCounter target={10000} suffix="+" />
              <p className="text-gray-400 text-sm mt-1" style={{ fontFamily: "var(--tp-font-body)" }}>
                Deliveries
              </p>
            </div>
            <div>
              <AnimatedCounter target={99} suffix=".2%" />
              <p className="text-gray-400 text-sm mt-1" style={{ fontFamily: "var(--tp-font-body)" }}>
                On-Time
              </p>
            </div>
            <div>
              <AnimatedCounter target={500} suffix="+" />
              <p className="text-gray-400 text-sm mt-1" style={{ fontFamily: "var(--tp-font-body)" }}>
                Clients
              </p>
            </div>
          </div>
        </div>

        {/* Right: Image */}
        <div className="relative hidden lg:block">
          <img
            src={heroImage}
            alt="Freight operations"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right, ${secondaryColor} 0%, ${secondaryColor}88 30%, transparent 60%)`,
            }}
          />
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// About Section
// =============================================================================

function AboutSection({
  content,
  primaryColor,
  secondaryColor,
}: {
  content: TemplateProps["sections"]["about"]["content"];
  primaryColor: string;
  secondaryColor: string;
}) {
  return (
    <section id="about" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Text */}
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5" style={{ color: primaryColor }} />
              <span
                className="text-sm font-bold uppercase tracking-widest"
                style={{ color: primaryColor, fontFamily: "var(--tp-font-body)" }}
              >
                About Us
              </span>
            </div>
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6 leading-tight"
              style={{ fontFamily: "var(--tp-font-heading)", color: secondaryColor }}
            >
              {content.heading}
            </h2>
            <p
              className="text-gray-600 text-base md:text-lg leading-relaxed whitespace-pre-line"
              style={{ fontFamily: "var(--tp-font-body)" }}
            >
              {content.body}
            </p>
          </div>

          {/* Image */}
          {content.image_url && (
            <div className="relative">
              <div
                className="absolute -top-4 -left-4 w-full h-full rounded-2xl"
                style={{ backgroundColor: primaryColor, opacity: 0.08 }}
              />
              <img
                src={content.image_url}
                alt={content.heading}
                className="relative rounded-2xl shadow-xl w-full h-auto object-cover aspect-[4/3]"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// Services Section — Horizontal cards with red left border accent
// =============================================================================

function ServicesSection({
  content,
  primaryColor,
  secondaryColor,
}: {
  content: TemplateProps["sections"]["services"]["content"];
  primaryColor: string;
  secondaryColor: string;
}) {
  const services = content.services ?? [];

  return (
    <section
      id="services"
      className="py-20 md:py-28"
      style={{ backgroundColor: "#f9fafb" }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <span
            className="text-sm font-bold uppercase tracking-widest mb-2 inline-block"
            style={{ color: primaryColor, fontFamily: "var(--tp-font-body)" }}
          >
            What We Do
          </span>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4"
            style={{ fontFamily: "var(--tp-font-heading)", color: secondaryColor }}
          >
            Our Services
          </h2>
          <p
            className="text-gray-500 text-base md:text-lg max-w-2xl mx-auto"
            style={{ fontFamily: "var(--tp-font-body)" }}
          >
            Data-driven logistics solutions built for performance
          </p>
        </div>

        <div className="grid gap-5">
          {services.map((service, idx) => (
            <div
              key={idx}
              className="group flex items-start gap-6 bg-white rounded-xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300 border-l-4"
              style={{ borderColor: primaryColor }}
            >
              <div
                className="inline-flex items-center justify-center h-14 w-14 rounded-xl shrink-0 transition-colors duration-300"
                style={{
                  backgroundColor: primaryColor + "12",
                  color: primaryColor,
                }}
              >
                <ServiceIcon icon={service.icon} className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <h3
                    className="text-xl font-bold"
                    style={{ fontFamily: "var(--tp-font-heading)", color: secondaryColor }}
                  >
                    {service.title}
                  </h3>
                  <span
                    className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full"
                    style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
                  >
                    Service {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>
                <p
                  className="text-gray-500 text-sm md:text-base leading-relaxed mt-2"
                  style={{ fontFamily: "var(--tp-font-body)" }}
                >
                  {service.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// Calculator Section (Pro/Premium only)
// =============================================================================

interface CalculatorResult {
  distance_km: number;
  base_cost: number;
  surcharge: number;
  total: number;
  currency: string;
}

function CalculatorSection({
  content,
  rateTable,
  primaryColor,
  secondaryColor,
  siteName,
}: {
  content: TemplateProps["sections"]["calculator"]["content"];
  rateTable: TemplateProps["rateTable"];
  primaryColor: string;
  secondaryColor: string;
  siteName: string;
}) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const surcharges = rateTable?.vehicle_surcharges ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin.trim() || !destination.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteName,
          origin: origin.trim(),
          destination: destination.trim(),
          vehicle_type: vehicleType || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to get quote. Please try again.");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="calculator"
      className="py-20 md:py-28 bg-white"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <span
            className="text-sm font-bold uppercase tracking-widest mb-2 inline-block"
            style={{ color: primaryColor, fontFamily: "var(--tp-font-body)" }}
          >
            Instant Pricing
          </span>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4"
            style={{ fontFamily: "var(--tp-font-heading)", color: secondaryColor }}
          >
            {content.heading || "Get an Instant Quote"}
          </h2>
          {content.description && (
            <p
              className="text-gray-500 text-base md:text-lg max-w-2xl mx-auto"
              style={{ fontFamily: "var(--tp-font-body)" }}
            >
              {content.description}
            </p>
          )}
        </div>

        <div className="max-w-2xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-gray-200 p-8 shadow-sm space-y-5"
            style={{ backgroundColor: secondaryColor + "03" }}
          >
            {/* Origin */}
            <div>
              <label
                htmlFor="calc-origin"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
                style={{ fontFamily: "var(--tp-font-body)" }}
              >
                Origin
              </label>
              <input
                id="calc-origin"
                type="text"
                required
                placeholder="e.g. Sydney, NSW"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 text-sm outline-none transition-colors focus:border-[var(--tp-primary)] focus:ring-2 focus:ring-[var(--tp-primary)]/20"
                style={{ fontFamily: "var(--tp-font-body)" }}
              />
            </div>

            {/* Destination */}
            <div>
              <label
                htmlFor="calc-destination"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
                style={{ fontFamily: "var(--tp-font-body)" }}
              >
                Destination
              </label>
              <input
                id="calc-destination"
                type="text"
                required
                placeholder="e.g. Melbourne, VIC"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 text-sm outline-none transition-colors focus:border-[var(--tp-primary)] focus:ring-2 focus:ring-[var(--tp-primary)]/20"
                style={{ fontFamily: "var(--tp-font-body)" }}
              />
            </div>

            {/* Vehicle Type */}
            {surcharges.length > 0 && (
              <div>
                <label
                  htmlFor="calc-vehicle"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                  style={{ fontFamily: "var(--tp-font-body)" }}
                >
                  Vehicle Type
                </label>
                <select
                  id="calc-vehicle"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 text-sm outline-none transition-colors focus:border-[var(--tp-primary)] focus:ring-2 focus:ring-[var(--tp-primary)]/20"
                  style={{ fontFamily: "var(--tp-font-body)" }}
                >
                  <option value="">Standard (no surcharge)</option>
                  {surcharges.map((v, idx) => (
                    <option key={idx} value={v.type}>
                      {v.type} (+{rateTable?.currency ?? "$"}{v.surcharge.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-white font-bold text-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg disabled:opacity-60 disabled:pointer-events-none"
              style={{
                backgroundColor: primaryColor,
                fontFamily: "var(--tp-font-body)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Calculating…
                </>
              ) : (
                <>
                  Get Quote
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Result */}
          {result && (
            <div className="mt-8 rounded-2xl border border-green-100 bg-green-50/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-bold text-green-800">Quote Ready</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Distance</span>
                  <span className="font-semibold text-gray-900">
                    {result.distance_km.toFixed(1)} km
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Base cost</span>
                  <span className="font-semibold text-gray-900">
                    {result.currency}{result.base_cost.toFixed(2)}
                  </span>
                </div>
                {result.surcharge > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vehicle surcharge</span>
                    <span className="font-semibold text-gray-900">
                      +{result.currency}{result.surcharge.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="border-t border-green-200 pt-2 flex justify-between">
                  <span className="font-bold text-green-800">Total</span>
                  <span className="font-bold text-green-800 text-lg">
                    {result.currency}{result.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-8 rounded-2xl border border-red-100 bg-red-50/50 p-6">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// Testimonials Section — Dark section with red accent stars
// =============================================================================

function TestimonialsSection({
  content,
  primaryColor,
  secondaryColor,
}: {
  content: TemplateProps["sections"]["testimonials"]["content"];
  primaryColor: string;
  secondaryColor: string;
}) {
  const testimonials = content.testimonials ?? [];
  const [current, setCurrent] = useState(0);

  const prev = () => {
    setCurrent((c) => (c > 0 ? c - 1 : testimonials.length - 1));
  };
  const next = () => {
    setCurrent((c) => (c < testimonials.length - 1 ? c + 1 : 0));
  };

  if (testimonials.length === 0) return null;

  return (
    <section
      id="testimonials"
      className="py-20 md:py-28"
      style={{ backgroundColor: secondaryColor }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <span
            className="text-sm font-bold uppercase tracking-widest mb-2 inline-block"
            style={{ color: primaryColor, fontFamily: "var(--tp-font-body)" }}
          >
            Testimonials
          </span>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4"
            style={{ fontFamily: "var(--tp-font-heading)" }}
          >
            What Our Clients Say
          </h2>
        </div>

        {/* Mobile: single card with carousel */}
        <div className="md:hidden">
          <div className="rounded-2xl p-6" style={{ backgroundColor: secondaryColor + "99", border: `1px solid rgba(255,255,255,0.1)` }}>
            <StarRating rating={testimonials[current].rating} accentColor={primaryColor} />
            <p
              className="text-gray-300 mt-4 mb-6 leading-relaxed text-sm"
              style={{ fontFamily: "var(--tp-font-body)" }}
            >
              &ldquo;{testimonials[current].text}&rdquo;
            </p>
            <div>
              <p className="font-bold text-white text-sm">
                {testimonials[current].name}
              </p>
              <p className="text-gray-400 text-xs">
                {testimonials[current].company}
              </p>
            </div>
          </div>
          {testimonials.length > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                type="button"
                onClick={prev}
                className="h-10 w-10 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-colors"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-500">
                {current + 1} / {testimonials.length}
              </span>
              <button
                type="button"
                onClick={next}
                className="h-10 w-10 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-colors"
                aria-label="Next testimonial"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Desktop: grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <StarRating rating={t.rating} accentColor={primaryColor} />
              <p
                className="text-gray-300 mt-4 mb-6 leading-relaxed"
                style={{ fontFamily: "var(--tp-font-body)" }}
              >
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="border-t border-white/10 pt-4">
                <p className="font-bold text-white">{t.name}</p>
                <p className="text-gray-400 text-sm">{t.company}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// Contact Section
// =============================================================================

function ContactSection({
  content,
  primaryColor,
  secondaryColor,
  siteName,
}: {
  content: TemplateProps["sections"]["contact"]["content"];
  primaryColor: string;
  secondaryColor: string;
  siteName: string;
}) {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: siteName,
          name: formState.name,
          email: formState.email,
          phone: formState.phone,
          message: formState.message,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send message. Please try again.");
      }

      setSubmitted(true);
      setFormState({ name: "", email: "", phone: "", message: "" });
    } catch (err: any) {
      setSubmitError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 md:py-28" style={{ backgroundColor: "#f9fafb" }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <span
            className="text-sm font-bold uppercase tracking-widest mb-2 inline-block"
            style={{ color: primaryColor, fontFamily: "var(--tp-font-body)" }}
          >
            Contact
          </span>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4"
            style={{ fontFamily: "var(--tp-font-heading)", color: secondaryColor }}
          >
            {content.heading || "Get in Touch"}
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
          {/* Form */}
          <div>
            {submitted ? (
              <div className="rounded-2xl border border-green-100 bg-green-50 p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-800 mb-2">
                  Message Sent!
                </h3>
                <p className="text-green-700 text-sm">
                  We&apos;ll get back to you as soon as possible.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-4 text-sm font-medium underline text-green-700 hover:text-green-900"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div>
                  <label
                    htmlFor="contact-name"
                    className="block text-sm font-semibold text-gray-700 mb-1.5"
                    style={{ fontFamily: "var(--tp-font-body)" }}
                  >
                    Full Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={formState.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="James Mitchell"
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 text-sm outline-none transition-colors focus:border-[var(--tp-primary)] focus:ring-2 focus:ring-[var(--tp-primary)]/20"
                    style={{ fontFamily: "var(--tp-font-body)" }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-sm font-semibold text-gray-700 mb-1.5"
                    style={{ fontFamily: "var(--tp-font-body)" }}
                  >
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={formState.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="james@company.com.au"
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 text-sm outline-none transition-colors focus:border-[var(--tp-primary)] focus:ring-2 focus:ring-[var(--tp-primary)]/20"
                    style={{ fontFamily: "var(--tp-font-body)" }}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="contact-phone"
                    className="block text-sm font-semibold text-gray-700 mb-1.5"
                    style={{ fontFamily: "var(--tp-font-body)" }}
                  >
                    Phone
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    value={formState.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+61 400 000 000"
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 text-sm outline-none transition-colors focus:border-[var(--tp-primary)] focus:ring-2 focus:ring-[var(--tp-primary)]/20"
                    style={{ fontFamily: "var(--tp-font-body)" }}
                  />
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-sm font-semibold text-gray-700 mb-1.5"
                    style={{ fontFamily: "var(--tp-font-body)" }}
                  >
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={4}
                    value={formState.message}
                    onChange={(e) => handleChange("message", e.target.value)}
                    placeholder="Tell us about your freight requirements…"
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 text-sm outline-none transition-colors focus:border-[var(--tp-primary)] focus:ring-2 focus:ring-[var(--tp-primary)]/20 resize-y"
                    style={{ fontFamily: "var(--tp-font-body)" }}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-white font-bold text-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg disabled:opacity-60 disabled:pointer-events-none"
                  style={{
                    backgroundColor: primaryColor,
                    fontFamily: "var(--tp-font-body)",
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Message
                    </>
                  )}
                </button>

                {submitError && (
                  <p className="text-red-600 text-sm font-medium">
                    {submitError}
                  </p>
                )}
              </form>
            )}
          </div>

          {/* Contact Info + Map */}
          <div className="space-y-6">
            <div className="space-y-4">
              {content.email && (
                <div className="flex items-start gap-3">
                  <div
                    className="inline-flex items-center justify-center h-10 w-10 rounded-lg shrink-0"
                    style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
                  >
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Email</p>
                    <a
                      href={`mailto:${content.email}`}
                      className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      {content.email}
                    </a>
                  </div>
                </div>
              )}
              {content.phone && (
                <div className="flex items-start gap-3">
                  <div
                    className="inline-flex items-center justify-center h-10 w-10 rounded-lg shrink-0"
                    style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
                  >
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Phone</p>
                    <a
                      href={`tel:${content.phone}`}
                      className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      {content.phone}
                    </a>
                  </div>
                </div>
              )}
              {content.address && (
                <div className="flex items-start gap-3">
                  <div
                    className="inline-flex items-center justify-center h-10 w-10 rounded-lg shrink-0"
                    style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
                  >
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Address</p>
                    <p className="text-sm text-gray-500">{content.address}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Map embed */}
            {content.map_embed_url && (
              <div className="rounded-xl overflow-hidden border border-gray-200 mt-4">
                <iframe
                  src={content.map_embed_url}
                  width="100%"
                  height="280"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Map"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// Footer Section
// =============================================================================

function FooterSection({
  content,
  primaryColor,
  secondaryColor,
}: {
  content: TemplateProps["sections"]["footer"]["content"];
  primaryColor: string;
  secondaryColor: string;
}) {
  return (
    <footer style={{ backgroundColor: secondaryColor }} className="text-gray-300">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p
              className="text-xl font-bold text-white mb-1"
              style={{ fontFamily: "var(--tp-font-heading)" }}
            >
              {content.company_name}
            </p>
            <p className="text-sm text-gray-400">{content.copyright_text}</p>
          </div>

          {content.links && content.links.length > 0 && (
            <nav className="flex flex-wrap gap-x-6 gap-y-2">
              {content.links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                  style={{ fontFamily: "var(--tp-font-body)" }}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}
        </div>

        <div
          className="mt-8 h-0.5 w-20 rounded-full"
          style={{ backgroundColor: primaryColor }}
        />
      </div>
    </footer>
  );
}

// =============================================================================
// Mobile Navigation — Dark themed
// =============================================================================

function MobileNav({
  primaryColor,
  secondaryColor,
  sections,
}: {
  primaryColor: string;
  secondaryColor: string;
  sections: TemplateProps["sections"];
}) {
  const [open, setOpen] = useState(false);

  const navItems = [
    { id: "about", label: "About", show: sections.about.is_enabled },
    { id: "services", label: "Services", show: sections.services.is_enabled },
    { id: "calculator", label: "Calculator", show: sections.calculator.is_enabled },
    { id: "testimonials", label: "Testimonials", show: sections.testimonials.is_enabled },
    { id: "contact", label: "Contact", show: sections.contact.is_enabled },
  ].filter((i) => i.show);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed top-5 right-5 z-50 md:hidden h-10 w-10 rounded-lg flex items-center justify-center text-white"
        style={{ backgroundColor: secondaryColor + "cc" }}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 right-0 z-50 h-full w-72 shadow-2xl transform transition-transform duration-300 md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ backgroundColor: secondaryColor }}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <span className="font-bold text-white">Menu</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                scrollToSection(item.id);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-3 rounded-lg text-gray-300 hover:bg-white/5 hover:text-white font-medium text-sm transition-colors"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}

// =============================================================================
// Desktop Sticky Nav — Dark header
// =============================================================================

function DesktopNav({
  primaryColor,
  secondaryColor,
  sections,
}: {
  primaryColor: string;
  secondaryColor: string;
  sections: TemplateProps["sections"];
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { id: "about", label: "About", show: sections.about.is_enabled },
    { id: "services", label: "Services", show: sections.services.is_enabled },
    { id: "calculator", label: "Calculator", show: sections.calculator.is_enabled },
    { id: "testimonials", label: "Testimonials", show: sections.testimonials.is_enabled },
    { id: "contact", label: "Contact", show: sections.contact.is_enabled },
  ].filter((i) => i.show);

  return (
    <nav
      className={`hidden md:flex fixed top-0 left-0 right-0 z-40 items-center justify-between px-8 h-16 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm"
          : ""
      }`}
      style={!scrolled ? { backgroundColor: secondaryColor } : undefined}
    >
      <div className="flex items-center gap-6">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollToSection(item.id)}
            className={`text-sm font-medium transition-colors ${
              scrolled
                ? "text-gray-700 hover:text-gray-900"
                : "text-white/70 hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {sections.contact.is_enabled && (
        <button
          type="button"
          onClick={() => scrollToSection("contact")}
          className="rounded-lg px-5 py-2 text-sm font-bold text-white transition-all hover:scale-105"
          style={{ backgroundColor: primaryColor }}
        >
          Get a Quote
        </button>
      )}
    </nav>
  );
}

// =============================================================================
// Stats Section — Animated Counters
// =============================================================================

function StatsAnimatedCounter({ value, prefix, suffix }: { value: string; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState("0");
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    
    // Parse numeric value - strip K suffix for animation
    const numericStr = value.replace(/[,%]/g, "");
    const num = parseFloat(numericStr);
    
    if (isNaN(num)) {
      // Non-numeric like "24/7" - just show it
      setDisplay(value);
      return;
    }

    const duration = 2000;
    const start = performance.now();

    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = num * eased;
      
      // Format: if original had decimals, show them
      if (numericStr.includes(".")) {
        setDisplay(current.toFixed(numericStr.split(".")[1].length));
      } else {
        setDisplay(Math.round(current).toString());
      }
      
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [isVisible, value]);

  return (
    <span ref={ref}>
      {prefix}{display}{suffix}
    </span>
  );
}

function StatsSection({
  content,
  primaryColor,
}: {
  content: TemplateProps["sections"]["stats"]["content"];
  primaryColor: string;
}) {
  const stats = content.stats ?? [];
  if (stats.length === 0) return null;

  return (
    <section id="stats" className="py-14 md:py-20 bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center">
              <div
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-2"
                style={{ color: primaryColor, fontFamily: "var(--tp-font-heading)" }}
              >
                <StatsAnimatedCounter
                  value={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                />
              </div>
              <p
                className="text-gray-500 text-sm md:text-base font-medium uppercase tracking-wider"
                style={{ fontFamily: "var(--tp-font-body)" }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// Main Template Component — FreightPro
// =============================================================================

export default function FreightPro(props: TemplateProps) {
  const {
    siteName,
    config,
    sections,
    rateTable,
    integrations,
    plan,
  } = props;

  const primaryColor = config.primary_color || "#dc2626";
  const secondaryColor = config.secondary_color || "#111827";

  const isProOrAbove = plan === "pro" || plan === "premium";

  return (
    <>
      {integrations?.ga4_id && <GoogleAnalytics ga4Id={integrations.ga4_id} />}

      <div
        style={
          {
            "--tp-primary": primaryColor,
            "--tp-secondary": secondaryColor,
            "--tp-font-heading": config.font_heading || "inherit",
            "--tp-font-body": config.font_body || "inherit",
          } as React.CSSProperties
        }
        className="min-h-screen bg-white text-gray-900 antialiased"
      >
        <DesktopNav primaryColor={primaryColor} secondaryColor={secondaryColor} sections={sections} />
        <MobileNav primaryColor={primaryColor} secondaryColor={secondaryColor} sections={sections} />

        {sections.hero.is_enabled && (
          <HeroSection
            content={sections.hero.content}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            logoUrl={sections.hero.content.logo_url}
            siteName={siteName}
          />
        )}

        {sections.stats.is_enabled && (
          <StatsSection content={sections.stats.content} primaryColor={config.primary_color} />
        )}

        {sections.about.is_enabled && (
          <AboutSection
            content={sections.about.content}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />
        )}

        {sections.services.is_enabled && (
          <ServicesSection
            content={sections.services.content}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />
        )}

        {sections.calculator.is_enabled && isProOrAbove && (
          <CalculatorSection
            content={sections.calculator.content}
            rateTable={rateTable}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            siteName={siteName}
          />
        )}

        {sections.testimonials.is_enabled && (
          <TestimonialsSection
            content={sections.testimonials.content}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />
        )}

        {sections.contact.is_enabled && (
          <ContactSection
            content={sections.contact.content}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            siteName={siteName}
          />
        )}

        {sections.footer.is_enabled && (
          <FooterSection
            content={sections.footer.content}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />
        )}
      </div>
    </>
  );
}
