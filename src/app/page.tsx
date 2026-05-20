"use client";

import Link from "next/link";
import { useState } from "react";

// ─── Icon components (no external dep) ──────────────────────────────────────

function TruckIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 3h15v13H1z" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function GlobeIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function CalculatorIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 6h8" /><path d="M8 10h8" /><circle cx="8" cy="14" r="0.5" fill="currentColor" /><circle cx="12" cy="14" r="0.5" fill="currentColor" /><circle cx="16" cy="14" r="0.5" fill="currentColor" /><circle cx="8" cy="18" r="0.5" fill="currentColor" /><circle cx="12" cy="18" r="0.5" fill="currentColor" /><circle cx="16" cy="18" r="0.5" fill="currentColor" />
    </svg>
  );
}

function StarIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function CheckIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ArrowRightIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function MapPinIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PaintbrushIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.37 2.63a2.12 2.12 0 0 1 3 3L14 13l-4 1 1-4z" /><path d="M9 2H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5" />
    </svg>
  );
}

function ShieldIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function ZapIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: <PaintbrushIcon />,
    title: "Pick a Template",
    description: "Choose from transport-industry templates designed to convert visitors into customers.",
  },
  {
    icon: <GlobeIcon />,
    title: "Connect Your Domain",
    description: "Use your own domain or a free subdomain. SSL included, no DNS headaches.",
  },
  {
    icon: <CalculatorIcon />,
    title: "Rate Calculator",
    description: "Mapbox-powered distance calculator that emails quotes to customers — and to you.",
  },
  {
    icon: <MapPinIcon />,
    title: "Service Areas",
    description: "Show exactly where you operate with interactive maps and zone-based pricing.",
  },
  {
    icon: <ShieldIcon />,
    title: "SEO & Analytics",
    description: "Built-in meta tags, sitemap, and Google Analytics 4 integration out of the box.",
  },
  {
    icon: <ZapIcon />,
    title: "Live in Minutes",
    description: "No developers, no CMS setup. Edit, preview, and publish — all from your browser.",
  },
];

const plans = [
  {
    name: "Starter",
    price: 29,
    yearlyPrice: 278,
    setupFee: 49,
    description: "A professional site for your transport business",
    features: [
      "1 landing page site",
      "Choice of templates",
      "Contact form with email",
      "Free subdomain included",
      "SSL certificate",
      "Mobile responsive",
    ],
    cta: "Start Free Trial",
    highlighted: false,
  },
  {
    name: "Pro",
    price: 49,
    yearlyPrice: 470,
    setupFee: 99,
    description: "Turn your site into a lead-generation machine",
    features: [
      "Everything in Starter",
      "Rate calculator with Mapbox",
      "Calculator quote emails",
      "Custom domain connection",
      "Google Reviews embed",
      "Google Analytics 4",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Premium",
    price: 79,
    yearlyPrice: 758,
    setupFee: 199,
    description: "For companies that need full power",
    features: [
      "Everything in Pro",
      "Zone-based rate tables",
      "Vehicle type surcharges",
      "Priority support",
      "Dedicated VPS (faster)",
      "White-label option",
    ],
    cta: "Start Free Trial",
    highlighted: false,
  },
];

const testimonials = [
  {
    quote: "We were paying a designer $200/mo for a site that never got updated. Now we change our rates and service areas whenever we want.",
    author: "Dan M.",
    company: "Eastside Haulage",
    rating: 5,
  },
  {
    quote: "The rate calculator alone pays for itself. We get quote requests while we sleep — customers love the instant pricing.",
    author: "Sarah K.",
    company: "Metro Freight",
    rating: 5,
  },
  {
    quote: "Had our site live in 20 minutes. My wife helped pick the template and that was the hardest part.",
    author: "Mick R.",
    company: "Mick's Transport",
    rating: 5,
  },
];

const steps = [
  {
    number: "01",
    title: "Pick a template",
    description: "Browse transport-specific templates built to showcase your services and build trust.",
  },
  {
    number: "02",
    title: "Customise your content",
    description: "Use the live editor to update text, images, services, and service areas in real-time.",
  },
  {
    number: "03",
    title: "Hit publish",
    description: "Your site goes live instantly with SSL. Connect your own domain whenever you're ready.",
  },
];

// ─── Landing Page ────────────────────────────────────────────────────────────

export default function Home() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="min-h-screen bg-white text-gray-700 overflow-x-hidden">
      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-sm font-bold tracking-tight text-white">
              TB
            </div>
            <span className="text-lg font-heading font-bold tracking-tight text-gray-900">
              Transport<span className="text-gray-500">Builder</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <a href="#features" className="hover:text-gray-900 transition">Features</a>
            <a href="#how-it-works" className="hover:text-gray-900 transition">How It Works</a>
            <a href="#pricing" className="hover:text-gray-900 transition">Pricing</a>
            <a href="#testimonials" className="hover:text-gray-900 transition">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-gray-500 hover:text-gray-900 transition hidden sm:block"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-heading font-bold tracking-tight leading-[1.1] max-w-4xl mx-auto text-gray-900">
            Your transport company
            <br />
            <span className="text-gray-400">
              deserves a better website
            </span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Pick a template, customise your content, connect your domain. Go live in minutes — no developer needed. Built specifically for transport &amp; logistics companies.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 py-4 rounded-xl text-lg transition"
            >
              Start Building Free
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium px-6 py-4 rounded-xl text-lg transition border border-gray-300 hover:border-gray-400"
            >
              See How It Works
            </a>
          </div>

          {/* Hero visual — mockup */}
          <div className="mt-16 md:mt-24 relative mx-auto max-w-5xl">
            <div className="relative rounded-xl border border-gray-200 bg-gray-50 overflow-hidden shadow-lg">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-white">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-gray-100 rounded-md px-4 py-1 text-xs text-gray-400 font-mono">
                    yourcompany.transportbuilder.xyz
                  </div>
                </div>
              </div>
              {/* Mockup content */}
              <div className="aspect-[16/9] bg-white flex items-center justify-center">
                <div className="text-center space-y-4 px-8">
                  <TruckIcon className="w-16 h-16 text-gray-300 mx-auto" />
                  <div className="space-y-2">
                    <div className="h-4 w-48 bg-gray-200 rounded mx-auto" />
                    <div className="h-3 w-64 bg-gray-100 rounded mx-auto" />
                    <div className="h-3 w-40 bg-gray-100 rounded mx-auto" />
                  </div>
                  <div className="flex gap-3 justify-center pt-2">
                    <div className="h-10 w-32 bg-gray-900 rounded-lg" />
                    <div className="h-10 w-32 bg-gray-100 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social proof bar ────────────────────────────────────────────────── */}
      <section className="py-12 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm text-gray-400 mb-6 uppercase tracking-widest">
            Trusted by transport companies across Australia
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-4 text-gray-300">
            {["Eastside Haulage", "Metro Freight", "Mick's Transport", "Coastal Carriers", "Redline Logistics"].map(
              (name) => (
                <span key={name} className="text-lg font-heading font-semibold tracking-tight hover:text-gray-500 transition">
                  {name}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl md:text-5xl font-heading font-bold tracking-tight text-gray-900">
              Everything your transport site needs
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Purpose-built for the transport industry — not a generic website builder with transport bolted on.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl border border-gray-200 bg-white hover:shadow-md transition"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 mb-4 group-hover:bg-gray-200 transition">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-heading font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 md:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-3xl md:text-5xl font-heading font-bold tracking-tight text-gray-900">
              Live in three steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {steps.map((step) => (
              <div key={step.number} className="relative text-center md:text-left">
                <span className="text-6xl font-heading font-bold text-gray-200">
                  {step.number}
                </span>
                <h3 className="text-xl font-heading font-bold text-gray-900 mt-4 mb-2">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed">{step.description}</p>
                {step.number !== "03" && (
                  <div className="hidden md:block absolute top-8 -right-6 w-12 text-gray-300">
                    <ArrowRightIcon className="w-6 h-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Rate Calculator Showcase ─────────────────────────────────────────── */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-3">Pro Feature</p>
              <h2 className="text-3xl md:text-5xl font-heading font-bold tracking-tight text-gray-900">
                Rate calculator that works while you sleep
              </h2>
              <p className="mt-4 text-lg text-gray-500 leading-relaxed">
                Customers enter their pickup and delivery postcode. Mapbox calculates the distance, your rate table generates the price, and the quote gets emailed to both of you — instantly.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Mapbox-powered distance calculation",
                  "Customisable rate tables per km / per zone",
                  "Instant quote emails to you and your customer",
                  "Lead capture built right in",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-gray-700">
                    <CheckIcon className="w-5 h-5 text-gray-900 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold px-6 py-3 rounded-xl transition"
                >
                  Start with Pro
                  <ArrowRightIcon className="w-5 h-5" />
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="relative rounded-2xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 mb-6">Instant Rate Calculator</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Pickup Location</label>
                    <div className="h-11 bg-gray-50 border border-gray-200 rounded-lg px-4 flex items-center text-gray-500 text-sm">
                      Brisbane, QLD 4000
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Delivery Location</label>
                    <div className="h-11 bg-gray-50 border border-gray-200 rounded-lg px-4 flex items-center text-gray-500 text-sm">
                      Sydney, NSW 2000
                    </div>
                  </div>
                  <div className="h-11 bg-gray-100 border border-gray-300 rounded-lg px-4 flex items-center justify-center text-gray-700 text-sm font-medium">
                    Distance: 914 km
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className="text-sm text-gray-500 font-medium">Estimated Rate</p>
                    <p className="text-3xl font-heading font-bold text-gray-900 mt-1">$1,371.00</p>
                    <p className="text-xs text-gray-400 mt-1">Based on $1.50/km standard rate</p>
                  </div>
                  <div className="h-11 bg-gray-900 hover:bg-gray-800 rounded-lg flex items-center justify-center text-sm font-semibold text-white transition">
                    Get Quote via Email
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 md:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-3xl md:text-5xl font-heading font-bold tracking-tight text-gray-900">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Start free. Upgrade when you need the calculator and custom domain.
            </p>
          </div>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <span className={`text-sm ${billing === "monthly" ? "text-gray-900" : "text-gray-400"}`}>Monthly</span>
            <button
              onClick={() => setBilling(billing === "monthly" ? "yearly" : "monthly")}
              className="relative w-12 h-6 rounded-full bg-gray-200 transition"
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-gray-900 transition-transform ${billing === "yearly" ? "translate-x-6" : ""}`}
              />
            </button>
            <span className={`text-sm ${billing === "yearly" ? "text-gray-900" : "text-gray-400"}`}>
              Yearly <span className="text-gray-500 text-xs font-medium ml-1">Save 20%</span>
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => {
              const price = billing === "yearly" ? Math.round(plan.yearlyPrice / 12) : plan.price;
              const displayTotal = billing === "yearly" ? plan.yearlyPrice : null;
              return (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl p-6 md:p-8 ${
                    plan.highlighted
                      ? "border-2 border-gray-900 bg-white shadow-lg"
                      : "border border-gray-200 bg-white shadow-sm"
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-900 text-xs font-semibold px-3 py-1 rounded-full text-white">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-lg font-heading font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                  <div className="mt-6 mb-6">
                    <span className="text-4xl font-heading font-bold text-gray-900">${price}</span>
                    <span className="text-gray-400">/mo</span>
                    {billing === "yearly" && displayTotal && (
                      <p className="text-xs text-gray-400 mt-1">Billed annually (${displayTotal}/yr)</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">+ ${plan.setupFee} setup fee</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm text-gray-700">
                        <CheckIcon className={`w-4 h-4 shrink-0 text-gray-900`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className={`block text-center py-3 rounded-xl font-semibold text-sm transition ${
                      plan.highlighted
                        ? "bg-gray-900 hover:bg-gray-800 text-white"
                        : "bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────────────── */}
      <section id="testimonials" className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-3">Testimonials</p>
            <h2 className="text-3xl md:text-5xl font-heading font-bold tracking-tight text-gray-900">
              Loved by transport operators
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.author}
                className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <StarIcon key={i} className="w-4 h-4 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-heading font-bold text-sm text-gray-900">{t.author}</p>
                  <p className="text-sm text-gray-400">{t.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-32 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-heading font-bold tracking-tight text-gray-900">Common questions</h2>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "Do I need a developer to set this up?",
                a: "Not at all. Transport Builder is designed for transport operators, not tech teams. Pick a template, fill in your details, and publish. If you can use a web browser, you can build your site.",
              },
              {
                q: "How does the rate calculator work?",
                a: "Customers enter pickup and delivery postcodes. Mapbox calculates the driving distance, your rate table generates a price, and the quote is emailed to both of you instantly. It's available on Pro and Premium plans.",
              },
              {
                q: "Can I use my own domain name?",
                a: "Yes — on Pro and Premium plans. You get a free subdomain on Starter, and can connect your own domain (like yourcompany.com.au) on paid plans. We handle SSL automatically.",
              },
              {
                q: "What if I need to change my rates?",
                a: "Update your rate table in the editor and changes go live immediately. No waiting, no re-deployment. You can also set zone-based rates and vehicle surcharges on Premium.",
              },
              {
                q: "Is there a free trial?",
                a: "Yes — every plan comes with a free trial so you can build your site and see how it looks before committing. No credit card required to start.",
              },
            ].map((faq) => (
              <div key={faq.q} className="space-y-3">
                <h3 className="text-lg font-heading font-bold text-gray-900">{faq.q}</h3>
                <p className="text-gray-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-heading font-bold tracking-tight text-gray-900">
            Ready to get your transport company online?
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Start building your professional transport website today. No credit card required.
          </p>
          <div className="mt-10">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 py-4 rounded-xl text-lg transition"
            >
              Start Building Free
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-gray-900 flex items-center justify-center text-xs font-bold text-white">
                TB
              </div>
              <span className="text-sm font-heading font-bold text-gray-900">
                Transport<span className="text-gray-400">Builder</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="#features" className="hover:text-gray-900 transition">Features</a>
              <a href="#pricing" className="hover:text-gray-900 transition">Pricing</a>
              <a href="#" className="hover:text-gray-900 transition">Privacy</a>
              <a href="#" className="hover:text-gray-900 transition">Terms</a>
            </div>
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} Transport Builder. A product of ArcLink.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
