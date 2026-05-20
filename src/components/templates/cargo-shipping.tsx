"use client";

import { useEffect, useState, useRef } from "react";
import {
  Truck,
  Package,
  Clock,
  Shield,
  Globe,
  Star,
  Mail,
  Phone,
  MapPin,
  Send,
  Loader2,
  Menu,
  X,
  ArrowRight,
  CheckCircle,
  Play,
  ChevronLeft,
  ChevronRight,
  Anchor,
  Warehouse,
} from "lucide-react";

// =============================================================================
// Types (identical structure to haulier-bold.tsx)
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
  anchor: Anchor,
  warehouse: Warehouse,
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
// Top Info Bar
// =============================================================================

function TopBar({
  email,
  phone,
  primaryColor,
}: {
  email: string;
  phone: string;
  primaryColor: string;
}) {
  return (
    <div
      className="hidden md:block text-white text-sm"
      style={{ backgroundColor: primaryColor }}
    >
      <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-1.5 hover:text-white/80 transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>{email}</span>
            </a>
          )}
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>Working Hours: Mon–Fri 8:00 AM – 6:00 PM</span>
          </span>
        </div>
        {phone && (
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            className="flex items-center gap-1.5 font-semibold hover:text-white/80 transition-colors"
          >
            <Phone className="h-3.5 w-3.5" />
            <span>{phone}</span>
          </a>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Hero Section — Masonry image grid + Quote form
// =============================================================================

function HeroSection({
  content,
  primaryColor,
  secondaryColor,
  logoUrl,
  siteName,
  email,
  phone,
}: {
  content: TemplateProps["sections"]["hero"]["content"];
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  siteName: string;
  email: string;
  phone: string;
}) {
  const images = content.images?.filter(Boolean) ?? [];
  const [quoteForm, setQuoteForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleQuoteSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: quoteForm.name,
          email: quoteForm.email,
          phone: quoteForm.phone,
          message: quoteForm.message || "Quote request from homepage form",
        }),
      });
      setSubmitted(true);
    } catch {
      /* silent */
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="hero"
      className="relative overflow-hidden"
      style={{ backgroundColor: secondaryColor }}
    >
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid lg:grid-cols-2 gap-10 items-center">
        {/* Image Grid */}
        <div className="grid grid-cols-2 gap-3 h-[340px] md:h-[480px]">
          {images[0] && (
            <div className="col-span-1 row-span-2 rounded-xl overflow-hidden">
              <img
                src={images[0]}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {images[1] && (
            <div className="col-span-1 rounded-xl overflow-hidden">
              <img
                src={images[1]}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {images[2] && (
            <div className="col-span-1 rounded-xl overflow-hidden relative">
              <img
                src={images[2]}
                alt=""
                className="w-full h-full object-cover"
              />
              {content.cta_text && (
                <a
                  href={content.cta_link || "#contact"}
                  className="absolute bottom-4 left-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-bold text-sm shadow-lg transition-all hover:scale-105"
                  style={{ backgroundColor: primaryColor }}
                >
                  {content.cta_text}
                  <ArrowRight className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
          {/* Fallback if no images */}
          {images.length === 0 && (
            <div
              className="col-span-2 row-span-2 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}22, ${secondaryColor}88)`,
              }}
            >
              <Truck className="h-20 w-20 text-white/20" />
            </div>
          )}
        </div>

        {/* Quote Form */}
        <div
          className="rounded-2xl p-8 md:p-10 shadow-2xl"
          style={{ backgroundColor: primaryColor }}
        >
          <h3
            className="text-2xl md:text-3xl font-extrabold text-white mb-6 leading-tight"
            style={{ fontFamily: "var(--tp-font-heading)" }}
          >
            {content.headline || "Get your free quote today"}
          </h3>
          {submitted ? (
            <div className="flex items-center gap-3 text-white">
              <CheckCircle className="h-6 w-6" />
              <span className="font-medium">
                Thank you! We&apos;ll be in touch shortly.
              </span>
            </div>
          ) : (
            <form onSubmit={handleQuoteSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Your Name"
                required
                value={quoteForm.name}
                onChange={(e) =>
                  setQuoteForm({ ...quoteForm, name: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg bg-white/15 text-white placeholder-white/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
                style={{ fontFamily: "var(--tp-font-body)" }}
              />
              <input
                type="email"
                placeholder="Email*"
                required
                value={quoteForm.email}
                onChange={(e) =>
                  setQuoteForm({ ...quoteForm, email: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg bg-white/15 text-white placeholder-white/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
                style={{ fontFamily: "var(--tp-font-body)" }}
              />
              <input
                type="tel"
                placeholder="Phone"
                value={quoteForm.phone}
                onChange={(e) =>
                  setQuoteForm({ ...quoteForm, phone: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg bg-white/15 text-white placeholder-white/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
                style={{ fontFamily: "var(--tp-font-body)" }}
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-60"
                style={{
                  backgroundColor: "#fff",
                  color: primaryColor,
                  fontFamily: "var(--tp-font-body)",
                }}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Request A Quote
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// Feature Cards (3-up below hero)
// =============================================================================

function FeatureCards({ primaryColor }: { primaryColor: string }) {
  const features = [
    {
      icon: Globe,
      title: "Export Logistics",
      desc: "Streamlined export solutions ensuring smooth & timely transportation worldwide.",
    },
    {
      icon: Truck,
      title: "Fast Delivery",
      desc: "Express logistics with reliable, on-time delivery across all major routes.",
    },
    {
      icon: Clock,
      title: "24/7 Support",
      desc: "Round-the-clock customer support and real-time shipment tracking.",
    },
  ];

  return (
    <section className="relative -mt-8 z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-5">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-lg p-6 flex items-start gap-4 hover:shadow-xl transition-shadow"
            >
              <div
                className="flex-shrink-0 h-12 w-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <feat.icon
                  className="h-6 w-6"
                  style={{ color: primaryColor }}
                />
              </div>
              <div>
                <h4
                  className="font-bold text-gray-900 text-base mb-1"
                  style={{ fontFamily: "var(--tp-font-heading)" }}
                >
                  {feat.title}
                </h4>
                <p
                  className="text-gray-500 text-sm leading-relaxed"
                  style={{ fontFamily: "var(--tp-font-body)" }}
                >
                  {feat.desc}
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
// About Section — Years counter + stats
// =============================================================================

function AboutSection({
  content,
  primaryColor,
  secondaryColor,
  statsContent,
}: {
  content: TemplateProps["sections"]["about"]["content"];
  primaryColor: string;
  secondaryColor: string;
  statsContent: TemplateProps["sections"]["stats"]["content"];
}) {
  const stats = statsContent.stats ?? [];

  return (
    <section
      id="about"
      className="py-20 md:py-28"
      style={{ backgroundColor: "#f8f9fa" }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Image with year badge */}
          <div className="relative">
            {content.image_url ? (
              <>
                <img
                  src={content.image_url}
                  alt={content.heading}
                  className="rounded-2xl shadow-xl w-full h-auto object-cover aspect-[4/3]"
                />
                {/* Years badge */}
                {stats[0] && (
                  <div
                    className="absolute -bottom-6 -right-4 md:-right-6 rounded-2xl p-6 text-white shadow-xl"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <div className="flex items-baseline gap-1">
                      <span
                        className="text-4xl md:text-5xl font-extrabold"
                        style={{ fontFamily: "var(--tp-font-heading)" }}
                      >
                        {stats[0].value}
                      </span>
                      <span className="text-2xl font-bold">
                        {stats[0].suffix || "+"}
                      </span>
                    </div>
                    <p className="text-white/80 text-sm mt-1 font-medium">
                      Years Working Experience
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div
                className="rounded-2xl h-80 flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}22, ${secondaryColor}44)`,
                }}
              >
                <Truck className="h-16 w-16 text-gray-300" />
              </div>
            )}
          </div>

          {/* Text */}
          <div>
            <p
              className="text-sm font-bold uppercase tracking-widest mb-3"
              style={{ color: primaryColor }}
            >
              About Company
            </p>
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 leading-tight"
              style={{ fontFamily: "var(--tp-font-heading)" }}
            >
              {content.heading}
            </h2>
            <p
              className="text-gray-600 text-base md:text-lg leading-relaxed whitespace-pre-line mb-8"
              style={{ fontFamily: "var(--tp-font-body)" }}
            >
              {content.body}
            </p>

            {/* Mini stats row */}
            {stats.length >= 3 && (
              <div className="grid grid-cols-2 gap-4">
                {stats.slice(1, 3).map((stat, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl p-5"
                    style={{ backgroundColor: `${primaryColor}08` }}
                  >
                    <p
                      className="text-sm font-semibold text-gray-500 mb-1"
                      style={{ fontFamily: "var(--tp-font-body)" }}
                    >
                      {stat.label}
                    </p>
                    <p
                      className="text-3xl font-extrabold"
                      style={{
                        color: primaryColor,
                        fontFamily: "var(--tp-font-heading)",
                      }}
                    >
                      {stat.prefix || ""}
                      {stat.value}
                      {stat.suffix || ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// Services Section — Card grid with arrow links
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
  if (services.length === 0) return null;

  return (
    <section id="services" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <p
              className="text-sm font-bold uppercase tracking-widest mb-3"
              style={{ color: primaryColor }}
            >
              Our Services
            </p>
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight"
              style={{ fontFamily: "var(--tp-font-heading)" }}
            >
              Wide variety of logistics services
            </h2>
          </div>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm text-white transition-all hover:scale-105 shrink-0"
            style={{ backgroundColor: primaryColor }}
          >
            View All Services
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Service cards */}
        <div className="grid md:grid-cols-2 gap-4">
          {services.map((svc, idx) => (
            <div
              key={idx}
              className="group rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
              style={{ backgroundColor: secondaryColor }}
            >
              <div className="p-6 md:p-8 flex items-start gap-5">
                <div
                  className="flex-shrink-0 h-14 w-14 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  <ServiceIcon
                    icon={svc.icon}
                    className="h-7 w-7 text-white"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-lg md:text-xl font-bold text-white mb-2 group-hover:text-white/90"
                    style={{ fontFamily: "var(--tp-font-heading)" }}
                  >
                    {svc.title}
                  </h3>
                  <p
                    className="text-white/60 text-sm leading-relaxed"
                    style={{ fontFamily: "var(--tp-font-body)" }}
                  >
                    {svc.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => scrollToSection("contact")}
                  className="flex-shrink-0 h-10 w-10 rounded-full border border-white/20 flex items-center justify-center text-white/50 group-hover:text-white group-hover:border-white/50 transition-all"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// Scrolling Marquee
// =============================================================================

function ScrollingMarquee({ primaryColor }: { primaryColor: string }) {
  const items = ["CARGO", "TRANSPORT", "LOGISTICS", "WAREHOUSE"];

  return (
    <div
      className="py-5 overflow-hidden"
      style={{ backgroundColor: `${primaryColor}08` }}
    >
      <div className="flex animate-marquee whitespace-nowrap">
        {[...items, ...items, ...items, ...items, ...items].map((item, idx) => (
          <span
            key={idx}
            className="mx-8 flex items-center gap-4"
            style={{ fontFamily: "var(--tp-font-heading)" }}
          >
            <span className="text-2xl md:text-3xl font-extrabold text-gray-200">
              {item}
            </span>
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
          </span>
        ))}
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// Why Choose Us — With tabs
// =============================================================================

function WhyChooseSection({
  primaryColor,
  secondaryColor,
  aboutContent,
}: {
  primaryColor: string;
  secondaryColor: string;
  aboutContent: TemplateProps["sections"]["about"]["content"];
}) {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = [
    {
      label: "WHAT WE DO",
      content: aboutContent.body,
      items: [
        "End-to-end supply chain management",
        "Real-time shipment tracking & visibility",
        "Customs clearance & documentation",
        "Temperature-controlled logistics",
        "Last-mile delivery solutions",
        "Cross-docking & distribution",
      ],
    },
    {
      label: "OUR AWARD",
      content:
        "Recognized as a leading logistics provider with industry awards for excellence in service delivery and innovation.",
      items: [
        "Best Logistics Provider 2024",
        "Innovation in Supply Chain Award",
        "Customer Excellence Award",
        "Green Logistics Certification",
        "Industry Leader Recognition",
        "Safety Excellence Award",
      ],
    },
    {
      label: "COMPANY HISTORY",
      content:
        "From humble beginnings to a nationwide logistics network, our journey has been driven by a commitment to reliability and innovation.",
      items: [
        "Founded with a single depot",
        "Expanded to nationwide coverage",
        "Introduced real-time tracking",
        "Launched temperature-controlled fleet",
        "Opened cross-dock facilities",
        "Achieved ISO 9001 certification",
      ],
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: heading + video */}
          <div>
            <p
              className="text-sm font-bold uppercase tracking-widest mb-3"
              style={{ color: primaryColor }}
            >
              Why Choose Us
            </p>
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-6"
              style={{ fontFamily: "var(--tp-font-heading)" }}
            >
              We provide full time global logistics solution
            </h2>
            <button
              type="button"
              className="inline-flex items-center gap-3 group"
            >
              <span
                className="h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110"
                style={{ backgroundColor: primaryColor }}
              >
                <Play className="h-5 w-5 text-white ml-0.5" />
              </span>
              <span
                className="font-bold text-gray-900 group-hover:underline"
                style={{ fontFamily: "var(--tp-font-body)" }}
              >
                Watch Video
              </span>
            </button>
          </div>

          {/* Right: tabs */}
          <div>
            <div className="flex gap-1 mb-6 border-b border-gray-200">
              {tabs.map((tab, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 -mb-px ${
                    activeTab === idx
                      ? "border-current"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                  style={{
                    color: activeTab === idx ? primaryColor : undefined,
                    fontFamily: "var(--tp-font-body)",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <p
              className="text-gray-600 text-base leading-relaxed mb-6"
              style={{ fontFamily: "var(--tp-font-body)" }}
            >
              {tabs[activeTab].content}
            </p>
            <ul className="space-y-3">
              {tabs[activeTab].items.map((item, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <CheckCircle
                    className="h-5 w-5 flex-shrink-0"
                    style={{ color: primaryColor }}
                  />
                  <span
                    className="text-gray-700 text-sm"
                    style={{ fontFamily: "var(--tp-font-body)" }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 mt-6 font-bold text-sm transition-all hover:gap-3"
              style={{ color: primaryColor, fontFamily: "var(--tp-font-body)" }}
            >
              Learn More
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// CTA Banner
// =============================================================================

function CTABanner({
  primaryColor,
  secondaryColor,
}: {
  primaryColor: string;
  secondaryColor: string;
}) {
  return (
    <section
      className="py-16 md:py-20 relative overflow-hidden"
      style={{ backgroundColor: secondaryColor }}
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative max-w-7xl mx-auto px-6 text-center">
        <h2
          className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight"
          style={{ fontFamily: "var(--tp-font-heading)" }}
        >
          Where shipping meets satisfaction.
        </h2>
        <a
          href="#contact"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-sm text-white transition-all hover:scale-105"
          style={{ backgroundColor: primaryColor }}
        >
          Learn More
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}

// =============================================================================
// Testimonials Section
// =============================================================================

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

function TestimonialsSection({
  content,
  primaryColor,
}: {
  content: TemplateProps["sections"]["testimonials"]["content"];
  primaryColor: string;
}) {
  const testimonials = content.testimonials ?? [];
  if (testimonials.length === 0) return null;

  const [current, setCurrent] = useState(0);

  return (
    <section
      id="testimonials"
      className="py-20 md:py-28"
      style={{ backgroundColor: "#f8f9fa" }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <p
          className="text-sm font-bold uppercase tracking-widest mb-3 text-center"
          style={{ color: primaryColor }}
        >
          Testimonials
        </p>
        <h2
          className="text-3xl md:text-4xl font-extrabold text-gray-900 text-center mb-12"
          style={{ fontFamily: "var(--tp-font-heading)" }}
        >
          What our clients say
        </h2>

        <div className="max-w-2xl mx-auto">
          <div
            className="bg-white rounded-2xl shadow-lg p-8 md:p-10 text-center"
          >
            <StarRating rating={testimonials[current].rating} />
            <p
              className="text-gray-700 text-base md:text-lg leading-relaxed mt-4 mb-6 italic"
              style={{ fontFamily: "var(--tp-font-body)" }}
            >
              &ldquo;{testimonials[current].text}&rdquo;
            </p>
            <p
              className="font-bold text-gray-900"
              style={{ fontFamily: "var(--tp-font-heading)" }}
            >
              {testimonials[current].name}
            </p>
            <p className="text-gray-500 text-sm">{testimonials[current].company}</p>
          </div>

          {testimonials.length > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                type="button"
                onClick={() =>
                  setCurrent(
                    (current - 1 + testimonials.length) % testimonials.length
                  )
                }
                className="h-10 w-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </button>
              <div className="flex gap-2">
                {testimonials.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrent(idx)}
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: idx === current ? "24px" : "8px",
                      backgroundColor:
                        idx === current ? primaryColor : "#d1d5db",
                    }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  setCurrent((current + 1) % testimonials.length)
                }
                className="h-10 w-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          )}
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
}: {
  content: TemplateProps["sections"]["contact"]["content"];
  primaryColor: string;
  secondaryColor: string;
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setSubmitted(true);
    } catch {
      /* silent */
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="contact"
      className="py-20 md:py-28 bg-white"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact info */}
          <div>
            <p
              className="text-sm font-bold uppercase tracking-widest mb-3"
              style={{ color: primaryColor }}
            >
              Get In Touch
            </p>
            <h2
              className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6"
              style={{ fontFamily: "var(--tp-font-heading)" }}
            >
              {content.heading}
            </h2>

            <div className="space-y-5">
              {content.email && (
                <a
                  href={`mailto:${content.email}`}
                  className="flex items-center gap-4 group"
                >
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${primaryColor}12` }}
                  >
                    <Mail className="h-5 w-5" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Email
                    </p>
                    <p className="text-gray-900 font-medium group-hover:underline">
                      {content.email}
                    </p>
                  </div>
                </a>
              )}
              {content.phone && (
                <a
                  href={`tel:${content.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-4 group"
                >
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${primaryColor}12` }}
                  >
                    <Phone className="h-5 w-5" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Phone
                    </p>
                    <p className="text-gray-900 font-medium group-hover:underline">
                      {content.phone}
                    </p>
                  </div>
                </a>
              )}
              {content.address && (
                <div className="flex items-center gap-4">
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${primaryColor}12` }}
                  >
                    <MapPin className="h-5 w-5" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Address
                    </p>
                    <p className="text-gray-900 font-medium">
                      {content.address}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <div
            className="rounded-2xl p-8 md:p-10"
            style={{ backgroundColor: secondaryColor }}
          >
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-400 mb-4" />
                <h3
                  className="text-xl font-bold text-white mb-2"
                  style={{ fontFamily: "var(--tp-font-heading)" }}
                >
                  Message Sent!
                </h3>
                <p className="text-white/60">
                  We&apos;ll get back to you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-white/50 border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
                  style={{ fontFamily: "var(--tp-font-body)" }}
                />
                <input
                  type="email"
                  placeholder="Email*"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-white/50 border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
                  style={{ fontFamily: "var(--tp-font-body)" }}
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-white/50 border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
                  style={{ fontFamily: "var(--tp-font-body)" }}
                />
                <textarea
                  placeholder="Your Message"
                  rows={4}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-white/50 border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
                  style={{ fontFamily: "var(--tp-font-body)" }}
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-60"
                  style={{
                    backgroundColor: primaryColor,
                    color: "#fff",
                    fontFamily: "var(--tp-font-body)",
                  }}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Send Message
                      <Send className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// Footer
// =============================================================================

function Footer({
  content,
  primaryColor,
  secondaryColor,
  email,
  phone,
  address,
}: {
  content: TemplateProps["sections"]["footer"]["content"];
  primaryColor: string;
  secondaryColor: string;
  email: string;
  phone: string;
  address: string;
}) {
  return (
    <footer style={{ backgroundColor: secondaryColor }}>
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <h3
              className="text-xl font-extrabold text-white mb-4"
              style={{ fontFamily: "var(--tp-font-heading)" }}
            >
              {content.company_name}
            </h3>
            <p
              className="text-white/50 text-sm leading-relaxed max-w-md"
              style={{ fontFamily: "var(--tp-font-body)" }}
            >
              Your trusted logistics partner delivering reliability across
              Australia and beyond.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4
              className="text-white font-bold mb-4"
              style={{ fontFamily: "var(--tp-font-heading)" }}
            >
              Quick Links
            </h4>
            <ul className="space-y-2">
              {content.links.map((link, idx) => (
                <li key={idx}>
                  <a
                    href={link.url}
                    className="text-white/50 hover:text-white text-sm transition-colors"
                    style={{ fontFamily: "var(--tp-font-body)" }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4
              className="text-white font-bold mb-4"
              style={{ fontFamily: "var(--tp-font-heading)" }}
            >
              Contact
            </h4>
            <ul className="space-y-3">
              {email && (
                <li>
                  <a
                    href={`mailto:${email}`}
                    className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    {email}
                  </a>
                </li>
              )}
              {phone && (
                <li>
                  <a
                    href={`tel:${phone.replace(/\s/g, "")}`}
                    className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    {phone}
                  </a>
                </li>
              )}
              {address && (
                <li>
                  <span className="flex items-start gap-2 text-white/50 text-sm">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    {address}
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="border-t border-white/10 py-5"
      >
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-3 text-white/40 text-sm">
          <p style={{ fontFamily: "var(--tp-font-body)" }}>
            {content.copyright_text}
          </p>
          <p style={{ fontFamily: "var(--tp-font-body)" }}>
            Powered by Transport Builder
          </p>
        </div>
      </div>
    </footer>
  );
}

// =============================================================================
// Mobile Nav Drawer
// =============================================================================

function MobileNav({
  primaryColor,
  sections,
  logoUrl,
  siteName,
}: {
  primaryColor: string;
  sections: TemplateProps["sections"];
  logoUrl: string;
  siteName: string;
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
        className="fixed top-4 right-4 z-50 md:hidden h-10 w-10 rounded-lg flex items-center justify-center text-white"
        style={{ backgroundColor: primaryColor }}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-72 shadow-2xl transform transition-transform duration-300 md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <span className="font-bold text-white">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-8 w-auto" />
            ) : (
              siteName
            )}
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-white hover:text-white/80"
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
              className="w-full text-left px-4 py-3 rounded-lg text-white hover:bg-white/10 font-medium text-sm transition-colors"
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
  secondaryColor,
  sections,
  logoUrl,
  siteName,
  phone,
}: {
  primaryColor: string;
  secondaryColor: string;
  sections: TemplateProps["sections"];
  logoUrl: string;
  siteName: string;
  phone: string;
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
      className={`hidden md:flex items-center justify-between px-6 h-18 transition-all duration-300 ${
        scrolled
          ? "fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md shadow-sm"
          : "relative z-10"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo"
            className={`h-10 w-auto object-contain ${scrolled ? "" : "brightness-0 invert"}`}
          />
        ) : (
          <span
            className={`text-xl font-extrabold tracking-tight ${scrolled ? "text-gray-900" : "text-white"}`}
            style={{ fontFamily: "var(--tp-font-heading)" }}
          >
            {siteName}
          </span>
        )}
      </div>

      {/* Nav links */}
      <div className="flex items-center gap-6">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollToSection(item.id)}
            className={`text-sm font-medium transition-colors ${
              scrolled
                ? "text-gray-700 hover:text-gray-900"
                : "text-white/80 hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Phone CTA */}
      {phone && (
        <a
          href={`tel:${phone.replace(/\s/g, "")}`}
          className="flex items-center gap-2 shrink-0"
        >
          <Phone
            className={`h-4 w-4 ${scrolled ? "text-gray-500" : "text-white/60"}`}
          />
          <span
            className={`text-sm font-bold ${scrolled ? "text-gray-900" : "text-white"}`}
            style={{ fontFamily: "var(--tp-font-heading)" }}
          >
            {phone}
          </span>
        </a>
      )}
    </nav>
  );
}

// =============================================================================
// Calculator Section (Pro/Premium)
// =============================================================================

function CalculatorSection({
  content,
  primaryColor,
  rateTable,
}: {
  content: TemplateProps["sections"]["calculator"]["content"];
  primaryColor: string;
  rateTable?: TemplateProps["rateTable"];
}) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [distance, setDistance] = useState<number | null>(null);
  const [calculated, setCalculated] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCalculate() {
    if (!origin || !destination || !rateTable) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/calculator?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
      );
      const data = await res.json();
      if (data.distance_km) {
        setDistance(data.distance_km);
        setCalculated(true);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }

  const estimatedCost =
    distance && rateTable
      ? Math.max(rateTable.minimum_fee, distance * rateTable.base_rate_per_km)
      : null;

  return (
    <section id="calculator" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <p
          className="text-sm font-bold uppercase tracking-widest mb-3 text-center"
          style={{ color: primaryColor }}
        >
          Rate Calculator
        </p>
        <h2
          className="text-3xl md:text-4xl font-extrabold text-gray-900 text-center mb-4"
          style={{ fontFamily: "var(--tp-font-heading)" }}
        >
          {content.heading}
        </h2>
        <p
          className="text-gray-500 text-center max-w-xl mx-auto mb-10"
          style={{ fontFamily: "var(--tp-font-body)" }}
        >
          {content.description}
        </p>

        <div className="max-w-xl mx-auto">
          <div
            className="rounded-2xl p-8 shadow-lg"
            style={{ backgroundColor: "#f8f9fa" }}
          >
            <div className="space-y-4">
              <div>
                <label
                  className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block"
                  style={{ fontFamily: "var(--tp-font-body)" }}
                >
                  Pickup Location
                </label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="e.g. Sydney, NSW"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent bg-white"
                  style={{
                    fontFamily: "var(--tp-font-body)",
                    ["--tw-ring-color" as string]: primaryColor,
                  }}
                />
              </div>
              <div>
                <label
                  className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block"
                  style={{ fontFamily: "var(--tp-font-body)" }}
                >
                  Delivery Location
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Melbourne, VIC"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent bg-white"
                  style={{
                    fontFamily: "var(--tp-font-body)",
                    ["--tw-ring-color" as string]: primaryColor,
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleCalculate}
                disabled={loading || !origin || !destination}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg font-bold text-sm text-white transition-all hover:scale-[1.02] disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Calculate Rate
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            {calculated && distance && estimatedCost && rateTable && (
              <div
                className="mt-6 rounded-xl p-5 text-center"
                style={{ backgroundColor: `${primaryColor}10` }}
              >
                <p className="text-sm text-gray-500 mb-1">Estimated Distance</p>
                <p
                  className="text-lg font-bold"
                  style={{ color: primaryColor }}
                >
                  {distance.toFixed(1)} km
                </p>
                <p className="text-sm text-gray-500 mt-3 mb-1">
                  Estimated Cost
                </p>
                <p
                  className="text-3xl font-extrabold"
                  style={{ color: primaryColor }}
                >
                  {rateTable.currency === "AUD" ? "A$" : "$"}
                  {estimatedCost.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Based on ${rateTable.base_rate_per_km}/km rate. Final price
                  may vary.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// Stats Section — Animated Counters
// =============================================================================

function AnimatedCounter({
  value,
  prefix,
  suffix,
}: {
  value: string;
  prefix?: string;
  suffix?: string;
}) {
  const [display, setDisplay] = useState("0");
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const numericStr = value.replace(/[,%]/g, "");
    const num = parseFloat(numericStr);
    if (isNaN(num)) {
      setDisplay(value);
      return;
    }
    const duration = 2000;
    const start = performance.now();
    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = num * eased;
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
      {prefix}
      {display}
      {suffix}
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
    <section
      id="stats"
      className="py-14 md:py-20 border-y border-gray-100"
      style={{ backgroundColor: "#f8f9fa" }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center">
              <div
                className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-1"
                style={{
                  color: primaryColor,
                  fontFamily: "var(--tp-font-heading)",
                }}
              >
                <AnimatedCounter
                  value={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                />
              </div>
              <p
                className="text-gray-500 text-xs md:text-sm font-medium uppercase tracking-wider"
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

export default function CargoShipping(props: TemplateProps) {
  const { siteName, config, sections, rateTable, integrations, plan } = props;

  const primaryColor = config.primary_color || "#1a3c6e";
  const secondaryColor = config.secondary_color || "#0a1f3d";
  const isProOrAbove = plan === "pro" || plan === "premium";

  const contactEmail = sections.contact.is_enabled
    ? sections.contact.content.email
    : "";
  const contactPhone = sections.contact.is_enabled
    ? sections.contact.content.phone
    : "";
  const contactAddress = sections.contact.is_enabled
    ? sections.contact.content.address
    : "";

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
        className="min-h-screen bg-white text-gray-900 antialiased"
      >
        {/* Top Info Bar */}
        <TopBar
          email={contactEmail}
          phone={contactPhone}
          primaryColor={primaryColor}
        />

        {/* Navigation */}
        <DesktopNav
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          sections={sections}
          logoUrl={sections.hero.content.logo_url}
          siteName={siteName}
          phone={contactPhone}
        />
        <MobileNav
          primaryColor={primaryColor}
          sections={sections}
          logoUrl={sections.hero.content.logo_url}
          siteName={siteName}
        />

        {/* Hero — Image grid + Quote form */}
        {sections.hero.is_enabled && (
          <HeroSection
            content={sections.hero.content}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            logoUrl={sections.hero.content.logo_url}
            siteName={siteName}
            email={contactEmail}
            phone={contactPhone}
          />
        )}

        {/* Feature Cards */}
        <FeatureCards primaryColor={primaryColor} />

        {/* Services */}
        {sections.services.is_enabled && (
          <ServicesSection
            content={sections.services.content}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />
        )}

        {/* About — with years badge and mini stats */}
        {sections.about.is_enabled && (
          <AboutSection
            content={sections.about.content}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            statsContent={sections.stats.content}
          />
        )}

        {/* Scrolling Marquee */}
        <ScrollingMarquee primaryColor={primaryColor} />

        {/* Why Choose Us */}
        <WhyChooseSection
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          aboutContent={sections.about.content}
        />

        {/* CTA Banner */}
        <CTABanner
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />

        {/* Calculator — Pro/Premium only */}
        {isProOrAbove && sections.calculator.is_enabled && (
          <CalculatorSection
            content={sections.calculator.content}
            primaryColor={primaryColor}
            rateTable={rateTable}
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
            secondaryColor={secondaryColor}
          />
        )}

        {/* Footer */}
        {sections.footer.is_enabled && (
          <Footer
            content={sections.footer.content}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            email={contactEmail}
            phone={contactPhone}
            address={contactAddress}
          />
        )}
      </div>
    </>
  );
}
