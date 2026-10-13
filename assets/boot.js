/* pick the starting tab from the link before anything paints */
(function () {
  var d = document.documentElement, h = (location.hash || '').slice(1);
  var views = ['overview', 'experience', 'skills', 'homelab'];
  var emps = ['lansight', 'coke-florida', 'health-choice'];
  var ws = ['monitoring', 'compliance', 'network', 'dispatch', 'identity'];
  var view = 'overview', emp = 'lansight', w = 'monitoring';
  if (views.indexOf(h) > -1) view = h;
  else if (emps.indexOf(h) > -1) { view = 'experience'; emp = h; }
  else if (h.indexOf('ws-') === 0 && ws.indexOf(h.slice(3)) > -1) { view = 'experience'; w = h.slice(3); }
  else if (['cjis', 'lansight-team', 'municipal'].indexOf(h) > -1) view = 'experience';
  else if (h === 'contact') view = 'experience';
  d.setAttribute('data-view', view);
  d.setAttribute('data-emp', emp);
  d.setAttribute('data-ws', w);
})();
