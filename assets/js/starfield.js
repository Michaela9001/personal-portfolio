/* ==========================================================================
   Starlit Portfolio — Canvas Starfield Engine
   Dependency-free 2D particle background:
   twinkling stars, slow drift, constellation lines, shooting stars, parallax.
   Pauses when the tab is hidden and degrades to a static frame for
   prefers-reduced-motion users.
   ========================================================================== */
(function (global) {
  'use strict';

  var TAU = Math.PI * 2;

  var DEFAULTS = {
    maxStars: 220,
    shootingStars: true,
    parallax: true,
    constellation: true
  };

  var PALETTE = ['#e2e8f0', '#67e8f9', '#c4b5fd'];

  function clamp(value, min, max) {
    return value < min ? min : value > max ? max : value;
  }

  function Starfield(canvas, options) {
    if (!canvas || typeof canvas.getContext !== 'function') {
      throw new Error('Starfield: a <canvas> element is required.');
    }

    var ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Starfield: Canvas 2D context is unavailable.');
    }

    this.canvas = canvas;
    this.ctx = ctx;
    this.options = Object.assign({}, DEFAULTS, options || {});

    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.stars = [];
    this.pairs = [];
    this.shooting = [];
    this.pointer = { x: 0, y: 0, tx: 0, ty: 0 };

    this.rafId = 0;
    this.resizeRaf = 0;
    this.lastTime = 0;
    this.running = false;
    this.destroyed = false;

    this.motionQuery =
      typeof global.matchMedia === 'function'
        ? global.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    this.reducedMotion = !!(this.motionQuery && this.motionQuery.matches);

    this.boundLoop = this.loop.bind(this);
    this.boundResize = this.scheduleResize.bind(this);
    this.boundVisibility = this.handleVisibility.bind(this);
    this.boundPointer = this.handlePointer.bind(this);
    this.boundMotionChange = this.handleMotionChange.bind(this);

    this.bindEvents();
    this.resize();

    if (!this.reducedMotion && !this.isHidden()) {
      this.start();
    }
  }

  /* ---------- Setup ------------------------------------------------------ */

  Starfield.prototype.bindEvents = function () {
    global.addEventListener('resize', this.boundResize, { passive: true });
    global.addEventListener('visibilitychange', this.boundVisibility);

    if (this.options.parallax && !this.reducedMotion) {
      var finePointer =
        typeof global.matchMedia !== 'function' ||
        global.matchMedia('(pointer: fine)').matches;
      if (finePointer) {
        global.addEventListener('pointermove', this.boundPointer, { passive: true });
      }
    }

    if (this.motionQuery) {
      if (typeof this.motionQuery.addEventListener === 'function') {
        this.motionQuery.addEventListener('change', this.boundMotionChange);
      } else if (typeof this.motionQuery.addListener === 'function') {
        this.motionQuery.addListener(this.boundMotionChange);
      }
    }
  };

  Starfield.prototype.isHidden = function () {
    return typeof global.document !== 'undefined' && global.document.hidden === true;
  };

  /* ---------- Sizing & star construction -------------------------------- */

  Starfield.prototype.scheduleResize = function () {
    if (this.destroyed || this.resizeRaf) return;
    var self = this;
    this.resizeRaf = global.requestAnimationFrame(function () {
      self.resizeRaf = 0;
      self.resize();
    });
  };

  Starfield.prototype.resize = function () {
    if (this.destroyed) return;

    var width = Math.max(1, global.innerWidth || 1);
    var height = Math.max(1, global.innerHeight || 1);
    var dpr = Math.min(global.devicePixelRatio || 1, 2);

    this.width = width;
    this.height = height;
    this.dpr = dpr;

    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);

    // Resizing a canvas resets its context state, so re-apply the scale.
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.buildStars();

    if (this.reducedMotion) {
      this.drawStatic();
    }
  };

  Starfield.prototype.buildStars = function () {
    var area = this.width * this.height;
    var count = clamp(Math.round(area / 14000), 60, this.options.maxStars);
    var stars = [];

    for (var i = 0; i < count; i++) {
      var roll = Math.random();
      var colorIndex = roll < 0.72 ? 0 : roll < 0.9 ? 1 : 2;
      var radius = 0.4 + Math.random() * 1.35;
      if (Math.random() < 0.06) radius += 0.5;

      stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        r: radius,
        baseAlpha: 0.22 + Math.random() * 0.68,
        phase: Math.random() * TAU,
        speed: 0.0005 + Math.random() * 0.0023,
        driftX: (Math.random() - 0.5) * 0.007,
        driftY: (Math.random() - 0.5) * 0.006,
        depth: 0.35 + Math.random() * 0.65,
        color: PALETTE[colorIndex]
      });
    }

    this.stars = stars;
    this.pairs = this.buildConstellationPairs(stars);
  };

  Starfield.prototype.buildConstellationPairs = function (stars) {
    if (!this.options.constellation || stars.length < 2) return [];

    var pairs = [];
    var maxDistance = 118;
    var maxPairs = 60;

    for (var i = 0; i < stars.length && pairs.length < maxPairs; i++) {
      for (var j = i + 1; j < stars.length && pairs.length < maxPairs; j++) {
        var dx = stars[i].x - stars[j].x;
        var dy = stars[i].y - stars[j].y;
        if (dx * dx + dy * dy < maxDistance * maxDistance) {
          pairs.push({ a: i, b: j });
        }
      }
    }

    return pairs;
  };

  /* ---------- Animation lifecycle --------------------------------------- */

  Starfield.prototype.start = function () {
    if (this.destroyed || this.running || this.reducedMotion || this.isHidden()) return;
    this.running = true;
    this.lastTime = 0;
    this.rafId = global.requestAnimationFrame(this.boundLoop);
  };

  Starfield.prototype.stop = function () {
    this.running = false;
    if (this.rafId) {
      global.cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  };

  Starfield.prototype.loop = function (now) {
    if (!this.running || this.destroyed) return;

    if (!this.lastTime) this.lastTime = now;
    var dt = now - this.lastTime;
    this.lastTime = now;

    // Clamp after tab switches / long frames to avoid jumps.
    if (dt > 50) dt = 50;
    if (dt <= 0) dt = 16.7;

    this.update(dt);
    this.draw();

    this.rafId = global.requestAnimationFrame(this.boundLoop);
  };

  Starfield.prototype.update = function (dt) {
    var i;

    // Ease pointer parallax toward its target.
    var ease = Math.min(1, dt / 260);
    this.pointer.x += (this.pointer.tx - this.pointer.x) * ease;
    this.pointer.y += (this.pointer.ty - this.pointer.y) * ease;

    for (i = 0; i < this.stars.length; i++) {
      var star = this.stars[i];
      star.phase += star.speed * dt;
      star.x += star.driftX * dt;
      star.y += star.driftY * dt;

      if (star.x < -4) star.x = this.width + 4;
      else if (star.x > this.width + 4) star.x = -4;

      if (star.y < -4) star.y = this.height + 4;
      else if (star.y > this.height + 4) star.y = -4;
    }

    if (this.options.shootingStars) {
      this.updateShootingStars(dt);

      // Roughly one shooting star every ~6-8 seconds.
      var spawnChance = 0.0024 * (dt / 16.7);
      if (this.shooting.length < 2 && Math.random() < spawnChance) {
        this.spawnShootingStar();
      }
    }
  };

  Starfield.prototype.spawnShootingStar = function () {
    var angle = Math.PI / 4 + (Math.random() - 0.5) * 0.45;
    var speed = 0.5 + Math.random() * 0.4;

    this.shooting.push({
      x: Math.random() * this.width * 0.8 + this.width * 0.05,
      y: Math.random() * this.height * 0.4,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      ttl: 750 + Math.random() * 550,
      length: 80 + Math.random() * 80
    });
  };

  Starfield.prototype.updateShootingStars = function (dt) {
    for (var i = this.shooting.length - 1; i >= 0; i--) {
      var s = this.shooting[i];
      s.life += dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;

      if (s.life >= s.ttl || s.x > this.width + 140 || s.y > this.height + 140) {
        this.shooting.splice(i, 1);
      }
    }
  };

  /* ---------- Drawing --------------------------------------------------- */

  Starfield.prototype.draw = function () {
    var ctx = this.ctx;
    var offsetX = this.pointer.x * 18;
    var offsetY = this.pointer.y * 18;
    var i;

    ctx.clearRect(0, 0, this.width, this.height);

    if (this.options.constellation) {
      this.drawConstellations(offsetX, offsetY);
    }

    for (i = 0; i < this.stars.length; i++) {
      var star = this.stars[i];
      var alpha = star.baseAlpha * (0.55 + 0.45 * Math.sin(star.phase));
      var x = star.x + offsetX * star.depth;
      var y = star.y + offsetY * star.depth;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = star.color;
      ctx.beginPath();
      ctx.arc(x, y, star.r, 0, TAU);
      ctx.fill();

      if (star.r > 1.25) {
        ctx.globalAlpha = alpha * 0.1;
        ctx.beginPath();
        ctx.arc(x, y, star.r * 2.8, 0, TAU);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
    this.drawShootingStars();
  };

  Starfield.prototype.drawConstellations = function (offsetX, offsetY) {
    if (!this.pairs.length) return;

    var ctx = this.ctx;
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.09)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();

    for (var i = 0; i < this.pairs.length; i++) {
      var a = this.stars[this.pairs[i].a];
      var b = this.stars[this.pairs[i].b];
      if (!a || !b) continue;

      ctx.moveTo(a.x + offsetX * a.depth, a.y + offsetY * a.depth);
      ctx.lineTo(b.x + offsetX * b.depth, b.y + offsetY * b.depth);
    }

    ctx.stroke();
  };

  Starfield.prototype.drawShootingStars = function () {
    if (!this.shooting.length) return;

    var ctx = this.ctx;

    for (var i = 0; i < this.shooting.length; i++) {
      var s = this.shooting[i];
      var progress = clamp(s.life / s.ttl, 0, 1);
      var alpha = Math.sin(progress * Math.PI); // fade in and out
      var magnitude = Math.hypot(s.vx, s.vy) || 1;
      var tailX = s.x - (s.vx / magnitude) * s.length;
      var tailY = s.y - (s.vy / magnitude) * s.length;

      var gradient = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
      gradient.addColorStop(0, 'rgba(103, 232, 249, 0)');
      gradient.addColorStop(1, 'rgba(226, 232, 240, ' + (0.85 * alpha).toFixed(3) + ')');

      ctx.globalAlpha = 1;
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();
    }
  };

  Starfield.prototype.drawStatic = function () {
    var ctx = this.ctx;
    var i;

    ctx.clearRect(0, 0, this.width, this.height);

    for (i = 0; i < this.stars.length; i++) {
      var star = this.stars[i];
      ctx.globalAlpha = star.baseAlpha * 0.85;
      ctx.fillStyle = star.color;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, TAU);
      ctx.fill();
    }

    if (this.options.constellation) {
      ctx.globalAlpha = 1;
      this.drawConstellations(0, 0);
    }

    ctx.globalAlpha = 1;
  };

  /* ---------- Events ---------------------------------------------------- */

  Starfield.prototype.handlePointer = function (event) {
    if (this.reducedMotion) return;
    var x = (event.clientX / this.width) * 2 - 1;
    var y = (event.clientY / this.height) * 2 - 1;
    this.pointer.tx = clamp(x, -1, 1);
    this.pointer.ty = clamp(y, -1, 1);
  };

  Starfield.prototype.handleVisibility = function () {
    if (this.destroyed) return;
    if (this.isHidden()) {
      this.stop();
      return;
    }
    if (!this.reducedMotion) {
      this.lastTime = 0;
      this.start();
    }
  };

  Starfield.prototype.handleMotionChange = function (event) {
    if (this.destroyed) return;
    this.reducedMotion = !!(event && event.matches);
    if (this.reducedMotion) {
      this.stop();
      this.drawStatic();
    } else {
      this.lastTime = 0;
      this.start();
    }
  };

  /* ---------- Cleanup --------------------------------------------------- */

  Starfield.prototype.destroy = function () {
    if (this.destroyed) return;
    this.destroyed = true;
    this.stop();

    global.removeEventListener('resize', this.boundResize);
    global.removeEventListener('visibilitychange', this.boundVisibility);
    global.removeEventListener('pointermove', this.boundPointer);

    if (this.motionQuery) {
      if (typeof this.motionQuery.removeEventListener === 'function') {
        this.motionQuery.removeEventListener('change', this.boundMotionChange);
      } else if (typeof this.motionQuery.removeListener === 'function') {
        this.motionQuery.removeListener(this.boundMotionChange);
      }
    }

    if (this.resizeRaf) {
      global.cancelAnimationFrame(this.resizeRaf);
      this.resizeRaf = 0;
    }

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.stars = [];
    this.pairs = [];
    this.shooting = [];
  };

  global.Starfield = Starfield;
})(window);
