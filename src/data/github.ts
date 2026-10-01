// Build-time GitHub data: pinned repos for the projects list and the
// contribution calendar for the projects page. Fetched once per build
// (memoized) and baked into the HTML, no client JS. The deploy workflow
// rebuilds nightly, so both are at most a day old.
// Every failure path returns empty data: the API being down, rate-limited,
// or unreachable must never fail the build.

const USER = '0xDiyor';

export interface PinnedRepo {
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  topics: string[];
  pushedAt: string; // YYYY-MM-DD
}

let pinnedPromise: Promise<PinnedRepo[]> | null = null;

// Pinned repos are only exposed via the GraphQL API, which requires a token.
// CI has one (the Actions token); local builds without it fall back to an
// empty list, so dev just shows the curated PROJECTS array.
export function fetchPinnedRepos(): Promise<PinnedRepo[]> {
  pinnedPromise ??= (async () => {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      console.warn('[github] no GITHUB_TOKEN — skipping pinned repos (curated projects only)');
      return [];
    }
    const query = `query {
      user(login: "${USER}") {
        pinnedItems(first: 6, types: REPOSITORY) {
          nodes {
            ... on Repository {
              name
              url
              description
              pushedAt
              primaryLanguage { name }
              repositoryTopics(first: 6) { nodes { topic { name } } }
            }
          }
        }
      }
    }`;
    try {
      const res = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': `${USER}-site-build`,
        },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) {
        console.warn(`[github] graphql responded ${res.status} — skipping pinned repos`);
        return [];
      }
      const json = (await res.json()) as {
        data?: {
          user?: {
            pinnedItems?: {
              nodes?: Array<{
                name: string;
                url: string;
                description: string | null;
                pushedAt: string;
                primaryLanguage: { name: string } | null;
                repositoryTopics: { nodes: Array<{ topic: { name: string } }> };
              }>;
            };
          };
        };
      };
      const nodes = json.data?.user?.pinnedItems?.nodes ?? [];
      return nodes.map((n) => ({
        name: n.name,
        url: n.url,
        description: n.description,
        language: n.primaryLanguage?.name ?? null,
        topics: n.repositoryTopics?.nodes?.map((t) => t.topic.name) ?? [],
        pushedAt: (n.pushedAt ?? '').slice(0, 10),
      }));
    } catch (err) {
      console.warn('[github] graphql unreachable — skipping pinned repos', err);
      return [];
    }
  })();
  return pinnedPromise;
}

export interface ContributionDay {
  date: string; // YYYY-MM-DD
  count: number;
  weekday: number; // 0 = Sunday
}

let contributionsPromise: Promise<ContributionDay[]> | null = null;

// The last year of contributions, oldest first, as GitHub's profile graph
// shows them (private contributions included when the profile allows it).
// Needs a token like pinned repos; without one the tracker is left out.
export function fetchContributions(): Promise<ContributionDay[]> {
  contributionsPromise ??= (async () => {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      console.warn('[github] no GITHUB_TOKEN — skipping contribution graph');
      return [];
    }
    const query = `query {
      user(login: "${USER}") {
        contributionsCollection {
          contributionCalendar {
            weeks { contributionDays { date contributionCount weekday } }
          }
        }
      }
    }`;
    try {
      const res = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': `${USER}-site-build`,
        },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) {
        console.warn(`[github] graphql responded ${res.status} — skipping contribution graph`);
        return [];
      }
      const json = (await res.json()) as {
        data?: {
          user?: {
            contributionsCollection?: {
              contributionCalendar?: {
                weeks?: Array<{
                  contributionDays: Array<{ date: string; contributionCount: number; weekday: number }>;
                }>;
              };
            };
          };
        };
      };
      const weeks = json.data?.user?.contributionsCollection?.contributionCalendar?.weeks ?? [];
      return weeks.flatMap((w) =>
        w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount, weekday: d.weekday }))
      );
    } catch (err) {
      console.warn('[github] graphql unreachable — skipping contribution graph', err);
      return [];
    }
  })();
  return contributionsPromise;
}
