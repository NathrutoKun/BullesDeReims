/* =========================================================
   Reims & alentours — interactions partagées
   ========================================================= */
(function () {
  "use strict";

  /* --- Menu mobile --- */
  var toggle = document.querySelector(".mobile-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // Referme le menu quand on clique sur un lien
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* --- Surligne le lien de la page courante --- */
  var current = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(function (a) {
    var href = a.getAttribute("href");
    if (href === current || (current === "" && href === "index.html")) {
      a.setAttribute("aria-current", "page");
    }
  });

  /* --- Bouton « retour en haut » --- */
  var topBtn = document.querySelector(".back-to-top");
  if (topBtn) {
    window.addEventListener("scroll", function () {
      if (window.scrollY > 500) topBtn.classList.add("show");
      else topBtn.classList.remove("show");
    });
    topBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* --- Année courante dans le pied de page --- */
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();

  /* --- Filtre de recherche des communes (page Communes) --- */
  var search = document.querySelector("#commune-search");
  if (search) {
    var cards = Array.prototype.slice.call(document.querySelectorAll(".commune-card"));
    var countEl = document.querySelector("#commune-count");
    var emptyEl = document.querySelector(".commune-empty");
    var total = cards.length;

    var normalize = function (s) {
      return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    };

    var apply = function () {
      var q = normalize(search.value.trim());
      var shown = 0;
      cards.forEach(function (card) {
        var hay = normalize(card.getAttribute("data-search") || card.textContent);
        var match = q === "" || hay.indexOf(q) !== -1;
        card.style.display = match ? "" : "none";
        if (match) shown++;
      });
      if (countEl) {
        countEl.textContent = q === ""
          ? total + " communes"
          : shown + " / " + total + " communes";
      }
      if (emptyEl) emptyEl.style.display = shown === 0 ? "block" : "none";
    };

    search.addEventListener("input", apply);
    apply();
  }
})();
