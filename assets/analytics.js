/* Visit counts with GoatCounter (https://www.goatcounter.com): no cookies, no personal data stored.
   First-party beacon: a plain image request to your GoatCounter site, so no third-party script runs here.
   Setup: create a free site at goatcounter.com/signup and put its code below ("patrickborges" -> patrickborges.goatcounter.com).
   Leave CODE empty to switch tracking off. */
(function () {
  'use strict';
  var CODE = 'patrickborges';

  var d = document.documentElement;
  var host = location.hostname;
  if (!CODE) return;
  if (host === 'localhost' || host === '127.0.0.1' || host === '' || location.protocol === 'file:') return;
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true) return;

  var endpoint = 'https://' + CODE + '.goatcounter.com/count';
  var first = true;

  function send(params) {
    var q = [];
    for (var k in params) if (params[k] !== undefined && params[k] !== '') q.push(k + '=' + encodeURIComponent(params[k]));
    q.push('rnd=' + Math.random().toString(36).slice(2, 8));
    new Image().src = endpoint + '?' + q.join('&');
  }

  function screenInfo() {
    return [window.screen.width, window.screen.height, window.devicePixelRatio || 1].join(',');
  }

  function pageFor() {
    var v = d.getAttribute('data-view') || 'overview';
    if (v === 'overview') return { p: '/', t: 'Overview' };
    if (v === 'experience') {
      var e = d.getAttribute('data-emp') || 'lansight';
      return { p: '/experience/' + e, t: 'Experience: ' + e };
    }
    return { p: '/' + v, t: v.charAt(0).toUpperCase() + v.slice(1) };
  }

  /* one page view per tab the visitor looks at; the page swaps tabs without reloading, so watch the state attributes */
  var last = '', timer;
  function view() {
    var pg = pageFor();
    if (pg.p === last) return;
    last = pg.p;
    var ref = '';
    if (first) {
      try { if (document.referrer && new URL(document.referrer).host !== host) ref = document.referrer; } catch (err) { /* ignore */ }
    }
    send({ p: pg.p, t: pg.t, r: ref, s: first ? screenInfo() : '' });
    first = false;
  }
  function queue() { clearTimeout(timer); timer = setTimeout(view, 60); }
  new MutationObserver(queue).observe(d, { attributes: true, attributeFilter: ['data-view', 'data-emp'] });
  queue();

  /* the actions a recruiter takes */
  function event(name) { send({ p: name, t: name, e: 'true' }); }
  document.addEventListener('click', function (ev) {
    var el = ev.target && ev.target.closest ? ev.target.closest('a[href], button[data-copy]') : null;
    if (!el) return;
    if (el.hasAttribute('data-resume')) return event('download-resume');
    if (el.hasAttribute('data-copy')) return event('copy-email');
    var href = el.getAttribute('href') || '';
    if (href.indexOf('linkedin.com') > -1) return event('click-linkedin');
    if (href.indexOf('mailto:') === 0) return event('click-email');
  }, true);
})();
