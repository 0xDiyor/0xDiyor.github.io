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
    name: 'Threat Intelligence Dashboard',
    date: '2026-04-01',
    description:
      'React-based dashboard integrating VirusTotal and AbuseIPDB APIs for real-time threat monitoring. Dark terminal aesthetic with Recharts visualizations.',
    tech: ['React', 'Flask', 'SQLite', 'API Integration'],
    github: 'https://github.com/0xDiyor',
    demo: null,
  },
  {
    name: 'Homelab Infrastructure',
    date: '2026-03-01',
    description:
      'Full security lab built on Proxmox — pfSense firewall, Suricata IDS, Wazuh SIEM, GNS3 network simulation. Segmented for safe attack simulation.',
    tech: ['Proxmox', 'pfSense', 'Suricata', 'Wazuh', 'GNS3'],
    github: 'https://github.com/0xDiyor',
    demo: null,
  },
  {
    name: 'Intro to Programming Python',
    date: '2026-02-01',
    description:
      'Repository of Python exercises and labs from CCD coursework — covering list comprehensions, dictionaries, string methods, and more.',
    tech: ['Python'],
    github: 'https://github.com/0xDiyor/Intro-to-Programming-Python',
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
