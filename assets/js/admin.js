/* ==========================================================================
   Starlit Portfolio — Admin console
   Form hydration, validation, live preview, save/reset, import/export.
   The store owns persistence; this file owns UI state only.
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

  var SOCIAL_KEYS = ['github', 'linkedin', 'zhihu', 'bilibili', 'website'];
  var SOCIAL_LABELS = {
    github: 'GitHub',
    linkedin: 'LinkedIn',
    zhihu: '知乎',
    bilibili: '哔哩哔哩',
    website: '个人网站'
  };

  var els = {};
  var state = {
    dirty: false,
    saving: false,
    toastTimer: 0,
    previewTimer: 0
  };

  /* ---------- Helpers --------------------------------------------------- */
  function byId(id) {
    return document.getElementById(id);
  }

  function setField(id, value) {
    var el = byId(id);
    if (el) el.value = value == null ? '' : String(value);
  }

  function fieldValue(id) {
    var el = byId(id);
    return el ? el.value : '';
  }

  function rowField(row, name) {
    return row.querySelector('[data-field="' + name + '"]');
  }

  function create(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = String(text);
    return el;
  }

  function clamp(value, min, max) {
    return value < min ? min : value > max ? max : value;
  }

  function initials(profile) {
    var name = (profile.name || '').trim();
    if (/[\u3400-\u9fff]/.test(name)) return Array.from(name)[0];

    var words = (profile.nameEn || name).match(/[A-Za-z]+/g);
    if (words && words.length) {
      return words
        .slice(0, 2)
        .map(function (word) {
          return word.charAt(0).toUpperCase();
        })
        .join('');
    }

    return Array.from(name)[0] || '★';
  }

  function parseTags(raw) {
    var seen = Object.create(null);
    var out = [];

    String(raw || '')
      .split(/[,，]/)
      .forEach(function (part) {
        var tag = part.trim();
        if (!tag) return;
        var key = tag.toLowerCase();
        if (seen[key]) return;
        seen[key] = true;
        out.push(tag);
      });

    return out;
  }

  function formatDate(iso) {
    if (!iso) return '';
    var date = new Date(iso);
    if (isNaN(date.getTime())) return '';
    try {
      return date.toLocaleString('zh-CN', { hour12: false });
    } catch (err) {
      return date.toISOString();
    }
  }

  /* ---------- Element cache --------------------------------------------- */
  function cacheElements() {
    els.form = byId('editor-form');
    els.skillsList = byId('skills-list');
    els.projectsList = byId('projects-list');
    els.skillsEmpty = byId('skills-empty');
    els.projectsEmpty = byId('projects-empty');
    els.skillTemplate = byId('skill-template');
    els.projectTemplate = byId('project-template');
    els.addSkill = byId('add-skill');
    els.addProject = byId('add-project');
    els.bioCount = byId('bio-count');
    els.avatarPreviewImg = byId('avatar-preview-img');
    els.avatarPreviewFallback = byId('avatar-preview-fallback');
    els.previewAvatarImg = byId('preview-avatar-img');
    els.previewAvatarFallback = byId('preview-avatar-fallback');
    els.previewName = byId('preview-name');
    els.previewTitle = byId('preview-title');
    els.storageWarning = byId('storage-warning');
    els.formErrors = byId('form-errors');
    els.errorList = byId('error-list');
    els.toast = byId('toast');
    els.dirtyIndicator = byId('dirty-indicator');
    els.dirtyText = byId('dirty-text');
    els.lastSaved = byId('last-saved');
    els.saveBtn = byId('save-btn');
    els.resetBtn = byId('reset-btn');
    els.resetDialog = byId('reset-dialog');
    els.resetCancel = byId('reset-cancel');
    els.resetConfirm = byId('reset-confirm');
    els.exportBtn = byId('export-btn');
    els.importBtn = byId('import-btn');
    els.importFile = byId('import-file');
  }

  /* ---------- Toast & errors -------------------------------------------- */
  function showToast(message, type) {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.classList.toggle('is-error', type === 'error');
    els.toast.classList.add('is-visible');

    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(function () {
      els.toast.classList.remove('is-visible');
    }, 3800);
  }

  function clearErrors() {
    if (!els.formErrors) return;
    els.formErrors.hidden = true;
    if (els.errorList) els.errorList.replaceChildren();
    els.form.querySelectorAll('[aria-invalid="true"]').forEach(function (field) {
      field.removeAttribute('aria-invalid');
    });
  }

  function showErrors(errors) {
    if (!els.formErrors || !els.errorList) return;

    els.form.querySelectorAll('[aria-invalid="true"]').forEach(function (field) {
      field.removeAttribute('aria-invalid');
    });
    els.errorList.replaceChildren();

    if (!errors.length) {
      els.formErrors.hidden = true;
      return;
    }

    errors.forEach(function (error) {
      els.errorList.appendChild(create('li', null, error.message));
      if (error.el && error.el.setAttribute) {
        error.el.setAttribute('aria-invalid', 'true');
      }
    });

    els.formErrors.hidden = false;
    els.formErrors.scrollIntoView({
      behavior: REDUCED_MOTION ? 'auto' : 'smooth',
      block: 'center'
    });

    if (errors[0].el && typeof errors[0].el.focus === 'function') {
      errors[0].el.focus({ preventScroll: true });
    }
  }

  /* ---------- Dirty state ----------------------------------------------- */
  function setDirty(value) {
    state.dirty = !!value;

    if (els.dirtyIndicator) {
      els.dirtyIndicator.classList.toggle('is-dirty', state.dirty);
    }
    if (els.dirtyText) {
      els.dirtyText.textContent = state.dirty ? '有未保存的更改' : '所有更改已保存';
    }
  }

  /* ---------- Preview --------------------------------------------------- */
  function updatePreview(profile) {
    var label = initials(profile);

    if (els.previewName) els.previewName.textContent = profile.name || '未命名';
    if (els.previewTitle) {
      els.previewTitle.textContent = profile.title || '未填写头衔';
    }
    if (els.previewAvatarFallback) els.previewAvatarFallback.textContent = label;
    if (els.avatarPreviewFallback) els.avatarPreviewFallback.textContent = label;

    setPreviewImage(els.previewAvatarImg, els.previewAvatarFallback, profile.avatarUrl);
    setPreviewImage(els.avatarPreviewImg, els.avatarPreviewFallback, profile.avatarUrl);
  }

  function setPreviewImage(img, fallback, rawUrl) {
    if (!img) return;

    var url = store.safeUrl(rawUrl, {
      allowDataImage: true,
      allowRelative: true
    });

    if (fallback) fallback.hidden = false;

    if (!url) {
      img.hidden = true;
      img.removeAttribute('src');
      return;
    }

    if (
      img.getAttribute('src') === url &&
      img.complete &&
      img.naturalWidth > 0
    ) {
      img.hidden = false;
      if (fallback) fallback.hidden = true;
      return;
    }

    img.hidden = false;
    img.onload = function () {
      if (fallback) fallback.hidden = true;
    };
    img.onerror = function () {
      img.hidden = true;
      img.removeAttribute('src');
      if (fallback) fallback.hidden = false;
    };
    img.src = url;
  }

  function schedulePreview() {
    window.clearTimeout(state.previewTimer);
    state.previewTimer = window.setTimeout(function () {
      updatePreview({
        name: fieldValue('field-name').trim(),
        nameEn: fieldValue('field-nameEn').trim(),
        title: fieldValue('field-title').trim(),
        avatarUrl: fieldValue('field-avatar').trim()
      });
    }, 120);
  }

  function updateBioCount() {
    if (!els.bioCount) return;
    els.bioCount.textContent = fieldValue('field-bio').length + ' / 600';
  }

  function updateLastSaved(updatedAt) {
    if (!els.lastSaved) return;
    var formatted = formatDate(updatedAt);
    els.lastSaved.textContent = formatted ? '上次保存 ' + formatted : '尚未保存到本地';
  }

  /* ---------- Dynamic rows ---------------------------------------------- */
  function addSkillRow(skill) {
    if (!els.skillTemplate || !els.skillsList) return null;

    var fragment = els.skillTemplate.content.cloneNode(true);
    var row = fragment.querySelector('.skill-row');

    rowField(row, 'name').value = skill && skill.name ? skill.name : '';
    rowField(row, 'category').value = skill && skill.category ? skill.category : '';

    var level = skill && isFinite(Number(skill.level)) ? Number(skill.level) : 80;
    rowField(row, 'level').value = String(clamp(Math.round(level), 0, 100));
    updateLevelOutput(row);

    els.skillsList.appendChild(fragment);
    updateEmptyHints();
    return row;
  }

  function addProjectRow(project) {
    if (!els.projectTemplate || !els.projectsList) return null;

    var fragment = els.projectTemplate.content.cloneNode(true);
    var row = fragment.querySelector('.project-row');

    rowField(row, 'title').value = project && project.title ? project.title : '';
    rowField(row, 'description').value =
      project && project.description ? project.description : '';
    rowField(row, 'tags').value =
      project && project.tags && project.tags.length ? project.tags.join(', ') : '';
    rowField(row, 'link').value = project && project.link ? project.link : '';
    rowField(row, 'repo').value = project && project.repo ? project.repo : '';
    rowField(row, 'featured').checked = !!(project && project.featured);

    updateDescCount(row);

    els.projectsList.appendChild(fragment);
    renumberProjects();
    updateEmptyHints();
    return row;
  }

  function updateLevelOutput(row) {
    if (!row) return;
    var input = rowField(row, 'level');
    var output = row.querySelector('[data-role="level-output"]');
    if (input && output) output.textContent = input.value + '%';
  }

  function updateDescCount(row) {
    if (!row) return;
    var input = rowField(row, 'description');
    var output = row.querySelector('[data-role="desc-count"]');
    if (input && output) output.textContent = String(input.value.length);
  }

  function renumberProjects() {
    if (!els.projectsList) return;
    els.projectsList.querySelectorAll('.project-row').forEach(function (row, index) {
      var label = row.querySelector('[data-role="project-index"]');
      if (label) label.textContent = 'PROJECT ' + String(index + 1).padStart(2, '0');
    });
  }

  function updateEmptyHints() {
    if (els.skillsEmpty && els.skillsList) {
      els.skillsEmpty.hidden = els.skillsList.querySelectorAll('.skill-row').length > 0;
    }
    if (els.projectsEmpty && els.projectsList) {
      els.projectsEmpty.hidden =
        els.projectsList.querySelectorAll('.project-row').length > 0;
    }
  }

  function renderSkills(skills) {
    if (!els.skillsList) return;
    els.skillsList.replaceChildren();
    (skills || []).forEach(function (skill) {
      addSkillRow(skill);
    });
    updateEmptyHints();
  }

  function renderProjects(projects) {
    if (!els.projectsList) return;
    els.projectsList.replaceChildren();
    (projects || []).forEach(function (project) {
      addProjectRow(project);
    });
    updateEmptyHints();
  }

  /* ---------- Form hydration -------------------------------------------- */
  function renderForm(data) {
    var p = data.profile;

    setField('field-name', p.name);
    setField('field-nameEn', p.nameEn);
    setField('field-title', p.title);
    setField('field-titleEn', p.titleEn);
    setField('field-avatar', p.avatarUrl);
    setField('field-bio', p.bio);
    setField('field-location', p.location);
    setField('field-email', p.email);
    setField('field-availability', p.availability);

    SOCIAL_KEYS.forEach(function (key) {
      setField('field-' + key, p.socials ? p.socials[key] : '');
    });

    renderSkills(data.skills);
    renderProjects(data.projects);

    updateBioCount();
    updatePreview(p);
    updateLastSaved(data.meta ? data.meta.updatedAt : null);
    clearErrors();
    setDirty(false);

    document.title = '内容管理台 · ' + (p.name || '作品集');
  }

  /* ---------- Collect & validate ---------------------------------------- */
  function collect() {
    var socials = {};
    SOCIAL_KEYS.forEach(function (key) {
      socials[key] = fieldValue('field-' + key).trim();
    });

    var skills = [];
    els.skillsList.querySelectorAll('.skill-row').forEach(function (row) {
      var name = rowField(row, 'name').value.trim();
      var category = rowField(row, 'category').value.trim();
      if (!name && !category) return;

      skills.push({
        name: name,
        category: category,
        level: Number(rowField(row, 'level').value),
        _row: row
      });
    });

    var projects = [];
    els.projectsList.querySelectorAll('.project-row').forEach(function (row) {
      var title = rowField(row, 'title').value.trim();
      var description = rowField(row, 'description').value.trim();
      var tags = parseTags(rowField(row, 'tags').value);
      var link = rowField(row, 'link').value.trim();
      var repo = rowField(row, 'repo').value.trim();

      if (!title && !description && !tags.length && !link && !repo) return;

      projects.push({
        title: title,
        description: description,
        tags: tags,
        link: link,
        repo: repo,
        featured: !!rowField(row, 'featured').checked,
        _row: row
      });
    });

    return {
      schemaVersion: store.SCHEMA_VERSION,
      profile: {
        name: fieldValue('field-name').trim(),
        nameEn: fieldValue('field-nameEn').trim(),
        title: fieldValue('field-title').trim(),
        titleEn: fieldValue('field-titleEn').trim(),
        avatarUrl: fieldValue('field-avatar').trim(),
        bio: fieldValue('field-bio'),
        location: fieldValue('field-location').trim(),
        email: fieldValue('field-email').trim(),
        availability: fieldValue('field-availability').trim(),
        socials: socials
      },
      skills: skills,
      projects: projects,
      meta: { updatedAt: null }
    };
  }

  function validate(data) {
    var errors = [];
    var p = data.profile;

    function add(el, message) {
      errors.push({ el: el || null, message: message });
    }

    if (!p.name) add(byId('field-name'), '姓名不能为空。');
    else if (p.name.length > 40) add(byId('field-name'), '姓名不能超过 40 个字符。');

    if (!p.title) add(byId('field-title'), '头衔不能为空。');
    else if (p.title.length > 80) add(byId('field-title'), '头衔不能超过 80 个字符。');

    if (p.bio.length > 600) add(byId('field-bio'), '个人简介不能超过 600 个字符。');

    if (p.avatarUrl && !store.isSafeUrl(p.avatarUrl, { allowDataImage: true, allowRelative: true })) {
      add(
        byId('field-avatar'),
        '头像 URL 不受支持。请使用 http(s) 链接、相对路径或 data:image。'
      );
    }

    if (p.email && !store.isValidEmail(p.email)) {
      add(byId('field-email'), '邮箱格式不正确。');
    }

    SOCIAL_KEYS.forEach(function (key) {
      var url = p.socials[key];
      if (url && !store.isSafeUrl(url)) {
        add(
          byId('field-' + key),
          SOCIAL_LABELS[key] + ' 链接格式不受支持（仅允许 http/https 或相对路径）。'
        );
      }
    });

    data.skills.forEach(function (skill, index) {
      var row = skill._row;
      if (!skill.name) {
        add(
          row ? rowField(row, 'name') : null,
          '第 ' + (index + 1) + ' 项技能缺少名称。'
        );
      } else if (skill.name.length > 40) {
        add(row ? rowField(row, 'name') : null, '技能名称不能超过 40 个字符。');
      }

      if (!isFinite(skill.level) || skill.level < 0 || skill.level > 100) {
        add(row ? rowField(row, 'level') : null, '技能熟练度必须在 0–100 之间。');
      }
    });

    data.projects.forEach(function (project, index) {
      var row = project._row;
      if (!project.title) {
        add(
          row ? rowField(row, 'title') : null,
          '第 ' + (index + 1) + ' 个项目缺少标题。'
        );
      } else if (project.title.length > 80) {
        add(row ? rowField(row, 'title') : null, '项目标题不能超过 80 个字符。');
      }

      if (project.description.length > 300) {
        add(
          row ? rowField(row, 'description') : null,
          '第 ' + (index + 1) + ' 个项目描述不能超过 300 个字符。'
        );
      }

      if (project.tags.length > 8) {
        add(
          row ? rowField(row, 'tags') : null,
          '第 ' + (index + 1) + ' 个项目最多 8 个标签。'
        );
      }

      project.tags.forEach(function (tag) {
        if (tag.length > 24) {
          add(
            row ? rowField(row, 'tags') : null,
            '项目标签不能超过 24 个字符：“' + tag.slice(0, 12) + '…”。'
          );
        }
      });

      if (project.link && !store.isSafeUrl(project.link)) {
        add(
          row ? rowField(row, 'link') : null,
          '第 ' + (index + 1) + ' 个项目的预览链接格式不受支持。'
        );
      }

      if (project.repo && !store.isSafeUrl(project.repo)) {
        add(
          row ? rowField(row, 'repo') : null,
          '第 ' + (index + 1) + ' 个项目的源码链接格式不受支持。'
        );
      }
    });

    return errors;
  }

  /* ---------- Save / reset ---------------------------------------------- */
  function save() {
    if (state.saving) return;

    var data = collect();
    var errors = validate(data);

    if (errors.length) {
      showErrors(errors);
      showToast('保存失败：请先修正表单中的问题。', 'error');
      return;
    }

    state.saving = true;
    try {
      var saved = store.save(data);
      renderForm(saved);
      showToast('已保存并应用。打开首页即可看到更新。');
    } catch (err) {
      console.error('[portfolio] save failed:', err);
      showToast(err && err.message ? err.message : '保存失败，请重试。', 'error');
    } finally {
      state.saving = false;
    }
  }

  function doReset() {
    try {
      var data = store.reset();
      renderForm(data);
      showToast('已恢复默认内容。');
    } catch (err) {
      console.error('[portfolio] reset failed:', err);
      showToast(err && err.message ? err.message : '恢复默认失败。', 'error');
    }
  }

  function closeResetDialog() {
    if (els.resetDialog && els.resetDialog.open) els.resetDialog.close();
  }

  /* ---------- Import / export ------------------------------------------- */
  function exportData() {
    try {
      var payload = state.dirty ? store.normalize(collect()) : store.load();
      var json = JSON.stringify(payload, null, 2);
      var blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      var url = URL.createObjectURL(blob);

      var now = new Date();
      var stamp =
        now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') +
        '-' +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0');

      var link = document.createElement('a');
      link.href = url;
      link.download = 'portfolio-data-' + stamp + '.json';
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 1500);

      showToast(state.dirty ? '已导出当前表单内容（含未保存更改）。' : '已导出 JSON 备份。');
    } catch (err) {
      console.error('[portfolio] export failed:', err);
      showToast('导出失败，请重试。', 'error');
    }
  }

  function importData(file) {
    if (!file) return;

    if (file.size > 1024 * 1024) {
      showToast('文件过大（上限 1 MB），已取消导入。', 'error');
      return;
    }

    var confirmed = window.confirm('导入会覆盖当前浏览器中的内容，确定继续吗？');
    if (!confirmed) return;

    var reader = new FileReader();

    reader.onload = function () {
      try {
        var parsed = JSON.parse(String(reader.result || ''));
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('JSON 根节点必须是一个对象。');
        }

        var saved = store.save(store.normalize(parsed));
        renderForm(saved);
        showToast('导入成功，已应用新数据。');
      } catch (err) {
        console.error('[portfolio] import failed:', err);
        showToast(
          '导入失败：' + (err && err.message ? err.message : '无法解析该文件。'),
          'error'
        );
      }
    };

    reader.onerror = function () {
      showToast('读取文件失败，请重试。', 'error');
    };

    reader.readAsText(file, 'utf-8');
  }

  /* ---------- Events ---------------------------------------------------- */
  function bindEvents() {
    if (!els.form) return;

    els.form.addEventListener('submit', function (event) {
      event.preventDefault();
      save();
    });

    els.form.addEventListener('input', handleFormInput);
    els.form.addEventListener('change', handleFormInput);

    if (els.addSkill) {
      els.addSkill.addEventListener('click', function () {
        var row = addSkillRow({ name: '', category: '', level: 80 });
        setDirty(true);
        clearErrors();
        if (row) rowField(row, 'name').focus();
      });
    }

    if (els.addProject) {
      els.addProject.addEventListener('click', function () {
        var row = addProjectRow({ title: '', description: '', tags: [], link: '', repo: '' });
        setDirty(true);
        clearErrors();
        if (row) rowField(row, 'title').focus();
      });
    }

    bindRemoveButtons(els.skillsList, '.skill-row');
    bindRemoveButtons(els.projectsList, '.project-row');

    if (els.resetBtn) {
      els.resetBtn.addEventListener('click', function () {
        if (els.resetDialog && typeof els.resetDialog.showModal === 'function') {
          els.resetDialog.showModal();
        } else if (window.confirm('确定要恢复默认内容吗？此操作不可撤销。')) {
          doReset();
        }
      });
    }

    if (els.resetCancel) {
      els.resetCancel.addEventListener('click', closeResetDialog);
    }

    if (els.resetConfirm) {
      els.resetConfirm.addEventListener('click', function () {
        doReset();
        closeResetDialog();
      });
    }

    if (els.resetDialog) {
      els.resetDialog.addEventListener('click', function (event) {
        if (event.target === els.resetDialog) closeResetDialog();
      });
    }

    if (els.exportBtn) {
      els.exportBtn.addEventListener('click', exportData);
    }

    if (els.importBtn && els.importFile) {
      els.importBtn.addEventListener('click', function () {
        els.importFile.click();
      });

      els.importFile.addEventListener('change', function () {
        var file = els.importFile.files && els.importFile.files[0];
        els.importFile.value = '';
        importData(file);
      });
    }

    document.addEventListener('keydown', function (event) {
      if ((event.ctrlKey || event.metaKey) && String(event.key).toLowerCase() === 's') {
        event.preventDefault();
        if (typeof els.form.requestSubmit === 'function') els.form.requestSubmit();
        else save();
      }

      if (event.key === 'Escape') closeResetDialog();
    });

    window.addEventListener('beforeunload', function (event) {
      if (!state.dirty) return;
      event.preventDefault();
      event.returnValue = '';
    });
  }

  function handleFormInput(event) {
    var target = event.target;
    if (!target) return;

    setDirty(true);

    if (target.id === 'field-bio') updateBioCount();

    if (target.matches('[data-field="level"]')) {
      updateLevelOutput(target.closest('.skill-row'));
    }

    if (target.matches('[data-field="description"]')) {
      updateDescCount(target.closest('.project-row'));
    }

    if (
      target.id === 'field-name' ||
      target.id === 'field-nameEn' ||
      target.id === 'field-title' ||
      target.id === 'field-avatar'
    ) {
      schedulePreview();
    }
  }

  function bindRemoveButtons(list, selector) {
    if (!list) return;

    list.addEventListener('click', function (event) {
      var button = event.target.closest('[data-action="remove"]');
      if (!button) return;

      var row = button.closest(selector);
      if (!row) return;

      row.remove();
      renumberProjects();
      updateEmptyHints();
      setDirty(true);
      clearErrors();
    });
  }

  /* ---------- Background ------------------------------------------------- */
  function initStarfield() {
    var canvas = byId('starfield');
    if (!canvas || !window.Starfield) return;

    try {
      new window.Starfield(canvas, {
        maxStars: 140,
        shootingStars: false,
        parallax: true
      });
    } catch (err) {
      console.warn('[portfolio] Starfield disabled:', err);
    }
  }

  /* ---------- Boot ------------------------------------------------------ */
  function init() {
    document.documentElement.classList.add('js');
    cacheElements();

    if (!els.form || !els.skillsList || !els.projectsList) {
      console.error('[portfolio] Admin markup is incomplete.');
      return;
    }

    bindEvents();
    renderForm(store.load());

    if (!store.storageAvailable() && els.storageWarning) {
      els.storageWarning.hidden = false;
    }

    store.subscribe(function (data) {
      // Never clobber unsaved edits from a different tab.
      if (state.dirty) return;
      renderForm(data);
      showToast('已同步其他标签页的更改。');
    });

    initStarfield();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
