import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// ── HTML entity escaper ────────────────────────────────────────────────
function esc(str: string | undefined | null): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// ── URL validator ──────────────────────────────────────────────────────
function safeUrl(url: string | undefined | null): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    return url;
  } catch {
    return "";
  }
}

export async function GET(req: NextRequest) {
  // ── Auth check ──────────────────────────────────────────────────────
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const siteId = req.nextUrl.searchParams.get("siteId");
  if (!siteId) {
    return NextResponse.json({ error: "Missing siteId" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // ── Ownership check ─────────────────────────────────────────────────
  const { data: site, error: siteErr } = await supabase
    .from("sites")
    .select("*, templates:template_id(slug)")
    .eq("id", siteId)
    .single();

  if (siteErr || !site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  if (site.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch sections
  const { data: sections } = await supabase
    .from("site_sections")
    .select("*")
    .eq("site_id", siteId);

  // Fetch rate table
  const { data: rateTable } = await supabase
    .from("rate_tables")
    .select("*")
    .eq("site_id", siteId)
    .single();

  // Fetch integrations
  const { data: integration } = await supabase
    .from("site_integrations")
    .select("*")
    .eq("site_id", siteId)
    .single();

  // Fetch subscription/plan
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("site_id", siteId)
    .single();

  const plan = subscription?.plan ?? "starter";

  // Build the section data structure
  const sectionMap: Record<string, { is_enabled: boolean; content: any }> = {};
  for (const sec of sections ?? []) {
    sectionMap[sec.section_key] = {
      is_enabled: sec.is_enabled,
      content: sec.content,
    };
  }

  // Build the props that the template component expects
  const templateSlug = (site.templates as any)?.slug ?? "haulier-bold";
  const config = site.config ?? {};

  const templateProps = {
    siteName: site.name,
    config,
    sections: sectionMap,
    rateTable: rateTable ?? null,
    integrations: integration ?? null,
    plan,
  };

  // Generate static HTML (sanitized)
  const html = generateStaticHtml(templateProps, templateSlug);

  // Sanitize filename for Content-Disposition
  const safeSlug = (site.slug || "site").replace(/[^a-zA-Z0-9-_]/g, "");

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeSlug}.html"`,
    },
  });
}

function generateStaticHtml(
  props: {
    siteName: string;
    config: any;
    sections: Record<string, { is_enabled: boolean; content: any }>;
    rateTable: any;
    plan: string;
  },
  _templateSlug: string
): string {
  const { siteName, config, sections } = props;
  const primaryColor = /^#[0-9a-fA-F]{3,8}$/.test(config.primary_color) ? config.primary_color : "#2563eb";
  const fontHeading = /^[a-zA-Z\s]+$/.test(config.font_heading) ? config.font_heading : "Inter";
  const fontBody = /^[a-zA-Z\s]+$/.test(config.font_body) ? config.font_body : "Inter";

  const hero = sections.hero?.content ?? {};
  const stats = sections.stats?.content ?? { stats: [] };
  const about = sections.about?.content ?? {};
  const services = sections.services?.content ?? { services: [] };
  const testimonials = sections.testimonials?.content ?? { testimonials: [] };
  const contact = sections.contact?.content ?? {};
  const footer = sections.footer?.content ?? {};

  const heroEnabled = sections.hero?.is_enabled ?? true;
  const statsEnabled = sections.stats?.is_enabled ?? true;
  const aboutEnabled = sections.about?.is_enabled ?? true;
  const servicesEnabled = sections.services?.is_enabled ?? true;
  const testimonialsEnabled = sections.testimonials?.is_enabled ?? true;
  const contactEnabled = sections.contact?.is_enabled ?? true;

  const heroImageUrl = safeUrl(hero.images?.[0]);

  const logoHtml = safeUrl(hero.logo_url)
    ? `<img src="${esc(safeUrl(hero.logo_url))}" alt="Logo" style="height:40px;width:auto;object-fit:contain;filter:brightness(0)invert(1)">`
    : `<span style="font-family:${esc(fontHeading)},sans-serif;font-weight:800;font-size:1.25rem;color:white;">${esc(siteName)}</span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${esc(config.site_title || siteName)}</title>
  ${config.meta_description ? `<meta name="description" content="${esc(config.meta_description)}">` : ""}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:${esc(fontBody)},system-ui,sans-serif;color:#1f2937;line-height:1.6}
    h1,h2,h3,h4{font-family:${esc(fontHeading)},system-ui,sans-serif}
    .container{max-width:1200px;margin:0 auto;padding:0 1.5rem}
    a{color:inherit;text-decoration:none}
    .btn{display:inline-flex;align-items:center;gap:.5rem;padding:.75rem 2rem;border-radius:.5rem;font-weight:700;font-size:1.05rem;cursor:pointer;border:none;transition:transform .2s,box-shadow .2s}
    .btn:hover{transform:scale(1.05);box-shadow:0 10px 30px rgba(0,0,0,.15)}
    .hero{position:relative;min-height:70vh;display:flex;align-items:center;justify-content:center;text-align:center;overflow:hidden}
    .hero-bg{position:absolute;inset:0;background-size:cover;background-position:center}
    .hero-overlay{position:absolute;inset:0;background:rgba(0,0,0,.55)}
    .hero-content{position:relative;z-index:10;max-width:800px;padding:2rem 1.5rem}
    .hero h1{font-size:clamp(2.5rem,6vw,4.5rem);font-weight:900;color:white;line-height:1.1;margin-bottom:1.5rem}
    .hero p{font-size:1.2rem;color:rgba(255,255,255,.9);margin-bottom:2rem;max-width:600px;margin-left:auto;margin-right:auto}
    .hero .btn{background:${primaryColor};color:white}
    .hero-logo{position:absolute;top:1.5rem;left:1.5rem;z-index:20}
    .stats{padding:3.5rem 0;background:white;border-bottom:1px solid #f3f4f6}
    .stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:2rem;text-align:center}
    .stats-value{font-size:2.5rem;font-weight:900;color:${primaryColor};font-family:${esc(fontHeading)},sans-serif}
    .stats-label{font-size:.85rem;color:#6b7280;text-transform:uppercase;letter-spacing:.1em;font-weight:500}
    .about{padding:5rem 0;background:white}
    .about-grid{display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:center}
    @media(max-width:768px){.about-grid{grid-template-columns:1fr}}
    .about h2{font-size:2.5rem;font-weight:900;color:#111827;margin-bottom:1.5rem}
    .about-bar{width:4rem;height:.25rem;border-radius:9999px;background:${primaryColor};margin-bottom:1.5rem}
    .about p{color:#4b5563;line-height:1.8;white-space:pre-line}
    .about img{border-radius:1rem;box-shadow:0 20px 40px rgba(0,0,0,.1);width:100%;aspect-ratio:4/3;object-fit:cover}
    .services{padding:5rem 0;background:#f9fafb}
    .services-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.5rem}
    .service-card{background:white;border:1px solid #f3f4f6;border-radius:.75rem;padding:2rem;transition:transform .2s,box-shadow .2s}
    .service-card:hover{transform:translateY(-4px);box-shadow:0 12px 30px rgba(0,0,0,.08)}
    .service-icon{width:3.5rem;height:3.5rem;border-radius:.75rem;display:flex;align-items:center;justify-content:center;margin-bottom:1.25rem;background:${primaryColor}15;color:${primaryColor};font-size:1.5rem}
    .service-card h3{font-weight:700;font-size:1.2rem;margin-bottom:.75rem;color:#111827}
    .service-card p{color:#6b7280;font-size:.95rem;line-height:1.7}
    .testimonials{padding:5rem 0;background:white}
    .testimonials-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.5rem}
    .testimonial-card{background:#f9fafb;border-radius:.75rem;padding:2rem;border:1px solid #f3f4f6}
    .testimonial-card p{color:#4b5563;line-height:1.7;margin-bottom:1rem;font-style:italic}
    .testimonial-name{font-weight:700;color:#111827;font-size:.9rem}
    .testimonial-company{color:#9ca3af;font-size:.8rem}
    .stars{color:#facc15;margin-bottom:.5rem}
    .contact{padding:5rem 0;background:#f9fafb}
    .contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:3rem}
    @media(max-width:768px){.contact-grid{grid-template-columns:1fr}}
    .contact h2{font-size:2.5rem;font-weight:900;color:#111827;margin-bottom:1.5rem}
    .contact-item{display:flex;align-items:flex-start;gap:.75rem;margin-bottom:1rem;color:#4b5563}
    .contact-icon{width:1.25rem;height:1.25rem;color:${primaryColor};flex-shrink:0;margin-top:.2rem}
    .contact-form{display:flex;flex-direction:column;gap:1rem}
    .contact-form input,.contact-form textarea{padding:.75rem 1rem;border:1px solid #e5e7eb;border-radius:.5rem;font-size:.95rem;font-family:inherit}
    .contact-form button{background:${primaryColor};color:white;padding:.75rem 2rem;border:none;border-radius:.5rem;font-weight:700;cursor:pointer}
    .footer{padding:2rem 0;background:#111827;color:#9ca3af}
    .footer-inner{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem}
    .footer-links{display:flex;gap:1.5rem}
    .footer-links a{color:#9ca3af;font-size:.875rem;transition:color .2s}
    .footer-links a:hover{color:white}
    .footer-copy{font-size:.8rem}
    @keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    .animate-in{animation:fadeInUp .6s ease-out both}
  </style>
</head>
<body>
${heroEnabled ? `
  <section class="hero">
    ${heroImageUrl ? `<div class="hero-bg" style="background-image:url(${esc(heroImageUrl)})"></div>` : `<div class="hero-bg" style="background:linear-gradient(135deg,${primaryColor} 0%,#1a1a2e 60%,#16213e 100%)"></div>`}
    <div class="hero-overlay"></div>
    <div class="hero-logo">${logoHtml}</div>
    <div class="hero-content animate-in">
      <h1>${esc(hero.headline)}</h1>
      ${hero.subheadline ? `<p>${esc(hero.subheadline)}</p>` : ""}
      ${hero.cta_text ? `<a href="${esc(safeUrl(hero.cta_link) || "#contact")}" class="btn">${esc(hero.cta_text)} →</a>` : ""}
    </div>
  </section>
` : ""}
${statsEnabled && stats.stats?.length ? `
  <section class="stats">
    <div class="container">
      <div class="stats-grid">
        ${stats.stats.map((s: any) => `
        <div>
          <div class="stats-value">${esc(s.prefix || "")}${esc(String(s.value ?? ""))}${esc(s.suffix || "")}</div>
          <div class="stats-label">${esc(s.label)}</div>
        </div>`).join("")}
      </div>
    </div>
  </section>
` : ""}
${aboutEnabled ? `
  <section class="about" id="about">
    <div class="container">
      <div class="about-grid">
        <div>
          <div class="about-bar"></div>
          <h2>${esc(about.heading)}</h2>
          <p>${esc(about.body)}</p>
        </div>
        ${safeUrl(about.image_url) ? `<img src="${esc(safeUrl(about.image_url))}" alt="${esc(about.heading)}">` : ""}
      </div>
    </div>
  </section>
` : ""}
${servicesEnabled && services.services?.length ? `
  <section class="services" id="services">
    <div class="container">
      <div style="text-align:center;margin-bottom:3rem">
        <h2 style="font-size:2.5rem;font-weight:900;color:#111827;margin-bottom:.5rem">Our Services</h2>
        <p style="color:#6b7280">Reliable, efficient, and tailored to your logistics needs</p>
      </div>
      <div class="services-grid">
        ${services.services.map((s: any) => `
        <div class="service-card">
          <div class="service-icon">🚛</div>
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.description)}</p>
        </div>`).join("")}
      </div>
    </div>
  </section>
` : ""}
${testimonialsEnabled && testimonials.testimonials?.length ? `
  <section class="testimonials" id="testimonials">
    <div class="container">
      <div style="text-align:center;margin-bottom:3rem">
        <h2 style="font-size:2.5rem;font-weight:900;color:#111827">What Our Clients Say</h2>
      </div>
      <div class="testimonials-grid">
        ${testimonials.testimonials.map((t: any) => `
        <div class="testimonial-card">
          <div class="stars">${"★".repeat(Math.min(t.rating || 0, 5))}${"☆".repeat(5 - Math.min(t.rating || 0, 5))}</div>
          <p>"${esc(t.text)}"</p>
          <div class="testimonial-name">${esc(t.name)}</div>
          <div class="testimonial-company">${esc(t.company)}</div>
        </div>`).join("")}
      </div>
    </div>
  </section>
` : ""}
${contactEnabled ? `
  <section class="contact" id="contact">
    <div class="container">
      <div class="contact-grid">
        <div>
          <h2>${esc(contact.heading || "Get in Touch")}</h2>
          ${contact.email ? `<div class="contact-item"><span class="contact-icon">✉</span>${esc(contact.email)}</div>` : ""}
          ${contact.phone ? `<div class="contact-item"><span class="contact-icon">☎</span>${esc(contact.phone)}</div>` : ""}
          ${contact.address ? `<div class="contact-item"><span class="contact-icon">📍</span>${esc(contact.address)}</div>` : ""}
        </div>
        <form class="contact-form" onsubmit="event.preventDefault()">
          <input type="text" placeholder="Your Name" required>
          <input type="email" placeholder="Your Email" required>
          <textarea rows="4" placeholder="Your Message" required></textarea>
          <button type="submit">Send Message</button>
        </form>
      </div>
    </div>
  </section>
` : ""}
  <footer class="footer">
    <div class="container">
      <div class="footer-inner">
        <div>
          <div style="color:white;font-weight:700;margin-bottom:.25rem">${esc(footer.company_name || siteName)}</div>
          <div class="footer-copy">${esc(footer.copyright_text || `© ${new Date().getFullYear()} ${siteName}`)}</div>
        </div>
        ${footer.links?.length ? `<div class="footer-links">${footer.links.map((l: any) => `<a href="${esc(safeUrl(l.url) || "#")}">${esc(l.label)}</a>`).join("")}</div>` : ""}
      </div>
    </div>
  </footer>
</body>
</html>`;
}
