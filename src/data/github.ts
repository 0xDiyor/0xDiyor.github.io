// Build-time GitHub data. Fetched once per build (results are memoized so
// every page shares the API calls) and baked into the HTML — no client JS.
// The deploy workflow rebuilds nightly, so this is at most a day old.
// Every failure path returns empty data: the API being down, rate-limited,
// or unreachable must never fail the build.
//
// Note: the /users/{user}/events API no longer includes commit details in
// PushEvent payloads, so the commit feed is assembled from the commits
// endpoint of the most recently pushed repos instead.

const USER = '0xDiyor';

export interface CommitItem {
  shortSha: string;
  repo: string;
  message: string;
  date: string; // YYYY-MM-DD
  url: string;
}

export interface RepoMeta {
  stars: number;
  language: string | null;
  pushedAt: string; // YYYY-MM-DD
}

interface RawRepo {
  name: string;
  html_url: string;
  fork: boolean;
  stargazers_count?: number;
  language?: string | null;
  pushed_at?: string;
}

async function ghFetch(path: string): Promise<unknown> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': `${USER}-site-build`,
  };
  // In CI the workflow passes the Actions token — authenticated requests
  // avoid the shared-runner rate limit. Local builds work unauthenticated.
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await fetch(`https://api.github.com${path}`, { headers });
    if (!res.ok) {
      console.warn(`[github] ${path} responded ${res.status} — skipping`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn(`[github] ${path} unreachable — skipping`, err);
    return null;
  }
}

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

let reposPromise: Promise<RawRepo[]> | null = null;

function fetchRepos(): Promise<RawRepo[]> {
  reposPromise ??= (async () => {
    const repos = (await ghFetch(`/users/${USER}/repos?sort=pushed&per_page=100`)) as
      | RawRepo[]
      | null;
    return Array.isArray(repos) ? repos : [];
  })();
  return reposPromise;
}

// Keyed by lowercase repo html_url so PROJECTS entries can look themselves up
// by their `github` field. Entries pointing at a profile (not a repo) simply
// find no match and render without live metadata.
export async function fetchRepoMeta(): Promise<Map<string, RepoMeta>> {
  const repos = await fetchRepos();
  const map = new Map<string, RepoMeta>();
  for (const r of repos) {
    map.set(r.html_url.toLowerCase(), {
      stars: r.stargazers_count ?? 0,
      language: r.language ?? null,
      pushedAt: (r.pushed_at ?? '').slice(0, 10),
    });
  }
  return map;
}

let repoCommitsPromise: Promise<Map<string, CommitItem[]>> | null = null;

// Recent commits grouped by repo name, for the few repos with recent
// activity (own work, not forks — repos come back sorted by pushed_at)
export function fetchRepoCommits(): Promise<Map<string, CommitItem[]>> {
  repoCommitsPromise ??= (async () => {
    const repos = (await fetchRepos()).filter((r) => !r.fork).slice(0, 6);
    const map = new Map<string, CommitItem[]>();

    await Promise.all(
      repos.map(async (repo) => {
        const commits = (await ghFetch(`/repos/${USER}/${repo.name}/commits?per_page=10`)) as
          | Array<{
              sha: string;
              html_url: string;
              commit: { message: string; committer?: { date?: string }; author?: { date?: string } };
            }>
          | null;
        if (!Array.isArray(commits)) return;
        map.set(
          repo.name,
          commits.map((c) => ({
            shortSha: c.sha.slice(0, 7),
            repo: repo.name,
            message: (c.commit.message ?? '').split('\n')[0],
            date: (c.commit.committer?.date ?? c.commit.author?.date ?? '').slice(0, 10),
            url: c.html_url,
          }))
        );
      })
    );
    return map;
  })();
  return repoCommitsPromise;
}

export async function fetchRecentCommits(limit = 8): Promise<CommitItem[]> {
  const byRepo = await fetchRepoCommits();
  return [...byRepo.values()]
    .flat()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}
