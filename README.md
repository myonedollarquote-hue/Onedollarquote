# Le Livre — application `.io`

Un livre ouvert virtuel. Chaque page se débloque pour **1 €** (Stripe), puis se
rédige **une seule fois, pour toujours** (Supabase). Stack : **Next.js** (prêt
pour Vercel) + **Supabase** + **Stripe**.

Ce guide te fait tourner le projet **en local** sur `http://localhost:3000`.
Tu n'héberges rien : tu utilises seulement le projet Supabase (offre gratuite)
et Stripe en **mode test**.

---

## 0. Pré-requis

- Node.js 18+ (tu as 22, parfait).
- Un compte **Supabase** (gratuit) : https://supabase.com
- Un compte **Stripe** (mode test, aucune carte réelle) : https://stripe.com
- La **Stripe CLI** pour tester le webhook en local :
  https://docs.stripe.com/stripe-cli

---

## 1. Installer les dépendances

```bash
cd livre-io
npm install
```

---

## 2. Créer la base Supabase

1. Crée un projet sur https://supabase.com.
2. Menu **SQL Editor → New query**, colle le contenu de
   [`supabase/schema.sql`](supabase/schema.sql), puis **Run**.
   → Ça crée la table `pages` et les règles de sécurité (RLS).
3. Menu **Project Settings → API**, récupère :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (secrète !) → `SUPABASE_SERVICE_ROLE_KEY`

---

## 3. Récupérer les clés Stripe (mode Test)

1. Dans le Dashboard Stripe, garde le bouton **« Test mode »** activé (en haut).
2. Menu **Developers → API keys** :
   - **Secret key** (`sk_test_…`) → `STRIPE_SECRET_KEY`

Le `STRIPE_WEBHOOK_SECRET` sera donné à l'étape 5.

---

## 4. Configurer les variables d'environnement

```bash
cp .env.local.example .env.local
```

Ouvre `.env.local` et remplis les valeurs des étapes 2 et 3.
Laisse `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.

---

## 5. Écouter le webhook Stripe en local

Le webhook confirme le paiement et passe la page en `is_paid = true`.
Dans un **terminal séparé** (laisse-le tourner) :

```bash
stripe login          # une seule fois
stripe listen --forward-to localhost:3000/api/webhook
```

La commande affiche une ligne du type :

```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxx
```

Copie ce `whsec_…` dans `.env.local` → `STRIPE_WEBHOOK_SECRET`, puis
**relance** `npm run dev` pour qu'il soit pris en compte.

---

## 6. Lancer l'application

```bash
npm run dev
```

Ouvre http://localhost:3000.

### Tester un achat

1. Navigue avec les flèches jusqu'à une page vierge.
2. Clique **« Débloquer cette page pour 1 € »**.
3. Sur Stripe Checkout, utilise la carte de test :
   - Numéro : `4242 4242 4242 4242`
   - Date : n'importe quelle date future — CVC : 3 chiffres au hasard.
4. Après paiement → écran de rédaction : choisis **Citation** ou **Histoire**,
   écris, signe, **Publie**.
5. Tu es renvoyé sur la page : ton texte est là, visible par tout le monde.

---

## Comment ça marche (résumé)

- **`src/app/page.js`** → affiche le livre (`components/Book.jsx`). Le navigateur
  lit les pages publiées via la clé *anon* de Supabase (RLS : lecture seule).
- **`/api/checkout`** → réserve la page 10 min et crée la session Stripe.
- **`/api/webhook`** → Stripe confirme le paiement → `is_paid = true`.
- **`/write`** → après paiement, choix du format + saisie (`components/Writer.jsx`).
- **`/api/write`** → revérifie le paiement côté Stripe puis enregistre le texte.

Les écritures passent toujours par le serveur avec la clé *service_role*
(jamais exposée au navigateur).

---

## Passage sur Vercel (plus tard)

1. Pousse le dossier sur un dépôt **GitHub**.
2. Sur **Vercel**, « Import Project » depuis ce dépôt.
3. Recopie les variables de `.env.local` dans **Vercel → Settings → Environment
   Variables**, en remplaçant `NEXT_PUBLIC_SITE_URL` par ton URL Vercel.
4. Dans **Stripe → Developers → Webhooks**, ajoute un endpoint
   `https://ton-app.vercel.app/api/webhook` (événement
   `checkout.session.completed`) et mets son secret dans Vercel.

C'est tout — le même code tourne en local et en production.
