# Foodie — Swiggy-style mobile app prototype

**Live demo:** <https://shaikabdulbasith913-commits.github.io/swiggy-clone-pwa/>

A mobile-first **PWA prototype** inspired by Swiggy, built with plain HTML, CSS and JavaScript.
No build tools, no package installs, no backend — all restaurant and order data is bundled locally,
so the app works offline once loaded.

## Run it

From this folder, start any static file server (a server is needed for the service worker / install prompt):

```powershell
python -m http.server 8080
```

Then open <http://localhost:8080> in your browser. Use your browser's device toolbar (F12 → device
icon) to view it at a phone size.

> Opening `index.html` directly with `file://` also works for browsing, but browser install support
> and offline caching require `http://localhost`.

### Install as an app (optional)
In Chrome/Edge, click the install icon in the address bar (or **Menu → Install app**) to add it to
your phone/desktop like a native app.

## What's included

- **Home** — delivery location, cuisine shortcuts, promo banners, filters (pure veg, offers, rating,
  fast delivery) and restaurant cards.
- **Search** — search restaurants, cuisines and individual dishes, with recent searches.
- **Restaurant page** — menu categories, veg/non-veg marks, popularity/ratings, item detail sheet with
  size/spice customisations and quantity stepper, tabs for **Menu / Reviews / Info**.
- **Cart & checkout** — quantity editing, coupon codes (`WELCOME50`, `FREEDEL`, `SAVE100`), bill
  breakdown, address selection and mock payment methods (UPI, card, wallet, cash).
- **Orders** — place an order, watch a live-style status timeline (auto-advances every 12 seconds, or
  use **Simulate next update**), delivery partner card, active/past order history.
- **Profile** — mock phone/OTP sign-in (any 6 digits), saved addresses with add/delete, favourites,
  sign out.
- **Reviews** — star rating and written reviews on each restaurant page.
- **PWA** — web app manifest, theme colour, installable icon and a service worker that caches the app
  shell for offline use.

State (cart, orders, addresses, favourites, reviews, user) is saved in `localStorage`, so it survives
reloads. Use your browser's clear-site-data option to reset the demo.

## Project structure

```
swiggy-app/
├── index.html               App shell and script/style includes
├── manifest.webmanifest     PWA install metadata
├── sw.js                    Offline cache / service worker
├── icons/app-icon.svg       App icon
├── css/styles.css           All styling (mobile-first)
├── js/data.js               Mock restaurants, menus, coupons, banners
├── js/icons.js              Inline SVG icon helper
└── js/app.js                State, routing, screens and interactions
```

## Deployment

The app is deployed on **GitHub Pages** from the `main` branch (root directory) at
<https://shaikabdulbasith913-commits.github.io/swiggy-clone-pwa/>. Source repository:
<https://github.com/shaikabdulbasith913-commits/swiggy-clone-pwa>.

Pushing new commits to `main` triggers an automatic Pages rebuild. Because the service worker caches
the app shell, bump `CACHE_NAME` in `sw.js` whenever you change HTML/CSS/JS files so returning
visitors receive the update.

## Notes

This is a **UI prototype for demonstration**. It does not connect to Swiggy, process payments, send
OTPs, or place real orders. Restaurant information, reviews, prices and delivery partners are sample
data.

The existing Spring Boot `tag-taxonomy-service` in the parent folder is left untouched.

## Possible next steps

- Add a real backend (REST API + database) for restaurants, orders and authentication.
- Replace mock OTP/payments with Firebase Auth and a payment gateway.
- Convert the UI to React Native/Flutter if native app-store builds are needed.
- Add delivery-partner and restaurant-owner views.
