/**
 * Utility to fetch Rohan Yadav's public repositories from the GitHub API.
 * Includes support for topics header, custom "featured" filtering,
 * smart fallback to public repos, and token authentication.
 */
export async function fetchProjects() {
  try {
    const headers = {
      // Required to fetch repo topics using the REST API
      Accept: "application/vnd.github.mercy-preview+json",
    };

    // Safely check for a local config file containing a GitHub Token to avoid rate limiting
    let token = null;
    try {
      const config = await import('../config.js').catch(() => null);
      if (config && config.GITHUB_TOKEN) {
        token = config.GITHUB_TOKEN;
      }
    } catch (e) {
      // Fail silently if no local token config is provided
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
      "https://api.github.com/users/Aimbot01/repos",
      { headers }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const repos = await response.json();

    // 1. Initial filter: exclude forks and the profile README repository
    let filtered = repos.filter(
      (repo) => !repo.fork && repo.name !== "Aimbot01"
    );

    // 2. Featured filter: try to find repos with the "featured" topic
    const featuredRepos = filtered.filter((repo) =>
      repo.topics && repo.topics.includes("featured")
    );

    // Smart Fallback: If the user hasn't added the "featured" topic to any repos on GitHub yet,
    // we fall back to displaying the non-fork repositories to ensure the page doesn't look empty.
    if (featuredRepos.length > 0) {
      filtered = featuredRepos;
    }

    // 3. Sort: Latest updated repositories first
    filtered.sort(
      (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
    );

    return filtered;
  } catch (error) {
    console.error("Error fetching projects from GitHub:", error);
    return [];
  }
}

/**
 * Utility to fetch Rohan Yadav's general profile info from the GitHub API.
 */
export async function fetchProfile() {
  try {
    const headers = {
      Accept: "application/vnd.github.v3+json",
    };

    // Safely check for a local config token
    let token = null;
    try {
      const config = await import('../config.js').catch(() => null);
      if (config && config.GITHUB_TOKEN) {
        token = config.GITHUB_TOKEN;
      }
    } catch (e) {
      // Fail silently if no local token config is provided
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
      "https://api.github.com/users/Aimbot01",
      { headers }
    );

    if (!response.ok) {
      throw new Error(`GitHub Profile error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching profile from GitHub:", error);
    return null;
  }
}
