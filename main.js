// Commun — Global Interaction & State Controller

document.addEventListener('DOMContentLoaded', () => {
  // 1. Like Button Toggle
  document.querySelectorAll('.btn-like').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const countEl = btn.querySelector('.like-count');
      let count = parseInt(countEl ? countEl.textContent : '0', 10);
      const isLiked = btn.classList.toggle('liked');
      
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

  // 2. Bookmark / Save Button Toggle
  document.querySelectorAll('.btn-save').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isSaved = btn.classList.toggle('saved');
      const icon = btn.querySelector('.material-symbols-outlined');
      if (icon) {
        if (isSaved) {
          icon.classList.add('fill');
          showToast('Article saved to your library');
        } else {
          icon.classList.remove('fill');
          showToast('Removed from saved items');
        }
      }
    });
  });

  // 3. Follow / Unfollow Toggle
  document.querySelectorAll('.btn-follow-sm, .btn-follow-main').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (btn.classList.contains('following')) {
        btn.classList.remove('following');
        btn.textContent = 'Follow';
      } else {
        btn.classList.add('following');
        btn.textContent = 'Following';
      }
    });
  });

  // 4. Feed Tab Switching
  const feedTabs = document.querySelectorAll('.feed-tab');
  feedTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      feedTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  // 5. Post Item Navigation to Article
  document.querySelectorAll('.post-item[data-href]').forEach((post) => {
    post.addEventListener('click', () => {
      const url = post.getAttribute('data-href');
      if (url) window.location.href = url;
    });
  });
});

// Toast notification utility
function showToast(message) {
  let toast = document.getElementById('commun-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'commun-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #1e2330;
      color: #ffffff;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 0.88rem;
      font-weight: 500;
      border: 1px solid #282d3d;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      z-index: 1000;
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.2s ease;
      pointer-events: none;
    `;
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';

  clearTimeout(window.__toastTimeout);
  window.__toastTimeout = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
  }, 2400);
}
