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
  Zap,
} from "lucide-react";

// =============================================================================
// Types
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
  zap: Zap,
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
// Star Rating
// =============================================================================

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < rating
              ? "fill-sky-400 text-sky-400"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

// =============================================================================
// Hero Section
// =============================================================================

function HeroSection({
  content,
  primaryColor,
  logoUrl,
  siteName,
}: {
  content: TemplateProps["sections"]["hero"]["content"];
  primaryColor: string;
  logoUrl: string;
  siteName: string;
}) {
  const [currentImage, setCurrentImage] = useState(0);
  const images = content.images?.filter(Boolean) ?? [];
  const hasImages = images.length > 0;
  const hasMultiple = images.length > 1;

  useEffect(() => {
    if (!hasMultiple) return;
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [hasMultiple, images.length]);

  return (
    <section
      id="hero"
      className="relative flex items-center justify-center overflow-hidden"
      style={{ minHeight: "80vh" }}
    >
      {/* Background images */}
      {hasImages ? (
        <>
          {images.map((src, idx) => (
            <div
              key={idx}
              className="absolute inset-0 transition-opacity duration-1500 ease-in-out"
              style={{
                backgroundImage: `url(${src})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                opacity: idx === currentImage ? 1 : 0,
              }}
            />
          ))}
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(160deg, #f8fafc 0%, ${primaryColor}22 50%, #f8fafc 100%)`,
          }}
        />
      )}

      {/* Soft gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(248,250,252,0.3) 0%, rgba(248,250,252,0.55) 40%, rgba(248,250,252,0.75) 100%)",
        }}
      />

      {/* Logo — top left */}
      {(logoUrl || siteName) && (
        <div className="absolute top-6 left-6 z-20 md:top-8 md:left-8">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              className="h-10 md:h-12 w-auto object-contain"
            />
          ) : (
            <span
              className="text-xl font-extrabold text-white tracking-tight"
              style={{ fontFamily: "var(--tp-font-heading)" }}
            >
              {siteName}
            </span>
          )}
        </div>
      )}

      {/* Carousel dots */}
      {hasMultiple && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2.5">
          {images.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentImage(idx)}
              className="rounded-full transition-all duration-500"
              style={{
                width: idx === currentImage ? "28px" : "8px",
                height: "8px",
                backgroundColor:
                  idx === currentImage ? primaryColor : "rgba(15,23,42,0.2)",
              }}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <h1
          className="text-4xl md:text-5xl lg:text-6xl font-light text-slate-800 leading-snug tracking-tight mb-5"
          style={{ fontFamily: "var(--tp-font-heading)" }}
        >
          {content.headline}
        </h1>
        {content.subheadline && (
          <p
            className="text-base md:text-lg text-slate-500 max-w-xl mx-auto mb-10 leading-relaxed font-light"
            style={{ fontFamily: "var(--tp-font-body)" }}
          >
            {content.subheadline}
          </p>
        )}
        {content.cta_text && (
          <a
            href={content.cta_link || "#contact"}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-white font-medium text-sm shadow-md transition-all duration-300 hover:shadow-lg hover:translate-y-[-1px]"
            style={{
              backgroundColor: primaryColor,
              fontFamily: "var(--tp-font-body)",
            }}
          >
            {content.cta_text}
            <ArrowRight className="h-4 w-4" />
          </a>
        )}
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
}: {
  content: TemplateProps["sections"]["about"]["content"];
  primaryColor: string;
}) {
  return (
    <section id="about" className="py-24 md:py-32" style={{ backgroundColor: "#f8fafc" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 md:gap-20 items-center">
          {/* Image with subtle parallax feel */}
          {content.image_url && (
            <div className="relative order-2 md:order-1">
              <div
                className="absolute -top-3 -left-3 w-full h-full rounded-2xl"
                style={{ backgroundColor: primaryColor, opacity: 0.06 }}
              />
              <img
                src={content.image_url}
                alt={content.heading}
                className="relative rounded-2xl w-full h-auto object-cover shadow-sm"
                style={{ aspectRatio: "4/3" }}
              />
            </div>
          )}

          {/* Text */}
          <div className={`order-1 ${content.image_url ? "md:order-2" : ""}`}>
            <span
              className="inline-block text-xs font-medium tracking-widest uppercase mb-4"
              style={{ color: primaryColor, fontFamily: "var(--tp-font-body)" }}
            >
              About Us
            </span>
            <h2
              className="text-3xl md:text-4xl font-light text-slate-800 mb-6 leading-snug"
              style={{ fontFamily: "var(--tp-font-heading)" }}
            >
              {content.heading}
            </h2>
            <div
              className="h-px w-12 mb-6"
              style={{ backgroundColor: primaryColor, opacity: 0.4 }}
            />
            <p
              className="text-slate-500 text-sm md:text-base leading-relaxed whitespace-pre-line font-light"
              style={{ fontFamily: "var(--tp-font-body)" }}
            >
              {content.body}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// Services Section
// =============================================================================

function ServicesSection({
  content,
  primaryColor,
}: {
  content: TemplateProps["sections"]["services"]["content"];
  primaryColor: string;
  secondaryColor: string;
}) {
  const services = content.services ?? [];

  return (
    <section id="services" className="py-24 md:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span
            className="inline-block text-xs font-medium tracking-widest uppercase mb-4"
            style={{ color: primaryColor, fontFamily: "var(--tp-font-body)" }}
          >
            What We Do
          </span>
          <h2
            className="text-3xl md:text-4xl font-light text-slate-800 mb-4"
            style={{ fontFamily: "var(--tp-font-heading)" }}
          >
            Our Services
          </h2>
          <p
            className="text-slate-400 text-sm max-w-lg mx-auto font-light"
            style={{ fontFamily: "var(--tp-font-body)" }}
          >
            Fast, reliable delivery solutions across Australia
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((service, idx) => (
            <div
              key={idx}
              className="group bg-white rounded-2xl border border-slate-100 p-7 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
            >
              <div
                className="inline-flex items-center justify-center h-11 w-11 rounded-xl mb-5"
                style={{
                  backgroundColor: primaryColor + "10",
                  color: primaryColor,
                }}
              >
                <ServiceIcon icon={service.icon} className="h-5 w-5" />
              </div>
              <h3
                className="text-base font-medium text-slate-800 mb-2"
                style={{ fontFamily: "var(--tp-font-heading)" }}
              >
                {service.title}
              </h3>
              <p
                className="text-slate-400 text-sm leading-relaxed font-light"
                style={{ fontFamily: "var(--tp-font-body)" }}
              >
                {service.description}
              </p>
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
    <section id="calculator" className="py-24 md:py-32" style={{ backgroundColor: "#f8fafc" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <span
            className="inline-block text-xs font-medium tracking-widest uppercase mb-4"
            style={{ color: primaryColor, fontFamily: "var(--tp-font-body)" }}
          >
            Instant Quote
          </span>
          <h2
            className="text-3xl md:text-4xl font-light text-slate-800 mb-4"
            style={{ fontFamily: "var(--tp-font-heading)" }}
          >
            {content.heading || "Calculate Your Delivery Cost"}
          </h2>
          {content.description && (
            <p
              className="text-slate-400 text-sm max-w-lg mx-auto font-light"
              style={{ fontFamily: "var(--tp-font-body)" }}
            >
              {content.description}
            </p>
          )}
        </div>

        <div className="max-w-xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200/60 bg-white p-8 shadow-sm space-y-5"
          >
            {/* Origin */}
            <div>
              <label
                htmlFor="calc-origin"
                className="block text-xs font-medium text-slate-500 mb-1.5 tracking-wide uppercase"
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 text-sm outline-none transition-all focus:border-sky-300 focus:ring-2 focus:ring-sky-100 placeholder:text-slate-300"
                style={{ fontFamily: "var(--tp-font-body)" }}
              />
            </div>

            {/* Destination */}
            <div>
              <label
                htmlFor="calc-destination"
                className="block text-xs font-medium text-slate-500 mb-1.5 tracking-wide uppercase"
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 text-sm outline-none transition-all focus:border-sky-300 focus:ring-2 focus:ring-sky-100 placeholder:text-slate-300"
                style={{ fontFamily: "var(--tp-font-body)" }}
              />
            </div>

            {/* Vehicle Type */}
            {surcharges.length > 0 && (
              <div>
                <label
                  htmlFor="calc-vehicle"
                  className="block text-xs font-medium text-slate-500 mb-1.5 tracking-wide uppercase"
                  style={{ fontFamily: "var(--tp-font-body)" }}
                >
                  Vehicle Type
                </label>
                <select
                  id="calc-vehicle"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 text-sm outline-none transition-all focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
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
              className="w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-white font-medium text-sm transition-all duration-300 hover:shadow-md hover:translate-y-[-1px] disabled:opacity-50 disabled:pointer-events-none"
              style={{
                backgroundColor: primaryColor,
                fontFamily: "var(--tp-font-body)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
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
            <div className="mt-6 rounded-2xl border border-sky-100 bg-sky-50/40 p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-4 w-4" style={{ color: primaryColor }} />
                <h3 className="text-sm font-medium text-slate-800">Quote Ready</h3>
              </div>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Distance</span>
                  <span className="font-medium text-slate-700">
                    {result.distance_km.toFixed(1)} km
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Base cost</span>
                  <span className="font-medium text-slate-700">
                    {result.currency}{result.base_cost.toFixed(2)}
                  </span>
                </div>
                {result.surcharge > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vehicle surcharge</span>
                    <span className="font-medium text-slate-700">
                      +{result.currency}{result.surcharge.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="border-t border-sky-100 pt-2.5 flex justify-between">
                  <span className="font-medium text-slate-800">Total</span>
                  <span className="font-medium text-slate-800 text-lg">
                    {result.currency}{result.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-6 rounded-2xl border border-red-100 bg-red-50/40 p-6">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// Testimonials Section
// =============================================================================

function TestimonialsSection({
  content,
  primaryColor,
}: {
  content: TemplateProps["sections"]["testimonials"]["content"];
  primaryColor: string;
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
    <section id="testimonials" className="py-24 md:py-32 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span
            className="inline-block text-xs font-medium tracking-widest uppercase mb-4"
            style={{ color: primaryColor, fontFamily: "var(--tp-font-body)" }}
          >
            Testimonials
          </span>
          <h2
            className="text-3xl md:text-4xl font-light text-slate-800 mb-4"
            style={{ fontFamily: "var(--tp-font-heading)" }}
          >
            What Our Clients Say
          </h2>
        </div>

        {/* Mobile: single card with carousel */}
        <div className="md:hidden">
          <div className="rounded-2xl border border-slate-100 bg-white p-7 shadow-sm">
            <StarRating rating={testimonials[current].rating} />
            <p
              className="text-slate-600 mt-4 mb-6 leading-relaxed text-sm font-light"
              style={{ fontFamily: "var(--tp-font-body)" }}
            >
              &ldquo;{testimonials[current].text}&rdquo;
            </p>
            <div>
              <p className="font-medium text-slate-800 text-sm">
                {testimonials[current].name}
              </p>
              <p className="text-slate-400 text-xs">
                {testimonials[current].company}
              </p>
            </div>
          </div>
          {testimonials.length > 1 && (
            <div className="flex items-center justify-center gap-5 mt-6">
              <button
                type="button"
                onClick={prev}
                className="h-9 w-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-slate-300">
                {current + 1} / {testimonials.length}
              </span>
              <button
                type="button"
                onClick={next}
                className="h-9 w-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors"
                aria-label="Next testimonial"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Desktop: grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-100 bg-white p-7 shadow-sm hover:shadow transition-shadow duration-300"
            >
              <StarRating rating={t.rating} />
              <p
                className="text-slate-600 mt-4 mb-6 leading-relaxed text-sm font-light"
                style={{ fontFamily: "var(--tp-font-body)" }}
              >
                &ldquo;{t.text}&rdquo;
              </p>
              <div>
                <p className="font-medium text-slate-800 text-sm">{t.name}</p>
                <p className="text-slate-400 text-xs">{t.company}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// Contact Section — Floating card style
// =============================================================================

function ContactSection({
  content,
  primaryColor,
  siteName,
}: {
  content: TemplateProps["sections"]["contact"]["content"];
  primaryColor: string;
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
    <section id="contact" className="py-24 md:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <span
            className="inline-block text-xs font-medium tracking-widest uppercase mb-4"
            style={{ color: primaryColor, fontFamily: "var(--tp-font-body)" }}
          >
            Get in Touch
          </span>
          <h2
            className="text-3xl md:text-4xl font-light text-slate-800 mb-4"
            style={{ fontFamily: "var(--tp-font-heading)" }}
          >
            {content.heading || "Contact Us"}
          </h2>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-slate-200/60 bg-white shadow-lg p-8 md:p-10">
            <div className="grid md:grid-cols-2 gap-10">
              {/* Form */}
              <div>
                {submitted ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <div
                      className="inline-flex items-center justify-center h-12 w-12 rounded-full mb-4"
                      style={{ backgroundColor: primaryColor + "12", color: primaryColor }}
                    >
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-800 mb-2">
                      Message Sent!
                    </h3>
                    <p className="text-slate-400 text-sm font-light">
                      We&apos;ll get back to you shortly.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      className="mt-4 text-sm font-medium underline text-slate-400 hover:text-slate-600"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                      <label
                        htmlFor="contact-name"
                        className="block text-xs font-medium text-slate-500 mb-1.5 tracking-wide uppercase"
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
                        placeholder="Jane Smith"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 text-sm outline-none transition-all focus:border-sky-300 focus:ring-2 focus:ring-sky-100 placeholder:text-slate-300"
                        style={{ fontFamily: "var(--tp-font-body)" }}
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label
                        htmlFor="contact-email"
                        className="block text-xs font-medium text-slate-500 mb-1.5 tracking-wide uppercase"
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
                        placeholder="jane@example.com.au"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 text-sm outline-none transition-all focus:border-sky-300 focus:ring-2 focus:ring-sky-100 placeholder:text-slate-300"
                        style={{ fontFamily: "var(--tp-font-body)" }}
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label
                        htmlFor="contact-phone"
                        className="block text-xs font-medium text-slate-500 mb-1.5 tracking-wide uppercase"
                        style={{ fontFamily: "var(--tp-font-body)" }}
                      >
                        Phone
                      </label>
                      <input
                        id="contact-phone"
                        type="tel"
                        value={formState.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        placeholder="+61 400 123 456"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 text-sm outline-none transition-all focus:border-sky-300 focus:ring-2 focus:ring-sky-100 placeholder:text-slate-300"
                        style={{ fontFamily: "var(--tp-font-body)" }}
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <label
                        htmlFor="contact-message"
                        className="block text-xs font-medium text-slate-500 mb-1.5 tracking-wide uppercase"
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
                        placeholder="Tell us about your delivery needs…"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 text-sm outline-none transition-all focus:border-sky-300 focus:ring-2 focus:ring-sky-100 resize-y placeholder:text-slate-300"
                        style={{ fontFamily: "var(--tp-font-body)" }}
                      />
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-white font-medium text-sm transition-all duration-300 hover:shadow-md hover:translate-y-[-1px] disabled:opacity-50 disabled:pointer-events-none"
                      style={{
                        backgroundColor: primaryColor,
                        fontFamily: "var(--tp-font-body)",
                      }}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
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
                      <p className="text-red-500 text-sm font-medium">
                        {submitError}
                      </p>
                    )}
                  </form>
                )}
              </div>

              {/* Contact Info + Map */}
              <div className="space-y-6">
                <div className="space-y-5">
                  {content.email && (
                    <div className="flex items-start gap-3.5">
                      <div
                        className="inline-flex items-center justify-center h-9 w-9 rounded-lg shrink-0"
                        style={{ backgroundColor: primaryColor + "10", color: primaryColor }}
                      >
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">Email</p>
                        <a
                          href={`mailto:${content.email}`}
                          className="text-sm text-slate-600 hover:text-slate-800 transition-colors"
                          style={{ fontFamily: "var(--tp-font-body)" }}
                        >
                          {content.email}
                        </a>
                      </div>
                    </div>
                  )}
                  {content.phone && (
                    <div className="flex items-start gap-3.5">
                      <div
                        className="inline-flex items-center justify-center h-9 w-9 rounded-lg shrink-0"
                        style={{ backgroundColor: primaryColor + "10", color: primaryColor }}
                      >
                        <Phone className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">Phone</p>
                        <a
                          href={`tel:${content.phone}`}
                          className="text-sm text-slate-600 hover:text-slate-800 transition-colors"
                          style={{ fontFamily: "var(--tp-font-body)" }}
                        >
                          {content.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {content.address && (
                    <div className="flex items-start gap-3.5">
                      <div
                        className="inline-flex items-center justify-center h-9 w-9 rounded-lg shrink-0"
                        style={{ backgroundColor: primaryColor + "10", color: primaryColor }}
                      >
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">Address</p>
                        <p
                          className="text-sm text-slate-600"
                          style={{ fontFamily: "var(--tp-font-body)" }}
                        >
                          {content.address}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Map embed */}
                {content.map_embed_url && (
                  <div className="rounded-xl overflow-hidden border border-slate-100 mt-2">
                    <iframe
                      src={content.map_embed_url}
                      width="100%"
                      height="220"
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
}: {
  content: TemplateProps["sections"]["footer"]["content"];
  primaryColor: string;
}) {
  return (
    <footer className="bg-slate-800">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Company name + copyright */}
          <div>
            <p
              className="text-sm font-medium text-white mb-1"
              style={{ fontFamily: "var(--tp-font-heading)" }}
            >
              {content.company_name}
            </p>
            <p className="text-xs text-slate-500">{content.copyright_text}</p>
          </div>

          {/* Links */}
          {content.links && content.links.length > 0 && (
            <nav className="flex flex-wrap gap-x-5 gap-y-1">
              {content.links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                  style={{ fontFamily: "var(--tp-font-body)" }}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}
        </div>

        {/* Thin accent line */}
        <div
          className="mt-6 h-px w-16"
          style={{ backgroundColor: primaryColor, opacity: 0.4 }}
        />
      </div>
    </footer>
  );
}

// =============================================================================
// Mobile Navigation
// =============================================================================

function MobileNav({
  primaryColor,
  sections,
}: {
  primaryColor: string;
  sections: TemplateProps["sections"];
}) {
  const [open, setOpen] = useState(false);

  const navItems = [
    { id: "about", label: "About", show: sections.about.is_enabled },
    { id: "services", label: "Services", show: sections.services.is_enabled },
    {
      id: "calculator",
      label: "Calculator",
      show: sections.calculator.is_enabled,
    },
    {
      id: "testimonials",
      label: "Testimonials",
      show: sections.testimonials.is_enabled,
    },
    { id: "contact", label: "Contact", show: sections.contact.is_enabled },
  ].filter((i) => i.show);

  return (
    <>
      {/* Hamburger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed top-4 right-4 z-50 md:hidden h-9 w-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-600 shadow-sm"
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-2xl transform transition-transform duration-300 md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <span className="text-sm font-medium text-slate-800">Menu</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="p-4 space-y-0.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                scrollToSection(item.id);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 font-light text-sm transition-colors"
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
// Desktop Sticky Nav
// =============================================================================

function DesktopNav({
  primaryColor,
  sections,
}: {
  primaryColor: string;
  sections: TemplateProps["sections"];
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { id: "about", label: "About", show: sections.about.is_enabled },
    { id: "services", label: "Services", show: sections.services.is_enabled },
    {
      id: "calculator",
      label: "Calculator",
      show: sections.calculator.is_enabled,
    },
    {
      id: "testimonials",
      label: "Testimonials",
      show: sections.testimonials.is_enabled,
    },
    { id: "contact", label: "Contact", show: sections.contact.is_enabled },
  ].filter((i) => i.show);

  return (
    <nav
      className={`hidden md:flex fixed top-0 left-0 right-0 z-40 items-center justify-between px-10 h-14 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100"
          : "bg-transparent"
      }`}
    >
      <div className="flex items-center gap-8">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollToSection(item.id)}
            className={`text-xs font-medium tracking-wide transition-colors ${
              scrolled
                ? "text-slate-500 hover:text-slate-800"
                : "text-slate-600/70 hover:text-slate-800"
            }`}
            style={{ fontFamily: "var(--tp-font-body)" }}
          >
            {item.label}
          </button>
        ))}
      </div>
      {sections.contact.is_enabled && (
        <button
          type="button"
          onClick={() => scrollToSection("contact")}
          className="rounded-full px-5 py-2 text-xs font-medium text-white transition-all hover:shadow-md hover:translate-y-[-1px]"
          style={{ backgroundColor: primaryColor, fontFamily: "var(--tp-font-body)" }}
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

function AnimatedCounter({ value, prefix, suffix }: { value: string; prefix?: string; suffix?: string }) {
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
                <AnimatedCounter
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
// Main Template Component
// =============================================================================

export default function ExpressClean(props: TemplateProps) {
  const {
    siteName,
    config,
    sections,
    rateTable,
    integrations,
    plan,
  } = props;

  const primaryColor = config.primary_color || "#0ea5e9";
  const secondaryColor = config.secondary_color || "#0f172a";

  const isProOrAbove = plan === "pro" || plan === "premium";

  return (
    <>
      {/* Google Analytics */}
      {integrations?.ga4_id && <GoogleAnalytics ga4Id={integrations.ga4_id} />}

      {/* Wrapper with CSS custom properties for dynamic theming */}
      <div
        style={
          {
            "--tp-primary": primaryColor,
            "--tp-secondary": secondaryColor,
            "--tp-font-heading": config.font_heading || "inherit",
            "--tp-font-body": config.font_body || "inherit",
          } as React.CSSProperties
        }
        className="min-h-screen bg-white text-slate-800 antialiased"
      >
        {/* Navigation */}
        <DesktopNav primaryColor={primaryColor} sections={sections} />
        <MobileNav primaryColor={primaryColor} sections={sections} />

        {/* Hero */}
        {sections.hero.is_enabled && (
          <HeroSection
            content={sections.hero.content}
            primaryColor={primaryColor}
            logoUrl={sections.hero.content.logo_url}
            siteName={siteName}
          />
        )}

        {/* Stats */}
        {sections.stats.is_enabled && (
          <StatsSection content={sections.stats.content} primaryColor={config.primary_color} />
        )}

        {/* About */}
        {sections.about.is_enabled && (
          <AboutSection
            content={sections.about.content}
            primaryColor={primaryColor}
          />
        )}

        {/* Services */}
        {sections.services.is_enabled && (
          <ServicesSection
            content={sections.services.content}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />
        )}

        {/* Calculator — Pro/Premium only */}
        {sections.calculator.is_enabled && isProOrAbove && (
          <CalculatorSection
            content={sections.calculator.content}
            rateTable={rateTable}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            siteName={siteName}
          />
        )}

        {/* Testimonials */}
        {sections.testimonials.is_enabled && (
          <TestimonialsSection
            content={sections.testimonials.content}
            primaryColor={primaryColor}
          />
        )}

        {/* Contact */}
        {sections.contact.is_enabled && (
          <ContactSection
            content={sections.contact.content}
            primaryColor={primaryColor}
            siteName={siteName}
          />
        )}

        {/* Footer */}
        {sections.footer.is_enabled && (
          <FooterSection
            content={sections.footer.content}
            primaryColor={primaryColor}
          />
        )}
      </div>
    </>
  );
}
