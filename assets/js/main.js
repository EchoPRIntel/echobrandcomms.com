/* Echo — interactions. Vanilla JS, no dependencies. */
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  /* ---------- Preloader (once per session) ---------- */
  var loader = document.querySelector('.loader');
  if (loader) {
    var seen = false;
    try { seen = sessionStorage.getItem('echo-intro') === '1'; } catch (e) {}
    if (seen || reduce) { loader.remove(); }
    else {
      document.body.classList.add('loading');
      setTimeout(function () {
        loader.classList.add('done');
        document.body.classList.remove('loading');
        try { sessionStorage.setItem('echo-intro', '1'); } catch (e) {}
        setTimeout(function () { loader.remove(); }, 900);
      }, 1500);
    }
  }

  /* ---------- Nav ---------- */
  var nav = document.querySelector('.nav');
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY;
    if (nav) {
      nav.classList.toggle('is-scrolled', y > 40);
      nav.classList.toggle('is-hidden', y > 400 && y > lastY + 6 && !document.body.classList.contains('menu-open'));
    }
    lastY = y;
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  var burger = document.querySelector('.burger');
  var menu = document.querySelector('.menu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') !== 'true';
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.classList.toggle('is-open', open);
      document.body.classList.toggle('menu-open', open);
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        burger.setAttribute('aria-expanded', 'false');
        menu.classList.remove('is-open');
        document.body.classList.remove('menu-open');
      });
    });
  }

  /* ---------- Reveal + line reveals + counters ---------- */
  var revealEls = document.querySelectorAll('.reveal, .lines');
  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = (el.getAttribute('data-decimals') || '0') | 0;
    var dur = 1600, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      var v = target * e;
      el.textContent = decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
    revealEls.forEach(function (el) { io.observe(el); });
    var ic = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { runCounter(e.target); ic.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { ic.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
    counters.forEach(function (el) {
      var t = parseFloat(el.getAttribute('data-count')); var d = (el.getAttribute('data-decimals') || '0') | 0;
      el.textContent = d ? t.toFixed(d) : Math.round(t).toLocaleString('en-US');
    });
  }

  /* ---------- Marquee duplication ---------- */
  document.querySelectorAll('.marquee-track').forEach(function (track) {
    var dup = document.createElement('div');
    dup.className = 'dup'; dup.style.display = 'contents';
    dup.setAttribute('aria-hidden', 'true');
    dup.innerHTML = track.innerHTML;
    track.appendChild(dup);
  });

  /* ---------- Hero ripple canvas ---------- */
  var canvas = document.querySelector('.hero canvas');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var hero = canvas.parentElement;
    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var ripples = [];
    var lastSpawn = 0, lastMove = 0;
    var pointer = { x: null, y: null };
    function resize() {
      W = hero.clientWidth; H = hero.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);
    function spawn(x, y, strength) {
      ripples.push({ x: x, y: y, t: performance.now(), s: strength || 1 });
      if (ripples.length > 14) ripples.shift();
    }
    var rect = function () { return hero.getBoundingClientRect(); };
    hero.addEventListener('pointermove', function (e) {
      var r = rect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
      var now = performance.now();
      if (now - lastMove > 260) { spawn(pointer.x, pointer.y, 0.55); lastMove = now; }
    });
    hero.addEventListener('pointerleave', function () { pointer.x = null; });
    hero.addEventListener('pointerdown', function (e) {
      var r = rect(); spawn(e.clientX - r.left, e.clientY - r.top, 1.6);
    });
    var baseX = function () { return W * 0.72; }, baseY = function () { return H * 0.42; };
    function draw(now) {
      if (now - lastSpawn > 2600) { spawn(baseX(), baseY(), 1); lastSpawn = now; }
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;
      var speed = 0.11; // px per ms
      var maxR = Math.max(W, H) * 0.9;
      for (var i = ripples.length - 1; i >= 0; i--) {
        var rp = ripples[i];
        var age = now - rp.t;
        var r0 = age * speed;
        if (r0 - 6 * 34 > maxR) { ripples.splice(i, 1); continue; }
        for (var k = 0; k < 7; k++) {
          var r = r0 - k * 34 * rp.s;
          if (r <= 0) continue;
          var life = 1 - r / maxR;
          var a = Math.max(0, life) * 0.42 * rp.s * (1 - k * 0.1);
          if (a <= 0.005) continue;
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(246,243,238,' + a.toFixed(3) + ')';
          ctx.arc(rp.x, rp.y, r, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      /* static brand mark echo in the background */
      var cx = baseX(), cy = baseY();
      for (var j = 0; j < 6; j++) {
        var rr = (0.13 + j * 0.028) * Math.min(W, H) * 1.6;
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(246,243,238,' + (0.07 - j * 0.008).toFixed(3) + ')';
        ctx.arc(cx - rr * 0.0 + j * 10, cy, rr, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (!reduce) requestAnimationFrame(draw);
    }
    if (reduce) {
      spawn(baseX(), baseY(), 1); ripples[0].t = performance.now() - 2600;
      draw(performance.now());
    } else {
      spawn(baseX(), baseY(), 1.2);
      requestAnimationFrame(draw);
    }
  }

  /* ---------- Word rotator ---------- */
  document.querySelectorAll('.rotator').forEach(function (rot) {
    var words = rot.querySelectorAll('span');
    if (words.length < 2 || reduce) { if (words[0]) words[0].classList.add('on'); return; }
    var i = 0; words[0].classList.add('on');
    setInterval(function () {
      words[i].classList.remove('on');
      i = (i + 1) % words.length;
      words[i].classList.add('on');
    }, 2800);
  });

  /* ---------- Service tiles: measure lift, tap-to-reveal on touch ---------- */
  var tiles = document.querySelectorAll('.tile');
  function measureTiles() {
    tiles.forEach(function (t) {
      var more = t.querySelector('.more'); var body = t.querySelector('.tile-body');
      if (!more || !body) return;
      var pad = parseFloat(getComputedStyle(t).paddingBottom) || 22;
      var avail = t.clientHeight - body.offsetTop - body.offsetHeight - pad;
      var need = more.offsetHeight + 12 - avail;
      t.style.setProperty('--lift', (need > 0 ? need : 0) + 'px');
    });
  }
  if (tiles.length) {
    if (fine) measureTiles(); window.addEventListener('resize', function () { if (fine) measureTiles(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureTiles);
    window.addEventListener('load', measureTiles); setTimeout(measureTiles, 800);
    if (!fine) {
      tiles.forEach(function (t) {
        t.addEventListener('click', function (e) {
          if (!t.classList.contains('is-on')) {
            e.preventDefault();
            tiles.forEach(function (o) { o.classList.remove('is-on'); });
            t.classList.add('is-on');
          }
        });
      });
      document.addEventListener('click', function (e) { if (!e.target.closest('.tile')) tiles.forEach(function (o) { o.classList.remove('is-on'); }); });
    }
  }

  /* ---------- Parallax images ---------- */
  var par = document.querySelectorAll('[data-parallax]');
  if (par.length && !reduce) {
    var tick = false;
    function parallax() {
      par.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        var vh = window.innerHeight;
        if (r.bottom < 0 || r.top > vh) return;
        var p = (r.top + r.height / 2 - vh / 2) / vh; // -0.5..0.5
        var amt = parseFloat(el.getAttribute('data-parallax')) || 10;
        el.style.transform = 'scale(1.12) translateY(' + (p * amt).toFixed(2) + '%)';
      });
      tick = false;
    }
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(parallax); } }, { passive: true });
    parallax();
  }

  /* ---------- Horizontal rail (pinned) ---------- */
  var rail = document.querySelector('.rail');
  if (rail) {
    var track = rail.querySelector('.rail-track');
    var sticky = rail.querySelector('.rail-sticky');
    var bar = rail.querySelector('.rail-progress i');
    var enabled = false;
    function setup() {
      enabled = window.innerWidth > 900 && fine;
      if (!enabled) { rail.style.height = ''; track.style.transform = ''; return; }
      var dist = track.scrollWidth - window.innerWidth;
      rail.style.height = (window.innerHeight + dist) + 'px';
      update();
    }
    function update() {
      if (!enabled) return;
      var r = rail.getBoundingClientRect();
      var dist = track.scrollWidth - window.innerWidth;
      var p = Math.min(1, Math.max(0, -r.top / (rail.offsetHeight - window.innerHeight)));
      track.style.transform = 'translateX(' + (-p * dist).toFixed(1) + 'px)';
      if (bar) bar.style.width = (p * 100).toFixed(1) + '%';
    }
    setup();
    window.addEventListener('resize', setup);
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('load', setup);
  }

  /* ---------- Testimonial carousel ---------- */
  document.querySelectorAll('.carousel').forEach(function (c) {
    var track = c.querySelector('.carousel-track');
    var slides = c.querySelectorAll('.slide');
    var prev = c.querySelector('[data-prev]'), next = c.querySelector('[data-next]');
    var count = c.querySelector('.carousel-count'), bar = c.querySelector('.carousel-bar i');
    var i = 0, n = slides.length, timer;
    function go(k) {
      i = (k + n) % n;
      track.style.transform = 'translateX(' + (-i * 100) + '%)';
      if (count) count.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
      if (bar) bar.style.width = ((i + 1) / n * 100) + '%';
      slides.forEach(function (s, j) { s.setAttribute('aria-hidden', j === i ? 'false' : 'true'); });
    }
    function auto() { clearInterval(timer); if (!reduce) timer = setInterval(function () { go(i + 1); }, 7000); }
    if (prev) prev.addEventListener('click', function () { go(i - 1); auto(); });
    if (next) next.addEventListener('click', function () { go(i + 1); auto(); });
    /* drag */
    var vp = c.querySelector('.carousel-viewport'), sx = 0, dx = 0, drag = false;
    vp.addEventListener('pointerdown', function (e) { drag = true; sx = e.clientX; dx = 0; track.classList.add('dragging'); vp.setPointerCapture(e.pointerId); });
    vp.addEventListener('pointermove', function (e) { if (!drag) return; dx = e.clientX - sx; track.style.transform = 'translateX(calc(' + (-i * 100) + '% + ' + dx + 'px))'; });
    function end() { if (!drag) return; drag = false; track.classList.remove('dragging'); if (Math.abs(dx) > 60) go(dx < 0 ? i + 1 : i - 1); else go(i); auto(); }
    vp.addEventListener('pointerup', end); vp.addEventListener('pointercancel', end); vp.addEventListener('pointerleave', end);
    c.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { go(i + 1); auto(); } if (e.key === 'ArrowLeft') { go(i - 1); auto(); } });
    go(0); auto();
  });

  /* ---------- Magnetic buttons ---------- */
  if (fine && !reduce) {
    document.querySelectorAll('.btn, .carousel-btn, .service .arrow').forEach(function (b) {
      var parent = b;
      parent.addEventListener('mousemove', function (e) {
        var r = parent.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) / r.width;
        var y = (e.clientY - r.top - r.height / 2) / r.height;
        b.style.transform = 'translate(' + (x * 10).toFixed(1) + 'px,' + (y * 10).toFixed(1) + 'px)';
      });
      parent.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
  }

  /* ---------- Custom cursor ---------- */
  if (fine && !reduce) {
    var dot = document.createElement('div'); dot.className = 'cursor';
    var ring = document.createElement('div'); ring.className = 'cursor-ring';
    var label = document.createElement('div'); label.className = 'cursor-label';
    document.body.appendChild(dot); document.body.appendChild(ring); document.body.appendChild(label);
    var mx = -100, my = -100, rx = -100, ry = -100, shown = false;
    window.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!shown) { shown = true; document.body.classList.add('has-cursor'); rx = mx; ry = my; }
    }, { passive: true });
    document.addEventListener('mouseleave', function () { document.body.classList.remove('has-cursor'); shown = false; });
    (function cl() {
      rx = lerp(rx, mx, 0.18); ry = lerp(ry, my, 0.18);
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      label.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
      requestAnimationFrame(cl);
    })();
    var hoverSel = 'a, button, summary, .carousel-viewport, [data-cursor]';
    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest(hoverSel);
      document.body.classList.toggle('cursor-hover', !!t);
      var txt = t && t.getAttribute('data-cursor');
      document.body.classList.toggle('cursor-label-on', !!txt);
      label.textContent = txt || '';
    });
  }

  /* ---------- Copy buttons ---------- */
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var done = function () {
        var l = btn.textContent; btn.textContent = 'Copied'; btn.classList.add('done');
        setTimeout(function () { btn.textContent = l; btn.classList.remove('done'); }, 1800);
      };
      var fallback = function () {
        var code = btn.parentElement.querySelector('code');
        if (code) { var range = document.createRange(); range.selectNodeContents(code); var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); }
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
      else fallback();
    });
  });

  /* ---------- FAQ: one open at a time ---------- */
  var faqs = document.querySelectorAll('.faq details');
  faqs.forEach(function (d) { d.addEventListener('toggle', function () { if (d.open) faqs.forEach(function (o) { if (o !== d) o.open = false; }); }); });

  /* ---------- Services: sticky stage follows the list ---------- */
  var scroller = document.querySelector('.svc-scroll');
  if (scroller && 'IntersectionObserver' in window) {
    var stageImgs = scroller.querySelectorAll('.svc-stage-frame img');
    var svcItems = scroller.querySelectorAll('.svc-item');
    var stageN = scroller.querySelector('.svc-stage-n');
    var stageTitle = scroller.querySelector('.svc-stage-title');
    var stageBar = scroller.querySelector('.svc-stage-bar i');
    var current = -1;
    function setSvc(k) {
      if (k === current) return; current = k;
      stageImgs.forEach(function (im, j) { im.classList.toggle('is-on', j === k); });
      svcItems.forEach(function (it, j) { it.classList.toggle('is-active', j === k); });
      if (stageN) stageN.textContent = String(k + 1).padStart(2, '0');
      if (stageTitle) stageTitle.textContent = svcItems[k].querySelector('h3').textContent;
      if (stageBar) stageBar.style.width = ((k + 1) / svcItems.length * 100) + '%';
    }
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setSvc(+e.target.getAttribute('data-i')); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    svcItems.forEach(function (it) { so.observe(it); });
    scroller.classList.add('is-live');
    setSvc(0);
  }

  /* ---------- Year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
