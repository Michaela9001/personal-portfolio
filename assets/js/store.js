/* ==========================================================================
   Starlit Portfolio — Data Store
   Classic script (not an ES module) so the site also works over file://.
   Responsibilities: defaults, normalization, persistence, subscription,
   and small security helpers (URL allow-list + HTML escaping).
   No DOM access. No network access.
   ========================================================================== */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'portfolio.data.v1';
  var SCHEMA_VERSION = 1;
  var CHANGE_EVENT = 'portfolio:datachange';
  var MAX_URL_LENGTH = 2048;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /* ---------- Defaults -------------------------------------------------- */
  var DEFAULT_DATA = {
    schemaVersion: SCHEMA_VERSION,
    profile: {
      name: '王梦涵',
      nameEn: 'Wang Menghan',
      title: '计算机科学学生 · 前端开发者',
      titleEn: 'Computer Science Student · Frontend Developer',
      avatarUrl: '',
      bio:
        '我是王梦涵，一名计算机科学专业的学生，专注于前端工程、交互设计与可视化。' +
        '我喜欢把复杂的问题拆解成清晰的模块，再用代码把它们变成可以被触摸的体验。\n\n' +
        '目前我在深入 JavaScript 与 Canvas 图形编程，同时学习系统设计与算法。' +
        '我相信好的产品既要逻辑严谨，也要有让人愿意停留一秒的美感。',
      location: '中国 · 杭州',
      email: 'menghan.wang@example.com',
      availability: '开放实习与项目合作',
      socials: {
        github: 'https://github.com/wangmenghan',
        linkedin: '',
        zhihu: '',
        bilibili: '',
        website: ''
      }
    },
    skills: [
      { name: 'HTML5 / CSS3', category: '前端', level: 92 },
      { name: 'JavaScript (ES6+)', category: '前端', level: 88 },
      { name: 'TypeScript', category: '前端', level: 80 },
      { name: 'React / Vue 3', category: '前端', level: 82 },
      { name: 'Tailwind CSS', category: '前端', level: 85 },
      { name: 'Python', category: '后端', level: 86 },
      { name: 'Node.js / Express', category: '后端', level: 75 },
      { name: 'Java', category: '后端', level: 72 },
      { name: 'MySQL / SQLite', category: '后端', level: 74 },
      { name: 'Git / Linux', category: '工具', level: 80 },
      { name: 'Docker', category: '工具', level: 60 },
      { name: 'Figma / UI 设计', category: '设计', level: 68 }
    ],
    projects: [
      {
        title: '星海作品集 / Starlit Portfolio',
        description:
          '一个零构建的纯静态个人作品集：Canvas 星空引擎、玻璃拟态界面、localStorage 内容管理，可直接部署到任意静态托管平台。',
        tags: ['HTML5 Canvas', 'Tailwind CSS', 'localStorage'],
        link: '',
        repo: 'https://github.com/wangmenghan/starlit-portfolio',
        featured: true
      },
      {
        title: '校园二手交易平台 / Campus Mart',
        description:
          '面向校园场景的二手物品交易系统，包含商品发布、搜索筛选、站内消息与订单流转，前后端分离架构。',
        tags: ['Vue 3', 'Node.js', 'MySQL'],
        link: '',
        repo: 'https://github.com/wangmenghan/campus-mart',
        featured: false
      },
      {
        title: '手写数字识别 / Digit Recognizer',
        description:
          '基于卷积神经网络的手写数字识别实验，覆盖数据增强、训练调参、混淆矩阵分析与浏览器端推理演示。',
        tags: ['Python', 'PyTorch', 'CNN'],
        link: '',
        repo: 'https://github.com/wangmenghan/digit-recognizer',
        featured: false
      },
      {
        title: 'Mini Shell / 迷你命令行解释器',
        description:
          '用 C 语言实现的迷你 Shell：支持管道、重定向、前后台作业控制与内建命令，用于理解进程与系统调用。',
        tags: ['C', 'Linux', '系统编程'],
        link: '',
        repo: 'https://github.com/wangmenghan/mini-shell',
        featured: false
      }
    ],
    meta: {
      updatedAt: null
    }
  };

  /* ---------- Tiny utilities -------------------------------------------- */
  function isPlainObject(value) {
    return Object.prototype.toString.call(value) === '[object Object]';
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getStorage() {
    try {
      return global.localStorage || null;
    } catch (err) {
      return null;
    }
  }

  function clampInt(value, min, max, fallback) {
    var n = Number(value);
    if (!isFinite(n)) return fallback;
    n = Math.round(n);
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  function asString(value, fallback, maxLen) {
    if (typeof value !== 'string') return fallback;
    var s = value.trim();
    if (typeof maxLen === 'number' && s.length > maxLen) {
      s = s.slice(0, maxLen);
    }
    return s;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      switch (ch) {
        case '&':
          return '&amp;';
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '"':
          return '&quot;';
        case "'":
          return '&#39;';
        default:
          return ch;
      }
    });
  }

  /**
   * Sanitize a URL against an allow-list.
   * @param {*} raw
   * @param {{allowRelative?:boolean, allowDataImage?:boolean}} [options]
   * @returns {string} safe URL, or '' when rejected
   */
  function safeUrl(raw, options) {
    var opts = options || {};
    if (typeof raw !== 'string') return '';

    // Strip control characters that can be used to smuggle schemes.
    var s = raw.trim().replace(/[\u0000-\u001F\u007F]/g, '');
    if (!s || s.length > MAX_URL_LENGTH) return '';

    // Protocol-relative and backslash variants are rejected outright.
    if (/^[\\/]{2}/.test(s)) return '';

    if (/^data:/i.test(s)) {
      if (!opts.allowDataImage) return '';
      // Raster images only. SVG data URLs are intentionally excluded.
      return /^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(s) ? s : '';
    }

    if (/^https?:\/\//i.test(s)) {
      try {
        var parsed = new URL(s);
        if (!parsed.hostname) return '';
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
        return parsed.href;
      } catch (err) {
        return '';
      }
    }

    if (opts.allowRelative !== false) {
      var isRelative = /^(\.{1,2}\/|\/|assets\/)/.test(s);
      // Backslashes are rejected: browsers may normalize "/\\evil.com"
      // into a protocol-relative URL.
      var hasUnsafeChars = /[\s<>"'`\\]/.test(s);
      if (isRelative && !hasUnsafeChars) return s;
    }

    return '';
  }

  function isSafeUrl(raw, options) {
    return safeUrl(raw, options) !== '';
  }

  function isValidEmail(value) {
    return typeof value === 'string' && value.length <= 120 && EMAIL_RE.test(value.trim());
  }

  function normalizeEmail(value, fallback) {
    if (typeof value !== 'string') return fallback;
    var s = value.trim().slice(0, 120);
    if (!s) return '';
    return EMAIL_RE.test(s) ? s : '';
  }

  function normalizeTags(value) {
    if (!Array.isArray(value)) return [];
    var seen = Object.create(null);
    var out = [];
    for (var i = 0; i < value.length && out.length < 8; i++) {
      var tag = asString(value[i], '', 24);
      if (!tag) continue;
      var key = tag.toLowerCase();
      if (seen[key]) continue;
      seen[key] = true;
      out.push(tag);
    }
    return out;
  }

  function normalizeSocials(source, fallbackSocials) {
    var src = isPlainObject(source) ? source : {};
    var keys = ['github', 'linkedin', 'zhihu', 'bilibili', 'website'];
    var out = {};
    keys.forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(src, key)) {
        out[key] = safeUrl(src[key]);
      } else {
        out[key] = safeUrl(fallbackSocials[key]);
      }
    });
    return out;
  }

  /* ---------- Normalization --------------------------------------------- */
  /**
   * Coerce arbitrary input into the canonical data shape.
   * Pure function: never touches storage or the DOM.
   * @param {*} raw
   * @returns {object}
   */
  function normalize(raw) {
    var source = isPlainObject(raw) ? raw : {};
    var dProfile = DEFAULT_DATA.profile;
    var p = isPlainObject(source.profile) ? source.profile : {};

    var name = asString(p.name, dProfile.name, 40) || dProfile.name;
    var title = asString(p.title, dProfile.title, 80) || dProfile.title;

    var profile = {
      name: name,
      nameEn: asString(p.nameEn, dProfile.nameEn, 60),
      title: title,
      titleEn: asString(p.titleEn, dProfile.titleEn, 100),
      avatarUrl: safeUrl(p.avatarUrl, { allowDataImage: true, allowRelative: true }),
      bio: asString(p.bio, dProfile.bio, 600),
      location: asString(p.location, dProfile.location, 60),
      email: normalizeEmail(p.email, dProfile.email),
      availability: asString(p.availability, dProfile.availability, 60),
      socials: normalizeSocials(p.socials, dProfile.socials)
    };

    var skills;
    if (Array.isArray(source.skills)) {
      skills = [];
      for (var i = 0; i < source.skills.length && skills.length < 40; i++) {
        var item = source.skills[i];
        if (!isPlainObject(item)) continue;
        var skillName = asString(item.name, '', 40);
        if (!skillName) continue;
        skills.push({
          name: skillName,
          category: asString(item.category, '其他', 20) || '其他',
          level: clampInt(item.level, 0, 100, 60)
        });
      }
    } else {
      skills = clone(DEFAULT_DATA.skills);
    }

    var projects;
    if (Array.isArray(source.projects)) {
      projects = [];
      for (var j = 0; j < source.projects.length && projects.length < 24; j++) {
        var proj = source.projects[j];
        if (!isPlainObject(proj)) continue;
        var projTitle = asString(proj.title, '', 80);
        if (!projTitle) continue;
        projects.push({
          title: projTitle,
          description: asString(proj.description, '', 300),
          tags: normalizeTags(proj.tags),
          link: safeUrl(proj.link),
          repo: safeUrl(proj.repo),
          featured: proj.featured === true
        });
      }
    } else {
      projects = clone(DEFAULT_DATA.projects);
    }

    var updatedAt = null;
    if (isPlainObject(source.meta) && typeof source.meta.updatedAt === 'string') {
      var candidate = source.meta.updatedAt.trim();
      if (candidate && candidate.length <= 40 && !isNaN(Date.parse(candidate))) {
        updatedAt = candidate;
      }
    }

    return {
      schemaVersion: SCHEMA_VERSION,
      profile: profile,
      skills: skills,
      projects: projects,
      meta: { updatedAt: updatedAt }
    };
  }

  /* ---------- Persistence ----------------------------------------------- */
  function defaults() {
    return clone(DEFAULT_DATA);
  }

  function load() {
    var storage = getStorage();
    if (!storage) return defaults();

    var raw = null;
    try {
      raw = storage.getItem(STORAGE_KEY);
    } catch (err) {
      return defaults();
    }

    if (!raw) return defaults();

    try {
      return normalize(JSON.parse(raw));
    } catch (err) {
      return defaults();
    }
  }

  function emit(data, source) {
    try {
      global.dispatchEvent(
        new CustomEvent(CHANGE_EVENT, {
          detail: { data: data, source: source || 'save' }
        })
      );
    } catch (err) {
      /* CustomEvent unavailable: subscribers fall back to storage events. */
    }
  }

  /**
   * Persist normalized data. Throws a user-readable Error on failure.
   * @param {object} data
   * @returns {object} the normalized, saved data
   */
  function save(data) {
    var normalized = normalize(data);
    normalized.meta = { updatedAt: new Date().toISOString() };

    var storage = getStorage();
    if (!storage) {
      throw new Error(
        '无法访问浏览器存储（可能处于隐私模式）。数据未保存。 / localStorage is unavailable.'
      );
    }

    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch (err) {
      var isQuota =
        err &&
        (err.name === 'QuotaExceededError' ||
          err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
          err.code === 22 ||
          err.code === 1014);
      if (isQuota) {
        throw new Error(
          '存储空间不足，保存失败。请改用图片 URL（而非 base64 头像），或清理本站数据后重试。 / Storage quota exceeded.'
        );
      }
      throw new Error(
        '保存失败：浏览器拒绝了写入操作。 / Save failed: storage write was rejected.'
      );
    }

    emit(normalized, 'save');
    return normalized;
  }

  /**
   * Remove stored data and fall back to defaults.
   * @returns {object} defaults
   */
  function reset() {
    var storage = getStorage();
    if (storage) {
      try {
        storage.removeItem(STORAGE_KEY);
      } catch (err) {
        throw new Error(
          '清除数据失败：浏览器拒绝了操作。 / Reset failed: storage removal was rejected.'
        );
      }
    }

    var data = defaults();
    emit(data, 'reset');
    return data;
  }

  /**
   * Subscribe to data changes (same tab + other tabs).
   * @param {(data:object)=>void} callback
   * @returns {() => void} unsubscribe
   */
  function subscribe(callback) {
    if (typeof callback !== 'function') return function () {};

    function onLocal(event) {
      var next = event && event.detail && event.detail.data ? event.detail.data : load();
      callback(next);
    }

    function onStorage(event) {
      if (event && event.key !== null && event.key !== STORAGE_KEY) return;
      callback(load());
    }

    global.addEventListener(CHANGE_EVENT, onLocal);
    global.addEventListener('storage', onStorage);

    return function unsubscribe() {
      global.removeEventListener(CHANGE_EVENT, onLocal);
      global.removeEventListener('storage', onStorage);
    };
  }

  function storageAvailable() {
    var storage = getStorage();
    if (!storage) return false;
    try {
      var probe = '__portfolio_probe__';
      storage.setItem(probe, '1');
      storage.removeItem(probe);
      return true;
    } catch (err) {
      return false;
    }
  }

  /* ---------- Export ---------------------------------------------------- */
  global.PortfolioStore = {
    STORAGE_KEY: STORAGE_KEY,
    SCHEMA_VERSION: SCHEMA_VERSION,
    CHANGE_EVENT: CHANGE_EVENT,
    defaults: defaults,
    load: load,
    save: save,
    reset: reset,
    normalize: normalize,
    subscribe: subscribe,
    escapeHtml: escapeHtml,
    safeUrl: safeUrl,
    isSafeUrl: isSafeUrl,
    isValidEmail: isValidEmail,
    normalizeEmail: normalizeEmail,
    storageAvailable: storageAvailable
  };
})(window);
