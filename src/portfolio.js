import { fetchProjects } from './utils/github.js';

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
