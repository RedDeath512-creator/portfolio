(function () {
  var d = document.documentElement;
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  function all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function byId(id) { return id ? document.getElementById(id) : null; }

  var VIEWS = ['overview', 'experience', 'skills', 'homelab'];
  var EMPS = ['lansight', 'coke-florida', 'health-choice'];
  var WS = ['monitoring', 'compliance', 'network', 'identity', 'dispatch'];
  var LANSIGHT_PARTS = ['cjis', 'lansight-team', 'municipal'];
  var MAP_FOCUS = {
    monitoring: ['endpoints', 'defender', 'siem'],
    network: ['patrol', 'carriers', 'remote', 'edge'],
    identity: ['ad', 'entra']
  };

  /* ---------- small animations, replayed whenever a panel is shown ---------- */
  function countUp(el) {
    var to = Number(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var start = null;
    function fmt(n) { return Math.round(n).toLocaleString('en-US') + suffix; }
    if (reduce) { el.textContent = fmt(to); return; }
    function step(t) {
      if (start === null) start = t;
      var p = Math.min(1, (t - start) / 1100);
      el.textContent = fmt(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function replay(scope) {
    if (!scope || reduce) return;
    all('[data-count]', scope).forEach(countUp);
    all('[data-reveal]', scope).forEach(function (el) {
      el.classList.add('is-pending');
      void el.offsetWidth;
      el.classList.remove('is-pending');
    });
  }

  /* ---------- state: which tab, employer and workstream ---------- */
  function syncState() {
    var view = d.getAttribute('data-view');
    var emp = d.getAttribute('data-emp');
    var ws = d.getAttribute('data-ws');
    all('.tabs a').forEach(function (a) {
      if (a.getAttribute('data-view') === view) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    all('.emps [role="tab"]').forEach(function (b) {
      var on = b.getAttribute('data-emp') === emp;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    all('.ws-tabs [role="tab"]').forEach(function (b) {
      var on = b.getAttribute('data-ws') === ws;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    var map = byId('cjis-map');
    if (map) {
      var focus = MAP_FOCUS[ws] || null;
      map.classList.toggle('has-focus', !!focus);
      all('a[data-node]', map).forEach(function (a) {
        a.classList.toggle('on', !!focus && focus.indexOf(a.getAttribute('data-node')) > -1);
      });
    }
  }

  function setHash(id, push) {
    try {
      if (push) history.pushState(null, '', '#' + id);
      else history.replaceState(null, '', '#' + id);
    } catch (e) { /* the viewer may not allow history changes; the page still works */ }
  }

  /* resolve any in-page target to a tab (and employer / workstream) and show it */
  function go(id, opts) {
    opts = opts || {};
    var view = null, emp = null, ws = null;
    if (VIEWS.indexOf(id) > -1) view = id;
    else if (EMPS.indexOf(id) > -1) { view = 'experience'; emp = id; }
    else if (id.indexOf('ws-') === 0 && WS.indexOf(id.slice(3)) > -1) { view = 'experience'; emp = 'lansight'; ws = id.slice(3); }
    else if (LANSIGHT_PARTS.indexOf(id) > -1) { view = 'experience'; emp = 'lansight'; }
    else if (id === 'contact') view = d.getAttribute('data-view') === 'overview' ? 'experience' : d.getAttribute('data-view');
    else return false;

    var viewChanged = view !== d.getAttribute('data-view');
    var empChanged = emp && emp !== d.getAttribute('data-emp');
    var wsChanged = ws && ws !== d.getAttribute('data-ws');
    d.setAttribute('data-view', view);
    if (emp) d.setAttribute('data-emp', emp);
    if (ws) d.setAttribute('data-ws', ws);
    syncState();

    if (viewChanged && view === 'experience') replay(byId(d.getAttribute('data-emp')));
    else if (empChanged) replay(byId(emp));
    if (wsChanged || (viewChanged && view === 'experience')) replay(byId('ws-' + d.getAttribute('data-ws')));

    if (opts.history !== false) setHash(id, viewChanged);

    var behavior = reduce ? 'auto' : 'smooth';
    if (opts.scroll === 'none') return true;
    if (opts.scroll === 'panel') {
      var panel = byId('ws-' + d.getAttribute('data-ws'));
      if (panel) panel.scrollIntoView({ block: 'start', behavior: behavior });
      return true;
    }
    if (VIEWS.indexOf(id) > -1 || EMPS.indexOf(id) > -1) {
      if (viewChanged || EMPS.indexOf(id) < 0) window.scrollTo({ top: 0, behavior: 'auto' });
      else {
        var list = document.querySelector('.emps');
        if (list && list.getBoundingClientRect().top < 0) list.scrollIntoView({ block: 'start', behavior: behavior });
      }
    } else if (ws) {
      var target = viewChanged ? byId('cjis') : byId('ws-' + ws);
      if (target) {
        var r = target.getBoundingClientRect();
        if (viewChanged || r.top < 60 || r.top > window.innerHeight - 120) target.scrollIntoView({ block: viewChanged ? 'start' : 'nearest', behavior: viewChanged ? 'auto' : behavior });
      }
    } else {
      var el = byId(id);
      if (el) el.scrollIntoView({ block: 'start', behavior: viewChanged ? 'auto' : behavior });
    }
    return true;
  }

  document.addEventListener('click', function (ev) {
    if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    var a = ev.target && ev.target.closest ? ev.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    var opts = a.closest('.map') ? { scroll: window.innerWidth < 980 ? 'panel' : 'none' } : {};
    if (go(id, opts)) ev.preventDefault();
  });

  all('.emps [role="tab"]').forEach(function (b) {
    b.addEventListener('click', function () { go(b.getAttribute('data-emp')); });
  });
  all('.ws-tabs [role="tab"]').forEach(function (b) {
    b.addEventListener('click', function () { go('ws-' + b.getAttribute('data-ws'), { scroll: 'none' }); });
  });
  /* arrow keys move between tabs in each tab list */
  all('[role="tablist"]').forEach(function (list) {
    list.addEventListener('keydown', function (e) {
      var tabs = all('[role="tab"]', list);
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var n = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') n = 0;
      if (e.key === 'End') n = tabs.length - 1;
      if (n === null) return;
      e.preventDefault();
      tabs[n].focus();
      tabs[n].click();
    });
  });
  window.addEventListener('popstate', function () {
    var id = (location.hash || '#overview').slice(1);
    if (!go(id, { history: false })) go('overview', { history: false });
  });

  /* first paint: the head script already picked the tab; finish the job */
  syncState();
  (function () {
    var id = (location.hash || '').slice(1);
    var view = d.getAttribute('data-view');
    if (view === 'experience') {
      replay(byId(d.getAttribute('data-emp')));
      replay(byId('ws-' + d.getAttribute('data-ws')));
    }
    /* the browser jumps to the fragment on load; land each kind of link where it reads best */
    function land() {
      if (!id) return;
      if (VIEWS.indexOf(id) > -1 || EMPS.indexOf(id) > -1) { window.scrollTo(0, 0); return; }
      var t = id.indexOf('ws-') === 0 ? byId('cjis') : byId(id);
      if (t) t.scrollIntoView({ block: 'start' });
    }
    requestAnimationFrame(land);
    window.addEventListener('load', function () { requestAnimationFrame(land); }, { once: true });
  })();

  /* ---------- theme, copy, toast ---------- */
  var modeBtn = byId('mode');
  if (modeBtn) modeBtn.addEventListener('click', function () {
    var t = d.getAttribute('data-theme');
    var dark = t === 'dark' || (t !== 'light' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    d.setAttribute('data-theme', dark ? 'light' : 'dark');
  });

  var toast = byId('toast');
  var toastTimer;
  function say(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.hidden = true; }, 3600);
  }

  all('[data-copy]').forEach(function (btn) {
    var original = btn.textContent;
    var timer;
    function flash(msg) {
      btn.textContent = msg;
      clearTimeout(timer);
      timer = setTimeout(function () { btn.textContent = original; }, 1600);
    }
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var target = byId(btn.getAttribute('data-target'));
      function fallback() {
        if (target && window.getSelection) {
          var range = document.createRange();
          range.selectNodeContents(target);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
        flash('Selected');
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { flash('Copied'); }, fallback);
      } else {
        fallback();
      }
    });
  });

  /* ---------- résumé download: the viewer's save prompt inside Claude, a plain link anywhere else ---------- */
  var RESUME = 'Patrick_Borges_Resume.pdf';
  var cvLinks = all('[data-resume]');
  var inViewer = !!(window.claude && typeof window.claude.use === 'function');
  var dlReady = inViewer
    ? Promise.resolve().then(function () { return window.claude.use('downloads'); }).catch(function () { return null; })
    : null;
  function hideCv() { cvLinks.forEach(function (a) { a.hidden = true; }); }
  if (dlReady) dlReady.then(function (dl) { if (!dl) hideCv(); });
  var busy = false;
  cvLinks.forEach(function (a) {
    a.addEventListener('click', function (ev) {
      if (!dlReady) return;
      ev.preventDefault();
      if (busy) return;
      busy = true;
      dlReady.then(function (dl) {
        if (!dl) {
          hideCv();
          say("Download isn’t available in this view. Email me and I’ll send my résumé.");
          return;
        }
        return fetch(RESUME)
          .then(function (r) { if (!r.ok) throw { code: 'missing' }; return r.blob(); })
          .then(function (blob) { return dl.save({ filename: RESUME, data: blob }); })
          .then(function () { say('Résumé saved.'); });
      }).catch(function (err) {
        var code = err && err.code;
        if (code === 'declined') return;
        if (code === 'rate_limited') { say('A save prompt is already open.'); return; }
        say("The résumé couldn’t be downloaded here. Email me and I’ll send it.");
      }).then(function () { busy = false; });
    });
  });
})();
