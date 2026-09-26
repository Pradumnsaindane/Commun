// ==========================================================================
// Commun — Production-Quality Client Interactive Engine & Global Controller
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initCanvasNetwork();
  initCommandPalette();
  initAIAssistant();
  initFeedInteractions();
  initProjectFeatures();
  initOpportunitiesModal();
  initWorkspaceModule();
  initMessagingSystem();
  initDiscussionsSystem();
  initOnboardingWizard();
  initGlobalModals();
});

// --------------------------------------------------------------------------
// 1. Theme Manager
// --------------------------------------------------------------------------
function initTheme() {
  const savedTheme = localStorage.getItem('commun-theme') || 'obsidian';
  setTheme(savedTheme);

  document.querySelectorAll('[data-set-theme]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const theme = btn.getAttribute('data-set-theme');
      setTheme(theme);
      showToast(`Switched theme to ${theme.toUpperCase()}`);
    });
  });
}

function setTheme(theme) {
  document.body.classList.remove('theme-midnight', 'theme-matrix');
  if (theme === 'midnight') {
    document.body.classList.add('theme-midnight');
  } else if (theme === 'matrix') {
    document.body.classList.add('theme-matrix');
  }
  localStorage.setItem('commun-theme', theme);
}

// --------------------------------------------------------------------------
// 2. Interactive 3D / Dynamic Node Graph Visualizer (Landing Page Hero)
// --------------------------------------------------------------------------
function initCanvasNetwork() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = canvas.width = canvas.parentElement.clientWidth;
  let height = canvas.height = canvas.parentElement.clientHeight || 460;

  window.addEventListener('resize', () => {
    if (!canvas.parentElement) return;
    width = canvas.width = canvas.parentElement.clientWidth;
    height = canvas.height = canvas.parentElement.clientHeight || 460;
  });

  const nodeCount = Math.floor(width > 768 ? 48 : 24);
  const nodes = [];

  const types = [
    { label: 'Alex Chen', role: 'Distributed Systems', color: '#6366f1', type: 'developer' },
    { label: 'Sarah J.', role: 'Fullstack / React', color: '#3b82f6', type: 'developer' },
    { label: 'HyperScale AI', role: 'Rust Core Engine', color: '#10b981', type: 'project' },
    { label: 'CloudNative Org', role: 'Kubernetes Org', color: '#a855f7', type: 'org' },
    { label: 'Distributed Cache', role: 'Go / Raft', color: '#06b6d4', type: 'repo' },
    { label: 'Open Healthcare', role: 'Collab Opportunity', color: '#f59e0b', type: 'opportunity' }
  ];

  for (let i = 0; i < nodeCount; i++) {
    const meta = types[i % types.length];
    nodes.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      radius: i < 6 ? 6 : Math.random() * 3 + 2,
      meta: meta,
      isPrimary: i < 6,
      pulse: Math.random() * Math.PI
    });
  }

  let mouse = { x: -1000, y: -1000, isHovering: false };
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.isHovering = true;
  });

  canvas.addEventListener('mouseleave', () => {
    mouse.x = -1000;
    mouse.y = -1000;
    mouse.isHovering = false;
  });

  function render() {
    ctx.clearRect(0, 0, width, height);

    // Draw connecting links
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 130) {
          const alpha = (1 - dist / 130) * 0.28;
          ctx.beginPath();
          ctx.strokeStyle = nodes[i].isPrimary || nodes[j].isPrimary 
            ? `rgba(99, 102, 241, ${alpha * 1.5})` 
            : `rgba(148, 163, 184, ${alpha})`;
          ctx.lineWidth = nodes[i].isPrimary && nodes[j].isPrimary ? 1.5 : 0.75;
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    // Update and draw nodes
    nodes.forEach(node => {
      // Movement
      node.x += node.vx;
      node.y += node.vy;

      if (node.x < 10 || node.x > width - 10) node.vx *= -1;
      if (node.y < 10 || node.y > height - 10) node.vy *= -1;

      // Mouse interaction
      if (mouse.isHovering) {
        const mdx = node.x - mouse.x;
        const mdy = node.y - mouse.y;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mDist < 100 && mDist > 0) {
          node.x += (mdx / mDist) * 1.5;
          node.y += (mdy / mDist) * 1.5;
        }
      }

      // Draw glowing node
      node.pulse += 0.03;
      const pulseSize = node.isPrimary ? Math.sin(node.pulse) * 2 : 0;

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius + pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = node.meta.color;
      ctx.shadowColor = node.meta.color;
      ctx.shadowBlur = node.isPrimary ? 16 : 6;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw label for primary nodes
      if (node.isPrimary) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 11px Plus Jakarta Sans, sans-serif';
        ctx.fillText(node.meta.label, node.x + 10, node.y + 3);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '400 9px JetBrains Mono, monospace';
        ctx.fillText(node.meta.role, node.x + 10, node.y + 14);
      }
    });

    requestAnimationFrame(render);
  }

  render();
}

// --------------------------------------------------------------------------
// 3. Global Command Palette (Cmd + K / Ctrl + K)
// --------------------------------------------------------------------------
function initCommandPalette() {
  const palette = document.getElementById('cmd-palette-modal');
  const searchInput = document.getElementById('cmd-search-input');
  const resultsContainer = document.getElementById('cmd-results-list');
  if (!palette || !searchInput) return;

  const dataset = [
    { title: 'Discover People & Developers', category: 'Navigation', url: 'people.html', icon: 'group' },
    { title: 'Explore Open Source Projects', category: 'Navigation', url: 'projects.html', icon: 'folder_code' },
    { title: 'Jobs & Collaboration Opportunities', category: 'Navigation', url: 'opportunities.html', icon: 'work' },
    { title: 'Technical Discussions & RFCs', category: 'Navigation', url: 'discussions.html', icon: 'forum' },
    { title: 'Organization & Campus Workspaces', category: 'Navigation', url: 'workspace.html', icon: 'domain' },
    { title: 'Developer Resource Hub & Roadmaps', category: 'Navigation', url: 'resources.html', icon: 'library_books' },
    { title: 'Live Developer Messaging', category: 'Navigation', url: 'messages.html', icon: 'chat' },
    { title: 'Hackathons & Tech Events', category: 'Navigation', url: 'events.html', icon: 'event' },
    { title: 'Developer Profile (Alex Chen)', category: 'Profile', url: 'profile.html', icon: 'person' },
    { title: 'Create New Project', category: 'Action', action: 'create_project', icon: 'add_circle' },
    { title: 'Post Collaboration Request', category: 'Action', action: 'post_collab', icon: 'handshake' },
    { title: 'Ask Technical Question', category: 'Action', action: 'ask_question', icon: 'help_outline' },
    { title: 'Launch Commun AI Assistant', category: 'AI', action: 'open_ai', icon: 'auto_awesome' }
  ];

  function openPalette() {
    palette.classList.add('open');
    searchInput.value = '';
    renderResults(dataset);
    setTimeout(() => searchInput.focus(), 50);
  }

  function closePalette() {
    palette.classList.remove('open');
  }

  // Keyboard shortcut Cmd/Ctrl + K
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (palette.classList.contains('open')) {
        closePalette();
      } else {
        openPalette();
      }
    }
    if (e.key === 'Escape' && palette.classList.contains('open')) {
      closePalette();
    }
  });

  document.querySelectorAll('[data-trigger="cmd-palette"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openPalette();
    });
  });

  palette.addEventListener('click', (e) => {
    if (e.target === palette) closePalette();
  });

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase().trim();
    if (!q) {
      renderResults(dataset);
      return;
    }
    const filtered = dataset.filter(item => 
      item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
    );
    renderResults(filtered);
  });

  function renderResults(items) {
    if (!resultsContainer) return;
    if (items.length === 0) {
      resultsContainer.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--text-muted);">
          <span class="material-symbols-outlined" style="font-size: 32px; margin-bottom: 8px;">search_off</span>
          <p>No results found for your query</p>
        </div>
      `;
      return;
    }

    resultsContainer.innerHTML = items.map((item, idx) => `
      <div class="cmd-item ${idx === 0 ? 'selected' : ''}" data-url="${item.url || ''}" data-action="${item.action || ''}">
        <span class="material-symbols-outlined" style="color: var(--accent-primary); font-size: 20px;">${item.icon}</span>
        <div style="flex: 1;">
          <div style="font-weight: 600; color: var(--text-pure);">${item.title}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${item.category}</div>
        </div>
        <span class="material-symbols-outlined" style="font-size: 16px; color: var(--text-dim);">arrow_forward</span>
      </div>
    `).join('');

    resultsContainer.querySelectorAll('.cmd-item').forEach(itemEl => {
      itemEl.addEventListener('click', () => {
        closePalette();
        const url = itemEl.getAttribute('data-url');
        const action = itemEl.getAttribute('data-action');
        if (url) {
          window.location.href = url;
        } else if (action === 'open_ai') {
          toggleAIAssistant(true);
        } else if (action === 'create_project') {
          openModal('modal-create-project');
        } else if (action === 'ask_question') {
          openModal('modal-ask-question');
        } else if (action === 'post_collab') {
          openModal('modal-post-collab');
        }
      });
    });
  }
}

// --------------------------------------------------------------------------
// 4. Commun AI Assistant Drawer & Intelligent Queries
// --------------------------------------------------------------------------
function initAIAssistant() {
  const fab = document.getElementById('ai-fab-btn');
  const drawer = document.getElementById('ai-assistant-drawer');
  const closeBtn = document.getElementById('ai-drawer-close');
  const chatInput = document.getElementById('ai-chat-input');
  const sendBtn = document.getElementById('ai-send-btn');
  const messagesList = document.getElementById('ai-messages-list');
  const promptPills = document.querySelectorAll('.ai-preset-pill');

  if (fab) {
    fab.addEventListener('click', () => toggleAIAssistant(true));
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', () => toggleAIAssistant(false));
  }

  promptPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const text = pill.getAttribute('data-prompt') || pill.textContent;
      if (chatInput) {
        chatInput.value = text;
        submitAIQuery(text);
      }
    });
  });

  if (sendBtn && chatInput) {
    sendBtn.addEventListener('click', () => {
      const q = chatInput.value.trim();
      if (q) submitAIQuery(q);
    });

    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const q = chatInput.value.trim();
        if (q) submitAIQuery(q);
      }
    });
  }

  function submitAIQuery(query) {
    if (!messagesList || !chatInput) return;
    chatInput.value = '';

    // Append user query
    const userMsg = document.createElement('div');
    userMsg.style.cssText = 'align-self: flex-end; background: var(--accent-primary); color: #fff; padding: 10px 14px; border-radius: 12px 12px 2px 12px; margin-bottom: 12px; font-size: 0.88rem; max-width: 85%;';
    userMsg.textContent = query;
    messagesList.appendChild(userMsg);

    // AI typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.style.cssText = 'align-self: flex-start; background: var(--bg-elevated); border: 1px solid var(--border-subtle); padding: 10px 14px; border-radius: 12px 12px 12px 2px; margin-bottom: 12px; font-size: 0.85rem; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;';
    typingIndicator.innerHTML = `
      <span class="material-symbols-outlined" style="font-size: 16px; color: var(--accent-cyan); animation: pulseGlow 1.5s infinite;">auto_awesome</span>
      Analyzing Commun graph for "${query.slice(0, 24)}..."
    `;
    messagesList.appendChild(typingIndicator);
    messagesList.scrollTop = messagesList.scrollHeight;

    // Simulate smart semantic search response
    setTimeout(() => {
      typingIndicator.remove();
      const aiResponse = document.createElement('div');
      aiResponse.style.cssText = 'align-self: flex-start; background: var(--bg-card); border: 1px solid var(--border-highlight); padding: 14px; border-radius: 12px 12px 12px 2px; margin-bottom: 14px; font-size: 0.88rem; color: var(--text-primary); max-width: 95%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);';

      if (query.toLowerCase().includes('spring') || query.toLowerCase().includes('aws') || query.toLowerCase().includes('developer')) {
        aiResponse.innerHTML = `
          <div style="font-weight: 700; color: #a5b4fc; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <span class="material-symbols-outlined" style="font-size: 16px;">verified_user</span> 3 Matching Developers Found:
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
            <div style="background: var(--bg-elevated); padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between;">
              <div>
                <strong style="color: #fff;">David Kumar</strong> <span style="font-size: 0.75rem; color: var(--accent-emerald);">• 98% Match</span>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">Senior Java / Spring Boot Architect • AWS Certified</div>
              </div>
              <a href="people.html" class="btn btn-sm btn-primary" style="padding: 4px 8px; font-size: 0.75rem;">Connect</a>
            </div>
            <div style="background: var(--bg-elevated); padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between;">
              <div>
                <strong style="color: #fff;">Elena Rostova</strong> <span style="font-size: 0.75rem; color: var(--accent-emerald);">• 94% Match</span>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">Microservices & EKS Lead @ Fintech Labs</div>
              </div>
              <a href="people.html" class="btn btn-sm btn-primary" style="padding: 4px 8px; font-size: 0.75rem;">Connect</a>
            </div>
          </div>
        `;
      } else if (query.toLowerCase().includes('project') || query.toLowerCase().includes('contribute')) {
        aiResponse.innerHTML = `
          <div style="font-weight: 700; color: #93c5fd; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <span class="material-symbols-outlined" style="font-size: 16px;">rocket_launch</span> Recommended Open Projects:
          </div>
          <div style="background: var(--bg-elevated); padding: 10px; border-radius: 8px; border: 1px solid var(--border-subtle); margin-top: 6px;">
            <div style="font-weight: 600; color: #fff;">AI Healthcare Triage Engine</div>
            <p style="font-size: 0.78rem; color: var(--text-secondary); margin: 4px 0 8px;">Looking for React & Rust contributors for client-side encryption.</p>
            <a href="projects.html" class="btn btn-sm btn-secondary" style="font-size: 0.75rem;">View Collaboration Request</a>
          </div>
        `;
      } else {
        aiResponse.innerHTML = `
          <div style="font-weight: 600; color: #fff; margin-bottom: 6px;">Commun AI Semantic Match</div>
          <p style="font-size: 0.82rem; color: var(--text-secondary);">I indexed Commun's technical graph and highlighted relevant discussions, repositories, and developers aligned with your search.</p>
          <div style="margin-top: 10px; display: flex; gap: 8px;">
            <a href="discover.html" class="btn btn-sm btn-outline" style="font-size: 0.75rem;">Explore Full Index</a>
          </div>
        `;
      }

      messagesList.appendChild(aiResponse);
      messagesList.scrollTop = messagesList.scrollHeight;
    }, 900);
  }
}

function toggleAIAssistant(open) {
  const drawer = document.getElementById('ai-assistant-drawer');
  if (!drawer) return;
  if (open) {
    drawer.classList.add('open');
  } else {
    drawer.classList.remove('open');
  }
}

// --------------------------------------------------------------------------
// 5. Technical Feed Interactions & Post Composer
// --------------------------------------------------------------------------
function initFeedInteractions() {
  // Feed composer type switcher
  const typeBtns = document.querySelectorAll('.composer-type-btn');
  const typeBadge = document.getElementById('composer-active-type-badge');
  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      typeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const typeLabel = btn.getAttribute('data-type');
      if (typeBadge) typeBadge.textContent = typeLabel;
    });
  });

  // Like / Upvote Button Toggle
  document.querySelectorAll('.btn-like, .btn-upvote').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const countEl = btn.querySelector('.like-count, .upvote-count');
      let count = parseInt(countEl ? countEl.textContent : '0', 10);
      const isLiked = btn.classList.toggle('active');
      
      const icon = btn.querySelector('.material-symbols-outlined');
      if (icon) {
        if (isLiked) {
          icon.classList.add('fill');
          if (countEl) countEl.textContent = count + 1;
        } else {
          icon.classList.remove('fill');
          if (countEl) countEl.textContent = Math.max(0, count - 1);
        }
      }
    });
  });

  // Bookmark / Save
  document.querySelectorAll('.btn-save').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isSaved = btn.classList.toggle('saved');
      const icon = btn.querySelector('.material-symbols-outlined');
      if (icon) {
        if (isSaved) {
          icon.classList.add('fill');
          showToast('Added to your Saved items');
        } else {
          icon.classList.remove('fill');
          showToast('Removed from Saved items');
        }
      }
    });
  });

  // Share / Copy link
  document.querySelectorAll('.btn-share').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard?.writeText(window.location.href);
      showToast('Link copied to clipboard!');
    });
  });

  // Publish Post Form
  const publishBtn = document.getElementById('feed-publish-btn');
  const postContentInput = document.getElementById('feed-post-textarea');
  const feedList = document.getElementById('feed-posts-container');

  if (publishBtn && postContentInput && feedList) {
    publishBtn.addEventListener('click', () => {
      const content = postContentInput.value.trim();
      if (!content) {
        showToast('Please enter post content or code snippet');
        return;
      }

      const activeType = document.getElementById('composer-active-type-badge')?.textContent || 'Build Update';
      const newPost = document.createElement('div');
      newPost.className = 'card card-interactive post-card';
      newPost.style.cssText = 'margin-bottom: 20px; animation: fadeIn 0.3s ease;';

      newPost.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="avatar avatar-md">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" alt="You">
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <strong style="color: #fff;">You</strong>
                <span class="badge badge-primary" style="font-size: 0.7rem;">${activeType}</span>
              </div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">Just now • Full-Stack Engineer</div>
            </div>
          </div>
          <button class="btn btn-ghost btn-sm"><span class="material-symbols-outlined">more_horiz</span></button>
        </div>
        <p style="color: var(--text-primary); line-height: 1.6; margin-bottom: 12px; white-space: pre-wrap;">${content}</p>
        <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-subtle); padding-top: 12px;">
          <div style="display: flex; gap: 16px;">
            <button class="btn btn-ghost btn-sm btn-like"><span class="material-symbols-outlined">favorite</span> <span class="like-count">1</span></button>
            <button class="btn btn-ghost btn-sm"><span class="material-symbols-outlined">chat_bubble_outline</span> 0</button>
            <button class="btn btn-ghost btn-sm btn-share"><span class="material-symbols-outlined">share</span> Share</button>
          </div>
          <button class="btn btn-ghost btn-sm btn-save"><span class="material-symbols-outlined">bookmark_border</span></button>
        </div>
      `;

      feedList.prepend(newPost);
      postContentInput.value = '';
      showToast('Post published to technical feed!');
    });
  }
}

// --------------------------------------------------------------------------
// 6. Project Hub & Collaboration Requests
// --------------------------------------------------------------------------
function initProjectFeatures() {
  // Apply to collaborate modal trigger
  document.querySelectorAll('[data-collab-apply]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const projectTitle = btn.getAttribute('data-project-title') || 'Project';
      const role = btn.getAttribute('data-role') || 'Developer';
      
      const modal = document.getElementById('modal-apply-collab');
      if (modal) {
        const titleEl = modal.querySelector('#collab-modal-title');
        if (titleEl) titleEl.textContent = `Apply for ${role} @ ${projectTitle}`;
        openModal('modal-apply-collab');
      }
    });
  });

  // Star / Bookmark project
  document.querySelectorAll('.btn-star-project').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const countEl = btn.querySelector('.star-count');
      let count = parseInt(countEl ? countEl.textContent : '0', 10);
      const isStarred = btn.classList.toggle('active');
      const icon = btn.querySelector('.material-symbols-outlined');
      
      if (isStarred) {
        if (icon) icon.classList.add('fill');
        if (countEl) countEl.textContent = count + 1;
        showToast('Project starred & added to your watch list');
      } else {
        if (icon) icon.classList.remove('fill');
        if (countEl) countEl.textContent = Math.max(0, count - 1);
        showToast('Removed from starred projects');
      }
    });
  });

  // Kanban task status update
  document.querySelectorAll('.kanban-task-card').forEach(task => {
    task.addEventListener('click', () => {
      showToast('Task details loaded');
    });
  });
}

// --------------------------------------------------------------------------
// 7. Opportunities & Jobs System
// --------------------------------------------------------------------------
function initOpportunitiesModal() {
  document.querySelectorAll('[data-apply-opp]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const jobTitle = btn.getAttribute('data-opp-title') || 'Opportunity';
      const org = btn.getAttribute('data-opp-org') || 'Company';

      const modal = document.getElementById('modal-apply-job');
      if (modal) {
        const titleEl = modal.querySelector('#job-modal-title');
        if (titleEl) titleEl.textContent = `Apply for ${jobTitle} at ${org}`;
        openModal('modal-apply-job');
      }
    });
  });

  const submitAppBtn = document.getElementById('btn-submit-application');
  if (submitAppBtn) {
    submitAppBtn.addEventListener('click', () => {
      closeModal('modal-apply-job');
      showToast('🎉 Application successfully submitted to hiring team!');
    });
  }
}

// --------------------------------------------------------------------------
// 8. Multi-Tenant SaaS Workspace & Role-Based Access Control (RBAC)
// --------------------------------------------------------------------------
function initWorkspaceModule() {
  // Tenant Organization Switcher
  const orgSwitcher = document.getElementById('workspace-org-select');
  if (orgSwitcher) {
    orgSwitcher.addEventListener('change', () => {
      const selectedOrg = orgSwitcher.value;
      showToast(`Switched workspace to: ${selectedOrg}`);
    });
  }

  // RBAC Role Preview Switcher
  const roleSelect = document.getElementById('rbac-role-preview-select');
  if (roleSelect) {
    roleSelect.addEventListener('change', () => {
      const role = roleSelect.value;
      const adminOnlyElements = document.querySelectorAll('.rbac-admin-only');
      const ownerOnlyElements = document.querySelectorAll('.rbac-owner-only');

      if (role === 'guest' || role === 'member') {
        adminOnlyElements.forEach(el => el.style.display = 'none');
        ownerOnlyElements.forEach(el => el.style.display = 'none');
      } else if (role === 'admin') {
        adminOnlyElements.forEach(el => el.style.display = '');
        ownerOnlyElements.forEach(el => el.style.display = 'none');
      } else {
        adminOnlyElements.forEach(el => el.style.display = '');
        ownerOnlyElements.forEach(el => el.style.display = '');
      }

      showToast(`Workspace viewing permission: ${role.toUpperCase()}`);
    });
  }

  // Billing Cycle Toggle (Monthly vs Annual)
  const billingToggle = document.getElementById('billing-cycle-toggle');
  if (billingToggle) {
    billingToggle.addEventListener('change', () => {
      const isAnnual = billingToggle.checked;
      document.querySelectorAll('.pricing-val').forEach(el => {
        const monthly = el.getAttribute('data-monthly');
        const annual = el.getAttribute('data-annual');
        if (isAnnual && annual) {
          el.textContent = annual;
        } else if (!isAnnual && monthly) {
          el.textContent = monthly;
        }
      });
      showToast(isAnnual ? 'Applied 20% annual subscription discount' : 'Monthly billing active');
    });
  }
}

// --------------------------------------------------------------------------
// 9. Developer Messaging & Channels
// --------------------------------------------------------------------------
function initMessagingSystem() {
  const chatForm = document.getElementById('chat-composer-form');
  const chatInput = document.getElementById('chat-input-text');
  const chatFeed = document.getElementById('chat-messages-container');

  if (chatForm && chatInput && chatFeed) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;

      const userMsg = document.createElement('div');
      userMsg.style.cssText = 'display: flex; gap: 12px; margin-bottom: 16px; align-self: flex-end; justify-content: flex-end; animation: fadeIn 0.2s ease;';
      userMsg.innerHTML = `
        <div style="background: var(--accent-primary); color: #fff; padding: 10px 14px; border-radius: 12px 12px 2px 12px; font-size: 0.88rem; max-width: 75%;">
          <div>${text}</div>
          <div style="font-size: 0.7rem; color: rgba(255,255,255,0.7); text-align: right; margin-top: 4px;">Just now</div>
        </div>
      `;
      chatFeed.appendChild(userMsg);
      chatInput.value = '';
      chatFeed.scrollTop = chatFeed.scrollHeight;

      // Simulated auto-reply
      setTimeout(() => {
        const replyMsg = document.createElement('div');
        replyMsg.style.cssText = 'display: flex; gap: 12px; margin-bottom: 16px; animation: fadeIn 0.2s ease;';
        replyMsg.innerHTML = `
          <div class="avatar avatar-sm"><img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150" alt="Sarah"></div>
          <div style="background: var(--bg-elevated); border: 1px solid var(--border-subtle); padding: 10px 14px; border-radius: 12px 12px 12px 2px; font-size: 0.88rem; max-width: 75%;">
            <div style="font-weight: 600; color: #fff; font-size: 0.78rem; margin-bottom: 2px;">Sarah Jenkins</div>
            <div>Sounds great! I just pushed the PR branch to staging. Let's test the Raft cluster benchmark.</div>
            <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 4px;">Just now</div>
          </div>
        `;
        chatFeed.appendChild(replyMsg);
        chatFeed.scrollTop = chatFeed.scrollHeight;
      }, 1200);
    });
  }
}

// --------------------------------------------------------------------------
// 10. Technical Discussions & Code Q&A
// --------------------------------------------------------------------------
function initDiscussionsSystem() {
  // Upvote Answer
  document.querySelectorAll('.btn-answer-upvote').forEach(btn => {
    btn.addEventListener('click', () => {
      const countEl = btn.querySelector('.upvote-count');
      let count = parseInt(countEl ? countEl.textContent : '0', 10);
      const isUpvoted = btn.classList.toggle('active');
      if (countEl) countEl.textContent = isUpvoted ? count + 1 : Math.max(0, count - 1);
    });
  });

  // Mark as accepted solution (author action)
  document.querySelectorAll('.btn-mark-accepted').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.answer-card');
      if (card) {
        card.classList.toggle('accepted-solution');
        showToast('Solution marked as accepted answer ✅');
      }
    });
  });

  // Copy code snippet to clipboard
  document.querySelectorAll('.btn-copy-code').forEach(btn => {
    btn.addEventListener('click', () => {
      const container = btn.closest('.code-block-container');
      const code = container ? container.querySelector('code')?.innerText : '';
      if (code) {
        navigator.clipboard.writeText(code);
        showToast('Code snippet copied to clipboard');
      }
    });
  });
}

// --------------------------------------------------------------------------
// 11. Multi-Step Onboarding Wizard
// --------------------------------------------------------------------------
function initOnboardingWizard() {
  const wizardContainer = document.getElementById('onboarding-wizard');
  if (!wizardContainer) return;

  let currentStep = 1;
  const totalSteps = 5;

  const nextBtn = document.getElementById('wizard-next-btn');
  const prevBtn = document.getElementById('wizard-prev-btn');
  const stepIndicators = document.querySelectorAll('.wizard-step-dot');
  const stepPanels = document.querySelectorAll('.wizard-step-panel');

  function updateStep(step) {
    currentStep = step;
    stepPanels.forEach(panel => {
      const panelStep = parseInt(panel.getAttribute('data-step'), 10);
      panel.style.display = panelStep === currentStep ? 'block' : 'none';
    });

    stepIndicators.forEach((dot, idx) => {
      if (idx + 1 < currentStep) {
        dot.className = 'wizard-step-dot completed';
      } else if (idx + 1 === currentStep) {
        dot.className = 'wizard-step-dot active';
      } else {
        dot.className = 'wizard-step-dot';
      }
    });

    if (prevBtn) prevBtn.style.display = currentStep > 1 ? 'inline-flex' : 'none';
    if (nextBtn) {
      nextBtn.textContent = currentStep === totalSteps ? 'Launch Commun Dashboard' : 'Continue →';
    }
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentStep < totalSteps) {
        updateStep(currentStep + 1);
      } else {
        showToast('Welcome to Commun! Loading your developer home...');
        setTimeout(() => {
          window.location.href = 'feed.html';
        }, 800);
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentStep > 1) updateStep(currentStep - 1);
    });
  }

  // Multi-select pills
  document.querySelectorAll('.wizard-selectable-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      pill.classList.toggle('selected');
    });
  });
}

// --------------------------------------------------------------------------
// 12. Global Modal Management Utilities
// --------------------------------------------------------------------------
function initGlobalModals() {
  document.querySelectorAll('[data-open-modal]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const modalId = trigger.getAttribute('data-open-modal');
      openModal(modalId);
    });
  });

  document.querySelectorAll('[data-close-modal]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const modal = trigger.closest('.modal-backdrop');
      if (modal) modal.classList.remove('open');
    });
  });

  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.classList.remove('open');
    });
  });
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('open');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('open');
}

// Toast Notification Manager
function showToast(message) {
  let toast = document.getElementById('commun-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'commun-toast';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <span class="material-symbols-outlined" style="font-size: 18px; color: var(--accent-cyan);">info</span>
    <span>${message}</span>
  `;
  toast.classList.add('show');

  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}
