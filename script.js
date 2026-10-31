// Symbols are embedded once in index.html and work without network/font loading.
function lucideIcon(name) {
  return `<i class="lucide-icon icon-${name}" aria-hidden="true"><svg class="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" focusable="false"><use href="#lucide-${name}"></use></svg></i>`;
}

document.addEventListener("DOMContentLoaded", () => {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo({ top: 0, behavior: "auto" });

  initNavigation();
  initTheme();
  initLanguage();
  initScrollReveal();
  initParallax();
  initContactForm();
  initStatsCounter();
  initBurgerMenu();
  initMobileNavbarControls();
  initCardNavigation();
  initStatsSpotlight();
  initWorkflowReveal();
  restoreActivePage();
  applyHashRoute(false);
  window.addEventListener("hashchange", () => applyHashRoute(true));
  initProjectGalleryLightbox();
  initImageFallback();

  requestAnimationFrame(() => requestAnimationFrame(syncAllUIState));
});

// ─── SAFE STORAGE ──────────────────────────────────────────────────────────

const safeStorage = {
  get(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      return value ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
};

function getSavedLang() {
  const lang = safeStorage.get("lang");
  return lang === "id" ? "id" : "en";
}

// ─── IMAGE FALLBACK ────────────────────────────────────────────────────────

function initImageFallback() {
  const FALLBACK_SVG =
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">' +
        '<rect width="800" height="450" fill="#1a1a1a"/>' +
        '<rect x="340" y="150" width="120" height="140" rx="14" fill="none" stroke="#5276ad" stroke-width="3"/>' +
        '<text x="400" y="345" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="24" fill="#8f8f8f">Image unavailable</text>' +
        "</svg>",
    );

  const showFallback = img => {
    if (!img || img.tagName !== "IMG" || !img.getAttribute("src") || img.dataset.fallback) return;
    img.dataset.fallback = "1";
    img.removeAttribute("srcset");
    img.src = FALLBACK_SVG;
  };
  document.addEventListener("error", event => showFallback(event.target), true);
  // Images can fail before DOMContentLoaded, before the capturing listener exists.
  document.querySelectorAll("img[src]").forEach(img => {
    if (img.complete && img.naturalWidth === 0) showFallback(img);
  });
}

// ─── PAGE NAVIGATION ───────────────────────────────────────────────────────

function clearPageNavStates() {
  document
    .querySelectorAll(".nav-link")
    .forEach((link) => link.removeAttribute("aria-current"));
  document
    .querySelectorAll(".nav-link")
    .forEach((link) => link.classList.remove("active"));
  document
    .querySelectorAll(".page")
    .forEach((page) => page.classList.remove("active"));
}

function resetProjectSections() {
  document
    .querySelectorAll(".project-detail-view.active")
    .forEach((el) => el.classList.remove("active"));
  document.querySelectorAll("#projects .section").forEach((section) => {
    section.classList.remove("hidden");
    section
      .querySelectorAll(".projects-grid, .section-title, .section-desc")
      .forEach((el) => {
        el.classList.remove("hidden");
      });
  });
}

const PAGE_IDS = new Set(["home", "about", "services", "projects", "contact"]);
const pageStorage = {
  get() { try { return sessionStorage.getItem("activePage"); } catch { return null; } },
  set(page) { try { sessionStorage.setItem("activePage", page); } catch {} },
};
function updatePageMetadata() {
  const page = getActivePage() || "home";
  const lang = document.documentElement.lang;
  const dict = translations[lang] || translations.en;
  const detail = document.querySelector(".project-detail-view.active h2");
  const title = detail?.textContent || dict[`nav_${page}`];
  document.title = `${title} — Rony Asmara · IT Infrastructure`;
}
function restoreActivePage() {
  const saved = pageStorage.get();
  const page = PAGE_IDS.has(saved) ? saved : "home";
  navigateToPage(page, {updateHistory: false, focus: false});
}
function navigateToPage(pageId, {updateHistory = true, focus = true} = {}) {
  if (!PAGE_IDS.has(pageId)) return;
  const target = document.getElementById(pageId);
  clearPageNavStates();
  resetProjectSections();
  target.classList.add("active");
  document.querySelectorAll(`nav .nav-link[data-page="${pageId}"]`).forEach(link => {
    link.classList.add("active"); link.setAttribute("aria-current", "page");
  });
  pageStorage.set(pageId);
  if (updateHistory && location.hash !== `#/${pageId}`) location.hash = `/${pageId}`;
  document.dispatchEvent(new CustomEvent("portfolio:navigate"));
  initScrollReveal(); initWorkflowReveal();
  window.scrollTo({top: 0, behavior: "instant"});
  if (focus) requestAnimationFrame(() => {
    if (getActivePage() === pageId && !document.querySelector(".project-detail-view.active")) focusHeading(target);
  });
  updatePageMetadata();
}

function initNavigation() {
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
        return;
      e.preventDefault();
      const pageId = link.dataset.page;
      if (pageId) navigateToPage(pageId);
    });
  });
}

// ─── HASH ROUTER ───────────────────────────────────────────────────────────

function getHashParts() {
  return (location.hash.replace(/^#\/?/, "") || "").split("/").filter(Boolean);
}

function getActivePage() {
  return document.querySelector(".page.active")?.id || null;
}

function applyHashRoute(fromEmpty) {
  const [requested, detail, extra] = getHashParts();
  if (!requested && !fromEmpty) return;
  const page = PAGE_IDS.has(requested) ? requested : "home";
  const validDetail = page === "projects" && detail && !extra &&
    [...document.querySelectorAll(".project-detail-view")].some(el => el.id === `detail-${detail}`);
  if (getActivePage() !== page) navigateToPage(page, {updateHistory: false});
  const activeDetail = document.querySelector(".project-detail-view.active");
  if (validDetail) {
    if (activeDetail?.id !== `detail-${detail}`) openProjectDetail(detail, {updateHistory: false});
  } else if (activeDetail) closeProjectDetail({updateHistory: false});
  if (!PAGE_IDS.has(requested) || (detail && !validDetail) || extra) {
    history.replaceState(null, "", `#/${page}`);
  }
  updatePageMetadata();
}

// ─── CARD NAVIGATION ───────────────────────────────────────────────────────

function initCardNavigation() {
  initProjectDetail();
  document.addEventListener("click", event => {
    const card = event.target.closest(".home-project-card[data-navigate-project]");
    if (!card || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigateToPage("projects", {updateHistory: false, focus: false});
    openProjectDetail(card.dataset.navigateProject);
  });
}

// ─── STATS SPOTLIGHT ───────────────────────────────────────────────────────

function initStatsSpotlight() {
  if ("ontouchstart" in window) return;

  document.querySelectorAll(".stat").forEach((stat) => {
    stat.addEventListener("mousemove", (e) => {
      const rect = stat.getBoundingClientRect();
      stat.style.setProperty("--sx", `${e.clientX - rect.left}px`);
      stat.style.setProperty("--sy", `${e.clientY - rect.top}px`);
      stat.classList.add("spotlight-active");
    });
    stat.addEventListener("mouseleave", () =>
      stat.classList.remove("spotlight-active"),
    );
  });
}

// ─── WORKFLOW REVEAL ───────────────────────────────────────────────────────

let _workflowRevealObserver = null;

function initWorkflowReveal() {
  if (_workflowRevealObserver) {
    _workflowRevealObserver.disconnect();
    _workflowRevealObserver = null;
  }

  const steps = document.querySelectorAll(".workflow-step");
  if (!steps.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    steps.forEach((step) => step.classList.add("revealed"));
    return;
  }

  steps.forEach((step) => step.classList.remove("revealed"));

  _workflowRevealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          _workflowRevealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 },
  );

  steps.forEach((step) => _workflowRevealObserver.observe(step));
}

// ─── THEME ─────────────────────────────────────────────────────────────────

function renderThemeIcons(btn) {
  if (!btn) return;
  if (!btn.querySelector(".theme-icon-box")) {
    btn.innerHTML = `<span class="theme-icon-box" aria-hidden="true">${lucideIcon("moon")}${lucideIcon("sun")}</span>`;
  }
}

function initTheme() {
  const themeBtn = document.querySelector(".theme-btn");
  if (!themeBtn) return;

  renderThemeIcons(themeBtn);
  applyTheme(safeStorage.get("theme") || "dark");

  themeBtn.addEventListener("click", () => {

    const isLight = document.documentElement.classList.contains("light");
    applyTheme(isLight ? "dark" : "light");
  });
}

function applyTheme(theme) {
  const isLight = theme === "light";
  document.documentElement.classList.toggle("light", isLight);

  const themeBtn = document.querySelector(".theme-btn");
  if (themeBtn) renderThemeIcons(themeBtn);

  safeStorage.set("theme", theme);
  syncMobileThemeIcon();
  syncControlLabels();
  document.querySelectorAll('meta[name="theme-color"]').forEach(meta => meta.content = isLight ? "#f6f8fc" : "#1a1a1a");
}

// ─── TRANSLATIONS ──────────────────────────────────────────────────────────

const translations = {
  en: {
    nav_home: "Home",
    nav_about: "About",
    nav_services: "Services",
    nav_projects: "Projects",
    nav_contact: "Contact",
    profile_role: "IT Infrastructure",
    footer_made: "Made with",
    footer_by: "by",
    hero_greeting: "Hi,",
    hero_im: "I'm",
    hero_location: "South Jakarta, Indonesia",
    position_1: "IT Infrastructure",
    position_2: "Technical Support",
    position_3: "Helpdesk Operations",
    hero_summary:
      "IT infrastructure professional with 4+ years of experience in technical support, helpdesk operations, incident management, and enterprise systems.",
    hero_cta_contact: "Get in Touch",
    hero_cta_projects: "View Projects",
    stat_years: "Years in IT",
    stat_clients: "Enterprise Clients",
    stat_products: "Products Supported",
    stat_projects: "Development Projects",
    home_services_title: "What I Do",
    home_services_desc: "Core areas of expertise.",
    home_services_link: "See full services",
    home_projects_title: "Featured Projects",
    home_projects_desc: "Selected work.",
    home_projects_link: "View all projects",
    cta_strip_title: "Ready to work together?",
    cta_strip_desc:
      "I am open to job opportunities, collaborations, and development projects.",
    cta_strip_contact: "Contact Me",
    cta_strip_about: "Learn More About Me",
    svc_support_title: "Technical Support",
    svc_support_short:
      "Troubleshooting, incident management, and root cause analysis for enterprise applications.",
    svc_support_desc:
      "Diagnosing application and system issues and using root cause analysis to support incident resolution.",
    svc_support_d1: "Incident triage & resolution",
    svc_support_d2: "Root cause analysis reports",
    svc_support_d3: "Remote & on-site troubleshooting",
    svc_support_d4: "System log review & diagnosis",
    svc_helpdesk_title: "Helpdesk Operations",
    svc_helpdesk_short:
      "SLA-driven ticket management and technical assistance for end users.",
    svc_helpdesk_desc:
      "Assisting end users and managing tickets and service requests in line with service-level agreements (SLAs).",
    svc_helpdesk_d1: "SLA-compliant ticket handling",
    svc_helpdesk_d2: "End-user technical assistance",
    svc_helpdesk_d3: "Service request management",
    svc_helpdesk_d4: "24/7 operational support",
    svc_webdev_title: "Web Development",
    svc_webdev_short:
      "Functional web apps with HTML, CSS, PHP, and MySQL from design to deployment.",
    svc_webdev_desc:
      "Building functional web applications using HTML, CSS, PHP, and MySQL — from requirements analysis and system design through to implementation.",
    svc_webdev_d1: "Requirements analysis & planning",
    svc_webdev_d2: "Responsive front-end development",
    svc_webdev_d3: "PHP & MySQL back-end systems",
    svc_webdev_d4: "CRUD & data management apps",
    svc_coord_title: "Cross-Team Coordination",
    svc_coord_short:
      "Bridging developers, account managers, and business teams for smooth delivery.",
    svc_coord_desc:
      "Coordinating with development teams, account managers, and business teams to support service delivery, route escalations, and document issue resolution.",
    svc_coord_d1: "Escalation management",
    svc_coord_d2: "Cross-functional communication",
    svc_coord_d3: "Resolution documentation",
    svc_coord_d4: "Client-facing coordination",
    svc_infra_title: "IT Infrastructure",
    svc_infra_short:
      "Supporting IT infrastructure operations and maintaining reliable technology environments.",
    svc_infra_desc:
      "Supporting IT infrastructure operations and maintaining the technology environment required for reliable business operations.",
    svc_infra_d1: "IT infrastructure operations support",
    svc_infra_d2: "Technology environment management",
    svc_infra_d3: "System reliability maintenance",
    svc_infra_d4: "Operational support coordination",
    workflow_title: "Workflow",
    workflow_desc:
      "My structured approach to handling support requests and technical issues.",
    wf_receive: "Receive Request",
    wf_receive_desc:
      "Receiving tickets, reports, or service requests from users through the designated support channel.",
    wf_analyze: "Analyze",
    wf_analyze_desc:
      "Reviewing the initial report to understand the symptoms, impact, and scope of the issue.",
    wf_troubleshoot: "Troubleshoot",
    wf_troubleshoot_desc:
      "Checking system logs, configurations, and related data to identify and isolate the source of the problem.",
    wf_resolve: "Resolve",
    wf_resolve_desc:
      "Providing a direct solution or performing corrective actions to restore normal service operation.",
    wf_escalate: "Escalate",
    wf_escalate_desc:
      "Escalating to the relevant team when the issue requires higher-level expertise or cross-team involvement.",
    wf_validate: "Validate",
    wf_validate_desc:
      "Confirming with the user that the solution is working correctly and that the issue has been fully resolved.",
    wf_document: "Document",
    wf_document_desc:
      "Recording the resolution details and updating the ticket status to maintain accurate service records.",
    ai_title: "AI & Automation",
    ai_desc: "Exploring intelligent workflows and automation systems.",
    ai_body:
      "I explore AI-assisted workflows for prompt design, content creation, image enhancement, and task automation. This work focuses on improving efficiency and making digital systems easier to use.",
    ai_tag1: "Prompt Engineering",
    ai_tag2: "Image Enhancement",
    ai_tag3: "Content Generation",
    ai_tag4: "Automation Systems",
    ai_tag5: "Workflow Optimization",
    techstack_title: "Tech Stack",
    techstack_desc:
      "Tools and technologies I use across IT infrastructure, technical support, helpdesk operations, and web development.",
    tech_support_tools: "Support Tools",
    tech_webdev: "Web Development",
    tech_productivity: "Productivity",
    tech_design: "Design",
    skills_title: "Skills & Competencies",
    skills_desc: "Core competencies and tools I work with professionally.",
    skill_technical: "IT Infrastructure & Technical Support",
    skill_webdev: "Web Development",
    skill_soft: "Soft Skills",
    skill_tools: "Tools",
    services_title: "Services",
    services_desc:
      "Operational support, technical issue resolution, and web application development.",
    milestones_title: "Career Journey",
    milestones_desc: "Key moments that shaped my professional journey.",
    ms1_title: "Graduated from Vocational High School",
    ms1_desc:
      "Completed secondary education at SMK Tamansiswa Jetis Yogyakarta, majoring in Computer and Network Engineering.",
    ms2_title: "First Work Experience",
    ms2_desc:
      "Started my first role as a waiter in the food and beverage industry, developing interpersonal and customer service skills.",
    ms3_title: "Joined University Cooperative",
    ms3_desc:
      "Joined the student cooperative at Universitas PGRI Yogyakarta in an administration and public relations role.",
    ms4_title: "Internship in System Development",
    ms4_desc:
      "Completed an internship at PT Yogya Kristal Sejati in administration and warehouse data system development.",
    ms5_title: "Completed Bachelor's Degree",
    ms5_desc:
      "Graduated with a Bachelor's Degree in Informatics from Universitas PGRI Yogyakarta with a GPA of 3.61.",
    ms6_title: "Entered the Digital Support Industry",
    ms6_desc:
      "Started a professional career in the customer engagement support field for digital platforms.",
    ms7_title: "Joined Ivosights as Technical Support",
    ms7_desc:
      "Joined Ivosights as a Technical Support specialist, handling troubleshooting, incident management, and client coordination.",
    ms8_title: "Enterprise Product Support",
    ms8_desc:
      "Handled implementations and support for Sociomile Omni, Sociomile Voice, IVO WABA, and Ripple10 across national enterprise clients.",
    ms9_title: "Transitioned to Helpdesk",
    ms9_desc:
      "Transitioned from Technical Support to the Helpdesk function within the Customer Experience & Growth division, focusing on incident handling, monitoring, troubleshooting, and SLA-driven operations.",
    ms10_title: "Transitioned to IT Infrastructure",
    ms10_desc:
      "Transitioned to an IT Infrastructure role at Ivosights, expanding my professional focus from technical support and helpdesk operations toward IT infrastructure.",
    page_about_title: "About Me",
    page_about_desc: "The person behind the work.",
    about_bio_text:
      "I am an IT professional with a degree in Informatics and experience in customer service, technical support, helpdesk operations, and IT infrastructure. My career has progressed from assisting users to diagnosing technical issues, handling incidents, and supporting enterprise systems. With a foundation in computer networking and system development, I continue to build my technical skills and deliver practical solutions for users and business operations.",
    about_exp_title: "Work Experience",
    about_exp1_role: "IT Infrastructure",
    about_exp1_period: "Jul 2026 – Present",
    about_exp1_desc:
      "Supporting IT infrastructure operations and maintaining system reliability for business operations.",
    about_exp_prev_role: "Technical Support / Helpdesk",
    about_exp_prev_period: "Nov 2022 – Jun 2026",
    about_exp_prev_desc:
      "Handled technical troubleshooting, incident management, tracing, and client support for enterprise products including Sociomile Omni, Sociomile Voice, IVO WABA, and Ripple10 through remote and on-site support.",
    about_exp2_role: "Customer Service",
    about_exp2_period: "Oct 2022 – Nov 2022",
    about_exp2_desc:
      "Provided chat-based customer service, answered user inquiries, and handled issues in line with service procedures.",
    about_exp3_role: "Customer Engagement Champion",
    about_exp3_period: "Oct 2021 – May 2022",
    about_exp3_desc:
      "Provided customer service through chat, helped users resolve service issues, and shared accurate product information.",
    about_exp4_role: "Administration Intern",
    about_exp4_period: "2019",
    about_exp4_desc:
      "Developed a warehouse data management system and supported day-to-day administrative and operational activities.",
    about_exp5_role: "Server / Waiter",
    about_exp5_period: "2017 – 2018",
    about_exp5_desc:
      "Served customers and supported daily restaurant operations.",
    about_edu_title: "Education",
    about_edu1_degree: "Bachelor's Degree — Informatics",
    about_edu1_period: "2016 – 2021",
    about_edu1_desc:
      'Universitas PGRI Yogyakarta · GPA 3.61 / 4.00 · Final Thesis: "Decision Support System for Fogging Area Determination in Jetis District, Yogyakarta."',
    about_edu2_degree: "Computer and Network Engineering",
    about_edu2_period: "2013 – 2016",
    about_edu2_desc: "SMK Tamansiswa Jetis Yogyakarta.",
    qf_location: "Location",
    qf_role: "Current Role",
    qf_company: "Company",
    qf_education: "Education",
    qf_experience: "Experience",
    qf_experience_val: "4+ Years in IT",
    page_achievements_title: "Certifications & Achievements",
    page_achievements_desc: "Milestones, certifications, and recognitions.",
    ach_academic_title: "Academic Achievement",
    ach_academic:
      "Bachelor's Degree in Informatics — Universitas PGRI Yogyakarta · Graduated 2021 · GPA 3.61 / 4.00",
    ach_professional_title: "Professional Experience",
    ach_professional:
      "Experience supporting enterprise clients in Indonesia through technical support and helpdesk operations, including incident handling, troubleshooting, and service delivery in line with SLAs.",
    ach_cert1_title: "English Proficiency Test",
    ach_cert1: "Certification of English language proficiency — 2019",
    ach_cert2_title: "Digital Business Skills",
    ach_cert2: "Digital business skills competency certificate — 2019",
    page_prof_projects_title: "Additional Projects",
    page_prof_projects_desc:
      "Internship projects, academic work, and other development contributions.",
    page_projects_title: "Web Development Projects",
    page_projects_desc:
      "Selected web projects that showcase my development skills.",
    proj_bookmark_title: "Bookmark Manager",
    proj_bookmark_desc:
      "Privacy-first browser bookmark manager with local storage using IndexedDB. Supports folder hierarchy, duplicate detection, and domain analytics.",
    proj_bookmark_detail_desc:
      "A privacy-first browser bookmark manager with local storage using IndexedDB. Features include bookmark import/export, folder hierarchy, duplicate detection, domain analytics, multi-language support, and dark mode — all processed locally with no server uploads.",
    proj_bookmark_gallery_main: "Bookmark Manager — dashboard overview",
    proj_bookmark_gallery_1: "Bookmark Manager — folder hierarchy",
    proj_bookmark_gallery_2: "Bookmark Manager — domain analytics",
    proj_insta_title: "InstaAnalyzer",
    proj_insta_desc:
      "Browser-based Instagram data analysis app that processes Instagram export files locally without uploading data to any server.",
    proj_insta_detail_desc:
      "Browser-based Instagram data analysis app that processes Instagram export ZIP files entirely on the client side. Features followers analysis, following analysis, fan detection, and local-only processing with zero server uploads.",
    proj_insta_gallery_main: "InstaAnalyzer — export file instructions",
    proj_insta_gallery_1: "InstaAnalyzer — followers analysis",
    proj_insta_gallery_2: "InstaAnalyzer — privacy-first processing note",
    proj_dss_title: "DSS — Fogging Area Prioritization",
    proj_dss_desc:
      "Decision support system to help health agencies determine priority areas for fogging operations based on health and environmental parameters using the TOPSIS method.",
    proj_dss_detail_desc:
      "Web-based decision support system developed to assist health agencies in prioritizing fogging intervention areas using the TOPSIS multi-criteria decision-making method.",
    proj_dss_meta: "Undergraduate Thesis · Universitas PGRI Yogyakarta",
    proj_dss_gallery_main: "Fogging DSS — area data and criteria input",
    proj_dss_gallery_1: "Fogging DSS — TOPSIS calculation matrix",
    proj_dss_gallery_2: "Fogging DSS — prioritization result report",
    proj_ginger_title: "DSS — Ginger Farming Land Selection",
    proj_ginger_desc:
      "Decision support system for comparing ginger farming land in Gunungkidul, using AHP for criteria weighting and TOPSIS for ranking alternatives.",
    proj_ginger_detail_desc:
      "An academic decision support application for selecting ginger farming land in Gunungkidul. It includes criteria comparison and consistency checks with AHP, alternative ranking with TOPSIS, and a printable ranking report.",
    proj_ginger_meta: "Academic Project",
    proj_ginger_gallery_main: "Ginger Land DSS — application overview",
    proj_ginger_gallery_1: "Ginger Land DSS — AHP criteria comparison and consistency",
    proj_ginger_gallery_2: "Ginger Land DSS — printable ranking report",
    prof_warehouse_title: "Warehouse Administration System",
    prof_warehouse_desc:
      "Warehouse data management system developed during an internship at PT Yogya Kristal Sejati to support inventory management and data administration.",
    prof_warehouse_meta: "Internship · PT Yogya Kristal Sejati",
    prof_proj2_title: "DSS — Village Cash Assistance Recipients",
    prof_proj2_desc:
      "Decision support system to help village governments determine eligible recipients for direct cash assistance (BLT) based on established criteria using the TOPSIS method.",
    prof_proj2_meta: "Academic Project",
    prof_proj3_title: "Expert System — Oyster Mushroom Diagnosis",
    prof_proj3_desc:
      "Expert system to help users identify pests and diseases in oyster mushroom cultivation and provide handling recommendations.",
    prof_proj3_meta: "Contribution: UI and Front-End Development",
    proj_view_showcase: "View Showcase",
    proj_demo: "Demo",
    proj_back: "Back to Projects",
    proj_live_demo: "Live Demo",
    page_contact_title: "Contact",
    page_contact_desc: "Let us discuss your technical support or project needs.",
    form_name: "Full Name",
    form_email: "Email Address",
    form_message: "Message",
    form_send: "Send Message",
    form_subject: "Subject",
    form_subject_placeholder: "Enter the subject of your message",
    form_name_placeholder: "Your full name",
    form_email_placeholder: "hello@example.com",
    form_message_placeholder: "Write your message here.",
    form_sending: "Sending message…",
    contact_address: "South Jakarta, Indonesia",
    form_success: "Your message has been sent. I will get back to you.",
    form_error: "Failed to send message. Please try again.",
    form_error_network: "Your message was not sent. Check your internet connection and try again.",
  },
  id: {
    nav_home: "Beranda",
    nav_about: "Tentang",
    nav_services: "Layanan",
    nav_projects: "Proyek",
    nav_contact: "Kontak",
    profile_role: "Infrastruktur TI",
    footer_made: "Dibuat dengan",
    footer_by: "oleh",
    hero_greeting: "Halo,",
    hero_im: "Saya",
    hero_location: "Jakarta Selatan, Indonesia",
    position_1: "Infrastruktur TI",
    position_2: "Dukungan Teknis",
    position_3: "Layanan Bantuan TI",
    hero_summary:
      "Profesional infrastruktur TI dengan pengalaman 4+ tahun dalam dukungan teknis, layanan bantuan TI, manajemen insiden, dan operasional sistem perusahaan.",
    hero_cta_contact: "Hubungi Saya",
    hero_cta_projects: "Lihat Proyek",
    stat_years: "Tahun di Bidang TI",
    stat_clients: "Klien Perusahaan",
    stat_products: "Produk yang Didukung",
    stat_projects: "Proyek Pengembangan",
    home_services_title: "Bidang Keahlian",
    home_services_desc: "Dukungan teknis dan pengembangan sistem.",
    home_services_link: "Lihat layanan lengkap",
    home_projects_title: "Proyek Unggulan",
    home_projects_desc: "Karya terpilih.",
    home_projects_link: "Lihat semua proyek",
    cta_strip_title: "Siap bekerja sama?",
    cta_strip_desc:
      "Saya terbuka untuk peluang kerja, kolaborasi, dan pengembangan proyek.",
    cta_strip_contact: "Hubungi Saya",
    cta_strip_about: "Tentang Saya",
    svc_support_title: "Dukungan Teknis",
    svc_support_short:
      "Diagnosis gangguan, manajemen insiden, dan analisis akar masalah pada aplikasi perusahaan.",
    svc_support_desc:
      "Menangani gangguan aplikasi dan sistem melalui diagnosis teknis serta analisis akar masalah untuk mendukung penyelesaian insiden.",
    svc_support_d1: "Penilaian dan penyelesaian insiden",
    svc_support_d2: "Laporan analisis akar masalah",
    svc_support_d3: "Diagnosis jarak jauh dan di lokasi",
    svc_support_d4: "Pemeriksaan catatan sistem dan diagnosis",
    svc_helpdesk_title: "Layanan Bantuan TI",
    svc_helpdesk_short:
      "Pengelolaan tiket berbasis SLA dan bantuan teknis untuk pengguna.",
    svc_helpdesk_desc:
      "Memberikan bantuan teknis kepada pengguna serta mengelola tiket dan permintaan layanan sesuai perjanjian tingkat layanan (SLA).",
    svc_helpdesk_d1: "Penanganan tiket sesuai SLA",
    svc_helpdesk_d2: "Bantuan teknis bagi pengguna",
    svc_helpdesk_d3: "Manajemen permintaan layanan",
    svc_helpdesk_d4: "Dukungan operasional 24/7",
    svc_webdev_title: "Pengembangan Web",
    svc_webdev_short:
      "Pengembangan aplikasi web dengan HTML, CSS, PHP, dan MySQL, dari perancangan hingga penerapan.",
    svc_webdev_desc:
      "Membangun aplikasi web menggunakan HTML, CSS, PHP, dan MySQL, mulai dari analisis kebutuhan dan perancangan sistem hingga penerapan.",
    svc_webdev_d1: "Analisis kebutuhan dan perencanaan",
    svc_webdev_d2: "Pengembangan antarmuka responsif",
    svc_webdev_d3: "Pengembangan sistem dengan PHP dan MySQL",
    svc_webdev_d4: "Aplikasi CRUD dan pengelolaan data",
    svc_coord_title: "Koordinasi Lintas Tim",
    svc_coord_short:
      "Menghubungkan tim pengembang, pengelola akun klien, dan tim bisnis untuk mendukung kelancaran layanan.",
    svc_coord_desc:
      "Berkoordinasi dengan tim pengembang, pengelola akun klien, dan tim bisnis untuk memastikan eskalasi tepat sasaran serta mendokumentasikan penyelesaian masalah.",
    svc_coord_d1: "Manajemen eskalasi",
    svc_coord_d2: "Komunikasi lintas fungsi",
    svc_coord_d3: "Dokumentasi penyelesaian masalah",
    svc_coord_d4: "Koordinasi langsung dengan klien",
    svc_infra_title: "Infrastruktur TI",
    svc_infra_short:
      "Mendukung operasional infrastruktur TI dan menjaga keandalan sistem perusahaan.",
    svc_infra_desc:
      "Mendukung operasional dan pemeliharaan infrastruktur TI untuk menjaga kelancaran kegiatan bisnis.",
    svc_infra_d1: "Dukungan operasional infrastruktur TI",
    svc_infra_d2: "Pengelolaan lingkungan teknologi",
    svc_infra_d3: "Pemeliharaan keandalan sistem",
    svc_infra_d4: "Koordinasi dukungan operasional",
    workflow_title: "Alur Kerja",
    workflow_desc:
      "Pendekatan terstruktur dalam menangani permintaan layanan dan masalah teknis.",
    wf_receive: "Penerimaan Permintaan",
    wf_receive_desc:
      "Menerima tiket, laporan, atau permintaan layanan dari pengguna melalui saluran dukungan yang tersedia.",
    wf_analyze: "Analisis Awal",
    wf_analyze_desc:
      "Menelaah laporan awal untuk memahami gejala, dampak, dan ruang lingkup masalah.",
    wf_troubleshoot: "Diagnosis",
    wf_troubleshoot_desc:
      "Memeriksa catatan sistem, konfigurasi, dan data terkait untuk mengidentifikasi sumber masalah.",
    wf_resolve: "Penyelesaian",
    wf_resolve_desc:
      "Memberikan solusi atau melakukan tindakan perbaikan untuk memulihkan layanan.",
    wf_escalate: "Eskalasi",
    wf_escalate_desc:
      "Meneruskan masalah kepada tim terkait apabila diperlukan keahlian khusus atau penanganan lintas tim.",
    wf_validate: "Validasi",
    wf_validate_desc:
      "Mengonfirmasi kepada pengguna bahwa solusi berfungsi dan masalah telah terselesaikan.",
    wf_document: "Dokumentasi",
    wf_document_desc:
      "Mencatat langkah penyelesaian dan memperbarui status tiket agar riwayat layanan terdokumentasi dengan akurat.",
    ai_title: "AI dan Otomatisasi",
    ai_desc: "Eksplorasi alur kerja berbantuan AI dan otomatisasi.",
    ai_body:
      "Saya mengeksplorasi pemanfaatan kecerdasan artifisial (AI) untuk merancang instruksi, membuat konten, meningkatkan kualitas gambar, dan mengotomatisasi alur kerja. Eksplorasi ini berfokus pada efisiensi pekerjaan dan kemudahan penggunaan sistem digital.",
    ai_tag1: "Perancangan Instruksi AI",
    ai_tag2: "Peningkatan Gambar",
    ai_tag3: "Pembuatan Konten",
    ai_tag4: "Sistem Otomatisasi",
    ai_tag5: "Optimasi Alur Kerja",
    techstack_title: "Perangkat dan Teknologi",
    techstack_desc:
      "Perangkat dan teknologi yang saya gunakan untuk infrastruktur TI, dukungan teknis, layanan bantuan TI, dan pengembangan web.",
    tech_support_tools: "Alat Pendukung",
    tech_webdev: "Pengembangan Web",
    tech_productivity: "Produktivitas",
    tech_design: "Desain",
    skills_title: "Keahlian dan Kompetensi",
    skills_desc:
      "Kompetensi inti dan tools yang saya gunakan secara profesional.",
    skill_technical: "Infrastruktur TI dan Dukungan Teknis",
    skill_webdev: "Pengembangan Web",
    skill_soft: "Soft Skills",
    skill_tools: "Tools",
    services_title: "Layanan",
    services_desc:
      "Dukungan operasional, penanganan masalah teknis, dan pengembangan aplikasi web.",
    milestones_title: "Perjalanan Karier",
    milestones_desc:
      "Tahapan pendidikan dan pengalaman kerja saya.",
    ms1_title: "Lulus SMK",
    ms1_desc:
      "Menyelesaikan pendidikan menengah di SMK Tamansiswa Jetis Yogyakarta, jurusan Teknik Komputer dan Jaringan.",
    ms2_title: "Pengalaman Kerja Pertama",
    ms2_desc:
      "Memulai pengalaman kerja sebagai pramusaji di bidang makanan dan minuman serta mengembangkan keterampilan interpersonal dan pelayanan pelanggan.",
    ms3_title: "Bergabung dengan Koperasi Mahasiswa",
    ms3_desc:
      "Bergabung dengan Koperasi Mahasiswa Universitas PGRI Yogyakarta sebagai staf administrasi dan hubungan masyarakat.",
    ms4_title: "Magang Pengembangan Sistem",
    ms4_desc:
      "Menjalani magang di PT Yogya Kristal Sejati dalam bidang administrasi dan pengembangan sistem pendataan gudang.",
    ms5_title: "Menyelesaikan Pendidikan Sarjana",
    ms5_desc:
      "Lulus program sarjana Informatika di Universitas PGRI Yogyakarta dengan IPK 3,61.",
    ms6_title: "Memasuki Bidang Layanan Digital",
    ms6_desc:
      "Memulai karier dalam dukungan interaksi pelanggan pada platform digital.",
    ms7_title: "Bergabung dengan Ivosights",
    ms7_desc:
      "Bergabung dengan Ivosights dalam bidang dukungan teknis, dengan tanggung jawab diagnosis gangguan, manajemen insiden, dan koordinasi klien.",
    ms8_title: "Dukungan Produk Perusahaan",
    ms8_desc:
      "Menangani penerapan dan dukungan Sociomile Omni, Sociomile Voice, IVO WABA, dan Ripple10 untuk klien perusahaan di Indonesia.",
    ms9_title: "Beralih ke Layanan Bantuan TI",
    ms9_desc:
      "Beralih dari dukungan teknis ke layanan bantuan TI di divisi Customer Experience & Growth, dengan fokus pada penanganan insiden, pemantauan sistem, diagnosis gangguan, dan pemenuhan SLA.",
    ms10_title: "Beralih ke Infrastruktur TI",
    ms10_desc:
      "Beralih ke bidang infrastruktur TI di Ivosights setelah menjalankan peran dukungan teknis dan layanan bantuan TI.",
    page_about_title: "Tentang Saya",
    page_about_desc: "Latar belakang, pengalaman, dan keahlian saya.",
    about_bio_text:
      "Saya adalah profesional teknologi informasi dengan latar belakang pendidikan sarjana Informatika dan pengalaman dalam layanan pelanggan, dukungan teknis, layanan bantuan TI, serta infrastruktur TI. Perjalanan karier saya berkembang dari penanganan kebutuhan pengguna ke diagnosis gangguan, manajemen insiden, dan operasional sistem perusahaan. Berbekal pengetahuan jaringan komputer dan pengembangan sistem, saya terus mengembangkan kemampuan teknis untuk memberikan solusi yang sesuai dengan kebutuhan pengguna dan kegiatan bisnis.",
    about_exp_title: "Pengalaman Kerja",
    about_exp1_role: "IT Infrastructure",
    about_exp1_period: "Jul 2026 – Sekarang",
    about_exp1_desc:
      "Mendukung operasional infrastruktur TI dan menjaga keandalan sistem untuk menunjang kegiatan bisnis.",
    about_exp_prev_role: "Technical Support / Helpdesk",
    about_exp_prev_period: "Nov 2022 – Jun 2026",
    about_exp_prev_desc:
      "Menangani diagnosis gangguan, manajemen insiden, penelusuran masalah, dan dukungan klien untuk Sociomile Omni, Sociomile Voice, IVO WABA, dan Ripple10, baik dari jarak jauh maupun di lokasi.",
    about_exp2_role: "Customer Service",
    about_exp2_period: "Okt 2022 – Nov 2022",
    about_exp2_desc:
      "Memberikan layanan pelanggan melalui percakapan daring, menjawab pertanyaan pengguna, dan menangani masalah sesuai prosedur layanan.",
    about_exp3_role: "Customer Engagement Champion",
    about_exp3_period: "Okt 2021 – Mei 2022",
    about_exp3_desc:
      "Menangani layanan pelanggan melalui percakapan daring, membantu menyelesaikan kendala layanan, dan memberikan informasi produk secara akurat.",
    about_exp4_role: "Administration Intern",
    about_exp4_period: "2019",
    about_exp4_desc:
      "Mengembangkan sistem pendataan gudang dan mendukung kegiatan administrasi serta operasional harian perusahaan.",
    about_exp5_role: "Server / Waiter",
    about_exp5_period: "2017 – 2018",
    about_exp5_desc:
      "Melayani pelanggan dan mendukung kegiatan operasional harian restoran.",
    about_edu_title: "Pendidikan",
    about_edu1_degree: "Sarjana Informatika",
    about_edu1_period: "2016 – 2021",
    about_edu1_desc:
      "Universitas PGRI Yogyakarta · IPK 3,61 dari 4,00 · Skripsi: \"Sistem Pendukung Keputusan Penentuan Wilayah Layak Fogging di Kecamatan Jetis Yogyakarta.\"",
    about_edu2_degree: "Teknik Komputer dan Jaringan",
    about_edu2_period: "2013 – 2016",
    about_edu2_desc: "SMK Tamansiswa Jetis Yogyakarta.",
    qf_location: "Lokasi",
    qf_role: "Posisi Saat Ini",
    qf_company: "Perusahaan",
    qf_education: "Pendidikan",
    qf_experience: "Pengalaman",
    qf_experience_val: "4+ Tahun di Bidang TI",
    page_achievements_title: "Sertifikasi dan Pencapaian",
    page_achievements_desc: "Pendidikan, sertifikasi, dan pengalaman profesional.",
    ach_academic_title: "Prestasi Akademik",
    ach_academic:
      "Sarjana Informatika — Universitas PGRI Yogyakarta · Lulus 2021 · IPK 3,61 dari 4,00",
    ach_professional_title: "Pengalaman Profesional",
    ach_professional:
      "Pengalaman mendukung klien perusahaan di Indonesia melalui dukungan teknis dan layanan bantuan TI, termasuk penanganan insiden, diagnosis gangguan, dan pemenuhan SLA.",
    ach_cert1_title: "English Proficiency Test",
    ach_cert1: "Sertifikat kemampuan bahasa Inggris — 2019",
    ach_cert2_title: "Digital Business Skills",
    ach_cert2: "Sertifikat Kompetensi Keterampilan Bisnis Digital — 2019",
    page_prof_projects_title: "Proyek Lainnya",
    page_prof_projects_desc:
      "Proyek magang, proyek akademik, dan kontribusi pengembangan lainnya.",
    page_projects_title: "Proyek Pengembangan Web",
    page_projects_desc:
      "Karya terpilih dalam pengembangan aplikasi web.",
    proj_bookmark_title: "Bookmark Manager",
    proj_bookmark_desc:
      "Aplikasi pengelola markah di peramban dengan penyimpanan lokal menggunakan IndexedDB. Mendukung hierarki folder, deteksi duplikat, dan analisis domain.",
    proj_bookmark_detail_desc:
      "Aplikasi pengelola markah di peramban dengan penyimpanan lokal menggunakan IndexedDB. Fiturnya mencakup impor dan ekspor markah, hierarki folder, deteksi duplikat, analisis domain, dukungan multibahasa, dan mode gelap. Seluruh data diproses secara lokal tanpa diunggah ke peladen.",
    proj_bookmark_gallery_main: "Bookmark Manager — ikhtisar dasbor",
    proj_bookmark_gallery_1: "Bookmark Manager — hierarki folder",
    proj_bookmark_gallery_2: "Bookmark Manager — analisis domain",
    proj_insta_title: "InstaAnalyzer",
    proj_insta_desc:
      "Aplikasi analisis data Instagram di peramban yang memproses berkas ekspor secara lokal tanpa mengunggah data ke peladen.",
    proj_insta_detail_desc:
      "Aplikasi analisis data Instagram yang memproses berkas ekspor ZIP di peramban. Fiturnya mencakup analisis pengikut, akun yang diikuti, dan penggemar. Seluruh data diproses secara lokal tanpa diunggah ke peladen.",
    proj_insta_gallery_main: "InstaAnalyzer — petunjuk berkas ekspor",
    proj_insta_gallery_1: "InstaAnalyzer — analisis pengikut",
    proj_insta_gallery_2: "InstaAnalyzer — keterangan privasi dan pemrosesan lokal",
    proj_dss_title: "SPK — Prioritas Wilayah Pengasapan",
    proj_dss_desc:
      "Sistem pendukung keputusan untuk membantu instansi kesehatan menentukan prioritas wilayah pengasapan berdasarkan kriteria kesehatan dan lingkungan menggunakan metode TOPSIS.",
    proj_dss_detail_desc:
      "Sistem pendukung keputusan berbasis web untuk membantu instansi kesehatan menentukan prioritas wilayah pengasapan menggunakan metode TOPSIS.",
    proj_dss_meta: "Skripsi Sarjana · Universitas PGRI Yogyakarta",
    proj_dss_gallery_main: "SPK Pengasapan — data wilayah dan masukan kriteria",
    proj_dss_gallery_1: "SPK Pengasapan — matriks perhitungan TOPSIS",
    proj_dss_gallery_2: "SPK Pengasapan — laporan prioritas wilayah",
    proj_ginger_title: "SPK — Pemilihan Lahan Pertanian Jahe",
    proj_ginger_desc:
      "Sistem pendukung keputusan untuk membandingkan lahan pertanian jahe di Gunungkidul dengan metode AHP untuk pembobotan kriteria dan TOPSIS untuk pemeringkatan alternatif.",
    proj_ginger_detail_desc:
      "Aplikasi pendukung keputusan untuk pemilihan lahan pertanian jahe di Gunungkidul. Aplikasi ini mencakup perbandingan kriteria dan uji konsistensi dengan AHP, pemeringkatan alternatif dengan TOPSIS, serta laporan peringkat yang dapat dicetak.",
    proj_ginger_meta: "Proyek Akademik",
    proj_ginger_gallery_main: "SPK Lahan Jahe — ikhtisar aplikasi",
    proj_ginger_gallery_1: "SPK Lahan Jahe — perbandingan kriteria dan uji konsistensi AHP",
    proj_ginger_gallery_2: "SPK Lahan Jahe — laporan peringkat alternatif siap cetak",
    prof_warehouse_title: "Sistem Administrasi Gudang",
    prof_warehouse_desc:
      "Sistem pendataan gudang yang dikembangkan selama magang di PT Yogya Kristal Sejati untuk mendukung pengelolaan persediaan dan administrasi data.",
    prof_warehouse_meta: "Magang · PT Yogya Kristal Sejati",
    prof_proj2_title: "SPK — Penerima BLT Desa",
    prof_proj2_desc:
      "Sistem pendukung keputusan untuk membantu pemerintah desa menentukan calon penerima bantuan langsung tunai (BLT) berdasarkan kriteria yang ditetapkan menggunakan metode TOPSIS.",
    prof_proj2_meta: "Proyek Akademik",
    prof_proj3_title: "Sistem Pakar — Diagnosis Jamur Tiram",
    prof_proj3_desc:
      "Sistem pakar untuk membantu mengidentifikasi hama dan penyakit pada budi daya jamur tiram serta memberikan rekomendasi penanganan.",
    prof_proj3_meta: "Kontribusi: pengembangan antarmuka pengguna",
    proj_view_showcase: "Lihat Showcase",
    proj_demo: "Demo",
    proj_back: "Kembali ke Proyek",
    proj_live_demo: "Demo Langsung",
    page_contact_title: "Kontak",
    page_contact_desc: "Mari diskusikan kebutuhan dukungan teknis atau proyek Anda.",
    form_name: "Nama Lengkap",
    form_email: "Alamat Pos-el",
    form_message: "Pesan",
    form_send: "Kirim Pesan",
    form_subject: "Subjek",
    form_subject_placeholder: "Tuliskan topik pesan Anda",
    form_name_placeholder: "Nama lengkap Anda",
    form_email_placeholder: "nama@contoh.com",
    form_message_placeholder: "Tuliskan pesan Anda di sini.",
    form_sending: "Mengirim pesan…",
    contact_address: "Jakarta Selatan, Indonesia",
    form_success: "Pesan berhasil dikirim. Saya akan menghubungi Anda kembali.",
    form_error: "Gagal mengirim pesan. Silakan coba lagi.",
    form_error_network: "Pesan belum terkirim. Periksa koneksi internet Anda dan coba lagi.",
  },
};

// ─── LANGUAGE ──────────────────────────────────────────────────────────────

function setI18nText(el, text) {
  const firstTextNode = [...el.childNodes].find(
    (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim(),
  );
  if (firstTextNode) {
    firstTextNode.textContent = text;
    return;
  }
  el.textContent = text;
}

function initLanguage() {
  const savedLang = getSavedLang();
  document.querySelectorAll(".lang").forEach((el) => {
    el.dataset.active = savedLang;
  });
  applyLanguage(savedLang);

  document.querySelectorAll(".lang button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === savedLang);
    btn.setAttribute("aria-pressed", String(btn.dataset.lang === savedLang));
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".lang button")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      applyLanguage(btn.dataset.lang);
    });
  });
}

function applyLanguage(lang) {
  const dictionary = translations[lang];
  if (!dictionary) return;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (Object.prototype.hasOwnProperty.call(dictionary, key)) {
      setI18nText(el, dictionary[key]);
    }
  });

  document.documentElement.lang = lang === "id" ? "id" : "en";

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    if (Object.prototype.hasOwnProperty.call(dictionary, key)) {
      el.placeholder = dictionary[key];
    }
  });

  document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
    const key = el.dataset.i18nAlt;
    if (Object.prototype.hasOwnProperty.call(dictionary, key)) {
      el.alt = dictionary[key];
    }
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const label = dictionary[el.dataset.i18nAria];
    if (label) el.setAttribute("aria-label", label);
  });
  safeStorage.set("lang", lang);
  syncControlLabels();
  updatePageMetadata();
  document.dispatchEvent(new CustomEvent("portfolio:language"));

  const mobileLangLabel = document.getElementById("mobileLangLabel");
  if (mobileLangLabel) {
    mobileLangLabel.textContent = lang.toUpperCase();
    mobileLangLabel.classList.remove("lang-pop");
    void mobileLangLabel.offsetWidth;
    mobileLangLabel.classList.add("lang-pop");
    setTimeout(() => mobileLangLabel.classList.remove("lang-pop"), 400);
  }

  document.querySelectorAll(".lang").forEach((el) => {
    el.dataset.active = lang;
  });

  document.querySelectorAll(".lang button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
    btn.setAttribute("aria-pressed", String(btn.dataset.lang === lang));
  });
}

// ─── PARALLAX ──────────────────────────────────────────────────────────────

function initParallax() {
  if (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    window.innerWidth < 992 ||
    "ontouchstart" in window
  )
    return;

  document
    .querySelectorAll(".project-card, .achievement-card")
    .forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const rotateX = ((e.clientY - rect.top - rect.height / 2) / 50) * -1;
        const rotateY = (e.clientX - rect.left - rect.width / 2) / 50;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
      });
      card.addEventListener("mouseenter", () => {
        card.style.transition = "transform 0.18s cubic-bezier(0.22,1,0.36,1)";
      });
      card.addEventListener("mouseleave", () => {
        card.style.transition = "transform 0.6s cubic-bezier(0.22,1,0.36,1)";
        card.style.transform = "";
      });
    });
}

// ─── SCROLL REVEAL ─────────────────────────────────────────────────────────

let _scrollRevealObserver = null;
const revealSeen = new WeakSet();
const revealAnimations = new Set();
const revealMotion = matchMedia("(prefers-reduced-motion: reduce)");
const revealSelector = [
  ".section-title", ".section-desc", ".stat", ".achievement-card",
  ".project-card", ".service-card", ".tech-group", ".milestone-item",
  ".home-project-card", ".home-service-item", ".exp-timeline-item",
  ".edu-item", ".quick-fact", ".about-bio-text", ".ai-content", ".ai-tags",
  ".contact-form", ".contact-info", ".cta-strip__body", ".project-detail-header",
  ".case-study-grid article", ".project-gallery-item", ".project-detail-links",
].join(", ");
function clearRevealState() {
  _scrollRevealObserver?.disconnect();
  revealAnimations.forEach(animation => animation.cancel());
  revealAnimations.clear();
  document.querySelectorAll(".reveal-pending").forEach(el => el.classList.remove("reveal-pending"));
}
function fadeInElement(el, delay = 0, duration = 450) {
  el.dataset.fadeIn = "true";
  el.classList.remove("reveal-pending");
  if (revealMotion.matches || !el.animate) return;
  // Animate opacity only: hover transforms and timeline connector geometry stay intact.
  const animation = el.animate([{opacity: 0}, {opacity: 1}], {
    duration, delay, easing: "ease-out", fill: "backwards",
  });
  revealAnimations.add(animation);
  const cleanup = () => revealAnimations.delete(animation);
  animation.onfinish = cleanup;
  animation.oncancel = cleanup;
}
function initScrollReveal() {
  clearRevealState();
  const page = document.querySelector(".page.active");
  if (!page || revealMotion.matches || !("IntersectionObserver" in window) || !Element.prototype.animate) return;
  const candidates = [...page.querySelectorAll(revealSelector)].filter(el => el.getClientRects().length);
  const candidateSet = new Set(candidates);
  // Never stack a card's reveal on top of a reveal for its own content.
  const targets = candidates.filter(el => {
    for (let parent = el.parentElement; parent && parent !== page; parent = parent.parentElement) {
      if (candidateSet.has(parent)) return false;
    }
    return !revealSeen.has(el);
  });
  _scrollRevealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      revealSeen.add(el);
      const siblings = [...el.parentElement.children].filter(sibling => candidateSet.has(sibling));
      const delay = Math.min(Math.max(0, siblings.indexOf(el)), 3) * 40;
      fadeInElement(el, delay);
      _scrollRevealObserver.unobserve(el);
    });
  }, {threshold: .06, rootMargin: "0px 0px -12px 0px"});
  targets.forEach(el => { el.classList.add("reveal-pending"); _scrollRevealObserver.observe(el); });
}
revealMotion.addEventListener("change", initScrollReveal);
document.addEventListener("focusin", event => {
  const pending = event.target.closest?.(".reveal-pending");
  if (pending) {
    pending.classList.remove("reveal-pending");
    revealSeen.add(pending);
    _scrollRevealObserver?.unobserve(pending);
  }
});

// ─── STATS COUNTER ─────────────────────────────────────────────────────────

function initStatsCounter() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".stat [data-target]").forEach(el => el.textContent = `${el.dataset.target}+`);
    return;
  }
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const animateCounter = (h2, number, delay = 0) => {
    setTimeout(() => {
      const duration = 1200;
      const startTime = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        h2.innerText = Math.floor(easeOutCubic(progress) * number) + "+";

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          h2.innerText = number + "+";
          h2.classList.add("stat-done");
          setTimeout(() => h2.classList.remove("stat-done"), 600);
          delete h2.dataset.animating;
        }
      };

      requestAnimationFrame(tick);
    }, delay);
  };

  const statsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const h2 = entry.target.querySelector("h2");
        if (h2 && !h2.dataset.animating) {
          h2.dataset.animating = "true";
          const rawValue =
            h2.dataset.target || h2.innerText.replace("+", "").trim();
          h2.dataset.target = rawValue;
          const number = parseInt(rawValue);
          const index = [...document.querySelectorAll(".stat")].indexOf(
            entry.target,
          );
          if (!isNaN(number)) animateCounter(h2, number, index * 150);
        }
        statsObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.5 },
  );

  document
    .querySelectorAll(".stat")
    .forEach((stat) => statsObserver.observe(stat));
}

// ─── HERO ANIMATIONS ───────────────────────────────────────────────────────

function initAnimations() {
  if (revealMotion.matches) return;
  // Hero metadata stays immediately visible; only the editorial content fades in.
  [".hero h1", ".hero-summary", ".hero-cta-group"].forEach((selector, index) => {
    const el = document.querySelector(selector);
    if (el?.getClientRects().length) fadeInElement(el, index * 60, 450);
  });
}

// ─── CONTACT FORM ──────────────────────────────────────────────────────────

function initContactForm() {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  const submit = form?.querySelector(".submit-btn");
  if (!form || !status || !submit) return;
  let sending = false;
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (sending) return;
    sending = true; submit.disabled = true;
    form.setAttribute("aria-busy", "true");
    submit.dataset.i18n = "form_sending";
    submit.textContent = translations[getSavedLang()].form_sending;
    status.textContent = ""; status.className = "";
    delete status.dataset.i18n;
    const snapshot = Object.fromEntries(new FormData(form));
    const data = Object.fromEntries(Object.entries(snapshot).map(([key, value]) => [key, value.trim()]));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch("https://formspree.io/f/mbdebkje", {
        method: "POST", headers: {"Content-Type": "application/json", Accept: "application/json"},
        body: JSON.stringify(data), signal: controller.signal,
      });
      const current = Object.fromEntries(new FormData(form));
      const unchanged = Object.keys(snapshot).every(key => current[key] === snapshot[key]);
      status.dataset.i18n = response.ok ? (unchanged ? "form_success" : "form_success_draft") : "form_error";
      status.className = response.ok ? "form-status--success" : "form-status--error";
      // A successful response belongs to the submitted snapshot, never to newer edits.
      if (response.ok && unchanged) form.reset();
    } catch (error) {
      status.dataset.i18n = error.name === "AbortError" ? "form_timeout" : "form_error_network";
      status.className = "form-status--error";
    } finally {
      clearTimeout(timeout); sending = false; submit.disabled = false;
      form.removeAttribute("aria-busy"); submit.dataset.i18n = "form_send";
      const dict = translations[getSavedLang()];
      submit.textContent = dict.form_send;
      status.textContent = dict[status.dataset.i18n];
    }
  });
}

// ─── BURGER MENU ───────────────────────────────────────────────────────────

function initBurgerMenu() {
  const button = document.getElementById("burgerBtn");
  const overlay = document.getElementById("navOverlay");
  const main = document.querySelector("main");
  const sidebar = document.querySelector(".sidebar");
  if (!button || !overlay) return;
  const close = (restoreFocus = true) => {
    if (!overlay.classList.contains("open")) return;
    overlay.classList.remove("open"); overlay.setAttribute("aria-hidden", "true"); overlay.inert = true;
    button.classList.remove("open"); button.setAttribute("aria-expanded", "false");
    button.innerHTML = lucideIcon("menu");
    main.inert = false; sidebar.inert = false; document.body.style.overflow = "";
    if (restoreFocus) button.focus({preventScroll: true});
  };
  overlay.inert = true;
  button.addEventListener("click", () => {
    if (overlay.classList.contains("open")) return close();
    overlay.inert = false; overlay.classList.add("open"); overlay.setAttribute("aria-hidden", "false");
    button.classList.add("open"); button.setAttribute("aria-expanded", "true");
    button.innerHTML = lucideIcon("x");
    main.inert = true; sidebar.inert = true; document.body.style.overflow = "hidden";
    overlay.querySelector("a")?.focus({preventScroll: true});
  });
  document.addEventListener("keydown", event => {
    if (!overlay.classList.contains("open")) return;
    if (event.key === "Escape") { event.preventDefault(); close(); }
    if (event.key !== "Tab") return;
    const controls = [button, ...overlay.querySelectorAll("a[href]")];
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  document.addEventListener("portfolio:navigate", () => close(false));
  window.addEventListener("resize", () => { if (innerWidth > 1024) close(false); });
}

// ─── MOBILE NAVBAR CONTROLS ────────────────────────────────────────────────

function initMobileNavbarControls() {
  const mobileLangBtn = document.getElementById("mobileLangBtn");
  const mobileLangLabel = document.getElementById("mobileLangLabel");

  if (mobileLangBtn && mobileLangLabel) {
    mobileLangLabel.textContent = getSavedLang().toUpperCase();
    mobileLangBtn.addEventListener("click", () => {
      const newLang = getSavedLang() === "en" ? "id" : "en";
      applyLanguage(newLang);
    });
  }

  const mobileThemeBtn = document.getElementById("mobileThemeBtn");
  if (mobileThemeBtn) {
    syncMobileThemeIcon();
    mobileThemeBtn.addEventListener("click", () => {

      const isLight = document.documentElement.classList.contains("light");
      applyTheme(isLight ? "dark" : "light");
    });
  }
}

function syncMobileThemeIcon() {
  const mobileThemeBtn = document.getElementById("mobileThemeBtn");
  if (!mobileThemeBtn) return;
  renderThemeIcons(mobileThemeBtn);
}

// ─── PROJECT DETAIL ────────────────────────────────────────────────────────

function initProjectDetail() {
  const projectsEl = document.querySelector("#projects");

  projectsEl.addEventListener("click", (e) => {
    const detailBtn = e.target.closest(".project-detail-btn");
    if (detailBtn) return openProjectDetail(detailBtn.dataset.project);
    if (e.target.closest(".project-detail-back")) closeProjectDetail();
  });

  projectsEl.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const detailBtn = e.target.closest(".project-detail-btn");
    if (detailBtn && detailBtn.tagName !== "BUTTON") {
      e.preventDefault();
      openProjectDetail(detailBtn.dataset.project);
    }
  });
}

let projectListPosition = 0;
let projectListTrigger = null;
function focusHeading(container) {
  const heading = container.querySelector("h1, h2");
  if (heading) {
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
}
function openProjectDetail(projectId, {updateHistory = true} = {}) {
  const target = document.getElementById(`detail-${projectId}`);
  if (!target) return;

  const parentSection = target.closest(".section");
  if (!parentSection) return;
  document.dispatchEvent(new CustomEvent("portfolio:detailchange"));

  if (!document.querySelector(".project-detail-view.active")) {
    projectListPosition = window.scrollY;
    projectListTrigger = document.querySelector(
      `#projects .project-detail-btn[data-project="${projectId}"]`,
    );
  }
  resetProjectSections();

  parentSection
    .querySelectorAll(".projects-grid, .section-title, .section-desc")
    .forEach((el) => {
      el.classList.add("hidden");
    });

  [...document.querySelectorAll("#projects .section")]
    .filter((s) => s !== parentSection)
    .forEach((section) => section.classList.add("hidden"));

  target.classList.add("active");
  initScrollReveal();
  focusHeading(target);
  window.scrollTo({ top: 0, behavior: "auto" });

  if (updateHistory && location.hash !== `#/projects/${projectId}`) location.hash = `/projects/${projectId}`;
  updatePageMetadata();
}

function closeProjectDetail({updateHistory = true} = {}) {
  const activeDetail = document.querySelector(".project-detail-view.active");
  if (!activeDetail) return;
  document.dispatchEvent(new CustomEvent("portfolio:detailchange"));

  const parentSection = activeDetail.closest(".section");
  activeDetail.classList.remove("active");

  if (parentSection) {
    parentSection
      .querySelectorAll(".projects-grid, .section-title, .section-desc")
      .forEach((el) => {
        el.classList.remove("hidden");
      });
  }

  document
    .querySelectorAll("#projects .section")
    .forEach((section) => section.classList.remove("hidden"));
  requestAnimationFrame(() => {
    window.scrollTo({ top: projectListPosition, behavior: "instant" });
    projectListTrigger?.focus({ preventScroll: true });
  });

  if (updateHistory && location.hash !== "#/projects") location.hash = "/projects";
  updatePageMetadata();
}

// ─── SYNC UI STATE ─────────────────────────────────────────────────────────

function syncAllUIState() {
  const savedLang = getSavedLang();
  syncMobileThemeIcon();
  const mobileLangLabel = document.getElementById("mobileLangLabel");
  if (mobileLangLabel) mobileLangLabel.textContent = savedLang.toUpperCase();
}

// ─── PROJECT GALLERY LIGHTBOX ──────────────────────────────────────────────

function initProjectGalleryLightbox() {
  const lightbox = document.getElementById("projectLightbox");
  const lightboxImage = document.getElementById("projectLightboxImage");
  const closeBtn = document.querySelector(".project-lightbox-close");

  if (!lightbox || !lightboxImage) return;

  let _lightboxTrigger = null;
  let gallery = [],
    galleryIndex = 0;
  const showImage = () => {
    const img = gallery[galleryIndex];
    lightboxImage.src = img.src;
    lightboxImage.alt = img.alt;
    document.getElementById("lightboxCaption").textContent =
      `${galleryIndex + 1} / ${gallery.length} — ${img.alt}`;
  };
  const step = (direction) => {
    galleryIndex = (galleryIndex + direction + gallery.length) % gallery.length;
    showImage();
  };
  lightbox
    .querySelector(".lightbox-prev")
    .addEventListener("click", () => step(-1));
  lightbox
    .querySelector(".lightbox-next")
    .addEventListener("click", () => step(1));
  document.addEventListener("keydown", (e) => {
    if (
      lightbox.classList.contains("active") &&
      (e.key === "ArrowLeft" || e.key === "ArrowRight")
    ) {
      e.preventDefault();
      step(e.key === "ArrowLeft" ? -1 : 1);
    }
  });

  const focusableSelectors = "a[href], button, [tabindex]:not([tabindex='-1'])";

  const trapFocus = (e) => {
    const focusable = [...lightbox.querySelectorAll(focusableSelectors)];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.key === "Tab") {
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  };

  const openLightbox = (img, trigger) => {
    _lightboxTrigger = trigger || null;
    gallery = [
      ...img.closest(".project-detail-gallery").querySelectorAll("img"),
    ];
    galleryIndex = gallery.indexOf(img);
    showImage();
    lightbox.classList.add("active");
    document.querySelector(".container").inert = true;
    document.querySelector(".skip-link").inert = true;
    document.body.style.overflow = "hidden";
    lightbox.setAttribute("aria-hidden", "false");
    // Transfer focus in the same interaction that makes the background inert.
    // A timer leaves fast keyboard input on the disabled thumbnail.
    closeBtn?.focus({preventScroll: true});
    lightbox.addEventListener("keydown", trapFocus);
  };

  const closeLightbox = ({restoreFocus = true} = {}) => {
    if (!lightbox.classList.contains("active")) return;
    document.querySelector(".container").inert = false;
    document.querySelector(".skip-link").inert = false;
    lightbox.classList.remove("active");
    document.body.style.overflow = "";
    lightbox.setAttribute("aria-hidden", "true");
    lightbox.removeEventListener("keydown", trapFocus);
    const trigger = _lightboxTrigger;
    _lightboxTrigger = null;
    if (restoreFocus && trigger?.isConnected && trigger.getClientRects().length) trigger.focus({preventScroll: true});
  };

  document.querySelectorAll(".project-gallery-placeholder").forEach((item) => {
    const openOnInteraction = (e) => {
      if (e.type === "keydown" && item.tagName === "BUTTON") return;
      if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
      if (e.type === "keydown") e.preventDefault();
      const img = item.querySelector("img");
      if (img) openLightbox(img, item);
    };
    item.addEventListener("click", openOnInteraction);
    item.addEventListener("keydown", openOnInteraction);
  });

  closeBtn?.addEventListener("click", closeLightbox);
  document.addEventListener("portfolio:navigate", () => closeLightbox({restoreFocus: false}));
  document.addEventListener("portfolio:detailchange", () => closeLightbox({restoreFocus: false}));
  let swipe = null;
  lightbox.addEventListener("pointerdown", event => {
    if (event.pointerType === "touch") swipe = {x:event.clientX,y:event.clientY};
  }, {passive:true});
  lightbox.addEventListener("pointerup", event => {
    if (!swipe || event.pointerType !== "touch") return;
    const dx = event.clientX - swipe.x, dy = event.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
  }, {passive:true});
  lightbox.addEventListener("pointercancel", () => swipe = null);
  document.addEventListener("portfolio:language", () => {
    if (lightbox.classList.contains("active")) showImage();
  });

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox || e.target.classList.contains("lightbox-figure")) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox.classList.contains("active"))
      closeLightbox();
  });
}
// Portfolio usability enhancements.
const uxTranslations = {
  en: {
    proj_view_showcase: "View case study",




    email_direct: "Prefer email? Write to me directly",

    case_problem: "The problem",
    case_role: "My contribution",
    case_solution: "The solution",
    case_result: "What the project delivers",
    field_required: "Please complete this field.",
    field_email: "Enter a valid email address.",
  },
  id: {
    proj_view_showcase: "Lihat studi kasus",




    email_direct: "Anda juga dapat menghubungi saya langsung melalui pos-el.",

    case_problem: "Masalah",
    case_role: "Kontribusi saya",
    case_solution: "Solusi",
    case_result: "Hasil proyek",
    field_required: "Mohon lengkapi kolom ini.",
    field_email: "Masukkan alamat pos-el yang valid.",
  },
};
Object.keys(uxTranslations).forEach((lang) =>
  Object.assign(translations[lang], uxTranslations[lang]),
);
const caseStudies = {
  "bookmark-manager": {
    en: [
      "Bookmarks can become scattered and difficult to organize.",
      "Web application development with HTML, CSS, JavaScript, and IndexedDB.",
      "Local storage with folders, import/export, duplicate detection, and domain analytics.",
      "A browser-based tool for organizing bookmarks without uploading them to a server.",
    ],
    id: [
      "Markah yang tersebar perlu dikelola agar mudah ditemukan kembali.",
      "Pengembangan aplikasi web dengan HTML, CSS, JavaScript, dan IndexedDB.",
      "Penyimpanan lokal dengan pengelompokan folder, impor dan ekspor markah, deteksi duplikat, serta analisis domain.",
      "Aplikasi di peramban untuk mengelola markah tanpa mengunggah data ke peladen.",
    ],
  },
  "insta-analyzer": {
    en: [
      "Instagram export files need to be processed to explore follower relationships.",
      "Client-side web application development and ZIP file processing.",
      "Read exported data in the browser to analyze followers, following, and fans.",
      "An analysis dashboard that processes personal data locally without server uploads.",
    ],
    id: [
      "Berkas ekspor Instagram perlu diolah untuk menelusuri hubungan antara pengikut dan akun yang diikuti.",
      "Pengembangan aplikasi web di sisi klien dan pemrosesan berkas ZIP.",
      "Pemrosesan data ekspor di peramban untuk menganalisis pengikut, akun yang diikuti, dan penggemar.",
      "Dasbor analisis yang memproses data pribadi secara lokal tanpa mengunggahnya ke peladen.",
    ],
  },
  "dss-fogging": {
    en: [
      "Fogging area prioritization needs to account for health and environmental criteria.",
      "Development of a decision support system as an undergraduate thesis project.",
      "PHP and MySQL application applying TOPSIS to the supplied criteria.",
      "Criteria entry, calculation matrices, and an area prioritization report.",
    ],
    id: [
      "Penentuan prioritas wilayah pengasapan perlu mempertimbangkan kriteria kesehatan dan lingkungan.",
      "Pengembangan sistem pendukung keputusan sebagai proyek skripsi.",
      "Aplikasi PHP dan MySQL yang menerapkan TOPSIS pada kriteria yang dimasukkan.",
      "Masukan kriteria, matriks perhitungan, dan laporan prioritas wilayah.",
    ],
  },
  "dss-ginger-land": {
  "en": [
    "Ginger farming locations need to be compared against a consistent set of land-selection criteria.",
    "Development of an academic decision support application with PHP and MySQL.",
    "AHP criteria comparisons and consistency checks, followed by TOPSIS ranking of land alternatives.",
    "A ranked list of land alternatives and a printable report for reviewing the selection."
  ],
  "id": [
    "Lokasi pertanian jahe perlu dibandingkan menggunakan kriteria pemilihan lahan yang konsisten.",
    "Pengembangan aplikasi pendukung keputusan akademik dengan PHP dan MySQL.",
    "Perbandingan kriteria dan uji konsistensi AHP, dilanjutkan dengan pemeringkatan alternatif lahan menggunakan TOPSIS.",
    "Daftar peringkat alternatif lahan dan laporan yang dapat dicetak untuk meninjau hasil pemilihan."
  ]
},
};

Object.assign(translations.en, {
  gallery_previous: "Previous image",
  gallery_next: "Next image",
  gallery_close: "Close gallery",
});
Object.assign(translations.id, {
  gallery_previous: "Gambar sebelumnya",
  gallery_next: "Gambar berikutnya",
  gallery_close: "Tutup galeri",
});
function initPortfolioUX() {
  const labels = ["case_problem", "case_role", "case_solution", "case_result"];
  Object.entries(caseStudies).forEach(([id, content]) => {
    const detail = document.getElementById(`detail-${id}`);
    const grid = document.createElement("div");
    grid.className = "case-study-grid";
    labels.forEach((label, index) => {
      const article = document.createElement("article");
      const heading = document.createElement("h3");
      heading.dataset.i18n = label;
      const p = document.createElement("p");
      const key = `case_${id}_${index}`;
      p.dataset.i18n = key;
      ["en", "id"].forEach((lang) => {
        translations[lang][key] = content[lang][index];
      });
      article.append(heading, p);
      grid.append(article);
    });
    detail.querySelector(".project-detail-header").after(grid);
  });
  applyLanguage(getSavedLang());
  initScrollReveal();
  const dict = () => translations[getSavedLang()];
  const form = document.getElementById("contact-form");
  const fields = [...form.querySelectorAll("input, textarea")];
  const validate = (field) => {
    const error = document.getElementById(`${field.id}-error`);
    const valid = field.validity.valid && field.value.trim().length > 0;
    field.setAttribute("aria-invalid", String(!valid));
    error.textContent = valid
      ? ""
      : field.validity.typeMismatch
        ? dict().field_email
        : dict().field_required;
    return valid;
  };
  document.addEventListener("portfolio:language", () => {
    fields.filter(field => field.getAttribute("aria-invalid") === "true").forEach(validate);
  });
  fields.forEach((field) => {
    const error = document.createElement("p");
    error.id = `${field.id}-error`;
    error.className = "field-error";
    field.setAttribute("aria-describedby", error.id);
    field.after(error);
    field.addEventListener("blur", () => {
      if (field.value || field.getAttribute("aria-invalid") === "true")
        validate(field);
    });
    field.addEventListener("input", () => {
      if (field.getAttribute("aria-invalid") === "true") validate(field);
    });
  });
  form.addEventListener(
    "submit",
    (event) => {
      const invalid = fields.filter((field) => !validate(field));
      if (invalid.length) {
        event.preventDefault();
        event.stopImmediatePropagation();
        invalid[0].focus();
      }
    },
    true,
  );
  form.addEventListener("reset", () =>
    fields.forEach((field) => {
      field.removeAttribute("aria-invalid");
      document.getElementById(`${field.id}-error`).textContent = "";
    }),
  );
}
document.addEventListener("DOMContentLoaded", initPortfolioUX);

// Aurora physics: pixels/second, elastic core collisions, and bounded centers.
function initHeroAurora() {
  const hero = document.querySelector(".hero");
  if (!hero) return;
  if (hero.dataset.auroraInitialized) return;
  hero.dataset.auroraInitialized = "true";
  // Autoplay is intentional, including on systems with reduced motion (user preference).
  hero.classList.add("aurora-motion-enabled");
  const settings = {
    speed: 100, // Base speed in pixels per second; raise this to accelerate all orbs.
    maxSubsteps: 64, // Bound collision work on slower devices.
    coreRatio: 0.16, // Collision radius relative to the visible glow size.
    pointerResponse: 0.14,
  };
  const seeds = [
    [0.22, 0.3, 0.88, 0.48],
    [0.76, 0.34, -0.72, 0.69],
    [0.49, 0.78, 0.6, -0.8],
  ];
  const orbs = [...hero.querySelectorAll(".hero-orb")].map((el, i) => ({
    el,
    x: 0,
    y: 0,
    radius: 0,
    half: 0,
    mass: 1,
    vx: seeds[i][2] * settings.speed,
    vy: seeds[i][3] * settings.speed,
    depth: parseFloat(getComputedStyle(el).getPropertyValue("--depth")),
  }));
  let width = 0,
    height = 0,
    frame = 0,
    previousTime = 0,
    visible = true;
  let mouseX = 0,
    mouseY = 0,
    targetX = 0,
    targetY = 0;
  const render = () =>
    orbs.forEach((orb) => {
      orb.el.style.setProperty("--orb-x", `${orb.x.toFixed(3)}px`);
      orb.el.style.setProperty("--orb-y", `${orb.y.toFixed(3)}px`);
    });
  const walls = (orb) => {
    // The core's CENTER reaches the wall; the diffuse halo may be clipped.
    if (orb.x <= 0) {
      orb.x = 0;
      orb.vx = Math.abs(orb.vx);
    }
    if (orb.x >= width) {
      orb.x = width;
      orb.vx = -Math.abs(orb.vx);
    }
    if (orb.y <= 0) {
      orb.y = 0;
      orb.vy = Math.abs(orb.vy);
    }
    if (orb.y >= height) {
      orb.y = height;
      orb.vy = -Math.abs(orb.vy);
    }
  };
  const collide = (a, b) => {
    const dx = b.x - a.x,
      dy = b.y - a.y;
    const distance = Math.hypot(dx, dy),
      minimum = a.radius + b.radius;
    if (distance >= minimum) return;
    const nx = distance > 0.001 ? dx / distance : 1;
    const ny = distance > 0.001 ? dy / distance : 0;
    const inverseA = 1 / a.mass,
      inverseB = 1 / b.mass,
      inverseSum = inverseA + inverseB;
    // Separate overlapping cores by mass, then exchange only approaching velocity.
    const overlap = minimum - distance + 0.01;
    a.x -= (nx * overlap * inverseA) / inverseSum;
    a.y -= (ny * overlap * inverseA) / inverseSum;
    b.x += (nx * overlap * inverseB) / inverseSum;
    b.y += (ny * overlap * inverseB) / inverseSum;
    const approach = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (approach >= 0) return;
    const impulse = (-2 * approach) / inverseSum;
    a.vx -= impulse * nx * inverseA;
    a.vy -= impulse * ny * inverseA;
    b.vx += impulse * nx * inverseB;
    b.vy += impulse * ny * inverseB;
  };
  const resize = () => {
    const nextWidth = hero.clientWidth,
      nextHeight = hero.clientHeight;
    if (!nextWidth || !nextHeight || (nextWidth === width && nextHeight === height)) return;
    orbs.forEach((orb, i) => {
      orb.x = width ? (orb.x / width) * nextWidth : seeds[i][0] * nextWidth;
      orb.y = height ? (orb.y / height) * nextHeight : seeds[i][1] * nextHeight;
      const size = orb.el.offsetWidth;
      orb.half = size / 2;
      orb.radius = Math.min(
        size * settings.coreRatio,
        nextWidth * 0.12,
        nextHeight * 0.12,
      );
      orb.mass = orb.radius * orb.radius;
      orb.el.style.setProperty("--orb-half", `${orb.half}px`);
    });
    width = nextWidth;
    height = nextHeight;
    render();
  };
  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
  };
  const tick = (time) => {
    const dt = previousTime
      ? Math.min((time - previousTime) / 1000, 0.05)
      : 1 / 60;
    previousTime = time;
    const alpha = 1 - Math.pow(1 - settings.pointerResponse, dt * 60);
    const shiftX = (targetX - mouseX) * alpha,
      shiftY = (targetY - mouseY) * alpha;
    mouseX += shiftX;
    mouseY += shiftY;
    hero.style.setProperty("--mouse-x", `${mouseX.toFixed(2)}px`);
    hero.style.setProperty("--mouse-y", `${mouseY.toFixed(2)}px`);
    // Substeps prevent fast cores passing through each other on slower frames.
    const smallestCore = Math.max(
      1,
      Math.min(...orbs.map((orb) => orb.radius)),
    );
    const fastest = Math.max(...orbs.map((orb) => Math.hypot(orb.vx, orb.vy)));
    const pointerTravel = Math.hypot(shiftX, shiftY) * 0.4;
    const steps = Math.min(
      settings.maxSubsteps,
      Math.max(
        1,
        Math.ceil(dt * 120),
        Math.ceil((fastest * dt + pointerTravel) / (smallestCore * 0.4)),
      ),
    );
    for (let step = 0; step < steps; step++) {
      orbs.forEach((orb) => {
        orb.x += (orb.vx * dt) / steps + (shiftX * orb.depth) / steps;
        orb.y += (orb.vy * dt) / steps + (shiftY * orb.depth) / steps;
        walls(orb);
      });
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < orbs.length; i++) {
          for (let j = i + 1; j < orbs.length; j++) collide(orbs[i], orbs[j]);
        }
        orbs.forEach(walls);
      }
    }
    render();
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    const paused = !visible || document.hidden;
    hero.dataset.auroraState = document.hidden
      ? "tab-hidden"
      : !visible
        ? "offscreen"
        : "running";
    hero.classList.toggle("aurora-paused", paused);
    if (paused) {
      stop();
      targetX = targetY = mouseX = mouseY = 0;
      hero.classList.remove("is-pointer-active");
      hero.style.setProperty("--mouse-x", "0px");
      hero.style.setProperty("--mouse-y", "0px");
    } else if (!frame) frame = requestAnimationFrame(tick);
  };
  hero.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType === "touch") return;
      const bounds = hero.getBoundingClientRect();
      targetX = event.clientX - bounds.left - bounds.width / 2;
      targetY = event.clientY - bounds.top - bounds.height / 2;
      hero.classList.add("is-pointer-active");
    },
    { passive: true },
  );
  const leave = () => {
    targetX = targetY = 0;
    hero.classList.remove("is-pointer-active");
  };
  hero.addEventListener("pointerleave", leave);
  hero.addEventListener("pointercancel", leave);
  document.addEventListener("visibilitychange", sync);
  new ResizeObserver(resize).observe(hero);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }).observe(hero);
  resize();
  sync();
}

// Isolated startup: unrelated page enhancements cannot prevent orb initialization.
document.addEventListener("DOMContentLoaded", initHeroAurora);

function syncControlLabels() {
  const dict = translations[document.documentElement.lang] || translations.en;
  const light = document.documentElement.classList.contains("light");
  document.querySelectorAll(".theme-btn, #mobileThemeBtn").forEach(button => {
    button.setAttribute("aria-label", light ? dict.theme_dark : dict.theme_light);
    button.setAttribute("aria-pressed", String(light));
  });
  document.getElementById("mobileLangBtn")?.setAttribute("aria-label", document.documentElement.lang === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia");
}
Object.assign(translations.en, {skip_content:"Skip to content", theme_dark:"Switch to dark mode", theme_light:"Switch to light mode", menu_toggle:"Open or close navigation", form_timeout:"The request timed out. Please retry or email me directly.", gallery_zoom:"Enlarge screenshot"});
Object.assign(translations.id, {skip_content:"Lewati ke konten", theme_dark:"Aktifkan mode gelap", theme_light:"Aktifkan mode terang", menu_toggle:"Buka atau tutup navigasi", form_timeout:"Waktu pengiriman habis. Silakan coba lagi atau hubungi saya melalui pos-el.", gallery_zoom:"Perbesar tangkapan layar"});
document.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".skip-link")?.addEventListener("click", event => {
    event.preventDefault(); document.querySelector("main").focus({preventScroll: true});
    document.querySelector("main").scrollIntoView({behavior:"instant"});
  });
  document.querySelectorAll(".project-gallery-placeholder").forEach(button => {
    button.setAttribute("aria-label", `${translations[getSavedLang()].gallery_zoom}: ${button.querySelector("img").alt}`);
  });
  document.addEventListener("portfolio:language", () => {
    document.querySelectorAll(".project-gallery-placeholder").forEach(button => button.setAttribute("aria-label", `${translations[getSavedLang()].gallery_zoom}: ${button.querySelector("img").alt}`));
  });
});

// Start editorial fades after page restoration and generated case-study content.
document.addEventListener("DOMContentLoaded", initAnimations);

Object.assign(translations.en, {form_success_draft: "Your message has been sent. Changes made while it was sending remain in the form."});
Object.assign(translations.id, {form_success_draft: "Pesan berhasil dikirim. Perubahan yang Anda buat selama pengiriman tetap tersimpan di formulir."});

// Keep visible UI and persisted preferences consistent between tabs.
window.addEventListener("storage", event => {
  try { if (event.storageArea !== localStorage) return; } catch { return; }
  if (event.key === "theme" || event.key === null) applyTheme(safeStorage.get("theme") === "light" ? "light" : "dark");
  if (event.key === "lang" || event.key === null) applyLanguage(getSavedLang());
});

// Localize competency labels; product names and technology identifiers stay unchanged.
Object.assign(translations.en, {
  "competency_1": "IT Infrastructure Operations",
  "competency_2": "Technical Troubleshooting",
  "competency_3": "Helpdesk Operations",
  "competency_4": "Incident Management",
  "competency_5": "Root Cause Analysis",
  "competency_6": "System Monitoring",
  "competency_7": "Remote Support",
  "competency_8": "SLA Management",
  "competency_9": "Client Support",
  "competency_10": "Product Support",
  "competency_11": "Technical Documentation",
  "competency_12": "Ticket Management",
  "competency_13": "User Assistance",
  "competency_14": "Enterprise Application Support",
  "competency_15": "Responsive Web Design",
  "competency_16": "CRUD Application",
  "competency_17": "Database Design",
  "competency_18": "Problem Solving",
  "competency_19": "Analytical Thinking",
  "competency_20": "Communication",
  "competency_21": "Customer Orientation",
  "competency_22": "Team Collaboration",
  "competency_23": "Knowledge Sharing",
  "competency_24": "Mentoring",
  "competency_25": "Adaptability"
});
Object.assign(translations.id, {
  "competency_1": "Operasional Infrastruktur TI",
  "competency_2": "Pemecahan Masalah Teknis",
  "competency_3": "Layanan Bantuan TI",
  "competency_4": "Manajemen Insiden",
  "competency_5": "Analisis Akar Masalah",
  "competency_6": "Pemantauan Sistem",
  "competency_7": "Dukungan Jarak Jauh",
  "competency_8": "Manajemen SLA",
  "competency_9": "Dukungan Klien",
  "competency_10": "Dukungan Produk",
  "competency_11": "Dokumentasi Teknis",
  "competency_12": "Manajemen Tiket",
  "competency_13": "Bantuan Pengguna",
  "competency_14": "Dukungan Aplikasi Perusahaan",
  "competency_15": "Desain Web Responsif",
  "competency_16": "Aplikasi CRUD",
  "competency_17": "Perancangan Basis Data",
  "competency_18": "Pemecahan Masalah",
  "competency_19": "Pemikiran Analitis",
  "competency_20": "Komunikasi",
  "competency_21": "Orientasi Pelanggan",
  "competency_22": "Kolaborasi Tim",
  "competency_23": "Berbagi Pengetahuan",
  "competency_24": "Pendampingan",
  "competency_25": "Kemampuan Beradaptasi",
  "skill_soft": "Keterampilan Interpersonal",
  "skill_tools": "Perangkat Kerja",
  "skill_technical": "Infrastruktur TI dan Dukungan Teknis",
  "techstack_title": "Perangkat dan Teknologi",
  "techstack_desc": "Perangkat dan teknologi yang saya gunakan untuk infrastruktur TI, dukungan teknis, layanan bantuan TI, dan pengembangan web.",
  "skills_desc": "Kompetensi inti dan perangkat yang saya gunakan secara profesional."
});

Object.assign(translations.en, {
  "hero_role_primary": "IT Infrastructure",
  "hero_role_secondary": "& Technical Support",
  "company_ivosights": "Ivosights · Jakarta · hybrid",
  "company_karier": "Ivosights BPO (Karier.mu project)",
  "company_ajaib": "PT VADS Indonesia (Ajaib project)",
  "tech_basic_js": "JavaScript Fundamentals",
  "tech_social_design": "Social Media Design",
  "tech_php_native": "PHP without a Framework",
  "tech_frontend": "Front-End Development",
  "nav_mobile_label": "Mobile navigation",
  "nav_fullscreen_label": "Navigation menu",
  "gallery_dialog_label": "Project image gallery"
});

Object.assign(translations.id, {
  "hero_role_primary": "Infrastruktur TI",
  "hero_role_secondary": "dan Dukungan Teknis",
  "company_ivosights": "Ivosights · Jakarta · kerja hibrida",
  "company_karier": "Ivosights BPO (proyek Karier.mu)",
  "company_ajaib": "PT VADS Indonesia (proyek Ajaib)",
  "tech_basic_js": "Dasar JavaScript",
  "tech_social_design": "Desain Media Sosial",
  "tech_php_native": "PHP tanpa Kerangka Kerja",
  "tech_frontend": "Pengembangan Antarmuka",
  "nav_mobile_label": "Navigasi perangkat seluler",
  "nav_fullscreen_label": "Menu navigasi",
  "gallery_dialog_label": "Galeri gambar proyek"
});
