// Single source of truth for the public portfolio landing page.
// Edit content here; sections in src/pages/index.astro render from this.

export interface SkillGroup {
  category: string;
  items: { name: string; note?: string }[];
}

export interface ExperienceItem {
  role: string;
  period: string;
  location: string;
  bullets: string[];
}

export interface Project {
  title: string;
  /** One-line, metric-driven pitch. */
  description: string;
  tags: string[];
  href?: string;
  featured?: boolean;
}

export interface SocialLink {
  label: string;
  href: string;
  /** Key used to pick an inline icon in the Contact section. */
  icon: 'linkedin' | 'github' | 'email' | 'website';
}

export const profile = {
  name: 'Heri Rusmanto',
  role: 'DevOps Certified & Backend Engineer',
  subtitle: 'Infrastructure System Engineer · Cloud & Backend Specialist',
  location: 'Tokyo, Japan',
  email: 'mail@heri.life',
  resumeUrl: '/cv', // heri.life short link to CV; update if needed
  about: [
    'Cloud and Backend Engineer with extensive experience administering and optimizing customer systems, ensuring reliability through preventive maintenance and proactive issue resolution. Currently an Infrastructure System Engineer in Tokyo, Japan.',
    'Skilled in system installation, configuration, and implementation with a strong focus on supporting new projects. Experienced migrating applications from virtual machines to containers for greater scalability and efficiency, with backend expertise in Golang, Node.js, Python, and Bash.',
    'Experienced setting up observability with Grafana, Prometheus, and Alertmanager, and working collaboratively with teams to maintain seamless operations and prevent future system issues.',
  ],
} as const;

export const skillGroups: SkillGroup[] = [
  {
    category: 'Backend & Programming',
    items: [
      { name: 'Golang', note: 'Primary backend development' },
      { name: 'Python', note: 'Automation & scripting' },
      { name: 'Node.js', note: 'API development' },
      { name: 'Bash', note: 'Automation & DevOps' },
    ],
  },
  {
    category: 'Cloud & Infrastructure',
    items: [
      { name: 'AWS / GCP', note: 'Migration expertise' },
      { name: 'Kubernetes', note: 'Orchestration' },
      { name: 'Docker', note: 'Containerization' },
      { name: 'Terragrunt', note: 'Infrastructure as Code' },
    ],
  },
  {
    category: 'DevOps & Monitoring',
    items: [
      { name: 'Grafana', note: 'Visualization' },
      { name: 'Prometheus', note: 'Metrics & alerting' },
      { name: 'Alertmanager', note: 'Alert routing' },
      { name: 'GitLab CI/CD', note: 'Pipelines' },
    ],
  },
  {
    category: 'Frontend & Web',
    items: [
      { name: 'React / Next.js' },
      { name: 'Astro' },
      { name: 'TypeScript' },
      { name: 'Tailwind CSS' },
    ],
  },
  {
    category: 'Databases & Storage',
    items: [
      { name: 'Elasticsearch', note: 'Search & analytics' },
      { name: 'PostgreSQL' },
      { name: 'SQLite / D1' },
    ],
  },
];

export const experience: ExperienceItem[] = [
  {
    role: 'Infrastructure System Engineer',
    period: 'Apr 2025 – Present',
    location: 'Tokyo, Japan',
    bullets: [
      'Lead design and development of system architecture for new services',
      'Develop software solutions and maintain high-quality, secure code',
      'Create and maintain technical documentation',
      'Collaborate with teams to deliver features with quality and speed',
    ],
  },
  {
    role: 'Cloud Engineer',
    period: 'Sep 2024 – Mar 2025',
    location: 'Semarang, Indonesia',
    bullets: [
      'Administered customer systems with regular checks and maintenance',
      'Led migration of applications from VMs to containers',
      'Set up monitoring: Grafana, Prometheus, and Alertmanager',
      'Provided technical support for new project implementations',
    ],
  },
  {
    role: 'Backend Infrastructure (SRE)',
    period: 'Jul 2022 – Jul 2024',
    location: 'Indonesia',
    bullets: [
      'Led AWS → GCP migration using Terragrunt for scalable infrastructure',
      'Implemented robust Kubernetes monitoring tooling',
      'Optimized deployment workflows, reducing complexity and improving reliability',
      'Conducted cost monitoring and optimization for K8s clusters',
      'Automated operational tasks with Bash and Python',
    ],
  },
  {
    role: 'DevOps Engineer',
    period: 'Jul 2021 – Apr 2022',
    location: 'Surakarta, Indonesia',
    bullets: [
      'Set up and managed Kubernetes clusters for dev/prod environments',
      'Configured GitLab CI/CD pipelines, improving delivery speed',
      'Implemented cost-efficient cloud resource strategies',
    ],
  },
];

export const projects: Project[] = [
  {
    title: 'heri.life — Personal Site & URL Shortener',
    description:
      'Production URL shortener + blog on Cloudflare Workers/D1 with a JWT-secured admin panel, multi-tier KV caching (>95% hit rate, ~50ms P50), SSRF protection, and 90.95% test coverage.',
    tags: ['Astro', 'TypeScript', 'React 19', 'Cloudflare D1', 'Workers'],
    href: 'https://heri.life',
    featured: true,
  },
  {
    title: 'AWS → GCP Migration',
    description:
      'Led a full cloud migration using Terragrunt for reproducible, scalable infrastructure, with Kubernetes monitoring and cost optimization across clusters.',
    tags: ['Terragrunt', 'GCP', 'AWS', 'Kubernetes'],
  },
  {
    title: 'Observability Stack',
    description:
      'Designed and deployed end-to-end monitoring and alerting — Grafana dashboards, Prometheus metrics, and Alertmanager routing — for proactive incident response.',
    tags: ['Grafana', 'Prometheus', 'Alertmanager'],
  },
  {
    title: 'VM → Container Modernization',
    description:
      'Migrated legacy applications from virtual machines to containers, improving scalability, deployment speed, and operational efficiency.',
    tags: ['Docker', 'Kubernetes', 'CI/CD'],
  },
];

export const certifications: string[] = [
  'DevOps Foundation Certification',
  'LFEL1014: Scaling Cloud Native Applications with KEDA',
  'EF SET English Certificate — 74/100 (C2 Proficient)',
];

export const languages: { name: string; level: string }[] = [
  { name: 'English', level: 'Professional Working' },
  { name: 'Indonesian', level: 'Native / Bilingual' },
  { name: 'Japanese', level: 'Elementary' },
];

export const socials: SocialLink[] = [
  { label: 'LinkedIn', href: 'https://heri.life/li', icon: 'linkedin' },
  { label: 'GitHub', href: 'https://heri.life/gh', icon: 'github' },
  { label: 'Email', href: 'mailto:mail@heri.life', icon: 'email' },
  { label: 'Website', href: 'https://heri.life', icon: 'website' },
];
