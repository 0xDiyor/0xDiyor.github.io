// Projects have no detail pages — they link out to GitHub or a demo.
// Sorted by date descending wherever they're rendered; array order doesn't matter.
export interface Project {
  name: string;
  date: string; // YYYY-MM-DD
  description: string;
  tech: string[];
  github: string | null;
  demo: string | null;
}

export const PROJECTS: Project[] = [
  {
    name: '0xDiyor.github.io',
    date: '2026-08-14',
    description:
      'This portfolio site and blog, built with Astro 5. Static output with zero client JavaScript, build-time GitHub API data for projects, and a nightly rebuild cron.',
    tech: ['Astro', 'TypeScript', 'Markdown'],
    github: 'https://github.com/0xDiyor/0xDiyor.github.io',
    demo: null,
  },
  {
    name: 'opskit',
    date: '2026-08-04',
    description:
      'Terminal based IT diagnostics toolkit for Windows. Network, ports, health, and cert checks behind one menu, with a vetted script runner planned. Zero dependencies, PowerShell 5.1 compatible.',
    tech: ['PowerShell'],
    github: 'https://github.com/0xDiyor/opskit',
    demo: null,
  },
  {
    name: 'voidkit',
    date: '2026-05-24',
    description:
      'Modular Python framework for security and networking, inspired by Metasploit\u2019s use/set/run workflow and neutral between red and blue team operations. Foundation phase.',
    tech: ['Python'],
    github: 'https://github.com/0xDiyor/voidkit',
    demo: null,
  },
  {
    name: 'Intro to Programming Python',
    date: '2026-05-01',
    description:
      'Repository of Python exercises and labs from CCD coursework: list comprehensions, dictionaries, string methods, and more.',
    tech: ['Python'],
    github: 'https://github.com/0xDiyor/Intro-to-Programming-Python',
    demo: null,
  },
  {
    name: 'Homelab Infrastructure',
    date: '2026-03-01',
    description:
      'Full security lab built on Proxmox: OPNsense firewall, Suricata IDS, Wazuh SIEM, and GNS3 network simulation. Segmented for safe attack simulation.',
    tech: ['Proxmox', 'OPNsense', 'Suricata', 'Wazuh', 'GNS3'],
    github: null,
    demo: null,
  },
];

export const sortedProjects = () =>
  [...PROJECTS].sort((a, b) => +new Date(b.date) - +new Date(a.date));

// Curated PROJECTS plus any GitHub-pinned repo not already listed.
// Pin a repo on your profile and it shows up here on the next build;
// unpin it and it disappears. Curated entries always win over the
// auto-generated card for the same repo (better descriptions/tags),
// and entries without a repo (physical projects) are unaffected.
export async function fetchAllProjects(): Promise<Project[]> {
  const { fetchPinnedRepos } = await import('./github');
  const pinned = await fetchPinnedRepos();
  const curatedUrls = new Set(
    PROJECTS.map((p) => p.github?.toLowerCase()).filter(Boolean)
  );
  const auto: Project[] = pinned
    .filter((r) => !curatedUrls.has(r.url.toLowerCase()))
    .map((r) => ({
      name: r.name,
      date: r.pushedAt,
      description: r.description ?? '',
      tech: [r.language, ...r.topics].filter((t): t is string => !!t).slice(0, 6),
      github: r.url,
      demo: null,
    }));
  return [...PROJECTS, ...auto].sort((a, b) => +new Date(b.date) - +new Date(a.date));
}
