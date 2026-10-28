// The page's few behaviours: the theme menu, the phone drawer, the side nav following the scroll,
// and the footer (the deployed commit and a UTC clock).
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
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!themeMenu.hidden) closeMenu(true);
    else if (drawerOpen()) setDrawer(false, true);
  });

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
