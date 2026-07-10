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
