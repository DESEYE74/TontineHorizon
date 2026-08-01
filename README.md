# Tontine

Application web de gestion d'une tontine : un administrateur gère, les membres
consultent avec un code personnel. Fonctionne sur tout navigateur (ordinateur,
tablette, mobile), sans installation.

## 1. Essayer tout de suite (mode démo, sans configuration)

```bash
npm install
npm run dev
```

Ouvrez l'adresse affichée dans le terminal (en général `http://localhost:5173`).
Sans configuration, l'application tourne en **mode démo** avec des données
d'exemple : connexion admin avec n'importe quel identifiant/mot de passe non
vides, ou connexion membre avec le code `947162`.

## 2. Brancher les vraies données (Supabase, gratuit)

1. Créez un compte sur [supabase.com](https://supabase.com) et un nouveau projet (gratuit).
2. Dans le projet Supabase : **SQL Editor** → **New query** → collez tout le
   contenu de `supabase/schema.sql` → **Run**. Cela crée les tables, la
   sécurité (RLS) et les fonctions nécessaires.
3. Ajoutez votre premier membre pour tester : dans **Table editor** → `members`
   → **Insert row** (renseignez `name`, `initials`, `personal_code` à 6
   chiffres, `turn_order`).
4. Créez votre compte administrateur : **Authentication** → **Users** →
   **Add user** (email + mot de passe). C'est ce compte qui se connecte côté
   "Administrateur" dans l'application.
5. Récupérez vos clés : **Project Settings** → **API** → copiez `Project URL`
   et `anon public key`.
6. Copiez `.env.example` en `.env` à la racine du projet et collez-y ces deux
   valeurs.
7. Relancez `npm run dev` — l'application utilise maintenant vos vraies données.

## 3. Mettre en ligne gratuitement (Vercel)

1. Poussez le projet sur GitHub.
2. Sur [vercel.com](https://vercel.com), **New Project** → importez le dépôt.
3. Dans **Environment Variables**, ajoutez `VITE_SUPABASE_URL` et
   `VITE_SUPABASE_ANON_KEY` (les mêmes valeurs que dans `.env`).
4. Déployez. Vous obtenez une adresse `https://votre-projet.vercel.app`
   accessible depuis n'importe quel navigateur, gratuitement.

## 4. Activer l'assistant IA (optionnel)

Le chatbot appelle la fonction serveur `api/chat.js` (déployée automatiquement
par Vercel) pour ne jamais exposer de clé API dans le navigateur.

1. Créez une clé sur [console.anthropic.com](https://console.anthropic.com).
2. Sur Vercel : **Settings** → **Environment Variables** → ajoutez
   `ANTHROPIC_API_KEY` avec votre clé.
3. Redéployez. Sans cette clé, l'assistant continue de fonctionner avec des
   réponses de secours simples (voir `src/components/ChatDrawer.jsx`).

## Fonctionnement hors connexion

Le mode démo et l'affichage fonctionnent sans réseau une fois la page chargée.
Une synchronisation hors-ligne plus complète (écriture de versements sans
réseau, avec envoi différé) est prévue comme prochaine étape : voir la section
"Pistes suivantes" ci-dessous.

## Structure du projet

```
src/
  components/     Écrans et éléments d'interface
  data/           Accès aux données (bascule démo / Supabase)
  lib/pdf.js      Génération des reçus PDF et partage WhatsApp
  theme.js        Couleurs, polices
  App.jsx         Navigation générale
api/chat.js       Fonction serveur pour l'assistant IA (Vercel)
supabase/schema.sql  Structure de la base de données et sécurité
```

## Pistes suivantes

- Écran "Membres" pour ajouter/retirer un membre depuis l'interface (pour
  l'instant, cela se fait dans Supabase directement).
- Écran "Calendrier" détaillé avec dates réelles par tour.
- File d'attente hors-ligne pour les versements enregistrés sans réseau.
- Génération d'un relevé mensuel global en plus des reçus individuels.
