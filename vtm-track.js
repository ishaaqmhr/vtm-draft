/* VTM outreach tracker: one shared script for every outreach page on visualtruthmedia.com.
   Usage (put before </body>):  <script src="/vtm-track.js" data-slug="leadname" defer></script>
   Tracks by default: open, every link click (with its URL), tab hide/show, leave + dwell seconds.
   If the page has a <video>: play, 25/50/75%, ended. If it has #aiBtn: summary click.
   Fires only on visualtruthmedia.com, so local previews never count. */
(function () {
  var host = location.hostname;
  if (host !== 'visualtruthmedia.com' && host !== 'www.visualtruthmedia.com') return;
  var me = document.currentScript;
  var SLUG = (me && me.getAttribute('data-slug')) || '';
  if (!/^[a-z0-9-]{1,40}$/.test(SLUG)) return;
  var ENDPOINT = 'https://vtm-track.ishaaqmhr.workers.dev/e';
  var SID = Math.random().toString(36).slice(2, 12);
  var t0 = Date.now();
  var vid = null;
  var once = {};

  function send(ev, href) {
    var payload = { slug: SLUG, sid: SID, event: ev, sec: Math.round((Date.now() - t0) / 1000), vidSec: vid ? Math.round(vid.currentTime || 0) : 0 };
    if (href) payload.href = String(href).slice(0, 200);
    var body = JSON.stringify(payload);
    if (navigator.sendBeacon) { navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain' })); }
    else { fetch(ENDPOINT, { method: 'POST', body: body, keepalive: true }).catch(function () {}); }
  }
  function first(ev) { if (!once[ev]) { once[ev] = 1; send(ev); } }

  function init() {
    vid = document.querySelector('video');
    send('open');
    if (vid) {
      vid.addEventListener('play', function () { first('play'); });
      vid.addEventListener('timeupdate', function () {
        if (!vid.duration) return;
        var p = vid.currentTime / vid.duration;
        if (p >= 0.25) first('p25');
        if (p >= 0.5) first('p50');
        if (p >= 0.75) first('p75');
      });
      vid.addEventListener('ended', function () { first('ended'); });
    }
    var ai = document.getElementById('aiBtn');
    if (ai) ai.addEventListener('click', function () { first('summary'); });
    // Every link click, by default (capture phase so it fires before the new tab opens)
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (a) send('link', a.href);
    }, true);
    document.addEventListener('visibilitychange', function () { send(document.hidden ? 'tab_hide' : 'tab_show'); });
    window.addEventListener('pagehide', function () { send('leave'); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
