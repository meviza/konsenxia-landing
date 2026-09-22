(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var y = document.getElementById('y');
  if (y) y.textContent = new Date().getFullYear();

  /* scroll progress bar */
  var bar = document.querySelector('.progress');
  function onScrollProgress() {
    if (!bar) return;
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? (h.scrollTop || document.body.scrollTop) / max * 100 : 0) + '%';
  }
  window.addEventListener('scroll', onScrollProgress, { passive: true });
  onScrollProgress();

  /* stagger reveal */
  var io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  }
  document.querySelectorAll('.reveal').forEach(function (el, i) {
    if (!el.style.getPropertyValue('--d')) {
      var group = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : i;
      el.style.setProperty('--d', Math.min(group, 8) * 70 + 'ms');
    }
    if (io) io.observe(el); else el.classList.add('in');
  });

  /* parallax orbs */
  var orbs = document.querySelectorAll('.orb');
  if (!reduce && orbs.length) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var sc = window.scrollY || 0;
        orbs.forEach(function (o, i) {
          o.style.translate = '0 ' + (sc * (i % 2 ? -0.06 : 0.09)).toFixed(1) + 'px';
        });
        ticking = false;
      });
    }, { passive: true });
  }

  /* metric count-up (pure numeric values only — no invented digits) */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    if (isNaN(target)) return;
    var suffix = el.getAttribute('data-suffix') || '';
    var decimals = (String(el.getAttribute('data-count')).split('.')[1] || '').length;
    if (reduce) { el.textContent = target.toFixed(decimals) + suffix; return; }
    var dur = 1100, t0 = null;
    function frame(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = target.toFixed(decimals) + suffix;
    }
    requestAnimationFrame(frame);
  }
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { cio.observe(c); });
  } else {
    counters.forEach(animateCount);
  }

  /* magnetic CTA */
  if (!reduce && window.matchMedia && window.matchMedia('(hover:hover)').matches) {
    document.querySelectorAll('.btn-p, .nav-cta').forEach(function (btn) {
      btn.addEventListener('mousemove', function (ev) {
        var r = btn.getBoundingClientRect();
        var mx = ev.clientX - r.left - r.width / 2;
        var my = ev.clientY - r.top - r.height / 2;
        btn.style.transform = 'translate(' + (mx * 0.14).toFixed(1) + 'px,' + (my * 0.2 - 2).toFixed(1) + 'px)';
      });
      btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
    });
  }

  /* mobile nav */
  var burger = document.querySelector('.nav-burger');
  var panel = document.querySelector('.nav-panel');
  if (burger && panel) {
    burger.addEventListener('click', function () {
      var open = panel.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    panel.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { panel.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); });
    });
  }

  /* close locale menu on outside click */
  document.querySelectorAll('.locale').forEach(function (d) {
    document.addEventListener('click', function (ev) {
      if (d.open && !d.contains(ev.target)) d.open = false;
    });
  });

  /* contact form → POST /api/contact */
  var form = document.getElementById('contactForm');
  if (form) {
    var btn = document.getElementById('submitBtn');
    var msg = document.getElementById('formMsg');
    var L = {};
    try {
      var raw = document.documentElement.getAttribute('data-form');
      if (raw) L = JSON.parse(raw);
    } catch (e) { L = {}; }
    var errRequired = L.errRequired || 'Please fill in the required fields.';
    var errEmail = L.errEmail || 'Please enter a valid email address.';
    var errGeneric = L.errGeneric || 'Something went wrong. Please try again.';
    var successMsg = L.success || 'Thank you! Your request has been received.';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      msg.className = 'form-msg';
      msg.textContent = '';
      if (form.website.value) return;

      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      if (!data.name || !data.name.trim() || !data.email || !data.email.trim() || !data.interest || !data.message || !data.message.trim()) {
        msg.className = 'form-msg err';
        msg.textContent = errRequired;
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        msg.className = 'form-msg err';
        msg.textContent = errEmail;
        return;
      }
      btn.classList.add('loading');
      btn.disabled = true;
      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name, email: data.email, company: data.company || '',
          phone: data.phone || '', interest: data.interest, message: data.message,
          website: data.website || '', site: 'konsenxia',
          locale: document.documentElement.lang || 'en'
        })
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (out) {
          if (!res.ok) throw new Error(out.error || errGeneric);
          msg.className = 'form-msg ok';
          msg.textContent = successMsg;
          form.reset();
        });
      }).catch(function (err) {
        msg.className = 'form-msg err';
        msg.textContent = (err && err.message) || errGeneric;
      }).then(function () {
        btn.classList.remove('loading');
        btn.disabled = false;
      });
    });
  }
})();
