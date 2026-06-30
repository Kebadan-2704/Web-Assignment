/* ============================================
   INLINE.JS — Scripts extracted from index.html
   Early access form, newsletter, gate modal,
   and "Stay in the Loop" remover.
   ============================================ */

/* ── Early Access Form (#early-access) ── */
(function () {
  var form = document.getElementById('luxe-ea-form');
  var nameInput = document.getElementById('luxe-ea-name');
  var emailInput = document.getElementById('luxe-ea-email');
  var msg = document.getElementById('luxe-ea-msg');
  var section = document.getElementById('early-access');

  if (!form) return;

  function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = nameInput.value.trim();
    var email = emailInput.value.trim();
    msg.className = 'luxe-ea__msg';
    if (!name) { msg.textContent = 'Please enter your name.'; msg.classList.add('is-error'); nameInput.focus(); return; }
    if (!isValidEmail(email)) { msg.textContent = 'Please enter a valid email address.'; msg.classList.add('is-error'); emailInput.focus(); return; }
    try { localStorage.setItem('luxe_early_access', JSON.stringify({ name: name, email: email, at: Date.now() })); } catch (err) {}
    section.classList.add('luxe-ea--done');
    msg.textContent = "\ud83c\udf89 You\u2019re on the list, " + name + "! Check your inbox for your early access pass.";
    msg.classList.add('is-success');
  });
})();


/* ── Newsletter Form (#luxe-newsletter) ── */
(function () {
  var f = document.getElementById('luxe-nl-form');
  var e = document.getElementById('luxe-nl-email');
  var m = document.getElementById('luxe-nl-msg');

  if (!f) return;

  function ok(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  f.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var email = e.value.trim();
    m.className = 'luxe-nl__msg';
    if (!ok(email)) { m.textContent = 'Please enter a valid email address.'; m.classList.add('is-error'); e.focus(); return; }
    try { localStorage.setItem('luxe_newsletter', JSON.stringify({ email: email, at: Date.now() })); } catch (err) {}
    f.reset();
    m.textContent = '\u2713 Thanks for subscribing!';
    m.classList.add('is-success');
  });
})();


/* ── Early Access Gate Modal (#luxe-eam-modal) ── */
(function () {
  var modal = document.getElementById('luxe-eam-modal');
  if (!modal) return;

  var card = modal.querySelector('.luxe-eam__card');
  var form = document.getElementById('luxe-eam-form');
  var nameI = document.getElementById('luxe-eam-name');
  var emailI = document.getElementById('luxe-eam-email');
  var msg = document.getElementById('luxe-eam-msg');
  var closeBtn = document.getElementById('luxe-eam-close');

  function open() { modal.classList.add('is-open'); document.body.style.overflow = 'hidden'; setTimeout(function () { nameI.focus(); }, 60); }
  function close() { modal.classList.remove('is-open'); document.body.style.overflow = ''; }
  function valid(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  function allowed(el) {
    return el.closest('#luxe-eam-modal')
        || el.closest('#early-access')
        || el.closest('#luxe-newsletter')
        || el.closest('[data-theme-toggle]')
        || el.closest('#mobile-menu-toggle')
        || el.closest('.mobile-drawer__header')
        || el.closest('.back-to-top');
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('a, button');
    if (!t) return;
    if (allowed(t)) return;
    e.preventDefault();
    e.stopPropagation();
    open();
  }, true);

  closeBtn.addEventListener('click', close);
  modal.addEventListener('click', function (e) { if (!card.contains(e.target)) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('is-open')) close(); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = nameI.value.trim();
    var email = emailI.value.trim();
    msg.className = 'luxe-eam__msg';
    if (!name) { msg.textContent = 'Please enter your name.'; msg.classList.add('is-error'); nameI.focus(); return; }
    if (!valid(email)) { msg.textContent = 'Please enter a valid email address.'; msg.classList.add('is-error'); emailI.focus(); return; }
    try { localStorage.setItem('luxe_early_access', JSON.stringify({ name: name, email: email, at: Date.now() })); } catch (err) {}
    modal.classList.add('luxe-eam--done');
    msg.textContent = "\ud83c\udf89 You\u2019re on the list, " + name + "! We\u2019ll be in touch soon.";
    msg.classList.add('is-success');
    setTimeout(close, 2200);
  });
})();


/* ── Remove old "Stay in the Loop" newsletter injected by page JS ── */
(function () {
  function removeStayInLoop() {
    var heads = document.querySelectorAll('h1, h2, h3, h4');
    for (var i = 0; i < heads.length; i++) {
      var h = heads[i];
      if (!h.textContent || h.textContent.trim().toLowerCase() !== 'stay in the loop') continue;

      var target = h.closest('section');
      if (!target) {
        var node = h.parentElement;
        while (node && node !== document.body) {
          if (node.querySelector('input, form')) { target = node; break; }
          node = node.parentElement;
        }
      }
      if (target
          && target.id !== 'page-content'
          && target.id !== 'luxe-newsletter'
          && target.id !== 'early-access'
          && target.tagName !== 'MAIN'
          && target.tagName !== 'BODY') {
        target.remove();
      }
    }
  }

  removeStayInLoop();
  document.addEventListener('DOMContentLoaded', removeStayInLoop);

  var obs = new MutationObserver(function () { removeStayInLoop(); });
  obs.observe(document.documentElement, { childList: true, subtree: true });
})();
