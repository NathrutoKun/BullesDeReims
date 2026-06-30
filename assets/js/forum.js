/* =========================================================
   Reims & alentours — Forum citoyen (MAQUETTE)
   Démo locale : les messages sont stockés dans le navigateur
   du visiteur (localStorage), NON partagés. À remplacer par
   des appels Supabase à la mise en ligne.
   ========================================================= */
(function () {
  "use strict";

  var listEl = document.getElementById("forum-list");
  if (!listEl) return;

  var form = document.getElementById("forum-form");
  var authorEl = document.getElementById("ff-author");
  var catEl = document.getElementById("ff-cat");
  var textEl = document.getElementById("ff-text");
  var filterEl = document.getElementById("forum-filter");
  var countEl = document.getElementById("forum-count");
  var emptyEl = document.getElementById("forum-empty");
  var resetBtn = document.getElementById("forum-reset");

  var KEY = "reims_forum_v1";
  var MONTHS = ["janv.","févr.","mars","avril","mai","juin","juil.","août","sept.","oct.","nov.","déc."];

  /* ---------- stockage ---------- */
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || null; }
    catch (e) { return null; }
  }
  function save(posts) {
    try { localStorage.setItem(KEY, JSON.stringify(posts)); } catch (e) {}
  }

  // Exemples au premier chargement (clairement étiquetés)
  function seed() {
    var now = Date.now();
    return [
      { id: "ex1", author: "Mairie de quartier", cat: "Travaux & voirie", example: true,
        text: "Rappel : la rue de Vesle est en travaux jusqu'à la fin du mois, circulation alternée aux heures de pointe.",
        ts: now - 2 * 3600e3, likes: 4, reported: false, replies: [
          { id: "ex1r1", author: "Camille", text: "Merci pour l'info, je passe par le tram du coup !", ts: now - 1.5 * 3600e3, reported: false }
        ] },
      { id: "ex2", author: "Léa", cat: "Bon plan", example: true,
        text: "Marché du Boulingrin ce samedi : super primeur à l'entrée, fraises de la région à très bon prix.",
        ts: now - 26 * 3600e3, likes: 7, reported: false, replies: [] },
      { id: "ex3", author: "Anonyme", cat: "Question / entraide", example: true,
        text: "Quelqu'un connaît un bon médecin généraliste qui prend de nouveaux patients vers Cormontreuil ?",
        ts: now - 50 * 3600e3, likes: 1, reported: false, replies: [] }
    ];
  }

  var posts = load();
  if (!posts) { posts = seed(); save(posts); }

  /* ---------- utilitaires ---------- */
  function esc(s) {
    return (s || "").replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function uid() {
    return "p" + Date.now().toString(36) + Math.floor(performance.now()).toString(36);
  }
  function ago(ts) {
    var s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return "à l'instant";
    if (s < 3600) return "il y a " + Math.floor(s / 60) + " min";
    if (s < 86400) return "il y a " + Math.floor(s / 3600) + " h";
    var d = new Date(ts);
    return "le " + d.getDate() + " " + MONTHS[d.getMonth()];
  }

  /* ---------- rendu ---------- */
  function replyHtml(r, postId) {
    return (
      '<div class="forum-reply' + (r.reported ? " reported" : "") + '">' +
      '<div class="fp-head"><span class="fp-author">' + esc(r.author || "Anonyme") + "</span>" +
      '<span class="fp-meta">' + ago(r.ts) + "</span></div>" +
      '<p class="fp-text">' + esc(r.text) + "</p>" +
      '<div class="fp-actions">' +
      '<button type="button" class="fp-btn" data-act="report-reply" data-post="' + postId + '" data-reply="' + r.id + '">' +
      (r.reported ? "⚑ signalé" : "Signaler") + "</button></div>" +
      "</div>"
    );
  }

  function postHtml(p) {
    var replies = (p.replies || []).map(function (r) { return replyHtml(r, p.id); }).join("");
    var tag = p.example ? '<span class="fp-example">exemple</span>' : "";
    return (
      '<article class="forum-post' + (p.reported ? " reported" : "") + '" data-id="' + p.id + '" data-cat="' + esc(p.cat) + '">' +
      '<div class="fp-head">' +
        '<span class="fp-author">' + esc(p.author || "Anonyme") + "</span>" +
        '<span class="news-cat">' + esc(p.cat) + "</span>" + tag +
        '<span class="fp-meta">' + ago(p.ts) + "</span>" +
      "</div>" +
      '<p class="fp-text">' + esc(p.text) + "</p>" +
      '<div class="fp-actions">' +
        '<button type="button" class="fp-btn" data-act="like" data-post="' + p.id + '">👍 utile <span class="fp-n">' + (p.likes || 0) + "</span></button>" +
        '<button type="button" class="fp-btn" data-act="toggle-reply" data-post="' + p.id + '">💬 Répondre' + ((p.replies && p.replies.length) ? " (" + p.replies.length + ")" : "") + "</button>" +
        '<button type="button" class="fp-btn" data-act="report" data-post="' + p.id + '">' + (p.reported ? "⚑ signalé" : "Signaler") + "</button>" +
      "</div>" +
      (replies ? '<div class="forum-replies">' + replies + "</div>" : "") +
      '<form class="reply-form" data-post="' + p.id + '" hidden>' +
        '<input type="text" class="rf-author" maxlength="40" placeholder="Pseudo (facultatif)">' +
        '<textarea class="rf-text" rows="2" maxlength="500" placeholder="Votre réponse…" required></textarea>' +
        '<button type="submit" class="btn btn-outline">Répondre</button>' +
      "</form>" +
      "</article>"
    );
  }

  function render() {
    var filter = filterEl ? filterEl.value : "";
    var visible = posts.filter(function (p) { return !filter || p.cat === filter; });
    visible.sort(function (a, b) { return b.ts - a.ts; });
    listEl.innerHTML = visible.map(postHtml).join("");
    if (countEl) countEl.textContent = posts.length + (posts.length > 1 ? " messages" : " message");
    if (emptyEl) emptyEl.style.display = visible.length ? "none" : "block";
  }

  /* ---------- actions ---------- */
  function findPost(id) {
    for (var i = 0; i < posts.length; i++) if (posts[i].id === id) return posts[i];
    return null;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = textEl.value.trim();
    if (!text) return;
    posts.push({
      id: uid(),
      author: authorEl.value.trim() || "Anonyme",
      cat: catEl.value,
      text: text,
      ts: Date.now(),
      likes: 0,
      reported: false,
      replies: []
    });
    save(posts);
    form.reset();
    render();
    // recentre sur la liste
    listEl.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  if (filterEl) filterEl.addEventListener("change", render);

  if (resetBtn) resetBtn.addEventListener("click", function () {
    if (confirm("Réinitialiser la démo ? Les messages enregistrés dans votre navigateur seront effacés.")) {
      posts = seed();
      save(posts);
      render();
    }
  });

  // Délégation : like / signaler / répondre
  listEl.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-act]");
    if (!btn) return;
    var act = btn.getAttribute("data-act");
    var post = findPost(btn.getAttribute("data-post"));
    if (!post) return;

    if (act === "like") { post.likes = (post.likes || 0) + 1; save(posts); render(); }
    else if (act === "report") { post.reported = true; save(posts); render(); alert("Merci, ce message a été signalé. (Dans la version en ligne, un modérateur le vérifiera.)"); }
    else if (act === "report-reply") {
      var rid = btn.getAttribute("data-reply");
      (post.replies || []).forEach(function (r) { if (r.id === rid) r.reported = true; });
      save(posts); render(); alert("Merci, cette réponse a été signalée.");
    }
    else if (act === "toggle-reply") {
      var f = listEl.querySelector('.reply-form[data-post="' + post.id + '"]');
      if (f) { f.hidden = !f.hidden; if (!f.hidden) f.querySelector(".rf-text").focus(); }
    }
  });

  // Soumission d'une réponse
  listEl.addEventListener("submit", function (e) {
    var f = e.target.closest(".reply-form");
    if (!f) return;
    e.preventDefault();
    var post = findPost(f.getAttribute("data-post"));
    if (!post) return;
    var txt = f.querySelector(".rf-text").value.trim();
    if (!txt) return;
    post.replies = post.replies || [];
    post.replies.push({
      id: uid(),
      author: f.querySelector(".rf-author").value.trim() || "Anonyme",
      text: txt,
      ts: Date.now(),
      reported: false
    });
    save(posts);
    render();
  });

  render();
})();
