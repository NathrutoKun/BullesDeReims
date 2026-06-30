/* =========================================================
   Reims & alentours — fil d'actus en direct (page Actus)
   Agrège Google Actualités « Reims » via des relais CORS,
   avec cascade de secours et repli propre si tout échoue.
   La sélection vérifiée plus bas reste toujours affichée.
   ========================================================= */
(function () {
  "use strict";

  var box = document.getElementById("live-news");
  if (!box) return;

  var FEED =
    "https://news.google.com/rss/search?q=" +
    encodeURIComponent("Reims when:7d") +
    "&hl=fr&gl=FR&ceid=FR:fr";

  // Relais CORS essayés dans l'ordre (les relais publics gratuits sont parfois indisponibles)
  var PROXIES = [
    function (u) { return "https://api.allorigins.win/get?url=" + encodeURIComponent(u); },   // JSON {contents}
    function (u) { return "https://api.allorigins.win/raw?url=" + encodeURIComponent(u); },    // XML brut
    function (u) { return "https://corsproxy.io/?url=" + encodeURIComponent(u); }              // XML brut
  ];

  var MONTHS = ["janv.","févr.","mars","avril","mai","juin","juil.","août","sept.","oct.","nov.","déc."];
  var MAX_ITEMS = 8;

  function setStatus(msg, isError) {
    box.innerHTML =
      '<p class="live-status' + (isError ? " error" : "") + '">' + msg + "</p>";
  }

  function fetchWithTimeout(url, ms) {
    if (window.AbortController) {
      var ctrl = new AbortController();
      var t = setTimeout(function () { ctrl.abort(); }, ms);
      return fetch(url, { signal: ctrl.signal }).then(function (r) {
        clearTimeout(t);
        return r;
      });
    }
    return fetch(url);
  }

  // Récupère le XML RSS via un relais (gère le wrapper JSON d'allorigins)
  function getXml(proxyUrl) {
    return fetchWithTimeout(proxyUrl, 9000).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.text();
    }).then(function (text) {
      var t = text.trim();
      if (t.charAt(0) === "{") {           // wrapper JSON (allorigins /get)
        var data = JSON.parse(t);
        t = (data && data.contents) || "";
        // contents parfois en data:URI base64
        var m = t.match(/^data:[^;]*;base64,(.*)$/);
        if (m) { try { t = atob(m[1]); } catch (e) {} }
      }
      if (t.indexOf("<item") === -1) throw new Error("pas de flux RSS");
      return t;
    });
  }

  function parseItems(xmlText) {
    var doc = new DOMParser().parseFromString(xmlText, "text/xml");
    var nodes = doc.querySelectorAll("item");
    var out = [];
    for (var i = 0; i < nodes.length; i++) {
      var it = nodes[i];
      var rawTitle = text(it, "title");
      var link = text(it, "link");
      var src = text(it, "source");
      var pub = text(it, "pubDate");
      if (!rawTitle || !link) continue;
      var title = rawTitle;
      if (src && title.lastIndexOf(" - " + src) === title.length - (src.length + 3)) {
        title = title.slice(0, title.length - (src.length + 3));
      } else if (!src) {
        var idx = title.lastIndexOf(" - ");
        if (idx > 20) { src = title.slice(idx + 3); title = title.slice(0, idx); }
      }
      out.push({ title: title, link: link, source: src || "Source", date: pub ? new Date(pub) : null });
    }
    return out;
  }

  function text(parent, tag) {
    var el = parent.getElementsByTagName(tag)[0];
    return el ? el.textContent.trim() : "";
  }

  function esc(s) {
    return (s || "").replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function render(items) {
    // dédup par titre, tri par date décroissante
    var seen = {}, list = [];
    items.forEach(function (it) {
      var k = it.title.toLowerCase().slice(0, 60);
      if (seen[k]) return;
      seen[k] = 1; list.push(it);
    });
    list.sort(function (a, b) { return (b.date ? b.date.getTime() : 0) - (a.date ? a.date.getTime() : 0); });
    list = list.slice(0, MAX_ITEMS);
    if (!list.length) { fail(); return; }

    var html = list.map(function (it) {
      var day = "", mon = "";
      if (it.date && !isNaN(it.date.getTime())) {
        day = it.date.getDate();
        mon = MONTHS[it.date.getMonth()];
      }
      var when = day
        ? '<div class="news-when"><span class="day">' + day + '</span><span class="month">' + mon + "</span></div>"
        : '<div class="news-when"><span class="month">récent</span></div>';
      return (
        '<article class="news-item">' + when +
        '<div class="news-body">' +
        '<span class="news-cat">' + esc(it.source) + "</span>" +
        '<h3><a href="' + esc(it.link) + '" target="_blank" rel="noopener">' + esc(it.title) + "</a></h3>" +
        '<p class="news-source">via <a href="' + esc(it.link) + '" target="_blank" rel="noopener">' + esc(it.source) + "</a></p>" +
        "</div></article>"
      );
    }).join("");
    box.innerHTML = html;
  }

  function fail() {
    setStatus(
      "Le fil en direct est momentanément indisponible. " +
      "Consultez la <a href=\"#verifiee\">sélection vérifiée</a> ci-dessous ou les " +
      "<a href=\"#canaux\">canaux locaux</a>.",
      true
    );
  }

  function tryProxy(i) {
    if (i >= PROXIES.length) { fail(); return; }
    getXml(PROXIES[i](FEED))
      .then(function (xml) { render(parseItems(xml)); })
      .catch(function () { tryProxy(i + 1); });
  }

  // Lancement
  if (navigator.onLine === false) {
    setStatus("Vous êtes hors-ligne : le fil en direct nécessite une connexion. La sélection vérifiée reste disponible ci-dessous.", true);
    return;
  }
  setStatus("Chargement des dernières actus en direct…");
  tryProxy(0);
})();
