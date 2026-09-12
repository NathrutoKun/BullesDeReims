# Bulles de Reims — portail d'information sur Reims & ses alentours

Site statique (HTML / CSS / JavaScript). Aucune installation, aucun compte : il s'ouvre dans n'importe quel navigateur et fonctionne hors-ligne.

## Voir le site

- **Le plus simple** : double-cliquer sur `index.html` pour l'ouvrir dans le navigateur.
- **Aperçu « comme en ligne »** (recommandé pour tester les liens internes) : ouvrir un terminal dans ce dossier et lancer
  ```
  python3 -m http.server 8000
  ```
  puis ouvrir http://localhost:8000 dans le navigateur. (Ctrl+C pour arrêter.)

## Les pages

| Fichier            | Rubrique                          |
|--------------------|-----------------------------------|
| `index.html`       | Accueil                           |
| `actus.html`       | Actus de la semaine + canaux d'info locaux |
| `forum.html`       | Forum citoyen (MAQUETTE — voir plus bas) |
| `tourisme.html`    | Tourisme & patrimoine             |
| `sorties.html`     | Sorties & agenda                  |
| `restaurants.html` | Restaurants & bars                |
| `pratique.html`    | Transports & vie pratique         |
| `communes.html`    | Annuaire des 143 communes du Grand Reims + mairies |

- `assets/css/style.css` — toute la mise en forme (couleurs, polices, mise en page).
- `assets/js/main.js` — le menu mobile, le lien actif, le bouton « retour en haut » et la **recherche de communes**.
- `assets/js/actus-live.js` — le **fil d'actu en direct** de la page Actus (agrège Google Actualités « Reims » à chaque visite).
- `assets/js/forum.js` — le **forum citoyen** (MAQUETTE : stockage local `localStorage`, non partagé).
- `.data/enrichment.json` — données collectées (communes, sites de mairies, canaux locaux, actus). 
- `.tools/build_pages.py` — script qui **régénère** `communes.html` et `actus.html` à partir de `.data/enrichment.json`.

## Actus & communes : comment c'est sourcé

- **Communes** : liste des 143 communes de la communauté urbaine du Grand Reims (source : Wikipédia + comersis.fr). Chaque commune a un lien vers son **site officiel** quand il existe (81/143, vérifiés), et **toujours** un lien « fiche mairie » vers l'annuaire officiel `service-public.gouv.fr` (adresse, téléphone, horaires) — qui sert aussi de filet de sécurité si un site communal est en panne.
- **Actus** : la page combine deux niveaux —
  1. un **fil en direct** en haut (`actus-live.js`), qui agrège automatiquement Google Actualités « Reims » à chaque ouverture de la page ;
  2. une **sélection vérifiée** en dessous, contrôlée une à une auprès des canaux locaux (L'Union, ICI/France Bleu, France 3/franceinfo, Ville de Reims, Préfecture, JDS…), avec lien « Source » vers l'article d'origine.
- **Fil en direct — limites** : il nécessite une connexion internet et passe par des relais CORS publics gratuits (allorigins, corsproxy) parfois indisponibles. En cas d'échec, un message s'affiche et la sélection vérifiée reste accessible. Pour une fiabilité totale du direct, l'idéal est d'héberger un petit relais maison (Cloudflare Worker / fonction Netlify) le jour où le site sera mis en ligne.
- **Pour rafraîchir la sélection vérifiée** : demande-moi « mets à jour les actus de Reims » — je relance la collecte web vérifiée, je réécris `.data/enrichment.json` puis `python3 .tools/build_pages.py` régénère les pages.

## Modifier le contenu

Le texte est directement dans les fichiers `.html`. Pour ajouter une adresse ou un lieu, copiez un bloc `<div class="card">…</div>` existant et changez le titre + le texte. Les couleurs et la typo se règlent en haut de `style.css` (section `:root`).

## Bon à savoir

- Les horaires, tarifs, dates de festivals et lignes de transport **évoluent** : le site renvoie vers les sites officiels (reims.fr, reims-tourisme.com, citura.fr…) pour l'info en temps réel.
- Les polices (Playfair Display + Inter) sont chargées depuis Google Fonts quand il y a une connexion ; hors-ligne, le site bascule automatiquement sur des polices système équivalentes.

## Forum citoyen (état actuel : maquette)

La page `forum.html` est une **maquette fonctionnelle mais locale** :
- on peut publier des messages, répondre, « 👍 utile » et « Signaler » ;
- **mais** les messages sont enregistrés uniquement dans le navigateur du visiteur (`localStorage`) — ils ne sont **pas partagés** entre les internautes.

C'est volontaire : un vrai forum partagé a besoin d'un **serveur + base de données**, donc d'une mise en ligne. Le plan validé :
- **Backend** : base managée **Supabase** (gratuite pour un petit usage) — `forum.js` sera adapté pour lire/écrire dans Supabase au lieu de `localStorage`.
- **Modération** : publication immédiate + bouton « Signaler » (la pré-modération reste activable si besoin).
- **Responsabilité** : en France, l'ouverture d'un espace public implique des obligations (retrait de contenus illégaux, RGPD). Prévoir au minimum : bouton signaler (fait), possibilité de supprimer, et idéalement une connexion (pseudo) pour limiter le spam.

## Mettre en ligne plus tard (gratuit)

Le site étant 100 % statique, il peut être hébergé gratuitement sur **Netlify**, **Cloudflare Pages** ou **GitHub Pages** : il suffira de déposer ce dossier. (Je peux t'aider à le faire le moment venu.)
