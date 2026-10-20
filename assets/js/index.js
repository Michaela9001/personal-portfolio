/* ==========================================================================
   Starlit Portfolio — Homepage renderer
   Reads canonical data from PortfolioStore and renders every dynamic region.
   All user-provided text is written with textContent (never innerHTML).
   ========================================================================== */
(function () {
  'use strict';

  var store = window.PortfolioStore;
  if (!store) {
    console.error('[portfolio] PortfolioStore is missing. Check assets/js/store.js.');
    return;
  }

  var REDUCED_MOTION =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var revealObserver = null;
  var skillObserver = null;

  /* ---------- Static icon constants (no user input) --------------------- */
  var ICONS = {
    github:
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.17c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z"/></svg>',
    linkedin:
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>',
    zhihu:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="1.6"/><text x="12" y="16.4" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor" stroke="none" font-family="sans-serif">知</text></svg>',
    bilibili:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6.5" width="18" height="13" rx="3.5"/><path d="M7.5 3.5 10 6.5M16.5 3.5 14 6.5"/><path d="M9 11v2.5M15 11v2.5"/></svg>',
    website:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.4 3.8 5.5 3.8 9S14.5 18.6 12 21c-2.5-2.4-3.8-5.5-3.8-9S9.5 5.4 12 3z"/></svg>',
    mail:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></svg>',
    external:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/></svg>',
    pin:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>',
    spark:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.1 5.4L20 10.5l-5.9 2.1L12 18l-2.1-5.4L4 10.5l5.9-2.1L12 3z"/></svg>',
    arrow:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };

  var SOCIALS = [
    { key: 'github', label: 'GitHub', icon: ICONS.github },
    { key: 'linkedin', label: 'LinkedIn', icon: ICONS.linkedin },
    { key: 'zhihu', label: '知乎', icon: ICONS.zhihu },
    { key: 'bilibili', label: '哔哩哔哩', icon: ICONS.bilibili },
    { key: 'website', label: '个人网站', icon: ICONS.website }
  ];

  /* ---------- Helpers --------------------------------------------------- */
  function byId(id) {
    return document.getElementById(id);
  }

  function setText(id, value) {
    var el = byId(id);
    if (el) el.textContent = value == null ? '' : String(value);
  }

  function initials(profile) {
    var name = (profile.name || '').trim();
    if (/[\u3400-\u9fff]/.test(name)) {
      return Array.from(name)[0];
    }

    var words = (profile.nameEn || name).match(/[A-Za-z]+/g);
    if (words && words.length) {
      var letters = words.slice(0, 2).map(function (word) {
        return word.charAt(0).toUpperCase();
      });
      return letters.join('') || '★';
    }

    return Array.from(name)[0] || '★';
  }

  function mailto(email) {
    return 'mailto:' + email;
  }

  function create(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = String(text);
    return el;
  }

  /* ---------- Avatar ---------------------------------------------------- */
  function renderAvatar(profile) {
    var img = byId('hero-avatar-img');
    var fallback = byId('hero-avatar-fallback');
    if (!img || !fallback) return;

    var label = initials(profile);
    fallback.textContent = label;
    fallback.hidden = false;
    img.alt = profile.name ? profile.name + ' 的头像' : '头像';

    var url = store.safeUrl(profile.avatarUrl, {
      allowDataImage: true,
      allowRelative: true
    });

    if (!url) {
      img.hidden = true;
      img.removeAttribute('src');
      return;
    }

    img.hidden = false;

    // Re-render with the same URL may not fire `load` again; hide the
    // fallback explicitly so it never covers an already-loaded avatar.
    if (img.getAttribute('src') === url && img.complete && img.naturalWidth > 0) {
      fallback.hidden = true;
      return;
    }

    img.onload = function () {
      fallback.hidden = true;
    };
    img.onerror = function () {
      img.hidden = true;
      img.removeAttribute('src');
      fallback.hidden = false;
    };
    img.src = url;
  }

  /* ---------- Social links ---------------------------------------------- */
  function renderSocials(containerId, profile, options) {
    var container = byId(containerId);
    if (!container) return;

    var opts = options || {};
    container.replaceChildren();

    SOCIALS.forEach(function (meta) {
      var raw = profile.socials ? profile.socials[meta.key] : '';
      var url = store.safeUrl(raw);
      if (!url) return;

      var link = document.createElement('a');
      link.className = 'social-link';
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.title = meta.label;
      link.setAttribute('aria-label', meta.label);
      link.innerHTML = meta.icon;
      if (!opts.compact) {
        link.appendChild(create('span', null, meta.label));
      }
      container.appendChild(link);
    });

    if (profile.email) {
      var mail = document.createElement('a');
      mail.className = 'social-link';
      mail.href = mailto(profile.email);
      mail.title = profile.email;
      mail.setAttribute('aria-label', '发送邮件至 ' + profile.email);
      mail.innerHTML = ICONS.mail;
      if (!opts.compact) {
        mail.appendChild(create('span', null, '邮箱'));
      }
      container.appendChild(mail);
    }

    if (!container.childElementCount && opts.emptyHint) {
      container.appendChild(
        create('span', 'text-dim', '暂无社交链接 · 可在管理后台添加')
      );
    }
  }

  /* ---------- Profile --------------------------------------------------- */
  function renderProfile(profile) {
    document.title = profile.name + ' · ' + profile.title;

    var description = byId('meta-description');
    if (description) {
      description.setAttribute('content', (profile.bio || profile.title).slice(0, 150));
    }

    setText('brand-name', profile.name);
    setText('hero-name', profile.name);
    setText('hero-name-en', profile.nameEn || '');
    setText('hero-title', profile.title);
    setText('hero-title-en', profile.titleEn || '');
    setText('hero-status-text', profile.availability || '');
    setText('footer-name', profile.name);

    var heroBio = byId('hero-bio');
    if (heroBio) {
      heroBio.textContent = profile.bio || '';
      heroBio.hidden = !profile.bio;
    }

    var status = byId('hero-status');
    if (status) status.hidden = !profile.availability;

    renderAvatar(profile);
    renderSocials('hero-socials', profile, { emptyHint: true });
    renderSocials('about-socials', profile, { compact: true, emptyHint: false });
    renderSocials('footer-socials', profile, { compact: true, emptyHint: false });

    renderAbout(profile);
    renderContact(profile);
  }

  function renderAbout(profile) {
    var bio = byId('about-bio');
    if (bio) {
      bio.replaceChildren();
      var paragraphs = (profile.bio || '').split(/\n+/).filter(function (line) {
        return line.trim().length > 0;
      });

      if (!paragraphs.length) {
        bio.appendChild(create('p', 'text-dim', '这位同学还没有填写简介，去管理后台补充一段吧。'));
      } else {
        paragraphs.forEach(function (text) {
          bio.appendChild(create('p', null, text.trim()));
        });
      }
    }

    var locationRow = byId('about-location-row');
    setText('about-location', profile.location || '');
    if (locationRow) locationRow.hidden = !profile.location;

    var availabilityRow = byId('about-availability-row');
    setText('about-availability', profile.availability || '');
    if (availabilityRow) availabilityRow.hidden = !profile.availability;

    var emailRow = byId('about-email-row');
    var emailLink = byId('about-email');
    if (emailLink) {
      if (profile.email) {
        emailLink.href = mailto(profile.email);
        emailLink.textContent = profile.email;
      } else {
        emailLink.removeAttribute('href');
        emailLink.textContent = '';
      }
    }
    if (emailRow) emailRow.hidden = !profile.email;
  }

  function renderContact(profile) {
    var heroMail = byId('hero-mail');
    if (heroMail) {
      if (profile.email) {
        heroMail.hidden = false;
        heroMail.href = mailto(profile.email);
        heroMail.setAttribute('aria-label', '发送邮件至 ' + profile.email);
      } else {
        heroMail.hidden = true;
        heroMail.removeAttribute('href');
      }
    }

    var cta = byId('contact-email');
    if (cta) {
      if (profile.email) {
        cta.hidden = false;
        cta.href = mailto(profile.email);
        setText('contact-email-text', profile.email);
      } else {
        cta.hidden = true;
        cta.removeAttribute('href');
      }
    }

    setText('contact-name', profile.name || '我');
  }

  /* ---------- Skills ---------------------------------------------------- */
  function renderSkills(skills) {
    var grid = byId('skills-grid');
    if (!grid) return;

    grid.replaceChildren();

    var groups = new Map();
    skills.forEach(function (skill) {
      if (!groups.has(skill.category)) groups.set(skill.category, []);
      groups.get(skill.category).push(skill);
    });

    setText(
      'skills-count',
      skills.length + ' 项技能 · ' + groups.size + ' 个方向'
    );

    if (!skills.length) {
      grid.appendChild(
        createEmptyState('还没有技能条目', '在管理后台添加你的技术栈与熟练度。')
      );
      return;
    }

    groups.forEach(function (items, category) {
      var card = create('div', 'glass-card reveal');

      var head = create('div', 'skill-group-head');
      var title = create('h3', 'card-title', category);
      var count = create('span', 'chip', items.length + ' 项');
      head.appendChild(title);
      head.appendChild(count);

      var list = create('div', 'skill-list');

      items.forEach(function (skill) {
        var item = create('div', 'skill-item');
        var meta = create('div', 'skill-meta');
        var name = create('span', 'skill-name', skill.name);
        var level = create('span', 'skill-level', skill.level + '%');
        meta.appendChild(name);
        meta.appendChild(level);

        var track = create('div', 'skill-track');
        track.setAttribute('role', 'progressbar');
        track.setAttribute('aria-label', skill.name + ' 熟练度');
        track.setAttribute('aria-valuemin', '0');
        track.setAttribute('aria-valuemax', '100');
        track.setAttribute('aria-valuenow', String(skill.level));
        track.dataset.level = String(skill.level);

        var fill = create('span', 'skill-fill');
        track.appendChild(fill);

        item.appendChild(meta);
        item.appendChild(track);
        list.appendChild(item);
      });

      card.appendChild(head);
      card.appendChild(list);
      grid.appendChild(card);
    });
  }

  function animateSkillBars() {
    var tracks = Array.prototype.slice.call(
      document.querySelectorAll('.skill-track[data-level]')
    );

    if (!tracks.length) return;

    function fill(track) {
      var bar = track.querySelector('.skill-fill');
      if (bar) bar.style.width = track.dataset.level + '%';
    }

    if (REDUCED_MOTION || typeof IntersectionObserver === 'undefined') {
      tracks.forEach(fill);
      return;
    }

    if (skillObserver) skillObserver.disconnect();

    skillObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          fill(entry.target);
          skillObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.3 }
    );

    tracks.forEach(function (track) {
      var bar = track.querySelector('.skill-fill');
      if (bar) bar.style.width = '0%';
      skillObserver.observe(track);
    });
  }

  /* ---------- Projects -------------------------------------------------- */
  function createEmptyState(title, hint) {
    var wrap = create('div', 'empty-state reveal');
    wrap.appendChild(create('strong', null, title));
    wrap.appendChild(create('p', null, hint));

    var link = document.createElement('a');
    link.className = 'btn btn-ghost btn-sm';
    link.href = './admin.html';
    link.textContent = '前往管理后台';
    wrap.appendChild(link);

    return wrap;
  }

  function projectLink(href, label, icon) {
    var link = document.createElement('a');
    link.className = 'project-link';
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.innerHTML = icon;
    link.appendChild(create('span', null, label));
    return link;
  }

  function renderProjects(projects) {
    var grid = byId('projects-grid');
    if (!grid) return;

    grid.replaceChildren();
    setText('projects-count', projects.length + ' 个作品');

    if (!projects.length) {
      grid.appendChild(
        createEmptyState('作品集还是空的', '在管理后台添加你的第一个项目。')
      );
      return;
    }

    projects.forEach(function (project, index) {
      var card = create('article', 'glass-card project-card reveal');
      var titleId = 'project-title-' + index;
      card.setAttribute('aria-labelledby', titleId);

      var top = create('div', 'project-top');
      top.appendChild(
        create('span', 'project-index', 'PROJECT ' + String(index + 1).padStart(2, '0'))
      );
      if (project.featured) {
        top.appendChild(create('span', 'badge-featured', '★ 精选'));
      }

      var title = create('h3', 'project-title', project.title);
      title.id = titleId;

      var desc = create(
        'p',
        'project-desc',
        project.description || '暂无项目描述。'
      );

      var tags = create('div', 'chip-row');
      project.tags.forEach(function (tag) {
        tags.appendChild(create('span', 'tag', tag));
      });

      card.appendChild(top);
      card.appendChild(title);
      card.appendChild(desc);
      if (project.tags.length) card.appendChild(tags);

      var links = create('div', 'project-links');
      var linkUrl = store.safeUrl(project.link);
      var repoUrl = store.safeUrl(project.repo);

      if (linkUrl) {
        links.appendChild(projectLink(linkUrl, '在线预览', ICONS.external));
      }
      if (repoUrl) {
        links.appendChild(projectLink(repoUrl, '查看源码', ICONS.github));
      }
      if (!linkUrl && !repoUrl) {
        links.appendChild(create('span', 'text-dim', '暂无公开链接'));
      }

      card.appendChild(links);
      grid.appendChild(card);
    });
  }

  /* ---------- Stats & counters ------------------------------------------ */
  function updateStats(data) {
    setText('stat-projects', String(data.projects.length).padStart(2, '0'));
    setText('stat-skills', String(data.skills.length).padStart(2, '0'));

    var categories = new Set(
      data.skills.map(function (skill) {
        return skill.category;
      })
    );
    setText('stat-tracks', String(categories.size).padStart(2, '0'));
    setText('footer-year', String(new Date().getFullYear()));
  }

  /* ---------- Reveal on scroll ------------------------------------------ */
  function observeReveals() {
    var elements = Array.prototype.slice.call(
      document.querySelectorAll('.reveal:not(.is-visible)')
    );

    if (!elements.length) return;

    if (REDUCED_MOTION || typeof IntersectionObserver === 'undefined') {
      elements.forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
      );
    }

    elements.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ---------- Navigation ------------------------------------------------ */
  var MENU_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  var CLOSE_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

  function setupNavigation() {
    var toggle = byId('menu-toggle');
    var menu = byId('mobile-menu');

    function closeMenu() {
      if (!menu || !toggle) return;
      menu.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = MENU_ICON;
    }

    if (toggle && menu) {
      toggle.innerHTML = MENU_ICON;
      toggle.addEventListener('click', function () {
        var willOpen = menu.hidden;
        menu.hidden = !willOpen;
        toggle.setAttribute('aria-expanded', String(willOpen));
        toggle.innerHTML = willOpen ? CLOSE_ICON : MENU_ICON;
      });

      menu.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', closeMenu);
      });

      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') closeMenu();
      });
    }

    var links = Array.prototype.slice.call(
      document.querySelectorAll('.nav-link[data-nav]')
    );
    var sections = links
      .map(function (link) {
        return document.getElementById(link.getAttribute('href').slice(1));
      })
      .filter(Boolean);

    function setActive(id) {
      links.forEach(function (link) {
        var isActive = link.getAttribute('href') === '#' + id;
        link.classList.toggle('is-active', isActive);
        if (isActive) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    }

    if (!sections.length) return;

    if (typeof IntersectionObserver === 'undefined') {
      setActive('home');
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  /* ---------- Render everything ----------------------------------------- */
  function renderAll(data) {
    renderProfile(data.profile);
    renderSkills(data.skills);
    renderProjects(data.projects);
    updateStats(data);
    observeReveals();
    animateSkillBars();

    // Safety net: never leave content invisible if the observer misfires.
    window.setTimeout(function () {
      document.querySelectorAll('.reveal:not(.is-visible)').forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 1.2) el.classList.add('is-visible');
      });
    }, 1200);
  }

  /* ---------- Boot ------------------------------------------------------ */
  function init() {
    // Added at runtime: if this script fails, reveal content stays visible.
    document.documentElement.classList.add('js');
    renderAll(store.load());
    setupNavigation();

    var canvas = byId('starfield');
    if (canvas && window.Starfield) {
      try {
        new window.Starfield(canvas, { maxStars: 220 });
      } catch (err) {
        console.warn('[portfolio] Starfield disabled:', err);
      }
    }

    store.subscribe(renderAll);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
