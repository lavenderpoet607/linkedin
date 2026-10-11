import { api } from './api.js';

const state = {
  theme: localStorage.getItem('theme') || 'dark',
  currentTab: 'tab-overview',
  profile: null,
  account: null,
  audit: null,
  revisions: [],
  variations: [],
  jobs: [],
  drafts: [],
  logs: [],
  pendingConfirmAction: null,
  skillsCategory: 'all',
  skillsSearch: ''
};

const SKILL_TAXONOMY = [
  { name: 'TypeScript', category: 'frontend', icon: '⚡' },
  { name: 'Flutter', category: 'mobile', icon: '📱' },
  { name: 'Dart', category: 'mobile', icon: '🎯' },
  { name: 'React Native', category: 'mobile', icon: '📲' },
  { name: 'Android (Kotlin)', category: 'mobile', icon: '🤖' },
  { name: 'iOS (Swift)', category: 'mobile', icon: '🍎' },
  { name: 'BLoC Pattern', category: 'mobile', icon: '🧱' },
  { name: 'Jetpack Compose', category: 'mobile', icon: '🧩' },
  { name: 'JavaScript', category: 'frontend', icon: '💛' },
  { name: 'React.js', category: 'frontend', icon: '⚛️' },
  { name: 'Next.js', category: 'frontend', icon: '▲' },
  { name: 'Vue.js', category: 'frontend', icon: '💚' },
  { name: 'Tailwind CSS', category: 'frontend', icon: '🎨' },
  { name: 'HTML5 & CSS3', category: 'frontend', icon: '🌐' },
  { name: 'Redux / Zustand', category: 'frontend', icon: '🔄' },
  { name: 'Node.js', category: 'backend', icon: '🟢' },
  { name: 'Express.js', category: 'backend', icon: '🚂' },
  { name: 'NestJS', category: 'backend', icon: '🦁' },
  { name: 'Go (Golang)', category: 'backend', icon: '🐹' },
  { name: 'Python', category: 'backend', icon: '🐍' },
  { name: 'FastAPI', category: 'backend', icon: '⚡' },
  { name: 'RESTful APIs', category: 'backend', icon: '🔌' },
  { name: 'GraphQL', category: 'backend', icon: '🕸️' },
  { name: 'gRPC', category: 'backend', icon: '📡' },
  { name: 'PostgreSQL', category: 'database', icon: '🐘' },
  { name: 'MongoDB', category: 'database', icon: '🍃' },
  { name: 'MySQL', category: 'database', icon: '🐬' },
  { name: 'Redis', category: 'database', icon: '🔴' },
  { name: 'SQLite', category: 'database', icon: '💾' },
  { name: 'Firebase', category: 'database', icon: '🔥' },
  { name: 'Prisma ORM', category: 'database', icon: '💎' },
  { name: 'Docker', category: 'devops', icon: '🐳' },
  { name: 'Kubernetes', category: 'devops', icon: '☸️' },
  { name: 'CI/CD Pipelines', category: 'devops', icon: '🚀' },
  { name: 'GitHub Actions', category: 'devops', icon: '⚙️' },
  { name: 'AWS', category: 'devops', icon: '☁️' },
  { name: 'Google Cloud (GCP)', category: 'devops', icon: '⛅' },
  { name: 'Terraform', category: 'devops', icon: '🏗️' },
  { name: 'Linux', category: 'devops', icon: '🐧' },
  { name: 'Clean Architecture', category: 'architecture', icon: '🏛️' },
  { name: 'Microservices', category: 'architecture', icon: '🔗' },
  { name: 'System Design', category: 'architecture', icon: '📐' },
  { name: 'Test-Driven Development (TDD)', category: 'architecture', icon: '🧪' },
  { name: 'Agile / Scrum', category: 'architecture', icon: '📋' },
  { name: 'Design Patterns (OOP)', category: 'architecture', icon: '🧩' }
];

const EXPERIENCE_PRESETS = [
  {
    id: 'flutter_engineer',
    category: 'Mobile',
    badge: 'Mobile Specialist',
    title: 'Senior Flutter & Mobile Engineer',
    defaultCompany: 'Mobile Tech Scaleup',
    responsibilities: [
      'Merancang dan mengembangkan arsitektur aplikasi mobile cross-platform Android & iOS dengan Flutter dan Dart.',
      'Menerapkan Clean Architecture dan state management BLoC untuk pemisahan logika bisnis yang modular dan mudah diuji.',
      'Mengintegrasikan RESTful APIs, otentikasi aman JWT/OAuth, dan real-time push notification dengan Firebase.',
      'Mengoptimalkan performa rendering widget, konsumsi memori, dan asset caching di berbagai perangkat mobile.'
    ],
    achievements_metrics: [
      'Mempertahankan crash-free user rate di atas 99.8% untuk 150.000+ pengguna aktif bulanan.',
      'Mempercepat waktu startup aplikasi (cold launch time) hingga 38% melalui optimasi resource bundle.',
      'Memangkas siklus rilis fitur dari 3 minggu menjadi 1 minggu dengan otomasi CI/CD Fastlane dan GitHub Actions.'
    ],
    tech_stack: ['Flutter', 'Dart', 'Android (Kotlin)', 'iOS (Swift)', 'BLoC Pattern', 'RESTful APIs', 'Firebase', 'SQLite', 'Git']
  },
  {
    id: 'frontend_developer',
    category: 'Frontend',
    badge: 'Web & UI',
    title: 'Senior Frontend Developer',
    defaultCompany: 'Digital Product Studio',
    responsibilities: [
      'Membangun aplikasi web single-page (SPA) interaktif dan responsif menggunakan React.js, Next.js, dan TypeScript.',
      'Merancang dan memelihara design system komponen UI berbasis Tailwind CSS yang konsisten dan aksesibel (WCAG AA).',
      'Mengintegrasikan REST dan GraphQL APIs dengan manajemen state global yang efisien dan caching data sisi klien.',
      'Mengaudit dan mengoptimalkan performa web browser pada metrik Core Web Vitals (LCP, INP, CLS).'
    ],
    achievements_metrics: [
      'Meningkatkan skor audit Google Lighthouse performa web dari 62 menjadi 96+.',
      'Mengurangi initial bundle size JavaScript sebesar 42% melalui route code splitting dan tree-shaking.',
      'Meningkatkan konversi alur registrasi pengguna sebesar 24% berkat perbaikan responsivitas interaksi UI.'
    ],
    tech_stack: ['TypeScript', 'JavaScript', 'React.js', 'Next.js', 'Tailwind CSS', 'Redux / Zustand', 'HTML5 & CSS3', 'Jest']
  },
  {
    id: 'backend_developer',
    category: 'Backend',
    badge: 'Systems & API',
    title: 'Senior Backend Engineer',
    defaultCompany: 'Cloud & FinTech Services',
    responsibilities: [
      'Merancang dan membangun microservices terdistribusi yang tangguh menggunakan Node.js (Express/NestJS) dan Go.',
      'Mendesain skema database relasional PostgreSQL yang teroptimasi, indexing query, dan caching dengan Redis.',
      'Mengimplementasikan API gateway, otentikasi JWT/OAuth2 terpusat, rate limiting, dan audit logging keamanan.',
      'Menulis unit test, integration test, dan dokumentasi kontrak OpenAPI/Swagger secara komprehensif.'
    ],
    achievements_metrics: [
      'Mengurangi latency respon p99 API dari 320ms menjadi 85ms pada traffic puncak 12.000 RPS.',
      'Mencapai ketersediaan layanan backend (uptime SLA) sebesar 99.98% tanpa downtime terencana.',
      'Menghemat biaya infrastruktur database server sebesar 30% berkat strategi query indexing dan caching.'
    ],
    tech_stack: ['Node.js', 'Express.js', 'NestJS', 'Go (Golang)', 'PostgreSQL', 'Redis', 'Docker', 'RESTful APIs', 'Microservices']
  },
  {
    id: 'fullstack_developer',
    category: 'Fullstack',
    badge: 'End-to-End',
    title: 'Senior Fullstack Engineer',
    defaultCompany: 'SaaS Product Accelerator',
    responsibilities: [
      'Mengembangkan fitur aplikasi web end-to-end mulai dari perancangan antarmuka frontend hingga arsitektur backend.',
      'Membangun REST APIs dan integrasi database relasional serta sistem background worker untuk pemrosesan asinkron.',
      'Menetapkan standar rekayasa perangkat lunak, code review berkualitas, dan pengujian otomatis end-to-end.',
      'Menerapkan deployment aman dengan Docker container dan monitoring observability sistem.'
    ],
    achievements_metrics: [
      'Mengirimkan 4 fitur produk utama tepat waktu dengan cakupan pengujian unit test di atas 85%.',
      'Mempercepat onboarding engineer baru sebesar 50% melalui penyediaan dokumentasi sistem dan arsitektur modular.',
      'Mencegah regresi bug produksi dengan pipeline CI/CD otomatis sebelum setiap rilis production.'
    ],
    tech_stack: ['TypeScript', 'React.js', 'Node.js', 'PostgreSQL', 'Docker', 'Tailwind CSS', 'RESTful APIs', 'CI/CD Pipelines']
  },
  {
    id: 'devops_cloud_engineer',
    category: 'DevOps',
    badge: 'Platform & Infra',
    title: 'DevOps & Cloud Platform Engineer',
    defaultCompany: 'Global Cloud Infrastructure',
    responsibilities: [
      'Membangun dan mengotomatisasi pipeline CI/CD terpadu dengan GitHub Actions untuk build, test, dan deploy otomatis.',
      'Mengelola kluster kontainerisasi Kubernetes di GCP/AWS dan mengotomatisasi provisioning dengan Terraform (IaC).',
      'Menerapkan sistem observability, tracing, dan log aggregation terpusat menggunakan Prometheus, Grafana, dan ELK.',
      'Memperkuat postur keamanan cloud, rotasi secret/kunci enkripsi, dan kepatuhan akses infrastruktur.'
    ],
    achievements_metrics: [
      'Memangkas waktu siklus deployment build dari 45 menit menjadi kurang dari 6 menit.',
      'Mencapai zero-downtime deployment untuk 20+ microservices di lingkungan produksi.',
      'Mengurangi pengeluaran komputasi cloud bulanan sebesar 25% melalui right-sizing autoscaling pod Kubernetes.'
    ],
    tech_stack: ['Docker', 'Kubernetes', 'Terraform', 'GitHub Actions', 'AWS', 'Google Cloud (GCP)', 'Linux', 'CI/CD Pipelines']
  },
  {
    id: 'qa_automation_engineer',
    category: 'QA',
    badge: 'Quality Assurance',
    title: 'QA Automation Engineer',
    defaultCompany: 'FinTech & E-Commerce Platform',
    responsibilities: [
      'Merancang dan memelihara framework pengujian otomatis end-to-end untuk platform web dan mobile.',
      'Mengintegrasikan automated test suite ke dalam pipeline CI/CD untuk verifikasi regresi otomatis di setiap pull request.',
      'Melakukan pengujian performa beban (load testing) dan security testing berkala pada antarmuka API.',
      'Bekerja sama erat dengan tim developer untuk menerapkan pendekatan shift-left testing dan TDD.'
    ],
    achievements_metrics: [
      'Memangkas waktu siklus regression testing dari 4 hari kerja menjadi 1.5 jam.',
      'Mengidentifikasi dan mencegah lebih dari 150 bug kritis sebelum mencapai tahap produksi rilis.',
      'Mencapai test coverage automation sebesar 82% untuk skenario user journey utama.'
    ],
    tech_stack: ['TypeScript', 'Playwright', 'Jest', 'Postman', 'Python', 'CI/CD Pipelines', 'GitHub Actions', 'Docker']
  },
  {
    id: 'tech_lead_manager',
    category: 'Leadership',
    badge: 'Leadership & Design',
    title: 'Technical Lead / Engineering Manager',
    defaultCompany: 'Enterprise Technology Division',
    responsibilities: [
      'Memimpin dan memfasilitasi tim beranggotakan 6-10 software engineer dalam metodologi Agile/Scrum.',
      'Mengarahkan keputusan arsitektur sistem, standardisasi kualitas kode, dan mitigasi technical debt.',
      'Melakukan 1-on-1 coaching teknis, penilaian performa, dan program pengembangan kapasitas anggota tim.',
      'Menjembatani komunikasi teknis dengan pemangku kepentingan produk, desain, dan bisnis.'
    ],
    achievements_metrics: [
      'Meningkatkan sprint velocity dan kapasitas delivery tim sebesar 35% tanpa peningkatan defect escape rate.',
      'Mempertahankan tingkat retensi tim engineering sebesar 95% selama 2 tahun berturut-turut.',
      'Berhasil memimpin refaktorisasi arsitektur sistem monolitik menuju layanan modular berkinerja tinggi.'
    ],
    tech_stack: ['System Design', 'Clean Architecture', 'Agile / Scrum', 'Team Mentorship', 'TypeScript', 'Node.js', 'Microservices']
  }
];

function getPresetForLanguage(preset, lang = 'id') {
  if (lang === 'en') {
    const enMap = {
      flutter_engineer: {
        title: 'Senior Flutter & Mobile Engineer',
        company: 'Mobile Tech Scaleup',
        responsibilities: [
          'Architect and build cross-platform Android & iOS applications using Flutter and Dart.',
          'Implement Clean Architecture and BLoC pattern for modular, testable business logic separation.',
          'Integrate RESTful APIs, secure OAuth/JWT authentication, and real-time push notifications with Firebase.',
          'Optimize widget rendering performance, memory footprint, and offline caching on low-end devices.'
        ],
        achievements_metrics: [
          'Maintained 99.8%+ crash-free user rate across 150,000+ monthly active mobile users.',
          'Reduced application cold start launch time by 38% through proactive asset bundle optimization.',
          'Shortened feature release cycle from 3 weeks to 1 week with Fastlane and GitHub Actions CI/CD automation.'
        ]
      },
      frontend_developer: {
        title: 'Senior Frontend Developer',
        company: 'Digital Product Studio',
        responsibilities: [
          'Build responsive, high-performance web applications using React.js, Next.js, and TypeScript.',
          'Design and maintain accessible, reusable design system components using Tailwind CSS (WCAG AA).',
          'Integrate REST and GraphQL APIs with robust client-side state management and data caching.',
          'Audit and enhance browser performance across Core Web Vitals (LCP, INP, CLS).'
        ],
        achievements_metrics: [
          'Elevated Google Lighthouse web performance score from 62 to 96+.',
          'Reduced initial JavaScript bundle payload by 42% via route-based code splitting and tree-shaking.',
          'Boosted user checkout conversion rate by 24% through improved UI responsiveness.'
        ]
      },
      backend_developer: {
        title: 'Senior Backend Engineer',
        company: 'Cloud & FinTech Services',
        responsibilities: [
          'Design and implement resilient distributed microservices using Node.js (Express/NestJS) and Go.',
          'Design optimized PostgreSQL relational database schemas, query indexing, and Redis caching layers.',
          'Implement API gateways, centralized JWT/OAuth2 authentication, rate limiting, and security audit logs.',
          'Author unit tests, integration tests, and comprehensive OpenAPI/Swagger documentation.'
        ],
        achievements_metrics: [
          'Decreased p99 API response latency from 320ms to 85ms under peak 12,000 RPS traffic.',
          'Achieved 99.98% backend service availability SLA with zero unplanned maintenance downtime.',
          'Cut database infrastructure costs by 30% through index optimization and Redis caching.'
        ]
      },
      fullstack_developer: {
        title: 'Senior Fullstack Engineer',
        company: 'SaaS Product Accelerator',
        responsibilities: [
          'Develop end-to-end web features from responsive frontend UI to backend APIs and relational databases.',
          'Build RESTful APIs and asynchronous background processing worker jobs.',
          'Enforce software engineering best practices, constructive code reviews, and automated test coverage.',
          'Deploy containerized services using Docker and configure system observability.'
        ],
        achievements_metrics: [
          'Delivered 4 core product features on schedule with 85%+ automated unit test coverage.',
          'Halved new engineer onboarding time by authoring modular boilerplates and system documentation.',
          'Prevented production bugs with automated CI/CD validation before every deployment.'
        ]
      },
      devops_cloud_engineer: {
        title: 'DevOps & Cloud Platform Engineer',
        company: 'Global Cloud Infrastructure',
        responsibilities: [
          'Build and automate unified CI/CD pipelines with GitHub Actions for automated build, test, and release.',
          'Manage Kubernetes container clusters across GCP/AWS and automate provisioning with Terraform (IaC).',
          'Implement centralized observability, distributed tracing, and alerting using Prometheus and Grafana.',
          'Harden cloud security posture, automate secret rotation, and maintain least-privilege access policies.'
        ],
        achievements_metrics: [
          'Cut deployment build cycle times from 45 minutes to under 6 minutes.',
          'Maintained zero-downtime rolling deployments across 20+ production microservices.',
          'Reduced monthly cloud infrastructure expenditure by 25% via Kubernetes pod autoscaling tuning.'
        ]
      },
      qa_automation_engineer: {
        title: 'QA Automation Engineer',
        company: 'FinTech & E-Commerce Platform',
        responsibilities: [
          'Architect and maintain end-to-end automated test suites for web, mobile, and API platforms.',
          'Integrate automated tests into CI/CD pipelines to prevent regressions on every pull request.',
          'Conduct periodic API load testing, stress testing, and vulnerability regression audits.',
          'Collaborate with developers to champion shift-left testing and test-driven development (TDD).'
        ],
        achievements_metrics: [
          'Shortened regression testing cycles from 4 days to 1.5 hours.',
          'Caught and resolved over 150 critical defects prior to production releases.',
          'Achieved 82% end-to-end automation test coverage across core user journeys.'
        ]
      },
      tech_lead_manager: {
        title: 'Technical Lead / Engineering Manager',
        company: 'Enterprise Technology Division',
        responsibilities: [
          'Lead and mentor an engineering team of 6-10 developers under Agile/Scrum methodology.',
          'Drive architectural decisions, code quality standards, and technical debt reduction strategies.',
          'Conduct 1-on-1 career coaching, performance reviews, and technical roadmap planning.',
          'Bridge communication between engineering, product, design, and executive stakeholders.'
        ],
        achievements_metrics: [
          'Increased team sprint delivery velocity by 35% without elevating defect escape rates.',
          'Maintained 95% engineering team retention rate over two consecutive years.',
          'Successfully led architecture modernization from monolithic code into modular services.'
        ]
      }
    };
    const translated = enMap[preset.id];
    if (translated) {
      return {
        ...preset,
        title: translated.title,
        defaultCompany: translated.company,
        responsibilities: translated.responsibilities,
        achievements_metrics: translated.achievements_metrics
      };
    }
  }
  return preset;
}


function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseSkillsFromInput() {
  const raw = document.getElementById('editSkillsInput')?.value || '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function updateSkillsChipsUI() {
  const container = document.getElementById('skillsChipsContainer');
  const badge = document.getElementById('skillsCountBadge');
  if (!container) return;

  const currentSkills = parseSkillsFromInput();
  if (badge) {
    badge.textContent = `${currentSkills.length} Skills`;
  }

  const query = (state.skillsSearch || '').toLowerCase();
  const cat = state.skillsCategory || 'all';

  const filtered = SKILL_TAXONOMY.filter((item) => {
    const matchesCat = cat === 'all' || item.category === cat;
    const matchesSearch = !query || item.name.toLowerCase().includes(query);
    return matchesCat && matchesSearch;
  });

  if (filtered.length === 0) {
    if (query) {
      container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 0.25rem;">
          <span style="font-size: 0.8rem; color: var(--text-muted);">Skill tidak ditemukan di kategori ini.</span>
          <button type="button" id="addCustomSkillChip" class="skill-option-chip" style="border-style: dashed;">
            <span class="chip-icon">+</span> Tambahkan "${escapeHtml(state.skillsSearch)}"
          </button>
        </div>
      `;
      const addBtn = document.getElementById('addCustomSkillChip');
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          toggleSkill(state.skillsSearch);
          const filterInput = document.getElementById('skillSearchFilter');
          if (filterInput) filterInput.value = '';
          state.skillsSearch = '';
          updateSkillsChipsUI();
        });
      }
    } else {
      container.innerHTML = '<span style="font-size: 0.8rem; color: var(--text-muted); padding: 0.5rem;">Tidak ada skill dalam kategori ini.</span>';
    }
    return;
  }

  container.innerHTML = filtered
    .map((item) => {
      const isSelected = currentSkills.some((s) => s.toLowerCase() === item.name.toLowerCase());
      return `
        <button type="button" class="skill-option-chip ${isSelected ? 'selected' : ''}" data-skill="${escapeHtml(item.name)}">
          <span class="chip-icon">${isSelected ? '✓' : item.icon}</span>
          <span>${escapeHtml(item.name)}</span>
        </button>
      `;
    })
    .join('');

  container.querySelectorAll('.skill-option-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      const skillName = btn.getAttribute('data-skill');
      if (skillName) {
        toggleSkill(skillName);
      }
    });
  });
}

function toggleSkill(skillName) {
  const currentSkills = parseSkillsFromInput();
  const existingIndex = currentSkills.findIndex((s) => s.toLowerCase() === skillName.toLowerCase());
  let updated;
  if (existingIndex >= 0) {
    updated = currentSkills.filter((_, idx) => idx !== existingIndex);
  } else {
    updated = [...currentSkills, skillName];
  }
  const input = document.getElementById('editSkillsInput');
  if (input) {
    input.value = updated.join(', ');
  }
  updateSkillsChipsUI();
  renderLivePreview();
}


function initTheme() {
  document.body.setAttribute('data-theme', state.theme);
  const icon = document.getElementById('themeIcon');
  if (icon) {
    icon.textContent = state.theme === 'dark' ? '☀️' : '🌙';
  }
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', state.theme);
  initTheme();
}

function showNotification(message, type = 'info') {
  const banner = document.getElementById('notificationBanner');
  const msgEl = document.getElementById('notificationMessage');
  if (!banner || !msgEl) return;

  banner.className = `notification-banner ${type}`;
  msgEl.textContent = message;
  banner.classList.remove('hidden');

  setTimeout(() => {
    banner.classList.add('hidden');
  }, 5000);
}

function hideNotification() {
  const banner = document.getElementById('notificationBanner');
  if (banner) banner.classList.add('hidden');
}

function switchTab(tabId) {
  state.currentTab = tabId;
  document.querySelectorAll('.nav-tab').forEach((t) => {
    t.classList.toggle('active', t.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.view-panel').forEach((p) => {
    p.classList.toggle('active', p.id === tabId);
  });

  if (tabId === 'tab-audit' && !state.audit) {
    loadAudit();
  } else if (tabId === 'tab-variations' && state.variations.length === 0) {
    loadVariations();
  } else if (tabId === 'tab-automation') {
    loadAutomation();
  } else if (tabId === 'tab-logs') {
    loadLogs();
  } else if (tabId === 'tab-security') {
    loadCredentialsSettings();
  }
}

async function loadCredentialsSettings() {
  try {
    const creds = await api.settings.getCredentials();
    const clientIdInput = document.getElementById('settingsClientId');
    const secretHint = document.getElementById('secretStatusHint');
    if (clientIdInput && creds.clientId) {
      clientIdInput.value = creds.clientId;
    }
    if (secretHint) {
      secretHint.textContent = creds.hasClientSecret ? 'Status: Client Secret tersimpan aman di server' : 'Status: Belum ada Client Secret tersimpan';
    }
  } catch (err) {
    console.error('Failed to load credentials settings', err);
  }
}

async function saveCredentialsSettings() {
  const clientId = document.getElementById('settingsClientId')?.value || '';
  const clientSecret = document.getElementById('settingsClientSecret')?.value || '';
  if (!clientId.trim()) {
    showNotification('LinkedIn Client ID wajib diisi.', 'error');
    return;
  }
  try {
    await api.settings.saveCredentials(clientId, clientSecret);
    showNotification('Kredensial LinkedIn berhasil disimpan ke .env dan aktif.', 'success');
    await loadAccountStatus();
    await loadCredentialsSettings();
    const secretInput = document.getElementById('settingsClientSecret');
    if (secretInput) secretInput.value = '';
  } catch (err) {
    showNotification(`Gagal menyimpan kredensial: ${err.message}`, 'error');
  }
}

async function loadAccountStatus() {
  try {
    const status = await api.auth.getStatus();
    state.account = status;
    renderAccountStatus();
    renderLivePreview();
  } catch (err) {
    showNotification(`Failed to load account status: ${err.message}`, 'error');
  }
}

function renderAccountStatus() {
  const pill = document.getElementById('accountPill');
  const pillText = document.getElementById('accountStatusText');
  const connBox = document.getElementById('accountConnectedBox');
  const disconnBox = document.getElementById('accountDisconnectedBox');
  const overviewAcc = document.getElementById('overviewAccountName');
  const overviewScope = document.getElementById('overviewAccountScope');
  const modeBox = document.getElementById('integrationModeBox');
  const discModeBox = document.getElementById('disconnectedIntegrationModeBox');

  if (state.account && state.account.connected) {
    if (pill) {
      pill.className = 'account-pill connected';
      pillText.textContent = state.account.name || 'Connected';
    }
    if (connBox) connBox.classList.remove('hidden');
    if (disconnBox) disconnBox.classList.add('hidden');

    const nameEl = document.getElementById('connectedUserName');
    const emailEl = document.getElementById('connectedUserEmail');
    const avatarEl = document.getElementById('userAvatar');
    const expiryEl = document.getElementById('connectedUserExpiry');
    const scopesRow = document.getElementById('connectedScopesList');

    if (nameEl) nameEl.textContent = state.account.name;
    if (emailEl) emailEl.textContent = state.account.email;
    if (avatarEl) {
      const picture = state.account.pictureUrl || state.account.picture_url;
      const initial = (state.account.name || 'U').charAt(0).toUpperCase();
      if (picture) {
        avatarEl.innerHTML = `<img src="${escapeHtml(picture)}" alt="${escapeHtml(state.account.name || 'User')}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" onerror="this.onerror=null; this.parentElement.textContent='${escapeHtml(initial)}';">`;
      } else {
        avatarEl.textContent = initial;
      }
    }
    if (expiryEl) {
      const expDate = new Date(state.account.expiresAt).toLocaleDateString();
      expiryEl.textContent = `Token valid until: ${expDate} (${state.account.isExpired ? 'Expired' : 'Active'})`;
    }
    if (scopesRow) {
      scopesRow.innerHTML = (state.account.scope || [])
        .map((s) => `<span class="scope-tag">${s}</span>`)
        .join('');
    }

    if (modeBox) {
      const mode = state.account.effectiveMode || 'rest_api';
      const isMcp = mode === 'mcp';
      modeBox.innerHTML = `
        <div class="integration-mode-header">
          <strong>Protocol: ${isMcp ? 'LinkedIn Model Context Protocol (MCP)' : 'LinkedIn REST API v2'}</strong>
          <span class="badge ${isMcp ? 'badge-success' : 'badge-primary'}">${isMcp ? 'MCP Active' : 'Official REST Fallback'}</span>
        </div>
        <p style="margin: 0.25rem 0; font-size: 0.8rem; color: var(--text-secondary);">
          ${state.account.mcp?.officialAvailabilityNotice || 'LinkedIn Developer Portal Develop with MCP preview requires portal login. App operates on official LinkedIn REST API.'}
        </p>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
          Permissions: Basic Profile (${state.account.permissions?.readProfileBasic ? 'Yes' : 'No'}), Email (${state.account.permissions?.readEmail ? 'Yes' : 'No'}), Social Share (${state.account.permissions?.writeMemberSocial ? 'Yes' : 'No'})
        </div>
      `;
    }

    if (overviewAcc) overviewAcc.textContent = state.account.name;
    if (overviewScope) overviewScope.textContent = `Scopes: ${(state.account.scope || []).join(', ')}`;
  } else {
    if (pill) {
      pill.className = 'account-pill disconnected';
      pillText.textContent = 'LinkedIn Disconnected';
    }
    if (connBox) connBox.classList.add('hidden');
    if (disconnBox) disconnBox.classList.remove('hidden');
    if (overviewAcc) overviewAcc.textContent = 'Not Connected';
    if (overviewScope) overviewScope.textContent = 'Permissions: None';

    if (discModeBox) {
      discModeBox.innerHTML = `
        <div class="integration-mode-header">
          <strong>Integration Mode: Official REST API (Default) / MCP Protocol</strong>
          <span class="badge badge-secondary">Ready to Authorize</span>
        </div>
        <p style="margin: 0.25rem 0; font-size: 0.8rem; color: var(--text-secondary);">
          Authentication uses LinkedIn 3-Legged OAuth 2.0 with PKCE and state verification. Developer portal Develop with MCP protocol is supported when MCP server credentials are provided.
        </p>
      `;
    }
  }
}

async function loadProfile() {
  try {
    const res = await api.profile.get();
    state.profile = res.profile;
    renderProfileToForm();
    renderLivePreview();
    updateOverviewCards();
    loadRevisions();
  } catch (err) {
    showNotification(`Failed to load profile: ${err.message}`, 'error');
  }
}

function updateOverviewCards() {
  if (!state.profile) return;
  const compVal = document.getElementById('overviewCompleteness');
  const compBar = document.getElementById('overviewProgressBar');
  const compBadge = document.getElementById('completenessBadge');
  const targetRole = document.getElementById('overviewTargetRole');
  const langEl = document.getElementById('overviewLanguage');

  const score = state.profile.completenessScore || 0;
  if (compVal) compVal.textContent = `${score}%`;
  if (compBar) compBar.style.width = `${score}%`;

  if (compBadge) {
    if (score >= 80) {
      compBadge.className = 'badge badge-success';
      compBadge.textContent = 'Optimized';
    } else if (score >= 50) {
      compBadge.className = 'badge badge-warning';
      compBadge.textContent = 'Moderate';
    } else {
      compBadge.className = 'badge badge-danger';
      compBadge.textContent = 'Incomplete';
    }
  }

  if (targetRole) targetRole.textContent = state.profile.targetRole || 'Not specified';
  if (langEl) langEl.textContent = `Language: ${state.profile.language === 'en' ? 'English (en)' : 'Indonesian (id)'}`;
}

function renderProfileToForm() {
  const p = state.profile;
  if (!p) return;

  const targetRoleInput = document.getElementById('editTargetRole');
  const targetIndInput = document.getElementById('editTargetIndustry');
  const langInput = document.getElementById('editLanguage');
  const headlineInput = document.getElementById('editHeadline');
  const aboutInput = document.getElementById('editAbout');
  const skillsInput = document.getElementById('editSkillsInput');
  const emailInput = document.getElementById('editContactEmail');
  const portInput = document.getElementById('editPortfolioUrl');

  if (targetRoleInput) targetRoleInput.value = p.targetRole || '';
  if (targetIndInput) targetIndInput.value = p.targetIndustry || '';
  if (langInput) langInput.value = p.language || 'id';
  if (headlineInput) headlineInput.value = p.headline || '';
  if (aboutInput) aboutInput.value = p.about || '';
  if (skillsInput) skillsInput.value = (p.skills || []).join(', ');
  if (emailInput) emailInput.value = p.contactInfo?.email || '';
  if (portInput) portInput.value = p.contactInfo?.portfolio_url || '';

  updateSkillsChipsUI();
  updateCharCounts();
  renderExperienceList();
}

function updateCharCounts() {
  const headline = document.getElementById('editHeadline');
  const about = document.getElementById('editAbout');
  const headlineCount = document.getElementById('headlineCharCount');
  const aboutCount = document.getElementById('aboutCharCount');

  if (headline && headlineCount) headlineCount.textContent = headline.value.length;
  if (about && aboutCount) aboutCount.textContent = about.value.length;
}

function renderLivePreview() {
  const p = state.profile;
  const headlineInput = document.getElementById('editHeadline');
  const aboutInput = document.getElementById('editAbout');
  const skillsInput = document.getElementById('editSkillsInput');

  const headlineVal = headlineInput && headlineInput.value.trim().length > 0
    ? headlineInput.value.trim()
    : p?.headline || '';
  const aboutVal = aboutInput && aboutInput.value.trim().length > 0
    ? aboutInput.value.trim()
    : p?.about || '';
  const skillsVal = skillsInput && skillsInput.value.trim().length > 0
    ? skillsInput.value.split(',').map((s) => s.trim()).filter((s) => s.length > 0)
    : p?.skills || [];

  const prevHeadline = document.getElementById('previewHeadline');
  const prevAbout = document.getElementById('previewAbout');
  const prevSkills = document.getElementById('previewSkills');
  const prevExp = document.getElementById('previewExperience');
  const prevName = document.getElementById('previewName');
  const prevContact = document.getElementById('previewContact');
  const mockupAvatar = document.getElementById('mockupAvatar');

  const nameVal = (state.account?.name || state.profile?.name || 'Your Professional Name').trim();
  if (prevName) {
    prevName.textContent = nameVal;
  }

  if (mockupAvatar) {
    const picture = state.account?.pictureUrl || state.account?.picture_url;
    const initial = (nameVal.charAt(0) || 'U').toUpperCase();
    if (picture) {
      mockupAvatar.innerHTML = `<img src="${escapeHtml(picture)}" alt="${escapeHtml(nameVal)}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" onerror="this.onerror=null; this.parentElement.textContent='${escapeHtml(initial)}';">`;
    } else {
      mockupAvatar.textContent = initial;
    }
  }

  if (prevContact) {
    const loc = (p?.contactInfo?.location || p?.contact_info?.location || 'Indonesia').trim();
    const verifiedEmail = (state.account?.email || document.getElementById('editContactEmail')?.value || p?.contactInfo?.email || p?.contact_info?.email || '').trim();
    if (loc && verifiedEmail) {
      prevContact.textContent = `${loc} • ${verifiedEmail}`;
    } else if (loc) {
      prevContact.textContent = loc;
    } else if (verifiedEmail) {
      prevContact.textContent = verifiedEmail;
    } else {
      prevContact.textContent = 'Indonesia • Contact Info';
    }
  }

  if (prevHeadline) {
    prevHeadline.textContent = headlineVal || 'Headline will appear here';
  }

  if (prevAbout) {
    prevAbout.textContent = aboutVal || 'About summary will appear here';
  }

  if (prevSkills) {
    if (skillsVal.length > 0) {
      prevSkills.innerHTML = skillsVal
        .map((s) => `<span class="mockup-skill-chip">${escapeHtml(s)}</span>`)
        .join('');
    } else {
      prevSkills.textContent = 'No skills added yet';
    }
  }

  if (prevExp) {
    const expEditors = document.querySelectorAll('.experience-item-editor');
    if (expEditors.length > 0) {
      syncExperienceInputsToState();
    }
    const expList = (state.profile?.experience || []).filter(
      (e) => (e.title || '').trim().length > 0 || (e.company || '').trim().length > 0
    );

    if (expList.length > 0) {
      prevExp.innerHTML = expList
        .map((e) => {
          const respSnippets = (e.responsibilities || []).slice(0, 2);
          const metricSnippets = (e.achievements_metrics || []).slice(0, 2);
          const techChips = (e.tech_stack || []).slice(0, 4);
          const dateRange = `${escapeHtml(e.start_date || '2023')} - ${e.is_current ? 'Present' : escapeHtml(e.end_date || 'Present')}`;
          return `
          <div style="margin-bottom: 0.85rem; padding-bottom: 0.65rem; border-bottom: 1px dashed var(--border-color);">
            <div style="font-weight: 600; color: var(--text-primary);">${escapeHtml(e.title || 'Role')}</div>
            <div style="font-size: 0.85rem; color: var(--accent-color); font-weight: 500;">${escapeHtml(e.company || 'Company')}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.35rem;">${dateRange}</div>
            ${metricSnippets.length > 0 ? `<ul style="margin: 0.25rem 0 0.35rem 1.1rem; padding: 0; font-size: 0.8rem; color: var(--text-secondary);">${metricSnippets.map((m) => `<li>${escapeHtml(m)}</li>`).join('')}</ul>` : ''}
            ${respSnippets.length > 0 && metricSnippets.length === 0 ? `<ul style="margin: 0.25rem 0 0.35rem 1.1rem; padding: 0; font-size: 0.8rem; color: var(--text-secondary);">${respSnippets.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}</ul>` : ''}
            ${techChips.length > 0 ? `<div style="display: flex; gap: 0.25rem; flex-wrap: wrap; margin-top: 0.35rem;">${techChips.map((t) => `<span class="mockup-skill-chip" style="font-size: 0.7rem; padding: 0.15rem 0.45rem;">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
          </div>
        `;
        })
        .join('');
    } else {
      prevExp.textContent = 'No experience added yet';
    }
  }
}

function syncExperienceInputsToState() {
  if (!state.profile) state.profile = {};
  const expItems = [];
  document.querySelectorAll('.experience-item-editor').forEach((el, idx) => {
    const prevItem = (state.profile.experience && state.profile.experience[idx]) || {};
    const title = el.querySelector('.exp-title')?.value.trim() || '';
    const company = el.querySelector('.exp-company')?.value.trim() || '';
    const resp = (el.querySelector('.exp-resp')?.value || '')
      .split('\n')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);
    const metrics = (el.querySelector('.exp-metrics')?.value || '')
      .split('\n')
      .map((m) => m.trim())
      .filter((m) => m.length > 0);
    const tech = (el.querySelector('.exp-tech')?.value || '')
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    expItems.push({
      ...prevItem,
      title,
      company,
      responsibilities: resp,
      achievements_metrics: metrics,
      tech_stack: tech,
      is_current: prevItem.is_current ?? true,
      start_date: prevItem.start_date || '2023',
      end_date: prevItem.end_date || 'Present'
    });
  });
  state.profile.experience = expItems;
}

function renderExperienceList() {
  const container = document.getElementById('experienceListContainer');
  if (!container) return;

  const exp = state.profile?.experience || [];
  if (exp.length === 0) {
    container.innerHTML = '<div class="empty-state">No experience entries yet. Click ✨ Auto-Generate Role or 📋 Pilih Template above.</div>';
    return;
  }

  container.innerHTML = exp
    .map(
      (item, idx) => `
      <div class="experience-item-editor" data-index="${idx}">
        <div class="exp-header-row">
          <strong class="exp-header-title">${escapeHtml(item.title || 'New Role')} at ${escapeHtml(item.company || 'Company')}</strong>
          <button type="button" class="btn btn-small btn-outline-danger remove-exp-btn" data-index="${idx}">Remove</button>
        </div>
        <div class="form-group">
          <label>Job Title</label>
          <input type="text" class="form-control exp-title" value="${escapeHtml(item.title || '')}">
        </div>
        <div class="form-group">
          <label>Company</label>
          <input type="text" class="form-control exp-company" value="${escapeHtml(item.company || '')}">
        </div>
        <div class="form-group">
          <label>Responsibilities (one per line)</label>
          <textarea class="form-control exp-resp" rows="3">${escapeHtml((item.responsibilities || []).join('\n'))}</textarea>
        </div>
        <div class="form-group">
          <label>Key Achievements & Metrics (one per line)</label>
          <textarea class="form-control exp-metrics" rows="3">${escapeHtml((item.achievements_metrics || []).join('\n'))}</textarea>
        </div>
        <div class="form-group">
          <label>Technology Stack (comma separated)</label>
          <input type="text" class="form-control exp-tech" value="${escapeHtml((item.tech_stack || []).join(', '))}">
        </div>
      </div>
    `
    )
    .join('');

  container.querySelectorAll('.experience-item-editor').forEach((editorEl) => {
    const headerTitleEl = editorEl.querySelector('.exp-header-title');
    const titleInput = editorEl.querySelector('.exp-title');
    const companyInput = editorEl.querySelector('.exp-company');

    editorEl.querySelectorAll('input, textarea').forEach((inputEl) => {
      inputEl.addEventListener('input', () => {
        if (headerTitleEl && (inputEl === titleInput || inputEl === companyInput)) {
          const t = titleInput?.value.trim() || 'New Role';
          const c = companyInput?.value.trim() || 'Company';
          headerTitleEl.textContent = `${t} at ${c}`;
        }
        syncExperienceInputsToState();
        renderLivePreview();
      });
    });
  });

  container.querySelectorAll('.remove-exp-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
      syncExperienceInputsToState();
      state.profile.experience.splice(idx, 1);
      renderExperienceList();
      renderLivePreview();
    });
  });
}

function openRoleTemplatesModal() {
  const modal = document.getElementById('roleTemplatesModal');
  if (!modal) return;
  renderRolePresetsGrid();
  modal.classList.remove('hidden');
}

function closeRoleTemplatesModal() {
  const modal = document.getElementById('roleTemplatesModal');
  if (!modal) return;
  modal.classList.add('hidden');
}

function renderRolePresetsGrid() {
  const grid = document.getElementById('rolePresetsGrid');
  if (!grid) return;
  const lang = document.getElementById('editLanguage')?.value || state.profile?.language || 'id';

  grid.innerHTML = EXPERIENCE_PRESETS.map((preset) => {
    const localized = getPresetForLanguage(preset, lang);
    const respHighlights = localized.responsibilities.slice(0, 2);
    const metricHighlights = localized.achievements_metrics.slice(0, 2);
    const techChips = localized.tech_stack.slice(0, 5);

    return `
      <div class="role-preset-card">
        <div>
          <div class="role-preset-title-row">
            <h4 class="role-preset-title">${escapeHtml(localized.title)}</h4>
            <span class="role-preset-badge">${escapeHtml(localized.badge || localized.category)}</span>
          </div>
          <div class="role-preset-company">${escapeHtml(localized.defaultCompany)}</div>
        </div>

        <div class="role-preset-highlights">
          <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">
            ${lang === 'en' ? 'Core Responsibilities:' : 'Tanggung Jawab:'}
          </div>
          <ul style="margin: 0 0 0.5rem 1.1rem; padding: 0;">
            ${respHighlights.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}
          </ul>

          <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">
            ${lang === 'en' ? 'Key Metrics & Outcomes:' : 'Pencapaian & Metrik:'}
          </div>
          <ul style="margin: 0 0 0.35rem 1.1rem; padding: 0;">
            ${metricHighlights.map((m) => `<li>${escapeHtml(m)}</li>`).join('')}
          </ul>
        </div>

        <div class="role-preset-tech">
          ${techChips.map((t) => `<span class="role-preset-tech-tag">${escapeHtml(t)}</span>`).join('')}
        </div>

        <div style="margin-top: 0.5rem;">
          <button type="button" class="btn btn-small btn-primary apply-preset-btn" data-preset-id="${preset.id}" style="width: 100%;">
            ${lang === 'en' ? '+ Add Role to Profile' : '+ Pilih Template Ini'}
          </button>
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.apply-preset-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const presetId = e.currentTarget.getAttribute('data-preset-id');
      applyExperiencePreset(presetId);
      closeRoleTemplatesModal();
    });
  });
}

function applyExperiencePreset(presetId) {
  const preset = EXPERIENCE_PRESETS.find((p) => p.id === presetId);
  if (!preset) return;

  syncExperienceInputsToState();
  const lang = document.getElementById('editLanguage')?.value || state.profile?.language || 'id';
  const localized = getPresetForLanguage(preset, lang);

  if (!state.profile) state.profile = {};
  if (!Array.isArray(state.profile.experience)) state.profile.experience = [];

  const newRole = {
    title: localized.title,
    company: localized.defaultCompany,
    responsibilities: [...localized.responsibilities],
    achievements_metrics: [...localized.achievements_metrics],
    tech_stack: [...localized.tech_stack],
    start_date: '2023',
    end_date: 'Present',
    is_current: true
  };

  state.profile.experience.push(newRole);
  renderExperienceList();
  renderLivePreview();

  const msg = lang === 'en'
    ? `Added role template "${newRole.title}" to your experience.`
    : `Template role "${newRole.title}" berhasil ditambahkan ke pengalaman kerja.`;
  showNotification(msg, 'success');
}

function autoGenerateExperienceRole() {
  syncExperienceInputsToState();
  const lang = document.getElementById('editLanguage')?.value || state.profile?.language || 'id';
  const targetRoleInput = document.getElementById('editTargetRole')?.value || state.profile?.targetRole || '';
  const headlineInput = document.getElementById('editHeadline')?.value || state.profile?.headline || '';
  const industryInput = document.getElementById('editTargetIndustry')?.value || state.profile?.targetIndustry || '';
  const currentSkills = parseSkillsFromInput();

  const targetRoleLower = targetRoleInput.toLowerCase();
  const headlineLower = headlineInput.toLowerCase();
  const combinedContext = [
    targetRoleInput,
    headlineInput,
    industryInput,
    currentSkills.join(' ')
  ].join(' ').toLowerCase();

  const presetScores = {
    flutter_engineer: 0,
    frontend_developer: 0,
    backend_developer: 0,
    fullstack_developer: 0,
    devops_cloud_engineer: 0,
    qa_automation_engineer: 0,
    tech_lead_manager: 0
  };

  const keywordsMap = {
    flutter_engineer: ['flutter', 'dart', 'mobile', 'android', 'ios', 'bloc', 'cross-platform', 'getx', 'provider', 'kotlin', 'swift'],
    frontend_developer: ['front', 'react', 'next', 'vue', 'angular', 'svelte', 'tailwind', 'ui/ux', 'css', 'html', 'javascript', 'typescript'],
    backend_developer: ['back', 'node', 'express', 'nest', 'golang', 'go', 'python', 'fastapi', 'django', 'sql', 'postgres', 'redis', 'api', 'microservice'],
    fullstack_developer: ['full', 'fullstack', 'full-stack', 'mern', 'mean', 'software engineer', 'web application'],
    devops_cloud_engineer: ['devops', 'cloud', 'sre', 'kubernetes', 'k8s', 'docker', 'terraform', 'aws', 'gcp', 'azure', 'ci/cd', 'infra'],
    qa_automation_engineer: ['qa', 'test', 'automation', 'quality', 'tester', 'playwright', 'cypress', 'selenium', 'sdet', 'jest'],
    tech_lead_manager: ['lead', 'manager', 'head', 'architect', 'principal', 'cto', 'engineering manager', 'tech lead', 'director']
  };

  Object.keys(keywordsMap).forEach((presetId) => {
    const kws = keywordsMap[presetId];
    kws.forEach((kw) => {
      if (targetRoleLower.includes(kw)) presetScores[presetId] += 6;
      if (headlineLower.includes(kw)) presetScores[presetId] += 3;
      if (combinedContext.includes(kw)) presetScores[presetId] += 1;
    });
  });

  let bestPresetId = null;
  let highestScore = 0;
  Object.keys(presetScores).forEach((presetId) => {
    if (presetScores[presetId] > highestScore) {
      highestScore = presetScores[presetId];
      bestPresetId = presetId;
    }
  });

  if (!bestPresetId && currentSkills.length > 0) {
    if (currentSkills.some((s) => /flutter|dart|mobile|android|ios/i.test(s))) {
      bestPresetId = 'flutter_engineer';
    } else if (currentSkills.some((s) => /react|vue|next|angular|tailwind|css|html/i.test(s))) {
      bestPresetId = 'frontend_developer';
    } else if (currentSkills.some((s) => /node|express|nest|sql|postgres|redis|go|python|api/i.test(s))) {
      bestPresetId = 'backend_developer';
    } else if (currentSkills.some((s) => /docker|k8s|kubernetes|aws|gcp|terraform|ci\/cd/i.test(s))) {
      bestPresetId = 'devops_cloud_engineer';
    } else if (currentSkills.some((s) => /qa|test|automation|cypress|playwright|jest/i.test(s))) {
      bestPresetId = 'qa_automation_engineer';
    }
  }

  if (!bestPresetId) {
    bestPresetId = 'fullstack_developer';
  }

  const selectedPreset = EXPERIENCE_PRESETS.find((p) => p.id === bestPresetId) || EXPERIENCE_PRESETS[0];
  const localized = getPresetForLanguage(selectedPreset, lang);

  let finalTitle = localized.title;
  if (targetRoleInput.trim().length > 2) {
    finalTitle = targetRoleInput.trim();
  }

  const mergedTech = Array.from(new Set([
    ...currentSkills.slice(0, 4),
    ...localized.tech_stack
  ]));

  if (!state.profile) state.profile = {};
  if (!Array.isArray(state.profile.experience)) state.profile.experience = [];

  const newRole = {
    title: finalTitle,
    company: localized.defaultCompany,
    responsibilities: [...localized.responsibilities],
    achievements_metrics: [...localized.achievements_metrics],
    tech_stack: mergedTech,
    start_date: '2023',
    end_date: 'Present',
    is_current: true
  };

  state.profile.experience.push(newRole);
  renderExperienceList();
  renderLivePreview();

  const msg = lang === 'en'
    ? `Role auto-generated for "${newRole.title}" based on your profession and skills.`
    : `Role berhasil digenerate otomatis: "${newRole.title}" berdasarkan profesi dan keahlian Anda.`;
  showNotification(msg, 'success');
}

function gatherProfileFromForm() {
  syncExperienceInputsToState();
  const targetRole = document.getElementById('editTargetRole')?.value || '';
  const targetIndustry = document.getElementById('editTargetIndustry')?.value || '';
  const language = document.getElementById('editLanguage')?.value || 'id';
  const headline = document.getElementById('editHeadline')?.value || '';
  const about = document.getElementById('editAbout')?.value || '';
  const skillsRaw = document.getElementById('editSkillsInput')?.value || '';
  const skills = skillsRaw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const contactEmail = document.getElementById('editContactEmail')?.value || '';
  const portfolioUrl = document.getElementById('editPortfolioUrl')?.value || '';

  const validExp = (state.profile?.experience || []).filter(
    (e) => (e.title || '').trim().length > 0 || (e.company || '').trim().length > 0
  );

  return {
    target_role: targetRole,
    target_industry: targetIndustry,
    language,
    headline,
    about,
    skills,
    experience: validExp,
    contact_info: {
      email: contactEmail,
      portfolio_url: portfolioUrl
    }
  };
}

async function saveProfile() {
  try {
    const payload = gatherProfileFromForm();
    const res = await api.profile.update(payload, 'User edited profile');
    state.profile = res.profile;
    updateOverviewCards();
    loadRevisions();
    showNotification('Profile successfully saved and revision snapshot created.', 'success');
  } catch (err) {
    showNotification(`Failed to save profile: ${err.message}`, 'error');
  }
}

async function loadRevisions() {
  try {
    const res = await api.profile.getRevisions();
    state.revisions = res.revisions || [];
    renderRevisions();
  } catch (err) {
    console.error('Failed to load revisions', err);
  }
}

function renderRevisions() {
  const container = document.getElementById('revisionsList');
  if (!container) return;

  if (state.revisions.length === 0) {
    container.innerHTML = '<div class="empty-state">No revisions saved yet.</div>';
    return;
  }

  container.innerHTML = state.revisions
    .map(
      (r) => `
      <div class="revision-item">
        <div>
          <strong>Version ${r.version_number}</strong>: ${r.change_summary}
          <div style="font-size: 0.7rem; color: var(--text-muted);">${new Date(r.created_at).toLocaleString()}</div>
        </div>
        <button class="btn btn-small btn-outline restore-btn" data-id="${r.id}">Restore</button>
      </div>
    `
    )
    .join('');

  container.querySelectorAll('.restore-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.getAttribute('data-id');
      try {
        const res = await api.profile.restoreRevision(id);
        state.profile = res.profile;
        renderProfileToForm();
        renderLivePreview();
        updateOverviewCards();
        showNotification('Profile restored from previous revision.', 'success');
      } catch (err) {
        showNotification(`Restore failed: ${err.message}`, 'error');
      }
    });
  });
}

async function loadAudit() {
  try {
    const [auditRes, recsRes] = await Promise.all([
      api.audit.run(),
      api.audit.getRecommendations().catch(() => null)
    ]);
    state.audit = auditRes.audit;
    state.aiRecommendations = recsRes?.recommendations || [];
    renderAudit();
  } catch (err) {
    showNotification(`Audit failed: ${err.message}`, 'error');
  }
}

function renderAudit() {
  const a = state.audit;
  if (!a) return;

  const scoreEl = document.getElementById('auditScoreVal');
  const issuesCountEl = document.getElementById('auditIssuesCount');
  const buzzwordsCountEl = document.getElementById('auditBuzzwordsCount');
  const issuesList = document.getElementById('auditIssuesList');
  const recList = document.getElementById('auditRecommendationsList');
  const aiRecList = document.getElementById('aiRecommendationsList');

  if (scoreEl) scoreEl.textContent = `${a.completenessScore} / 100`;
  if (issuesCountEl) issuesCountEl.textContent = a.totalIssues;
  if (buzzwordsCountEl) buzzwordsCountEl.textContent = a.detectedBuzzwords.length;

  if (issuesList) {
    if (a.issues.length === 0) {
      issuesList.innerHTML = '<div class="empty-state">All audit checks passed. Profile meets professional standards.</div>';
    } else {
      issuesList.innerHTML = a.issues
        .map(
          (issue) => `
          <div class="issue-item tier-${issue.tier}">
            <div class="issue-body">
              <h4>${issue.message}</h4>
              <p>${issue.suggestion}</p>
            </div>
          </div>
        `
        )
        .join('');
    }
  }

  if (recList) {
    if (a.recommendations.length === 0) {
      recList.innerHTML = '<li class="empty-state">No pending recommendations.</li>';
    } else {
      recList.innerHTML = a.recommendations.map((r) => `<li>${r}</li>`).join('');
    }
  }

  if (aiRecList) {
    const recs = state.aiRecommendations || [];
    if (recs.length === 0) {
      aiRecList.innerHTML = '<div class="empty-state">No AI recommendations generated yet. Profile matches baseline standards.</div>';
    } else {
      aiRecList.innerHTML = recs
        .map(
          (r) => `
          <div class="recommendation-card">
            <div class="recommendation-header">
              <strong>${r.section}</strong>
              <span class="priority-pill priority-${r.priority}">${r.priority} Priority</span>
            </div>
            <div class="rec-rationale">${r.rationale}</div>
            <div class="rec-action">Recommended Action: ${r.action}</div>
          </div>
        `
        )
        .join('');
    }
  }
}

async function loadVariations() {
  try {
    const res = await api.profile.getVariations();
    state.variations = res.variations || [];
    renderVariations();
  } catch (err) {
    showNotification(`Failed to load variations: ${err.message}`, 'error');
  }
}

function renderVariations() {
  const container = document.getElementById('variationsContainer');
  if (!container) return;

  if (state.variations.length === 0) {
    container.innerHTML = '<div class="empty-state">No variations available. Add experience and target role first.</div>';
    return;
  }

  container.innerHTML = state.variations
    .map(
      (v, idx) => `
      <div class="variation-card">
        <h3>${v.angle}</h3>
        <label style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">HEADLINE</label>
        <div class="variation-headline-box">${v.headline}</div>
        <label style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">ABOUT SUMMARY</label>
        <div class="variation-about-box">${v.about}</div>
        <button class="btn btn-primary apply-variation-btn" data-index="${idx}">Apply Angle to Editor</button>
      </div>
    `
    )
    .join('');

  container.querySelectorAll('.apply-variation-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'), 10);
      const v = state.variations[idx];
      const headlineInput = document.getElementById('editHeadline');
      const aboutInput = document.getElementById('editAbout');
      if (headlineInput) headlineInput.value = v.headline;
      if (aboutInput) aboutInput.value = v.about;
      updateCharCounts();
      renderLivePreview();
      switchTab('tab-editor');
      showNotification(`Applied ${v.angle} to Profile Editor. Review and click Save.`, 'success');
    });
  });
}

async function analyzeKeywords() {
  const jobDesc = document.getElementById('jobDescriptionInput')?.value || '';
  try {
    const res = await api.audit.analyzeKeywords(jobDesc);
    renderKeywordResults(res.analysis);
  } catch (err) {
    showNotification(`Keyword analysis failed: ${err.message}`, 'error');
  }
}

function renderKeywordResults(k) {
  const panel = document.getElementById('keywordResultsPanel');
  if (!panel) return;
  panel.classList.remove('hidden');

  const atsScore = document.getElementById('kwAtsScore');
  const jobScore = document.getElementById('kwJobMatchScore');
  const readScore = document.getElementById('kwReadabilityScore');
  const readLabel = document.getElementById('kwReadabilityLabel');
  const avgSent = document.getElementById('kwAvgSentenceLength');
  const matchedCloud = document.getElementById('matchedKeywordsList');
  const missingCloud = document.getElementById('missingKeywordsList');
  const densityTable = document.getElementById('keywordDensityTable');

  if (atsScore) atsScore.textContent = `${k.atsScore}%`;
  if (jobScore) jobScore.textContent = k.jobMatchScore !== null ? `${k.jobMatchScore}%` : 'N/A';
  if (readScore) readScore.textContent = k.readability.fleschScore;
  if (readLabel) readLabel.textContent = k.readability.label;
  if (avgSent) avgSent.textContent = k.readability.averageSentenceLength;

  if (matchedCloud) {
    matchedCloud.innerHTML = k.matchedKeywords
      .map((kw) => `<span class="tag-item matched">${kw}</span>`)
      .join('');
  }
  if (missingCloud) {
    missingCloud.innerHTML = k.missingKeywords
      .map((kw) => `<span class="tag-item missing">${kw}</span>`)
      .join('');
  }

  if (densityTable) {
    densityTable.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Keyword</th>
            <th>Count</th>
            <th>Density</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${k.topKeywords
            .map(
              (row) => `
            <tr>
              <td><strong>${row.keyword}</strong></td>
              <td>${row.count}</td>
              <td>${row.density}%</td>
              <td>${row.isStuffed ? '<span class="badge badge-danger">Stuffing Alert (>3.5%)</span>' : '<span class="badge badge-success">Balanced</span>'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;
  }
}

async function loadAutomation() {
  try {
    const [jobsRes, remindersRes, draftsRes] = await Promise.all([
      api.automation.getJobs(),
      api.automation.getReminders(),
      api.automation.getDrafts()
    ]);
    state.jobs = jobsRes.jobs || [];
    renderAutomationJobs();
    renderReminders(remindersRes.reminders || []);
    state.drafts = draftsRes.drafts || [];
    renderDrafts();
  } catch (err) {
    showNotification(`Failed to load automation data: ${err.message}`, 'error');
  }
}

function renderAutomationJobs() {
  const container = document.getElementById('automationJobsList');
  if (!container) return;

  container.innerHTML = state.jobs
    .map(
      (j) => `
      <div class="job-item">
        <div class="job-info">
          <h4>${j.job_type}</h4>
          <p>Schedule: ${j.schedule} • Status: ${j.status}</p>
        </div>
        <button class="btn btn-small ${j.status === 'active' ? 'btn-outline-danger' : 'btn-primary'} toggle-job-btn" data-id="${j.id}" data-status="${j.status === 'active' ? 'paused' : 'active'}">
          ${j.status === 'active' ? 'Pause Task' : 'Activate Task'}
        </button>
      </div>
    `
    )
    .join('');

  container.querySelectorAll('.toggle-job-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.getAttribute('data-id');
      const targetStatus = e.target.getAttribute('data-status');
      try {
        await api.automation.toggleJob(id, targetStatus);
        loadAutomation();
        showNotification(`Job status updated to ${targetStatus}.`, 'success');
      } catch (err) {
        showNotification(`Failed to toggle job: ${err.message}`, 'error');
      }
    });
  });
}

function renderReminders(reminders) {
  const container = document.getElementById('freshnessRemindersList');
  if (!container) return;

  if (reminders.length === 0) {
    container.innerHTML = '<div class="empty-state">No pending reminders. Profile is fresh.</div>';
    return;
  }

  container.innerHTML = reminders
    .map(
      (r) => `
      <div class="issue-item tier-medium">
        <div class="issue-body">
          <h4>${r.section}</h4>
          <p>${r.message}</p>
        </div>
      </div>
    `
    )
    .join('');
}

function renderDrafts() {
  const container = document.getElementById('draftsQueueList');
  if (!container) return;

  if (state.drafts.length === 0) {
    container.innerHTML = '<div class="empty-state">No post drafts generated yet. Click + Generate Post Draft.</div>';
    return;
  }

  const hasSocialScope = Boolean(
    state.account?.permissions?.writeMemberSocial ||
    (state.account?.scope && state.account.scope.some((s) => s.toLowerCase().includes('w_member_social')))
  );

  const warningBanner = (state.account && state.account.connected && !hasSocialScope) ? `
    <div class="guidance-callout" style="border-left-color: var(--warning-color); background-color: var(--bg-card); margin-bottom: 1rem;">
      <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">
        Izin Posting Feed (w_member_social) Belum Aktif
      </div>
      <p style="margin: 0.25rem 0; font-size: 0.85rem; color: var(--text-secondary);">
        Akun LinkedIn Anda saat ini hanya mengizinkan pembacaan profil. Untuk memposting draft otomatis langsung ke feed LinkedIn, sambungkan ulang akun dengan izin posting.
      </p>
      <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem; align-items: center;">
        <button type="button" id="reconnectSocialBtn" class="btn btn-small btn-primary">Sambungkan Ulang dengan Izin Posting</button>
      </div>
    </div>
  ` : '';

  const draftsHtml = state.drafts
    .map(
      (d) => `
      <div class="draft-card">
        <div class="draft-card-header">
          <span class="draft-topic">${escapeHtml(d.topic)}</span>
          <span class="badge ${d.status === 'published' ? 'badge-success' : d.status === 'approved' ? 'badge-warning' : 'badge-danger'}">${d.status}</span>
        </div>
        <div class="draft-content">${escapeHtml(d.content)}</div>
        <div class="draft-actions">
          <button class="btn btn-small btn-secondary copy-draft-btn" data-content="${escapeHtml(d.content)}">Copy Post</button>
          ${d.status === 'draft' ? `
            <button class="btn btn-small btn-outline approve-draft-btn" data-id="${d.id}">Approve Draft</button>
            <button class="btn btn-small btn-primary publish-draft-btn" data-id="${d.id}">Publish to LinkedIn</button>
            <button class="btn btn-small btn-outline-danger reject-draft-btn" data-id="${d.id}">Reject</button>
          ` : `
            <span style="font-size: 0.8rem; color: var(--text-muted);">${d.published_at ? 'Published on ' + new Date(d.published_at).toLocaleDateString() : 'Status: ' + d.status}</span>
          `}
        </div>
      </div>
    `
    )
    .join('');

  container.innerHTML = warningBanner + draftsHtml;

  const reconnectBtn = container.querySelector('#reconnectSocialBtn');
  if (reconnectBtn) {
    reconnectBtn.addEventListener('click', async () => {
      try {
        await api.auth.disconnect();
        const res = await api.auth.getUrl();
        window.location.href = res.url;
      } catch (err) {
        showNotification(`Gagal memulai otorisasi ulang: ${err.message}`, 'error');
      }
    });
  }

  container.querySelectorAll('.copy-draft-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const content = e.currentTarget.getAttribute('data-content') || '';
      copyToClipboard(content, e.currentTarget, 'Copied!');
    });
  });

  container.querySelectorAll('.approve-draft-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.getAttribute('data-id');
      try {
        await api.automation.approveDraft(id, true, false);
        loadAutomation();
        showNotification('Draft marked as approved.', 'success');
      } catch (err) {
        showNotification(`Approval failed: ${err.message}`, 'error');
      }
    });
  });

  container.querySelectorAll('.publish-draft-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      if (!hasSocialScope) {
        openConfirmModal(
          'Izin w_member_social Diperlukan',
          'Akun LinkedIn Anda saat ini belum memiliki izin memposting ke feed (w_member_social). Apakah Anda ingin menghubungkan ulang akun sekarang untuk memberikan izin posting?',
          async () => {
            try {
              await api.auth.disconnect();
              const res = await api.auth.getUrl();
              window.location.href = res.url;
            } catch (err) {
              showNotification(`Gagal memulai otorisasi ulang: ${err.message}`, 'error');
            }
          }
        );
        return;
      }

      openConfirmModal(
        'Confirm LinkedIn Post',
        'Are you sure you want to publish this post directly to your LinkedIn public feed via official API?',
        async () => {
          try {
            await api.automation.approveDraft(id, true, true);
            loadAutomation();
            showNotification('Post successfully published to LinkedIn feed.', 'success');
          } catch (err) {
            const isScopeError = err.message && err.message.includes('w_member_social');
            const msg = isScopeError
              ? 'Izin w_member_social belum diberikan. Silakan sambungkan ulang akun LinkedIn Anda untuk menyetujui izin posting feed.'
              : `Publish failed: ${err.message}`;
            showNotification(msg, 'error');
          }
        }
      );
    });
  });

  container.querySelectorAll('.reject-draft-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.getAttribute('data-id');
      try {
        await api.automation.approveDraft(id, false, false);
        loadAutomation();
        showNotification('Draft rejected.', 'info');
      } catch (err) {
        showNotification(`Rejection failed: ${err.message}`, 'error');
      }
    });
  });
}

async function loadLogs() {
  try {
    const res = await api.automation.getLogs(50);
    state.logs = res.logs || [];
    renderLogs();
  } catch (err) {
    showNotification(`Failed to load logs: ${err.message}`, 'error');
  }
}

function renderLogs() {
  const tbody = document.getElementById('activityLogsTableBody');
  if (!tbody) return;

  if (state.logs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No activity logs recorded yet.</td></tr>';
    return;
  }

  tbody.innerHTML = state.logs
    .map(
      (l) => `
      <tr>
        <td>${new Date(l.created_at).toLocaleString()}</td>
        <td><code>${l.action_type}</code></td>
        <td><span class="badge ${l.status === 'success' ? 'badge-success' : 'badge-danger'}">${l.status}</span></td>
        <td><small>${JSON.stringify(l.details)}</small></td>
      </tr>
    `
    )
    .join('');
}

function openConfirmModal(title, body, onConfirm) {
  const modal = document.getElementById('confirmModal');
  const titleEl = document.getElementById('modalTitle');
  const bodyEl = document.getElementById('modalBody');
  if (!modal || !titleEl || !bodyEl) return;

  titleEl.textContent = title;
  bodyEl.textContent = body;
  state.pendingConfirmAction = onConfirm;
  modal.classList.remove('hidden');
}

function closeConfirmModal() {
  const modal = document.getElementById('confirmModal');
  if (modal) modal.classList.add('hidden');
  state.pendingConfirmAction = null;
}

function copyToClipboard(text, btnElement, successLabel = 'Copied!') {
  if (!text) {
    showNotification('No text to copy', 'error');
    return;
  }
  navigator.clipboard.writeText(text).then(() => {
    const orig = btnElement.textContent;
    btnElement.textContent = successLabel;
    setTimeout(() => {
      btnElement.textContent = orig;
    }, 2000);
    showNotification('Copied to clipboard. Paste into your LinkedIn profile.', 'success');
  });
}

function setupEventListeners() {
  document.getElementById('themeToggleBtn')?.addEventListener('click', toggleTheme);

  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.addEventListener('click', (e) => {
      const targetTab = e.currentTarget.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  document.getElementById('closeNotificationBtn')?.addEventListener('click', hideNotification);

  document.getElementById('connectLinkedInBtn')?.addEventListener('click', async () => {
    try {
      const res = await api.auth.getUrl();
      window.location.href = res.url;
    } catch (err) {
      showNotification(`Failed to initiate LinkedIn OAuth: ${err.message}`, 'error');
    }
  });

  const handleDisconnect = () => {
    openConfirmModal(
      'Disconnect LinkedIn Account',
      'This will revoke OAuth credentials and remove stored tokens. Continue?',
      async () => {
        try {
          await api.auth.disconnect();
          await loadAccountStatus();
          showNotification('LinkedIn account disconnected.', 'success');
        } catch (err) {
          showNotification(`Disconnect failed: ${err.message}`, 'error');
        }
      }
    );
  };

  document.getElementById('disconnectLinkedInBtn')?.addEventListener('click', handleDisconnect);
  document.getElementById('disconnectAccountBtn')?.addEventListener('click', handleDisconnect);

  document.getElementById('purgeDataBtn')?.addEventListener('click', () => {
    openConfirmModal(
      'Permanent Data Purge',
      'This will erase all your profile drafts, history, and integration records. This cannot be undone. Confirm?',
      async () => {
        try {
          await api.settings.purge();
          await loadProfile();
          await loadAccountStatus();
          showNotification('All user data has been permanently purged.', 'success');
        } catch (err) {
          showNotification(`Purge failed: ${err.message}`, 'error');
        }
      }
    );
  });

  document.getElementById('modalCancelBtn')?.addEventListener('click', closeConfirmModal);
  document.getElementById('modalConfirmBtn')?.addEventListener('click', () => {
    if (typeof state.pendingConfirmAction === 'function') {
      state.pendingConfirmAction();
    }
    closeConfirmModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeConfirmModal();
      closeRoleTemplatesModal();
      hideNotification();
    }
  });

  document.getElementById('saveProfileBtn')?.addEventListener('click', saveProfile);

  document.getElementById('autoGenerateExpBtn')?.addEventListener('click', autoGenerateExperienceRole);
  document.getElementById('openRoleTemplatesBtn')?.addEventListener('click', openRoleTemplatesModal);
  document.getElementById('closeRoleTemplatesModalBtn')?.addEventListener('click', closeRoleTemplatesModal);
  document.getElementById('cancelRoleTemplatesModalBtn')?.addEventListener('click', closeRoleTemplatesModal);

  const roleModal = document.getElementById('roleTemplatesModal');
  if (roleModal) {
    roleModal.addEventListener('click', (e) => {
      if (e.target === roleModal) {
        closeRoleTemplatesModal();
      }
    });
  }

  document.getElementById('addExperienceBtn')?.addEventListener('click', () => {
    syncExperienceInputsToState();
    if (!state.profile) state.profile = {};
    if (!state.profile.experience) state.profile.experience = [];
    state.profile.experience.push({
      title: 'New Role',
      company: 'Company',
      responsibilities: [],
      achievements_metrics: [],
      tech_stack: [],
      start_date: '2023',
      end_date: 'Present',
      is_current: false
    });
    renderExperienceList();
    renderLivePreview();
  });

  const liveEditorInputs = [
    'editHeadline',
    'editAbout',
    'editSkillsInput',
    'editTargetRole',
    'editTargetIndustry',
    'editLanguage',
    'editContactEmail',
    'editPortfolioUrl'
  ];

  liveEditorInputs.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const updateHandler = () => {
      updateCharCounts();
      renderLivePreview();
      if (id === 'editSkillsInput') {
        updateSkillsChipsUI();
      }
    };
    el.addEventListener('input', updateHandler);
    el.addEventListener('change', updateHandler);
  });

  document.getElementById('skillCategoryTabs')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.skill-cat-btn');
    if (!btn) return;
    const cat = btn.getAttribute('data-cat') || 'all';
    state.skillsCategory = cat;
    document.querySelectorAll('#skillCategoryTabs .skill-cat-btn').forEach((b) => {
      b.classList.toggle('active', b === btn);
    });
    updateSkillsChipsUI();
  });

  document.getElementById('skillSearchFilter')?.addEventListener('input', (e) => {
    state.skillsSearch = e.target.value.trim().toLowerCase();
    updateSkillsChipsUI();
  });

  document.getElementById('clearAllSkillsBtn')?.addEventListener('click', () => {
    const input = document.getElementById('editSkillsInput');
    if (input) input.value = '';
    updateSkillsChipsUI();
    renderLivePreview();
  });

  document.getElementById('autoGenerateHeadlineBtn')?.addEventListener('click', async () => {
    try {
      const res = await api.profile.optimizeHeadline();
      if (res.options && res.options.length > 0) {
        const headlineInput = document.getElementById('editHeadline');
        if (headlineInput) {
          headlineInput.value = res.options[0].headline;
          updateCharCounts();
          renderLivePreview();
          showNotification('Headline generated based on your profile facts.', 'success');
        }
      }
    } catch (err) {
      showNotification(`Generation failed: ${err.message}`, 'error');
    }
  });

  document.getElementById('autoGenerateAboutBtn')?.addEventListener('click', async () => {
    const lang = document.getElementById('editLanguage')?.value || 'id';
    try {
      const res = await api.profile.optimizeAbout(lang, 'Technical Depth');
      const aboutInput = document.getElementById('editAbout');
      if (aboutInput && res.text) {
        aboutInput.value = res.text;
        updateCharCounts();
        renderLivePreview();
        showNotification('Summary generated based on your work history.', 'success');
      }
    } catch (err) {
      showNotification(`Generation failed: ${err.message}`, 'error');
    }
  });

  document.getElementById('copyHeadlineBtn')?.addEventListener('click', (e) => {
    const text = document.getElementById('editHeadline')?.value;
    copyToClipboard(text, e.currentTarget);
  });

  document.getElementById('copyAboutBtn')?.addEventListener('click', (e) => {
    const text = document.getElementById('editAbout')?.value;
    copyToClipboard(text, e.currentTarget);
  });

  document.getElementById('runAuditBtn')?.addEventListener('click', () => {
    switchTab('tab-audit');
    loadAudit();
  });

  document.getElementById('recheckAuditBtn')?.addEventListener('click', loadAudit);

  document.getElementById('refreshVariationsBtn')?.addEventListener('click', loadVariations);

  document.getElementById('analyzeKeywordsBtn')?.addEventListener('click', analyzeKeywords);

  document.getElementById('generatePostDraftBtn')?.addEventListener('click', async () => {
    try {
      await api.automation.generateDraft('Engineering Insights');
      await loadAutomation();
      showNotification('Professional post draft generated and added to approval queue.', 'success');
    } catch (err) {
      showNotification(`Draft generation failed: ${err.message}`, 'error');
    }
  });

  document.getElementById('refreshLogsBtn')?.addEventListener('click', loadLogs);
  document.getElementById('saveCredentialsBtn')?.addEventListener('click', saveCredentialsSettings);

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('oauth') === 'success') {
    showNotification('LinkedIn account connected successfully via OAuth 2.0.', 'success');
    window.history.replaceState({}, document.title, window.location.pathname);
    loadAccountStatus().then(() => {
      renderLivePreview();
    });
  } else if (urlParams.get('oauth') === 'error') {
    const msg = urlParams.get('message') || 'Authorization was cancelled or denied';
    showNotification(`LinkedIn connection error: ${msg}`, 'error');
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

async function initApp() {
  initTheme();
  setupEventListeners();
  updateSkillsChipsUI();
  await loadAccountStatus();
  await loadProfile();
  loadAutomation();
  renderLivePreview();
}

window.addEventListener('DOMContentLoaded', initApp);
