// The page's few behaviours: the theme menu, the phone drawer, full screen for any box, the photo at
// full size, the side nav following the scroll, the flash on the box a link jumps to, and the footer
// (the deployed commit and a UTC clock).
(function () {
  "use strict";

  var THEME_KEY = "ges.theme";
  var REPO = "George-Strauch/George-Strauch.github.io";
  var BRANCH = "main";
  var root = document.documentElement;

  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function utc(d, seconds) {
    var s = d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()) + " " +
      pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes());
    return (seconds ? s + ":" + pad(d.getUTCSeconds()) : s) + " UTC";
  }

  // ---------------------------------------------------------------- theme: follow the system, dark or light
  var themeBtn = document.getElementById("theme-btn");
  var themeMenu = document.getElementById("theme-menu");
  var themeItems = Array.prototype.slice.call(themeMenu.querySelectorAll("[data-theme-choice]"));
  var theme = "system";
  try { theme = localStorage.getItem(THEME_KEY) || "system"; } catch (e) { /* storage blocked: follow the system */ }

  function markTheme() {
    themeItems.forEach(function (item) {
      var on = item.getAttribute("data-theme-choice") === theme;
      item.classList.toggle("is-checked", on);
      item.setAttribute("aria-checked", on ? "true" : "false");
    });
  }
  function setTheme(choice) {
    theme = choice;
    if (choice === "dark" || choice === "light") root.setAttribute("data-theme", choice);
    else root.removeAttribute("data-theme");
    try {
      if (choice === "system") localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, choice);
    } catch (e) { /* the choice lasts for this visit only */ }
    markTheme();
  }
  function openMenu() {
    themeMenu.hidden = false;
    themeBtn.setAttribute("aria-expanded", "true");
    (themeMenu.querySelector(".is-checked") || themeItems[0]).focus();
  }
  function closeMenu(refocus) {
    if (themeMenu.hidden) return;
    themeMenu.hidden = true;
    themeBtn.setAttribute("aria-expanded", "false");
    if (refocus) themeBtn.focus();
  }

  markTheme();
  themeBtn.addEventListener("click", function () {
    if (themeMenu.hidden) openMenu(); else closeMenu(false);
  });
  themeMenu.addEventListener("click", function (e) {
    var item = e.target.closest("[data-theme-choice]");
    if (!item) return;
    setTheme(item.getAttribute("data-theme-choice"));
    closeMenu(true);
  });
  themeMenu.addEventListener("keydown", function (e) {
    var i = themeItems.indexOf(document.activeElement);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      var step = e.key === "ArrowDown" ? 1 : -1;
      themeItems[(i + step + themeItems.length) % themeItems.length].focus();
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      themeItems[e.key === "Home" ? 0 : themeItems.length - 1].focus();
    } else if (e.key === "Tab") {
      closeMenu(false);
    }
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".ui-menubtn")) closeMenu(false);
  });

  // ---------------------------------------------------------------- phones: the side nav as a drawer
  var shell = document.querySelector(".gs-shell");
  var side = document.getElementById("gs-side");
  var navBtn = document.getElementById("nav-btn");
  var scrim = document.querySelector(".gs-scrim");

  function drawerOpen() { return shell.classList.contains("is-drawer-open"); }
  function setDrawer(open, refocus) {
    shell.classList.toggle("is-drawer-open", open);
    navBtn.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) (side.querySelector(".gs-navitem.active") || side.querySelector(".gs-navitem")).focus();
    else if (refocus) navBtn.focus();
  }

  navBtn.addEventListener("click", function () { setDrawer(!drawerOpen(), false); });
  scrim.addEventListener("click", function () { setDrawer(false, true); });
  side.addEventListener("click", function (e) {
    if (e.target.closest("a") && drawerOpen()) setDrawer(false, false);
  });
  window.matchMedia("(min-width: 761px)").addEventListener("change", function (e) {
    if (e.matches && drawerOpen()) setDrawer(false, false);
  });
  // ---------------------------------------------------------------- full screen: a box covers the window
  var ICON_EXPAND = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
  var ICON_SHRINK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
  var fsBox = null;

  function markFsButton(btn, on) {
    btn.innerHTML = on ? ICON_SHRINK : ICON_EXPAND;
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.setAttribute("aria-label", on ? "Leave full screen" : "Full screen");
    btn.title = on ? "Leave full screen (Esc)" : "Full screen (F)";
  }
  function setFullScreen(box, on) {
    if (on && fsBox && fsBox !== box) setFullScreen(fsBox, false);
    box.classList.toggle("is-fs", on);
    document.body.classList.toggle("gs-has-fs", on);
    markFsButton(box.querySelector(".gs-fs-btn"), on);
    fsBox = on ? box : null;
  }
  Array.prototype.slice.call(document.querySelectorAll(".gs-main .ui-box")).forEach(function (box) {
    box.tabIndex = -1;   // a click inside focuses the box, so F knows which one
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ui-btn ghost xs icon gs-fs-btn";
    markFsButton(btn, false);
    btn.addEventListener("click", function () { setFullScreen(box, !box.classList.contains("is-fs")); });
    box.querySelector(".ui-box-head").appendChild(btn);
  });

  // ---------------------------------------------------------------- the photo at full size
  var viewer = document.getElementById("photo-viewer");
  document.querySelector(".gs-photo").addEventListener("click", function (e) {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;   // a new tab gets the file
    e.preventDefault();
    viewer.showModal();
  });
  viewer.addEventListener("click", function (e) {
    // the photo, the backdrop or the close button; not the rest of the head strip
    if (!e.target.closest(".ui-box-head") || e.target.closest(".gs-viewer-close")) viewer.close();
  });

  document.addEventListener("keydown", function (e) {
    if (viewer.open) return;   // the viewer handles its own Esc
    if (e.key === "Escape") {
      if (!themeMenu.hidden) closeMenu(true);
      else if (fsBox) setFullScreen(fsBox, false);
      else if (drawerOpen()) setDrawer(false, true);
    } else if ((e.key === "f" || e.key === "F") && !e.ctrlKey && !e.metaKey && !e.altKey) {
      var box = document.activeElement && document.activeElement.closest(".gs-main .ui-box");
      if (box) { e.preventDefault(); setFullScreen(box, !box.classList.contains("is-fs")); }
    }
  });

  // ---------------------------------------------------------------- a jump to a section flashes its box
  // The id is a box, or (Overview) the page head, whose row of boxes flashes together.
  function emphasize(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var group = el.classList.contains("ui-box") ? [el]
      : Array.prototype.slice.call((el.nextElementSibling || el).querySelectorAll(".ui-box"));
    group.forEach(function (box) {
      box.classList.remove("is-emph");
      void box.offsetWidth;   // restart the animation on a repeat click
      box.classList.add("is-emph");
      window.clearTimeout(box.emphTimer);
      box.emphTimer = window.setTimeout(function () { box.classList.remove("is-emph"); }, 2400);
    });
    if (group.length) group[0].focus({ preventScroll: true });
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (a && !a.classList.contains("gs-skip")) emphasize(a.getAttribute("href").slice(1));
  });
  if (location.hash.length > 1) emphasize(decodeURIComponent(location.hash.slice(1)));

  // ---------------------------------------------------------------- the side nav follows the scroll
  var links = Array.prototype.slice.call(side.querySelectorAll('a.gs-navitem[href^="#"]'));
  var targets = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
  var picked = -1;   // the entry last clicked: wins over the boxes that share its row
  var queued = false;

  function spy() {
    queued = false;
    var line = 80;
    var tops = targets.map(function (t) { return t.getBoundingClientRect().top; });
    var best = 0;
    tops.forEach(function (top, i) { if (top <= line && top > tops[best] + 1) best = i; });
    var atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (picked >= 0 && (Math.abs(tops[picked] - tops[best]) < 2 || (atEnd && tops[picked] < window.innerHeight))) best = picked;
    links.forEach(function (a, i) {
      a.classList.toggle("active", i === best);
      if (i === best) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current");
    });
  }
  links.forEach(function (a, i) { a.addEventListener("click", function () { picked = i; }); });
  window.addEventListener("scroll", function () {
    if (!queued) { queued = true; window.requestAnimationFrame(spy); }
  }, { passive: true });
  spy();

  // ---------------------------------------------------------------- footer: the deployed commit, a UTC clock
  var clock = document.getElementById("clock");
  function tick() { clock.textContent = utc(new Date(), true); }
  tick();
  window.setInterval(tick, 1000);

  var build = document.getElementById("build");
  fetch("https://api.github.com/repos/" + REPO + "/commits/" + BRANCH, { headers: { Accept: "application/vnd.github+json" } })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
    .then(function (c) {
      build.href = c.html_url;
      build.title = c.commit.message.split("\n")[0];
      build.innerHTML = '<span class="is-wide">george-strauch.github.io · </span>' + c.sha.slice(0, 7) + " · " + BRANCH +
        '<span class="is-wide"> · ' + utc(new Date(c.commit.committer.date), false) + "</span>";
    })
    .catch(function () { /* offline or rate-limited: the footer keeps the branch name */ });
})();
