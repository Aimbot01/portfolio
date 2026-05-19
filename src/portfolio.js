import { fetchProjects, fetchProfile } from './utils/github.js';

// Map repo names or topics to emojis for visual excellence
function getProjectEmoji(name, language) {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('review') || nameLower.includes('agent')) return '🤖';
  if (nameLower.includes('attend') || nameLower.includes('smart')) return '📱';
  if (nameLower.includes('manage') || nameLower.includes('restaurant')) return '🍽️';
  if (nameLower.includes('eoms') || nameLower.includes('shop') || nameLower.includes('order')) return '🛒';
  if (nameLower.includes('portfolio')) return '💼';
  
  // Language fallbacks
  const langLower = (language || '').toLowerCase();
  if (langLower.includes('python')) return '🐍';
  if (langLower.includes('java')) return '☕';
  if (langLower.includes('javascript') || langLower.includes('js')) return '🟨';
  if (langLower.includes('html') || langLower.includes('css')) return '🌐';
  
  return '💻';
}

document.addEventListener('DOMContentLoaded', async () => {
  const projectsGrid = document.querySelector('.projects-grid');
  if (!projectsGrid) return;

  // Render a beautiful modern glassmorphism loader
  projectsGrid.innerHTML = `
    <div class="reveal visible" style="grid-column: 1 / -1; text-align: center; padding: 48px; font-family: 'DM Mono', monospace; color: var(--accent);">
      <div class="loader-spinner" style="
        display: inline-block;
        width: 32px; height: 32px;
        border: 2px solid rgba(0, 212, 255, 0.1);
        border-radius: 50%;
        border-top-color: var(--accent);
        animation: spin 1s ease infinite;
        margin-bottom: 12px;
      "></div>
      <p style="font-size: 14px; letter-spacing: 0.05em;">SYNCHRONIZING WITH GITHUB...</p>
    </div>
    <style>
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
  `;

  // Fetch repositories from GitHub
  const repos = await fetchProjects();

  // If no repositories were fetched, show a fallback message
  if (repos.length === 0) {
    projectsGrid.innerHTML = `
      <div class="reveal visible" style="grid-column: 1 / -1; text-align: center; padding: 48px; border: 1px solid var(--border); border-radius: 20px; background: var(--surface);">
        <span style="font-size: 32px;">⚠️</span>
        <h3 style="font-family: 'Syne', sans-serif; font-size: 20px; margin-top: 12px;">Failed to load projects</h3>
        <p style="color: var(--muted); margin-top: 8px; font-size: 14px;">Please check your connection or rate limit configuration.</p>
      </div>
    `;
    return;
  }

  // Clear loader and populate projects
  projectsGrid.innerHTML = '';

  // Dynamically update project count statistics across the portfolio
  const projectCount = repos.length;
  const builtStat = document.querySelector('.hero-stats .stat:first-child .stat-num');
  const shippedCounter = document.querySelector('.counters .counter-card:first-child .counter-num');
  
  if (builtStat) {
    builtStat.dataset.target = projectCount;
    builtStat.textContent = projectCount;
  }
  if (shippedCounter) {
    shippedCounter.dataset.target = projectCount;
    shippedCounter.textContent = projectCount;
  }

  repos.forEach((repo, index) => {
    const emoji = getProjectEmoji(repo.name, repo.language);
    const updatedDate = new Date(repo.updated_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    // Create the project card element
    const card = document.createElement('div');
    card.className = `project-card reveal reveal-delay-${(index % 3) + 1}`;
    
    // Auto-detect and separate tech stack tags (language + other topics)
    const techTags = [];
    if (repo.language) {
      techTags.push(repo.language);
    }
    if (repo.topics) {
      repo.topics.forEach(topic => {
        if (topic !== 'featured' && topic !== repo.language?.toLowerCase()) {
          // Capitalize first letter of topics for professional look
          const formattedTopic = topic.charAt(0).toUpperCase() + topic.slice(1);
          if (!techTags.includes(formattedTopic)) {
            techTags.push(formattedTopic);
          }
        }
      });
    }

    // Build the Tech badges HTML
    const techBadgesHTML = techTags.map(tech => `<span class="tech-badge">${tech}</span>`).join('');

    // Check for stars count
    const starsHTML = repo.stargazers_count > 0 
      ? `<span class="tech-badge" style="background: rgba(255, 215, 0, 0.08); border-color: rgba(255, 215, 0, 0.2); color: #ffd700;">⭐ ${repo.stargazers_count}</span>` 
      : '';

    // Check for homepage/live demo
    const liveDemoBtnHTML = repo.homepage 
      ? `<a href="${repo.homepage}" target="_blank" class="proj-btn proj-demo">↗ Live Demo</a>` 
      : '';

    card.innerHTML = `
      <div class="project-icon">${emoji}</div>
      <div class="project-title">${repo.name}</div>
      <p style="font-family: 'DM Mono', monospace; font-size: 11px; color: var(--muted); margin-bottom: 8px; display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
        <span>Updated: ${updatedDate}</span>
        ${starsHTML}
      </p>
      <div class="project-desc">${repo.description || 'Public repository built and open-sourced on GitHub.'}</div>
      <div class="project-tech">
        ${techBadgesHTML}
      </div>
      <div class="project-links">
        <a href="${repo.html_url}" target="_blank" class="proj-btn proj-github">⬡ GitHub</a>
        ${liveDemoBtnHTML}
      </div>
    `;

    projectsGrid.appendChild(card);
  });

  // --- Dynamic GitHub Profile & Language Stats Enhancement ---
  try {
    const profile = await fetchProfile();
    if (profile) {
      // 1. Update Avatar image in the GitHub card
      const avatarEl = document.querySelector('.gh-avatar');
      if (avatarEl) {
        avatarEl.outerHTML = `
          <img src="${profile.avatar_url}" alt="${profile.login}" class="gh-avatar" style="
            width: 80px; height: 80px; border-radius: 50%;
            border: 2px solid var(--accent); object-fit: cover;
            background: var(--surface2);
          ">
        `;
      }

      // 2. Update Stats (Public Repos count & stars summed up from fetched repos)
      const totalStars = repos.reduce((acc, repo) => acc + (repo.stargazers_count || 0), 0);
      const statsEl = document.querySelector('.gh-stats');
      if (statsEl) {
        statsEl.innerHTML = `
          <div class="gh-stat"><div class="gh-stat-num">${profile.public_repos}</div><div class="gh-stat-label">Public Repos</div></div>
          <div class="gh-stat"><div class="gh-stat-num">${totalStars}</div><div class="gh-stat-label">Total Stars</div></div>
        `;
      }
    }
  } catch (err) {
    console.error("Error populating GitHub card details:", err);
  }

  // Calculate and render Language Breakdown dynamically
  try {
    const languageCounts = {};
    let totalLanguages = 0;
    
    // Process languages from all repos (excluding the profile readme) for accuracy
    repos.forEach(repo => {
      if (repo.language) {
        languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
        totalLanguages++;
      }
    });

    if (totalLanguages > 0) {
      const languagePercentages = Object.entries(languageCounts).map(([lang, count]) => ({
        name: lang,
        percentage: Math.round((count / totalLanguages) * 100)
      })).sort((a, b) => b.percentage - a.percentage);

      const languageColors = {
        JavaScript: 'linear-gradient(90deg, #f7df1e, #e0c800)',
        CSS: 'linear-gradient(90deg, #264de4, #4b7ff7)',
        HTML: 'linear-gradient(90deg, #e34f26, #f06529)',
        Java: 'linear-gradient(90deg, #ed8b00, #f5a623)',
        Python: 'linear-gradient(90deg, #3776ab, #ffd343)',
        C: 'linear-gradient(90deg, #a8b9cc, #555555)',
        SQL: 'linear-gradient(90deg, #00758f, #f29111)',
      };
      const defaultColor = 'linear-gradient(90deg, var(--accent), var(--accent2))';

      const langBars = document.querySelector('.lang-bars');
      if (langBars) {
        langBars.innerHTML = languagePercentages.map(lang => {
          const color = languageColors[lang.name] || defaultColor;
          return `
            <div class="lang-bar-item">
              <span class="lang-name">${lang.name}</span>
              <div class="lang-track">
                <div class="lang-fill" style="width:0%; background:${color};" data-w="${lang.percentage}"></div>
              </div>
              <span class="lang-pct">${lang.percentage}%</span>
            </div>
          `;
        }).join('');

        // Re-trigger scroll reveal observer for language progress fill
        if (window.lObserver) {
          window.lObserver.observe(langBars);
        }
      }
    }
  } catch (err) {
    console.error("Error populating language breakdown:", err);
  }

  // Re-observe the dynamically created reveal elements for smooth scroll reveal
  const scrollObserver = window.observer || new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.15 });

  projectsGrid.querySelectorAll('.reveal').forEach(el => {
    scrollObserver.observe(el);
  });

  // Re-attach custom hover listeners to the new dynamic links/buttons for the custom cursor scaling effect
  const cursor = document.getElementById('cursor');
  const trail = document.getElementById('cursor-trail');
  if (cursor && trail) {
    projectsGrid.querySelectorAll('a, button, .proj-btn').forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.style.transform = 'scale(2.5)';
        trail.style.transform = 'scale(1.5)';
      });
      el.addEventListener('mouseleave', () => {
        cursor.style.transform = 'scale(1)';
        trail.style.transform = 'scale(1)';
      });
    });
  }
});
