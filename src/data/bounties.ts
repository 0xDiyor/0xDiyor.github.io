// One entry per published bug bounty or coordinated disclosure.
// CVE IDs are optional: many valid findings never receive one.
// Add an entry here and push to main; /cves/ and the home page update on deploy.
export interface Bounty {
  cve: string | null; // e.g. "CVE-2026-1234", null when no CVE was assigned
  program: string; // Program or vendor name, e.g. "HackerOne", "Shopify"
  programUrl: string | null; // Link to the program or the disclosure
  title: string; // One line: what was found and where
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  type: string[]; // Vulnerability classes, e.g. ["Stored XSS", "IDOR"]
  date: string; // YYYY-MM-DD disclosure date
  bounty: number | null; // USD amount paid; null keeps it undisclosed
  links: { label: string; url: string }[]; // CVE/NVD record, advisory, writeup
}

export const BOUNTIES: Bounty[] = [
  // {
  //   cve: 'CVE-2026-0000',
  //   program: 'Example Program',
  //   programUrl: 'https://hackerone.com/example',
  //   title: 'Stored XSS in the support portal message composer',
  //   severity: 'High',
  //   type: ['Stored XSS'],
  //   date: '2026-05-01',
  //   bounty: 2500,
  //   links: [
  //     { label: 'NVD', url: 'https://nvd.nist.gov/vuln/detail/CVE-2026-0000' },
  //     { label: 'writeup', url: '/blog/my-writeup/' },
  //   ],
  // },
];

export const sortedBounties = () =>
  [...BOUNTIES].sort((a, b) => +new Date(b.date) - +new Date(a.date));
