/* Foodie — a Swiggy-style food delivery prototype (vanilla JS, no build step). */
(function () {
  'use strict';

  const D = window.APP_DATA;
  const app = document.getElementById('app');
  const sheetRoot = document.getElementById('sheet-root');
  const toastRegion = document.getElementById('toast-region');

  const $ = function (selector, root) { return (root || document).querySelector(selector); };
  const $$ = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };
  const money = function (n) { return '₹' + Math.round(n); };
  const esc = function (value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem('foodie.' + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem('foodie.' + key, JSON.stringify(value)); } catch (e) { /* private mode */ }
  }

  function parseHash() {
    const raw = (location.hash || '#/home').replace(/^#\/?/, '');
    const parts = raw.split('/').filter(Boolean);
    return { name: parts[0] || 'home', param: parts[1] || null };
  }

  const state = {
    route: parseHash(),
    user: load('user', null),
    addresses: load('addresses', D.addresses),
    selectedAddressId: load('address', 'a1'),
    cart: load('cart', { restaurantId: null, lines: [] }),
    orders: load('orders', []),
    favorites: load('favorites', []),
    reviews: load('reviews', {}),
    coupon: load('coupon', null),
    payment: load('payment', 'upi'),
    recentSearches: load('recent', ['Biryani', 'Pizza', 'Idli']),
    searchQuery: '',
    cuisineFilter: '',
    sort: 'recommended',
    vegOnly: false,
    offersOnly: false,
    ratingFilter: 0,
    detailTab: 'menu',
    ordersTab: 'active',
    bannerIndex: 0,
    sheet: null,
    pendingAdd: null,
    reviewRating: 5,
    reviewText: '',
    loginStep: 'phone',
    loginPhone: '',
    loginOtp: '',
    loginReturn: '#/profile',
    showAddressForm: false,
    phone: '',
    otp: '',
    couponInput: ''
  };

  let routeTimer = null;
  let previousRouteKey = '';

  function persistAll() {
    save('user', state.user);
    save('addresses', state.addresses);
    save('address', state.selectedAddressId);
    save('cart', state.cart);
    save('orders', state.orders);
    save('favorites', state.favorites);
    save('reviews', state.reviews);
    save('coupon', state.coupon);
    save('payment', state.payment);
    save('recent', state.recentSearches);
  }

  /* ---------- data helpers ---------- */

  function restaurantById(id) { return D.restaurants.find(function (r) { return r.id === id; }) || null; }
  function itemsOf(restaurant) {
    return restaurant ? restaurant.menu.reduce(function (all, group) { return all.concat(group.items); }, []) : [];
  }
  function itemById(restaurant, id) {
    return itemsOf(restaurant).find(function (item) { return item.id === id; }) || null;
  }
  function selectedAddress() {
    return state.addresses.find(function (a) { return a.id === state.selectedAddressId; }) || state.addresses[0] || null;
  }
  function cartLines() {
    const restaurant = restaurantById(state.cart.restaurantId);
    if (!restaurant) return [];
    return state.cart.lines.filter(function (line) { return !!itemById(restaurant, line.itemId); });
  }
  function cartCount() {
    return cartLines().reduce(function (sum, line) { return sum + line.qty; }, 0);
  }
  function cartTotals(linesOverride) {
    const lines = linesOverride || cartLines();
    const itemTotal = lines.reduce(function (sum, line) { return sum + line.unitPrice * line.qty; }, 0);
    let deliveryFee = itemTotal === 0 || itemTotal >= 199 ? 0 : 29;
    const packaging = itemTotal === 0 ? 0 : 15;
    const gst = Math.round(itemTotal * 0.05);
    let discount = 0;
    let couponLabel = '';
    const coupon = D.coupons.find(function (c) { return state.coupon && c.code === state.coupon.code; });
    if (coupon && itemTotal >= coupon.min) {
      if (coupon.type === 'percent') discount = Math.min(coupon.max, Math.round(itemTotal * coupon.value / 100));
      if (coupon.type === 'flat') discount = coupon.value;
      if (coupon.type === 'delivery') { discount = deliveryFee; deliveryFee = 0; }
      couponLabel = coupon.label;
    }
    const total = Math.max(0, itemTotal + deliveryFee + packaging + gst - discount);
    return { itemTotal: itemTotal, deliveryFee: deliveryFee, packaging: packaging, gst: gst, discount: discount, total: total, couponLabel: couponLabel };
  }

  function filteredRestaurants() {
    let list = D.restaurants.slice();
    if (state.vegOnly) list = list.filter(function (r) { return r.pureVeg; });
    if (state.offersOnly) list = list.filter(function (r) { return !!r.offer; });
    if (state.ratingFilter) list = list.filter(function (r) { return r.rating >= state.ratingFilter; });
    if (state.sort === 'rating') list.sort(function (a, b) { return b.rating - a.rating; });
    if (state.sort === 'delivery') list.sort(function (a, b) { return parseInt(a.deliveryTime, 10) - parseInt(b.deliveryTime, 10); });
    if (state.sort === 'cost') list.sort(function (a, b) { return parseInt(a.costForTwo.replace(/\D/g, ''), 10) - parseInt(b.costForTwo.replace(/\D/g, ''), 10); });
    return list;
  }

  /* ---------- shared UI pieces ---------- */

  function vegMark(veg) {
    return '<span class="veg-mark ' + (veg ? 'veg' : 'nonveg') + '" title="' + (veg ? 'Vegetarian' : 'Non-vegetarian') + '"><span></span></span>';
  }
  function ratingPill(rating, big) {
    return '<span class="rating-pill ' + (rating >= 4.5 ? 'green' : '') + (big ? ' big' : '') + '">' + icon('star', big ? 15 : 12, true) + ' ' + rating + '</span>';
  }
  function toast(message) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = icon('check', 16) + '<span>' + esc(message) + '</span>';
    toastRegion.appendChild(el);
    setTimeout(function () { el.classList.add('out'); setTimeout(function () { el.remove(); }, 300); }, 2600);
  }

  function bottomNav(active) {
    const tabs = [
      { key: 'home', label: 'Home', icon: 'home', path: '#/home' },
      { key: 'search', label: 'Search', icon: 'search', path: '#/search' },
      { key: 'orders', label: 'Orders', icon: 'receipt', path: '#/orders' },
      { key: 'profile', label: 'Profile', icon: 'user', path: '#/profile' }
    ];
    return '<nav class="bottom-nav">' + tabs.map(function (tab) {
      return '<button class="nav-item ' + (active === tab.key ? 'active' : '') + '" data-action="go" data-path="' + tab.path + '">' +
        icon(tab.icon, 22, active === tab.key) + '<span>' + tab.label + '</span></button>';
    }).join('') + '</nav>';
  }

  function header(title, opts) {
    opts = opts || {};
    return '<header class="app-header ' + (opts.plain ? 'plain' : '') + '">' +
      (opts.back ? '<button class="icon-btn" data-action="back" aria-label="Go back">' + icon('back', 22) + '</button>' : '') +
      '<h1>' + esc(title) + '</h1>' +
      (opts.action || '') + '</header>';
  }

  function restaurantCard(r) {
    return '<article class="rest-card" data-action="open-restaurant" data-id="' + r.id + '" role="button" tabindex="0">' +
      '<div class="rest-thumb" style="--c1:' + r.colors[0] + ';--c2:' + r.colors[1] + '">' +
        '<span class="thumb-emoji">' + r.emoji + '</span>' +
        (r.offer ? '<span class="thumb-offer">' + esc(r.offer) + '</span>' : '') +
        (r.promoted ? '<span class="promoted">Promoted</span>' : '') +
      '</div>' +
      '<div class="rest-body">' +
        '<div class="rest-title-row"><h3>' + esc(r.name) + '</h3>' + ratingPill(r.rating) + '</div>' +
        '<p class="rest-cuisines">' + esc(r.cuisines.join(', ')) + '</p>' +
        '<p class="rest-sub"><span>' + icon('clock', 13) + ' ' + esc(r.deliveryTime) + '</span><span>·</span><span>' + esc(r.distance) + '</span><span>·</span><span>' + esc(r.costForTwo) + '</span></p>' +
      '</div>' +
    '</article>';
  }

  function cartBar() {
    const count = cartCount();
    if (!count) return '';
    const totals = cartTotals();
    return '<div class="cart-bar" data-action="go" data-path="#/cart" role="button" tabindex="0">' +
      '<div class="cart-bar-left"><span class="cart-count">' + count + '</span><strong>' + (count === 1 ? 'item' : 'items') + ' · ' + money(totals.itemTotal) + '</strong><small>incl. all taxes</small></div>' +
      '<div class="cart-bar-right">View cart ' + icon('arrowRight', 18) + '</div>' +
    '</div>';
  }

  /* ---------- screens ---------- */

  function homeScreen() {
    return '<div class="screen home-screen">' +
      '<header class="home-header">' +
        '<button class="location-btn" data-action="go" data-path="#/profile">' +
          icon('pin', 20) + '<span><small>Deliver to</small><strong>' + esc(selectedAddress() ? selectedAddress().label : 'Select location') + ' ' + icon('chevronDown', 14) + '</strong></span>' +
        '</button>' +
        '<button class="icon-btn" data-action="go" data-path="#/profile" aria-label="Notifications">' + icon('bell', 21) + '</button>' +
      '</header>' +
      '<div class="home-scroll">' +
        '<button class="search-bar" data-action="go" data-path="#/search">' + icon('search', 20) + '<span>Search for restaurant, dish or cuisine</span></button>' +
        '<section class="section"><h2>What\'s on your mind?</h2>' +
          '<div class="cuisine-grid">' + D.cuisines.map(function (c) {
            return '<button class="cuisine-tile" data-action="cuisine" data-name="' + esc(c.name) + '">' +
              '<span class="cuisine-emoji" style="background:' + c.color + '">' + c.emoji + '</span><span>' + esc(c.name) + '</span></button>';
          }).join('') + '</div>' +
        '</section>' +
        '<section class="banner-section">' +
          '<div class="banner"><div class="banner-track" id="banner-track">' + D.banners.map(function (b) {
            return '<div class="banner-slide" style="--c1:' + b.colors[0] + ';--c2:' + b.colors[1] + '">' +
              '<div class="banner-copy"><strong>' + esc(b.title) + '</strong><span>' + esc(b.subtitle) + '</span></div>' +
              '<div class="banner-emoji">' + b.emoji + '</div></div>';
          }).join('') + '</div></div>' +
          '<div class="banner-dots" id="banner-dots">' + D.banners.map(function (_, i) {
            return '<button class="banner-dot ' + (i === 0 ? 'active' : '') + '" data-action="banner-dot" data-index="' + i + '" aria-label="Banner ' + (i + 1) + '"></button>';
          }).join('') + '</div>' +
        '</section>' +
        '<section class="section listings-section">' +
          '<div class="listings-head"><h2>Restaurants near you</h2><span id="rest-count">' + filteredRestaurants().length + ' places</span></div>' +
          '<div class="filter-row">' +
            '<button class="chip ' + (state.vegOnly ? 'active' : '') + '" data-action="filter" data-filter="veg">Pure veg</button>' +
            '<button class="chip ' + (state.offersOnly ? 'active' : '') + '" data-action="filter" data-filter="offers">Offers</button>' +
            '<button class="chip ' + (state.ratingFilter === 4 ? 'active' : '') + '" data-action="filter" data-filter="rating">Rating 4.0+</button>' +
            '<button class="chip ' + (state.sort === 'delivery' ? 'active' : '') + '" data-action="filter" data-filter="delivery">Fast delivery</button>' +
          '</div>' +
          '<div id="restaurant-list" class="restaurant-list">' + restaurantListHTML() + '</div>' +
        '</section>' +
      '</div>' + bottomNav('home') +
    '</div>';
  }

  function restaurantListHTML() {
    const list = filteredRestaurants();
    if (!list.length) {
      return '<div class="empty-state">' + icon('search', 34) + '<h3>No restaurants found</h3><p>Try removing a filter or searching for something else.</p>' +
        '<button class="btn btn-outline" data-action="reset-filters">Clear filters</button></div>';
    }
    return list.map(restaurantCard).join('');
  }

  function searchScreen() {
    return '<div class="screen">' + header('Search', { back: true, plain: true, action: '<button class="icon-btn" data-action="go" data-path="#/home">' + icon('home', 21) + '</button>' }) +
      '<div class="search-header"><div class="search-field">' + icon('search', 19) +
        '<input id="search-input" data-input="search" type="search" placeholder="Restaurant, dish or cuisine" value="' + esc(state.searchQuery) + '" autocomplete="off" />' +
        (state.searchQuery ? '<button data-action="clear-search" aria-label="Clear">' + icon('close', 17) + '</button>' : '') +
      '</div></div>' +
      '<div id="search-results" class="screen-body">' + searchResultsHTML() + '</div>' + bottomNav('search') + '</div>';
  }

  function searchResultsHTML() {
    const q = state.searchQuery.trim().toLowerCase();
    if (!q) {
      return '<section class="section"><h2>Recent searches</h2><div class="chip-wrap">' +
        (state.recentSearches.length ? state.recentSearches.map(function (term) {
          return '<button class="chip" data-action="search-chip" data-term="' + esc(term) + '">' + icon('clock', 14) + ' ' + esc(term) + '</button>';
        }).join('') : '<p class="muted">Your recent searches will appear here.</p>') + '</div></section>' +
        '<section class="section"><h2>Popular cuisines</h2><div class="chip-wrap">' +
        D.cuisines.slice(0, 8).map(function (c) {
          return '<button class="chip" data-action="search-chip" data-term="' + esc(c.name) + '">' + c.emoji + ' ' + esc(c.name) + '</button>';
        }).join('') + '</div></section>';
    }

    const restaurantMatches = D.restaurants.filter(function (r) {
      return r.name.toLowerCase().indexOf(q) !== -1 || r.cuisines.some(function (c) { return c.toLowerCase().indexOf(q) !== -1; });
    });
    const dishMatches = [];
    D.restaurants.forEach(function (r) {
      itemsOf(r).forEach(function (item) {
        if (item.name.toLowerCase().indexOf(q) !== -1 || item.desc.toLowerCase().indexOf(q) !== -1) {
          dishMatches.push({ restaurant: r, item: item });
        }
      });
    });

    if (!restaurantMatches.length && !dishMatches.length) {
      return '<div class="empty-state">' + icon('search', 34) + '<h3>No results for "' + esc(state.searchQuery) + '"</h3><p>Check the spelling or try a different dish or cuisine.</p></div>';
    }

    let html = '';
    if (restaurantMatches.length) {
      html += '<section class="section"><h2>Restaurants</h2><div class="restaurant-list">' + restaurantMatches.map(restaurantCard).join('') + '</div></section>';
    }
    if (dishMatches.length) {
      html += '<section class="section"><h2>Dishes</h2><div class="dish-results">' + dishMatches.slice(0, 20).map(function (match) {
        return '<article class="dish-result" data-action="open-item" data-id="' + match.item.id + '" data-rest="' + match.restaurant.id + '" role="button" tabindex="0">' +
          '<div class="dish-result-emoji">' + match.item.emoji + '</div>' +
          '<div class="dish-result-body"><h3>' + esc(match.item.name) + '</h3><p>' + esc(match.restaurant.name) + ' · ' + esc(match.item.cuisineHint || match.item.desc.slice(0, 48)) + '</p><strong>' + money(match.item.price) + '</strong></div>' +
          '<button class="add-btn" data-action="open-item" data-id="' + match.item.id + '" data-rest="' + match.restaurant.id + '">ADD</button>' +
        '</article>';
      }).join('') + '</div></section>';
    }
    return html;
  }

  function restaurantScreen(restaurant) {
    if (!restaurant) return notFoundScreen('Restaurant not found');
    const reviews = (state.reviews[restaurant.id] || []).concat(restaurant.reviews);
    return '<div class="screen restaurant-screen">' +
      '<div class="rest-hero" style="--c1:' + restaurant.colors[0] + ';--c2:' + restaurant.colors[1] + '">' +
        '<button class="round-btn" data-action="back" aria-label="Go back">' + icon('back', 22) + '</button>' +
        '<div class="hero-actions">' +
          '<button class="round-btn" data-action="share" aria-label="Share">' + icon('share', 19) + '</button>' +
          '<button class="round-btn ' + (state.favorites.indexOf(restaurant.id) !== -1 ? 'fav' : '') + '" data-action="toggle-favorite" data-id="' + restaurant.id + '" aria-label="Favorite">' + icon('heart', 19, state.favorites.indexOf(restaurant.id) !== -1) + '</button>' +
        '</div>' +
        '<div class="hero-emoji">' + restaurant.emoji + '</div>' +
      '</div>' +
      '<div class="rest-detail-card">' +
        '<div class="rest-title-row"><h1>' + esc(restaurant.name) + '</h1>' + ratingPill(restaurant.rating, true) + '</div>' +
        '<p class="rest-cuisines">' + esc(restaurant.cuisines.join(', ')) + '</p>' +
        '<p class="rest-sub"><span>' + icon('clock', 14) + ' ' + esc(restaurant.deliveryTime) + '</span><span>·</span><span>' + esc(restaurant.distance) + '</span><span>·</span><span>' + esc(restaurant.costForTwo) + '</span></p>' +
        '<p class="rest-address">' + icon('pin', 14) + ' ' + esc(restaurant.address) + '</p>' +
        (restaurant.offer ? '<div class="offer-strip">' + icon('tag', 16) + '<span><strong>' + esc(restaurant.offer) + '</strong><small>Use code ' + esc(restaurant.offerCode) + ' · T&amp;C apply</small></span></div>' : '') +
      '</div>' +
      '<div class="detail-tabs">' +
        '<button class="' + (state.detailTab === 'menu' ? 'active' : '') + '" data-action="detail-tab" data-tab="menu">Menu</button>' +
        '<button class="' + (state.detailTab === 'reviews' ? 'active' : '') + '" data-action="detail-tab" data-tab="reviews">Reviews (' + reviews.length + ')</button>' +
        '<button class="' + (state.detailTab === 'info' ? 'active' : '') + '" data-action="detail-tab" data-tab="info">Info</button>' +
      '</div>' +
      '<div class="screen-body">' + (state.detailTab === 'menu' ? menuHTML(restaurant) : state.detailTab === 'reviews' ? reviewsHTML(restaurant, reviews) : infoHTML(restaurant)) + '</div>' +
      cartBar() +
    '</div>';
  }

  function menuHTML(restaurant) {
    const lines = cartLines();
    return restaurant.menu.map(function (group) {
      return '<section class="menu-group"><h2>' + esc(group.category) + ' <span>(' + group.items.length + ')</span></h2>' +
        group.items.map(function (item) {
          const line = lines.find(function (l) { return l.itemId === item.id; });
          return '<div class="menu-item">' +
            '<div class="menu-copy">' +
              '<div class="item-name-row">' + vegMark(item.veg) + '<h3>' + esc(item.name) + '</h3></div>' +
              '<div class="item-price">' + money(item.price) + '</div>' +
              '<div class="item-rating">' + ratingPill(item.rating) + (item.popular ? '<span class="popular">' + icon('sparkles', 12) + ' Popular</span>' : '') + '</div>' +
              '<p class="item-desc">' + esc(item.desc) + '</p>' +
            '</div>' +
            '<div class="menu-item-side">' +
              '<div class="dish-thumb">' + item.emoji + '</div>' +
              (line ? '<div class="stepper small"><button data-action="qty-dec" data-key="' + line.key + '">' + icon('minus', 14) + '</button><span>' + line.qty + '</span><button data-action="qty-inc" data-key="' + line.key + '">' + icon('plus', 14) + '</button></div>'
                : '<button class="add-btn" data-action="open-item" data-id="' + item.id + '" data-rest="' + restaurant.id + '">ADD</button>') +
            '</div>' +
          '</div>';
        }).join('') +
      '</section>';
    }).join('');
  }

  function reviewsHTML(restaurant, reviews) {
    const allRatings = reviews.map(function (r) { return r.rating; });
    const average = allRatings.length ? (allRatings.reduce(function (a, b) { return a + b; }, 0) / allRatings.length).toFixed(1) : restaurant.rating;
    return '<section class="section review-section">' +
      '<div class="review-summary"><div><strong>' + average + '</strong><span>/ 5</span><p>' + reviews.length + ' ratings</p></div>' +
        '<div class="rating-bars">' + [5, 4, 3, 2, 1].map(function (star) {
          const count = reviews.filter(function (r) { return r.rating === star; }).length;
          const pct = reviews.length ? Math.round(count / reviews.length * 100) : 0;
          return '<div class="rating-bar"><span>' + star + '</span>' + icon('star', 11, true) + '<div><i style="width:' + Math.max(pct, 4) + '%"></i></div></div>';
        }).join('') + '</div></div>' +
      '<div class="write-review"><h3>Rate your experience</h3><div class="star-picker">' +
        [1, 2, 3, 4, 5].map(function (star) {
          return '<button data-action="set-review-rating" data-rating="' + star + '" class="' + (star <= state.reviewRating ? 'selected' : '') + '" aria-label="' + star + ' stars">' + icon('star', 26, star <= state.reviewRating) + '</button>';
        }).join('') + '</div>' +
        '<textarea data-input="review-text" rows="3" placeholder="Tell us about the food, packaging and delivery…">' + esc(state.reviewText) + '</textarea>' +
        '<button class="btn btn-primary" data-action="submit-review" data-id="' + restaurant.id + '">Submit review</button>' +
      '</div>' +
      '<div class="review-list">' + reviews.map(function (review) {
        return '<article class="review-card"><div class="avatar" style="background:' + (review.color || '#ddd') + '">' + esc(review.initials || review.name.slice(0, 2)) + '</div>' +
          '<div><div class="review-top"><strong>' + esc(review.name) + '</strong><span class="review-rating">' + icon('star', 12, true) + ' ' + review.rating + '</span></div><small>' + esc(review.time) + '</small><p>' + esc(review.text) + '</p></div></article>';
      }).join('') + '</div>' +
    '</section>';
  }

  function infoHTML(restaurant) {
    return '<section class="section info-section">' +
      '<div class="info-card">' + icon('pin', 20) + '<div><strong>Address</strong><p>' + esc(restaurant.address) + '</p></div></div>' +
      '<div class="info-card">' + icon('clock', 20) + '<div><strong>Opening hours</strong><p>' + esc(restaurant.timings) + '</p></div></div>' +
      '<div class="info-card">' + icon('shield', 20) + '<div><strong>Food safety</strong><p>FSSAI licensed kitchen · Hygienic packaging</p></div></div>' +
      '<div class="info-card">' + icon('phone', 20) + '<div><strong>Contact</strong><p>+91 80 4567 8900</p></div></div>' +
      '<div class="info-note">' + icon('info', 16) + ' This is a demo prototype. Restaurant details and contact information are sample data.</div>' +
    '</section>';
  }

  function cartScreen() {
    const lines = cartLines();
    if (!lines.length) {
      return '<div class="screen">' + header('Your cart', { back: true }) +
        '<div class="screen-body"><div class="empty-state tall">' + icon('bag', 42) + '<h3>Your cart is empty</h3><p>Good food is just a few taps away. Add something delicious!</p>' +
        '<button class="btn btn-primary" data-action="go" data-path="#/home">Browse restaurants</button></div></div>' + bottomNav('home') + '</div>';
    }
    const restaurant = restaurantById(state.cart.restaurantId);
    const totals = cartTotals();
    const address = selectedAddress();
    return '<div class="screen">' + header('Your cart', { back: true }) +
      '<div class="screen-body cart-screen">' +
        '<div class="cart-rest"><span class="cart-rest-emoji">' + restaurant.emoji + '</span><div><strong>' + esc(restaurant.name) + '</strong><small>' + icon('clock', 12) + ' ' + esc(restaurant.deliveryTime) + '</small></div><button class="link-btn" data-action="clear-cart">Clear</button></div>' +
        '<section class="panel"><div class="panel-head"><h2>Items</h2><button class="link-btn" data-action="go" data-path="#/restaurant/' + restaurant.id + '">Add more</button></div>' +
          lines.map(function (line) {
            const item = itemById(restaurant, line.itemId);
            return '<div class="cart-line">' + vegMark(item.veg) + '<div class="cart-line-body"><strong>' + esc(item.name) + '</strong>' +
              (line.choices.length ? '<small>' + esc(line.choices.join(', ')) + '</small>' : '') +
              '<span>' + money(line.unitPrice) + '</span></div>' +
              '<div class="stepper"><button data-action="qty-dec" data-key="' + line.key + '">' + icon('minus', 15) + '</button><span>' + line.qty + '</span><button data-action="qty-inc" data-key="' + line.key + '">' + icon('plus', 15) + '</button></div>' +
            '</div>';
          }).join('') +
        '</section>' +
        '<section class="panel coupon-panel"><div class="panel-head"><h2>' + icon('coupon', 18) + ' Offers & coupons</h2></div>' +
          (state.coupon ? '<div class="coupon-applied">' + icon('check', 16) + '<div><strong>' + esc(state.coupon.code) + ' applied</strong><small>' + esc(totals.couponLabel || 'Applicable on this order') + '</small></div><button class="icon-btn" data-action="remove-coupon">' + icon('close', 18) + '</button></div>' :
            '<div class="coupon-form"><input id="coupon-input" data-input="coupon" placeholder="Enter coupon code" value="' + esc(state.couponInput) + '" /><button class="btn btn-outline" data-action="apply-coupon">Apply</button></div><p class="coupon-hint">Try WELCOME50, FREEDEL or SAVE100</p>') +
        '</section>' +
        '<section class="panel address-panel"><div class="panel-head"><h2>' + icon('pin', 18) + ' Delivery address</h2><button class="link-btn" data-action="go" data-path="#/profile">Change</button></div>' +
          (address ? '<div class="address-line"><strong>' + esc(address.label) + '</strong><p>' + esc(address.line) + ', ' + esc(address.city) + ' — ' + esc(address.pin) + '</p></div>' : '<p class="muted">No address saved. Add one in your profile.</p>') +
        '</section>' +
        '<section class="panel bill-panel"><h2>Bill details</h2>' +
          '<div class="bill-row"><span>Item total</span><span>' + money(totals.itemTotal) + '</span></div>' +
          '<div class="bill-row"><span>Delivery fee ' + (totals.deliveryFee === 0 ? '<em>FREE</em>' : '') + '</span><span>' + (totals.deliveryFee ? money(totals.deliveryFee) : '₹0') + '</span></div>' +
          '<div class="bill-row"><span>Packaging charges</span><span>' + money(totals.packaging) + '</span></div>' +
          '<div class="bill-row"><span>GST & restaurant charges</span><span>' + money(totals.gst) + '</span></div>' +
          (totals.discount ? '<div class="bill-row discount"><span>Coupon discount</span><span>− ' + money(totals.discount) + '</span></div>' : '') +
          '<div class="bill-row total"><span>To pay</span><span>' + money(totals.total) + '</span></div>' +
        '</section>' +
        '<p class="safe-note">' + icon('shield', 15) + ' Safe and hygienic delivery · Contactless option available</p>' +
      '</div>' +
      '<div class="checkout-bar"><div><strong>' + money(totals.total) + '</strong><small>' + cartCount() + ' item' + (cartCount() > 1 ? 's' : '') + '</small></div>' +
        '<button class="btn btn-primary" data-action="go" data-path="#/checkout">Proceed to pay ' + icon('arrowRight', 17) + '</button></div>' +
    '</div>';
  }

  function checkoutScreen() {
    const lines = cartLines();
    if (!lines.length) return '<div class="screen">' + header('Checkout', { back: true }) + '<div class="screen-body"><div class="empty-state tall">' + icon('bag', 40) + '<h3>Nothing to check out</h3><button class="btn btn-primary" data-action="go" data-path="#/home">Browse restaurants</button></div></div>' + bottomNav('home') + '</div>';
    const totals = cartTotals();
    const methods = [
      { key: 'upi', icon: 'upi', label: 'UPI', sub: 'Google Pay, PhonePe, Paytm' },
      { key: 'card', icon: 'card', label: 'Credit / Debit card', sub: 'Visa, Mastercard, RuPay' },
      { key: 'wallet', icon: 'wallet', label: 'Wallets', sub: 'Paytm, Amazon Pay, Mobikwik' },
      { key: 'cod', icon: 'cash', label: 'Cash on delivery', sub: 'Pay when your order arrives' }
    ];
    return '<div class="screen">' + header('Checkout', { back: true }) +
      '<div class="screen-body checkout-screen">' +
        '<section class="panel"><div class="panel-head"><h2>' + icon('pin', 18) + ' Deliver to</h2><button class="link-btn" data-action="go" data-path="#/profile">Change</button></div>' +
          state.addresses.map(function (a) {
            return '<button class="address-option ' + (a.id === state.selectedAddressId ? 'selected' : '') + '" data-action="select-address" data-id="' + a.id + '">' +
              '<span class="radio-dot"></span><span><strong>' + esc(a.label) + '</strong><small>' + esc(a.line) + ', ' + esc(a.city) + ' — ' + esc(a.pin) + '</small></span></button>';
          }).join('') + '</section>' +
        '<section class="panel"><div class="panel-head"><h2>' + icon('wallet', 18) + ' Payment method</h2></div>' +
          methods.map(function (method) {
            return '<button class="payment-option ' + (state.payment === method.key ? 'selected' : '') + '" data-action="select-payment" data-key="' + method.key + '">' +
              '<span class="payment-icon">' + icon(method.icon, 20) + '</span><span><strong>' + method.label + '</strong><small>' + method.sub + '</small></span><span class="radio-dot"></span></button>';
          }).join('') + '<p class="coupon-hint">' + icon('shield', 13) + ' Demo only — no real payment is processed.</p>' +
        '</section>' +
        '<section class="panel"><div class="panel-head"><h2>' + icon('receipt', 18) + ' Order summary</h2></div>' +
          '<div class="bill-row"><span>' + cartCount() + ' item' + (cartCount() > 1 ? 's' : '') + ' from ' + esc(restaurantById(state.cart.restaurantId).name) + '</span><span>' + money(totals.itemTotal) + '</span></div>' +
          (totals.discount ? '<div class="bill-row discount"><span>Discount</span><span>− ' + money(totals.discount) + '</span></div>' : '') +
          '<div class="bill-row total"><span>Amount payable</span><span>' + money(totals.total) + '</span></div>' +
        '</section>' +
      '</div>' +
      '<div class="checkout-bar"><div><strong>' + money(totals.total) + '</strong><small>Incl. taxes & fees</small></div>' +
        '<button class="btn btn-primary" data-action="place-order">Place order</button></div>' +
    '</div>';
  }

  function ordersScreen() {
    const active = state.orders.filter(function (o) { return o.statusIndex < 4; });
    const past = state.orders.filter(function (o) { return o.statusIndex >= 4; });
    const list = state.ordersTab === 'active' ? active : past;
    return '<div class="screen">' + header('Your orders', { plain: true }) +
      '<div class="tabs-row">' +
        '<button class="' + (state.ordersTab === 'active' ? 'active' : '') + '" data-action="orders-tab" data-tab="active">Active (' + active.length + ')</button>' +
        '<button class="' + (state.ordersTab === 'past' ? 'active' : '') + '" data-action="orders-tab" data-tab="past">Past (' + past.length + ')</button>' +
      '</div>' +
      '<div class="screen-body">' +
        (list.length ? list.map(function (order) {
          const status = D.orderStatuses[order.statusIndex];
          return '<article class="order-card" data-action="open-order" data-id="' + order.id + '" role="button" tabindex="0">' +
            '<div class="order-card-top"><span class="order-emoji">' + order.emoji + '</span><div><strong>' + esc(order.restaurantName) + '</strong><small>' + new Date(order.placedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) + '</small></div><span class="order-status ' + (order.statusIndex >= 4 ? 'done' : '') + '">' + esc(status) + '</span></div>' +
            '<div class="order-items">' + order.lines.map(function (line) { return esc(line.name) + ' × ' + line.qty; }).join(', ') + '</div>' +
            '<div class="order-card-bottom"><strong>' + money(order.totals.total) + '</strong><span>Track order ' + icon('chevronRight', 15) + '</span></div>' +
          '</article>';
        }).join('') : '<div class="empty-state tall">' + icon('receipt', 40) + '<h3>No ' + state.ordersTab + ' orders</h3><p>' + (state.ordersTab === 'active' ? 'Place an order and follow it here in real time.' : 'Your completed orders will show up here.') + '</p><button class="btn btn-primary" data-action="go" data-path="#/home">Explore restaurants</button></div>') +
      '</div>' + bottomNav('orders') + '</div>';
  }

  function orderScreen(order) {
    if (!order) return notFoundScreen('Order not found');
    const steps = D.orderStatuses;
    const address = order.address;
    return '<div class="screen">' + header('Track order', { back: true, plain: true, action: '<button class="icon-btn" data-action="go" data-path="#/orders">' + icon('receipt', 20) + '</button>' }) +
      '<div class="screen-body tracking-screen">' +
        '<div class="tracking-hero" style="--c1:#fff2e6;--c2:#ffd9b3">' +
          '<span class="tracking-emoji">' + (order.statusIndex >= 4 ? '✅' : '🛵') + '</span>' +
          '<strong>' + (order.statusIndex >= 4 ? 'Delivered! Enjoy your meal.' : 'Estimated delivery in ' + (4 - order.statusIndex) * 8 + '–' + (4 - order.statusIndex) * 8 + 7 + ' min') + '</strong>' +
          '<small>Order #' + esc(order.id) + ' · ' + esc(order.restaurantName) + '</small>' +
        '</div>' +
        '<section class="panel timeline-panel"><h2>Order status</h2>' +
          steps.map(function (step, index) {
            const done = index < order.statusIndex;
            const current = index === order.statusIndex;
            return '<div class="timeline-step ' + (done ? 'done' : '') + (current ? 'current' : '') + '">' +
              '<div class="timeline-marker">' + (done ? icon('check', 15) : index + 1) + '</div>' +
              '<div><strong>' + esc(step) + '</strong><small>' + (done ? 'Completed' : current ? 'In progress' : 'Pending') + '</small></div>' +
              (current ? '<span class="pulse"></span>' : '') + '</div>';
          }).join('') +
          (order.statusIndex < 4 ? '<button class="btn btn-outline full" data-action="advance-order" data-id="' + order.id + '">Simulate next update ' + icon('arrowRight', 16) + '</button>' :
            '<button class="btn btn-primary full" data-action="go" data-path="#/restaurant/' + order.restaurantId + '">Order again</button>') +
          '<p class="coupon-hint">Demo: status also advances automatically every 12 seconds.</p>' +
        '</section>' +
        '<section class="panel"><h2>Delivery partner</h2>' +
          '<div class="partner"><span class="avatar" style="background:#ffd9a0">' + esc(order.partner.name.slice(0, 1)) + '</span><div><strong>' + esc(order.partner.name) + '</strong><small>' + icon('star', 12, true) + ' ' + order.partner.rating + ' · ' + esc(order.partner.vehicle) + '</small></div><button class="icon-btn" data-action="call-partner">' + icon('phone', 19) + '</button></div>' +
        '</section>' +
        '<section class="panel"><h2>Delivery address</h2><div class="address-line"><strong>' + esc(address.label) + '</strong><p>' + esc(address.line) + ', ' + esc(address.city) + ' — ' + esc(address.pin) + '</p></div></section>' +
        '<section class="panel"><h2>Order details</h2>' +
          order.lines.map(function (line) { return '<div class="bill-row"><span>' + esc(line.name) + ' × ' + line.qty + '</span><span>' + money(line.unitPrice * line.qty) + '</span></div>'; }).join('') +
          '<div class="bill-row"><span>Paid via ' + esc(order.paymentLabel) + '</span><span>' + money(order.totals.total) + '</span></div>' +
        '</section>' +
      '</div>' + bottomNav('orders') + '</div>';
  }

  function loginScreen() {
    if (state.loginStep === 'otp') {
      return '<div class="screen">' + header('Verify phone', { back: true, plain: true }) +
        '<div class="screen-body login-screen"><div class="login-illustration">📱</div><h2>Enter the 6-digit code</h2>' +
        '<p class="muted">Sent to +91 ' + esc(state.loginPhone) + '</p>' +
        '<input class="otp-input" data-input="otp" inputmode="numeric" maxlength="6" placeholder="••••••" value="' + esc(state.loginOtp) + '" />' +
        '<p class="demo-hint">Demo hint: use any 6 digits, e.g. 123456</p>' +
        '<button class="btn btn-primary full" data-action="login-verify">Verify & continue</button>' +
        '<button class="link-btn center" data-action="login-back">Change number</button>' +
      '</div></div>';
    }
    return '<div class="screen">' + header('Sign in', { back: true, plain: true }) +
      '<div class="screen-body login-screen"><div class="login-illustration">🍽️</div><h2>What\'s your number?</h2>' +
      '<p class="muted">We\'ll send you a one-time code to verify it.</p>' +
      '<div class="phone-field"><span>+91</span><input data-input="phone" inputmode="numeric" maxlength="10" placeholder="10-digit mobile number" value="' + esc(state.loginPhone) + '" /></div>' +
      '<button class="btn btn-primary full" data-action="login-continue">Continue</button>' +
      '<button class="link-btn center" data-action="login-skip">Skip for now</button>' +
      '<p class="terms">By continuing, you agree to our Terms of Service and Privacy Policy. This is a demo — no SMS is sent.</p>' +
    '</div></div>';
  }

  function profileScreen() {
    return '<div class="screen">' + header('Your profile', { plain: true }) +
      '<div class="screen-body profile-screen">' +
        (state.user ? '<div class="profile-card"><span class="avatar large">' + esc(state.user.name.slice(0, 1)) + '</span><div><strong>' + esc(state.user.name) + '</strong><small>+91 ' + esc(state.user.phone) + '</small></div><button class="icon-btn" data-action="logout" aria-label="Log out">' + icon('logout', 20) + '</button></div>' :
          '<div class="profile-login-card">' + icon('user', 26) + '<div><strong>Sign in to save your favourites</strong><p>Track orders and manage addresses easily.</p></div><button class="btn btn-primary" data-action="open-login">Sign in</button></div>') +
        '<section class="panel"><div class="panel-head"><h2>' + icon('pin', 18) + ' Saved addresses</h2><button class="link-btn" data-action="toggle-address-form">' + (state.showAddressForm ? 'Cancel' : 'Add new') + '</button></div>' +
          state.addresses.map(function (a) {
            return '<div class="address-option ' + (a.id === state.selectedAddressId ? 'selected' : '') + '">' +
              '<button class="address-select" data-action="select-address" data-id="' + a.id + '"><span class="radio-dot"></span><span><strong>' + esc(a.label) + '</strong><small>' + esc(a.line) + ', ' + esc(a.city) + ' — ' + esc(a.pin) + '</small></span></button>' +
              '<button class="icon-btn small" data-action="delete-address" data-id="' + a.id + '" aria-label="Delete address">' + icon('trash', 17) + '</button>' +
            '</div>';
          }).join('') +
          (state.showAddressForm ? '<form class="address-form" data-form="new-address">' +
            '<input name="label" placeholder="Label (Home, Work…)" required />' +
            '<input name="line" placeholder="Flat / house no., street" required />' +
            '<div class="form-row"><input name="city" placeholder="City" required /><input name="pin" inputmode="numeric" maxlength="6" placeholder="PIN code" required /></div>' +
            '<button class="btn btn-primary full" type="submit">Save address</button>' +
          '</form>' : '') +
        '</section>' +
        '<section class="panel link-list">' +
          '<button data-action="go" data-path="#/orders">' + icon('receipt', 19) + ' My orders ' + icon('chevronRight', 17) + '</button>' +
          '<button data-action="go" data-path="#/search">' + icon('heart', 19) + ' Favourites (' + state.favorites.length + ') ' + icon('chevronRight', 17) + '</button>' +
          '<button data-action="go" data-path="#/cart">' + icon('bag', 19) + ' Your cart ' + icon('chevronRight', 17) + '</button>' +
          '<button data-action="about">' + icon('info', 19) + ' About this app ' + icon('chevronRight', 17) + '</button>' +
        '</section>' +
        '<p class="app-version">Foodie prototype · v1.0 · Made for demo purposes</p>' +
      '</div>' + bottomNav('profile') + '</div>';
  }

  function notFoundScreen(message) {
    return '<div class="screen">' + header('Not found', { back: true }) + '<div class="screen-body"><div class="empty-state tall">' + icon('info', 38) + '<h3>' + esc(message) + '</h3><button class="btn btn-primary" data-action="go" data-path="#/home">Go home</button></div></div></div>';
  }

  /* ---------- sheets ---------- */

  function renderSheet() {
    if (!state.sheet) { sheetRoot.innerHTML = ''; return; }
    if (state.sheet.type === 'item') {
      const restaurant = restaurantById(state.sheet.restId);
      const item = itemById(restaurant, state.sheet.itemId);
      if (!item) { state.sheet = null; sheetRoot.innerHTML = ''; return; }
      const unitPrice = item.unitPriceOverride != null ? item.unitPriceOverride : itemPrice(item, state.sheet.selections);
      sheetRoot.innerHTML = '<div class="sheet-backdrop" data-action="close-sheet"></div>' +
        '<div class="sheet" role="dialog" aria-modal="true">' +
          '<button class="sheet-close" data-action="close-sheet" aria-label="Close">' + icon('close', 20) + '</button>' +
          '<div class="sheet-hero"><span>' + item.emoji + '</span></div>' +
          '<div class="sheet-content">' +
            '<div class="item-name-row">' + vegMark(item.veg) + '<h2>' + esc(item.name) + '</h2></div>' +
            '<p class="muted">' + esc(item.desc) + '</p>' +
            '<div class="item-price">' + money(item.price) + '</div>' +
            (item.customizations.length ? item.customizations.map(function (group, gi) {
              return '<div class="option-group"><h3>' + esc(group.title) + (group.required ? ' <em>Required</em>' : '') + '</h3>' +
                group.choices.map(function (choice, ci) {
                  const active = state.sheet.selections[gi] === ci;
                  return '<button class="option-choice ' + (active ? 'selected' : '') + '" data-action="sheet-choice" data-group="' + gi + '" data-choice="' + ci + '">' +
                    '<span class="radio-dot"></span><span>' + esc(choice.name) + '</span>' + (choice.delta ? '<span class="delta">+ ' + money(choice.delta) + '</span>' : '') + '</button>';
                }).join('') + '</div>';
            }).join('') : '') +
            '<div class="sheet-footer">' +
              '<div class="stepper"><button data-action="sheet-qty" data-delta="-1">' + icon('minus', 16) + '</button><span>' + state.sheet.qty + '</span><button data-action="sheet-qty" data-delta="1">' + icon('plus', 16) + '</button></div>' +
              '<button class="btn btn-primary" data-action="confirm-add">Add to cart · ' + money(unitPrice * state.sheet.qty) + '</button>' +
            '</div>' +
          '</div>' +
        '</div>';
    } else if (state.sheet.type === 'confirm-clear') {
      sheetRoot.innerHTML = '<div class="sheet-backdrop" data-action="close-sheet"></div>' +
        '<div class="sheet confirm-sheet" role="dialog" aria-modal="true">' +
          '<div class="sheet-content">' + icon('bag', 30) + '<h2>Start a new cart?</h2>' +
          '<p class="muted">Your cart has items from another restaurant. Clearing it lets you add items from this one.</p>' +
          '<div class="confirm-actions"><button class="btn btn-outline" data-action="close-sheet">Cancel</button>' +
          '<button class="btn btn-primary" data-action="confirm-clear-cart">Clear & add</button></div></div>' +
        '</div>';
    }
  }

  function itemPrice(item, selections) {
    let price = item.price;
    (item.customizations || []).forEach(function (group, gi) {
      const ci = selections[gi];
      if (ci != null && group.choices[ci]) price += group.choices[ci].delta;
    });
    return price;
  }

  /* ---------- actions ---------- */

  function navigate(path) {
    if (path === '#/home') state.cuisineFilter = '';
    state.sheet = null;
    renderSheet();
    if (location.hash === path) {
      render();
    } else {
      location.hash = path;
    }
  }

  function goBack() {
    if (history.length > 1) history.back();
    else navigate('#/home');
  }

  function addLine(restaurantId, itemId, selections, qty) {
    const restaurant = restaurantById(restaurantId);
    const item = itemById(restaurant, itemId);
    if (!item) return;
    const unitPrice = itemPrice(item, selections);
    const choices = (item.customizations || []).map(function (group, gi) {
      return selections[gi] != null && group.choices[selections[gi]] ? group.choices[selections[gi]].name : null;
    }).filter(Boolean);
    const key = itemId + '-' + choices.join('-').replace(/\s+/g, '').toLowerCase();
    if (state.cart.restaurantId && state.cart.restaurantId !== restaurantId) {
      state.pendingAdd = { restaurantId: restaurantId, itemId: itemId, selections: selections, qty: qty };
      state.sheet = { type: 'confirm-clear' };
      renderSheet();
      return;
    }
    state.cart.restaurantId = restaurantId;
    const existing = state.cart.lines.find(function (line) { return line.key === key; });
    if (existing) existing.qty += qty;
    else state.cart.lines.push({ key: key, itemId: itemId, name: item.name, qty: qty, unitPrice: unitPrice, choices: choices });
    persistAll();
    toast(item.name + ' added to cart');
  }

  function changeQty(key, delta) {
    const line = state.cart.lines.find(function (l) { return l.key === key; });
    if (!line) return;
    line.qty += delta;
    if (line.qty <= 0) state.cart.lines = state.cart.lines.filter(function (l) { return l.key !== key; });
    if (!state.cart.lines.length) { state.cart.restaurantId = null; state.coupon = null; }
    persistAll();
    render();
  }

  function placeOrder() {
    const lines = cartLines();
    if (!lines.length) { toast('Your cart is empty'); navigate('#/home'); return; }
    const restaurant = restaurantById(state.cart.restaurantId);
    const totals = cartTotals();
    const address = selectedAddress();
    if (!address) { toast('Please add a delivery address first'); navigate('#/profile'); return; }
    const paymentLabels = { upi: 'UPI', card: 'Card', wallet: 'Wallet', cod: 'Cash on delivery' };
    const order = {
      id: 'FD' + String(Date.now()).slice(-6),
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      emoji: restaurant.emoji,
      lines: lines.map(function (line) { return { name: line.name, qty: line.qty, unitPrice: line.unitPrice, choices: line.choices }; }),
      totals: totals,
      address: { label: address.label, line: address.line, city: address.city, pin: address.pin },
      payment: state.payment,
      paymentLabel: paymentLabels[state.payment] || 'UPI',
      partner: D.deliveryPartners[Math.floor(Math.random() * D.deliveryPartners.length)],
      statusIndex: 0,
      placedAt: Date.now()
    };
    state.orders.unshift(order);
    state.cart = { restaurantId: null, lines: [] };
    state.coupon = null;
    state.couponInput = '';
    state.ordersTab = 'active';
    persistAll();
    toast('Order placed successfully!');
    navigate('#/order/' + order.id);
  }

  function advanceOrder(id) {
    const order = state.orders.find(function (o) { return o.id === id; });
    if (!order || order.statusIndex >= 4) return;
    order.statusIndex += 1;
    persistAll();
    toast(D.orderStatuses[order.statusIndex] + ' · ' + order.id);
    render();
  }

  function rememberSearch(term) {
    term = term.trim();
    if (!term) return;
    state.recentSearches = [term].concat(state.recentSearches.filter(function (t) { return t.toLowerCase() !== term.toLowerCase(); })).slice(0, 6);
    save('recent', state.recentSearches);
  }

  const actions = {
    go: function (el) { navigate(el.dataset.path); },
    back: function () { goBack(); },
    'open-restaurant': function (el) { navigate('#/restaurant/' + el.dataset.id); },
    'open-order': function (el) { navigate('#/order/' + el.dataset.id); },
    'open-item': function (el) {
      const restaurant = restaurantById(el.dataset.rest);
      const item = itemById(restaurant, el.dataset.id);
      if (!item) return;
      state.sheet = { type: 'item', restId: el.dataset.rest, itemId: el.dataset.id, qty: 1, selections: [] };
      renderSheet();
    },
    'close-sheet': function () { state.sheet = null; state.pendingAdd = null; renderSheet(); },
    'sheet-choice': function (el) {
      state.sheet.selections[Number(el.dataset.group)] = Number(el.dataset.choice);
      renderSheet();
    },
    'sheet-qty': function (el) {
      state.sheet.qty = Math.max(1, Math.min(20, state.sheet.qty + Number(el.dataset.delta)));
      renderSheet();
    },
    'confirm-add': function () {
      const sheet = state.sheet;
      addLine(sheet.restId, sheet.itemId, sheet.selections, sheet.qty);
      if (!state.pendingAdd) { state.sheet = null; renderSheet(); render(); }
    },
    'confirm-clear-cart': function () {
      state.cart = { restaurantId: null, lines: [] };
      state.coupon = null;
      const pending = state.pendingAdd;
      state.pendingAdd = null;
      state.sheet = null;
      renderSheet();
      if (pending) addLine(pending.restaurantId, pending.itemId, pending.selections, pending.qty);
      render();
    },
    'clear-cart': function () {
      state.cart = { restaurantId: null, lines: [] };
      state.coupon = null;
      persistAll();
      toast('Cart cleared');
      render();
    },
    'qty-inc': function (el) { changeQty(el.dataset.key, 1); },
    'qty-dec': function (el) { changeQty(el.dataset.key, -1); },
    'apply-coupon': function () {
      const input = $('#coupon-input');
      const code = (input ? input.value : state.couponInput).trim().toUpperCase();
      const coupon = D.coupons.find(function (c) { return c.code === code; });
      if (!coupon) { toast('Invalid coupon code'); return; }
      const totals = cartTotals();
      if (totals.itemTotal < coupon.min) { toast('Add ' + money(coupon.min - totals.itemTotal) + ' more to use ' + code); return; }
      state.coupon = coupon;
      state.couponInput = '';
      persistAll();
      toast(coupon.label + ' applied');
      render();
    },
    'remove-coupon': function () { state.coupon = null; persistAll(); render(); },
    'select-address': function (el) {
      state.selectedAddressId = el.dataset.id;
      save('address', state.selectedAddressId);
      toast('Delivery address updated');
      render();
    },
    'select-payment': function (el) {
      state.payment = el.dataset.key;
      save('payment', state.payment);
      render();
    },
    'place-order': function () { placeOrder(); },
    'advance-order': function (el) { advanceOrder(el.dataset.id); },
    'detail-tab': function (el) { state.detailTab = el.dataset.tab; render(); },
    'orders-tab': function (el) { state.ordersTab = el.dataset.tab; render(); },
    'toggle-favorite': function (el) {
      const id = el.dataset.id;
      const index = state.favorites.indexOf(id);
      if (index === -1) { state.favorites.push(id); toast('Added to favourites'); }
      else { state.favorites.splice(index, 1); toast('Removed from favourites'); }
      save('favorites', state.favorites);
      render();
    },
    'share': function () {
      if (navigator.share) navigator.share({ title: document.title, url: location.href }).catch(function () {});
      else if (navigator.clipboard) { navigator.clipboard.writeText(location.href); toast('Link copied'); }
      else toast('Sharing is not supported here');
    },
    'call-partner': function () { toast('Demo: calls are disabled in this prototype'); },
    'filter': function (el) {
      const filter = el.dataset.filter;
      if (filter === 'veg') state.vegOnly = !state.vegOnly;
      if (filter === 'offers') state.offersOnly = !state.offersOnly;
      if (filter === 'rating') state.ratingFilter = state.ratingFilter === 4 ? 0 : 4;
      if (filter === 'delivery') state.sort = state.sort === 'delivery' ? 'recommended' : 'delivery';
      const list = $('#restaurant-list');
      if (list) {
        list.innerHTML = restaurantListHTML();
        const count = $('#rest-count');
        if (count) count.textContent = filteredRestaurants().length + ' places';
        $$('.filter-row .chip').forEach(function (chip) {
          const f = chip.dataset.filter;
          chip.classList.toggle('active', f === 'veg' ? state.vegOnly : f === 'offers' ? state.offersOnly : f === 'rating' ? state.ratingFilter === 4 : state.sort === 'delivery');
        });
      } else render();
    },
    'reset-filters': function () {
      state.vegOnly = false; state.offersOnly = false; state.ratingFilter = 0; state.sort = 'recommended'; state.cuisineFilter = '';
      render();
    },
    'cuisine': function (el) {
      state.cuisineFilter = el.dataset.name;
      state.searchQuery = el.dataset.name;
      rememberSearch(state.searchQuery);
      navigate('#/search');
    },
    'search-chip': function (el) {
      state.searchQuery = el.dataset.term;
      rememberSearch(state.searchQuery);
      render();
      const input = $('#search-input');
      if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
    },
    'clear-search': function () {
      state.searchQuery = '';
      render();
      const input = $('#search-input');
      if (input) input.focus();
    },
    'banner-dot': function (el) { state.bannerIndex = Number(el.dataset.index); updateBanner(); },
    'set-review-rating': function (el) { state.reviewRating = Number(el.dataset.rating); render(); },
    'submit-review': function (el) {
      const text = state.reviewText.trim();
      if (!text) { toast('Please write a short review first'); return; }
      const id = el.dataset.id;
      if (!state.reviews[id]) state.reviews[id] = [];
      state.reviews[id].unshift({
        name: state.user ? state.user.name : 'You', initials: 'YO', color: '#b0bec5',
        rating: state.reviewRating, time: 'Just now', text: text
      });
      state.reviewText = '';
      save('reviews', state.reviews);
      toast('Thanks for your review!');
      render();
    },
    'open-login': function () { state.loginStep = 'phone'; navigate('#/login'); },
    'login-continue': function () {
      const phone = (state.phone || '').replace(/\D/g, '');
      if (phone.length !== 10) { toast('Enter a valid 10-digit number'); return; }
      state.loginPhone = phone;
      state.loginOtp = '';
      state.loginStep = 'otp';
      render();
    },
    'login-verify': function () {
      const otp = (state.otp || '').replace(/\D/g, '');
      if (otp.length !== 6) { toast('Enter the 6-digit code'); return; }
      state.user = { phone: state.loginPhone, name: 'Foodie User' };
      state.loginStep = 'phone';
      persistAll();
      toast('Signed in successfully');
      navigate(state.loginReturn || '#/profile');
    },
    'login-back': function () { state.loginStep = 'phone'; render(); },
    'login-skip': function () { navigate('#/home'); },
    'logout': function () { state.user = null; persistAll(); toast('Signed out'); render(); },
    'toggle-address-form': function () { state.showAddressForm = !state.showAddressForm; render(); },
    'delete-address': function (el) {
      if (state.addresses.length <= 1) { toast('Keep at least one address'); return; }
      const id = el.dataset.id;
      state.addresses = state.addresses.filter(function (a) { return a.id !== id; });
      if (state.selectedAddressId === id) state.selectedAddressId = state.addresses[0].id;
      persistAll();
      toast('Address removed');
      render();
    },
    'about': function () { toast('Foodie — a Swiggy-style demo prototype'); }
  };

  document.addEventListener('click', function (event) {
    const el = event.target.closest('[data-action]');
    if (!el) return;
    const handler = actions[el.dataset.action];
    if (!handler) return;
    event.preventDefault();
    handler(el, event);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter') return;
    const el = event.target;
    if (el.dataset && el.dataset.input === 'search') {
      rememberSearch(el.value);
    }
    if (el.dataset && el.dataset.input === 'phone') actions['login-continue']();
    if (el.dataset && el.dataset.input === 'otp') actions['login-verify']();
    if (el.matches && el.matches('[role="button"][data-action]')) el.click();
  });

  document.addEventListener('input', function (event) {
    const el = event.target;
    if (!el.dataset || !el.dataset.input) return;
    const kind = el.dataset.input;
    if (kind === 'search') {
      state.searchQuery = el.value;
      const results = $('#search-results');
      if (results) results.innerHTML = searchResultsHTML();
      const clear = $('.search-field [data-action="clear-search"]');
      if (clear && !el.value) clear.remove();
      if (!clear && el.value) {
        const button = document.createElement('button');
        button.dataset.action = 'clear-search';
        button.setAttribute('aria-label', 'Clear');
        button.innerHTML = icon('close', 17);
        $('.search-field').appendChild(button);
      }
    }
    if (kind === 'phone') state.phone = el.value.replace(/\D/g, '').slice(0, 10);
    if (kind === 'otp') state.otp = el.value.replace(/\D/g, '').slice(0, 6);
    if (kind === 'coupon') state.couponInput = el.value;
    if (kind === 'review-text') state.reviewText = el.value;
  });

  document.addEventListener('submit', function (event) {
    const form = event.target;
    if (!form.dataset || form.dataset.form !== 'new-address') return;
    event.preventDefault();
    const data = new FormData(form);
    const label = String(data.get('label') || '').trim();
    const line = String(data.get('line') || '').trim();
    const city = String(data.get('city') || '').trim();
    const pin = String(data.get('pin') || '').trim();
    if (!label || !line || !city || pin.length !== 6) { toast('Please fill all address fields correctly'); return; }
    const id = 'a' + Date.now();
    state.addresses.push({ id: id, label: label, line: line, city: city, pin: pin });
    state.selectedAddressId = id;
    state.showAddressForm = false;
    persistAll();
    toast('Address saved');
    render();
  });

  window.addEventListener('hashchange', function () { render(); });

  function updateBanner() {
    const track = $('#banner-track');
    if (track) track.style.transform = 'translateX(-' + (state.bannerIndex * 100) + '%)';
    $$('.banner-dot').forEach(function (dot, i) { dot.classList.toggle('active', i === state.bannerIndex); });
  }

  /* ---------- render ---------- */

  function render() {
    if (routeTimer) { clearInterval(routeTimer); routeTimer = null; }
    state.route = parseHash();
    const route = state.route;
    const key = route.name + '/' + (route.param || '');
    const preserveScroll = key === previousRouteKey;
    const scrollY = window.scrollY;
    previousRouteKey = key;

    let html;
    switch (route.name) {
      case 'home': html = homeScreen(); break;
      case 'search': html = searchScreen(); break;
      case 'restaurant': html = restaurantScreen(restaurantById(route.param)); break;
      case 'cart': html = cartScreen(); break;
      case 'checkout': html = checkoutScreen(); break;
      case 'orders': html = ordersScreen(); break;
      case 'order': html = orderScreen(state.orders.find(function (o) { return o.id === route.param; })); break;
      case 'login': html = loginScreen(); break;
      case 'profile': html = profileScreen(); break;
      default: html = notFoundScreen('Page not found');
    }
    app.innerHTML = html;
    renderSheet();
    window.scrollTo(0, preserveScroll ? scrollY : 0);

    if (route.name === 'home') {
      updateBanner();
      routeTimer = setInterval(function () {
        state.bannerIndex = (state.bannerIndex + 1) % D.banners.length;
        updateBanner();
      }, 4500);
    }
    if (route.name === 'search') {
      const input = $('#search-input');
      if (input && !state.searchQuery) { try { input.focus(); } catch (e) { /* mobile keyboards */ } }
    }
    if (route.name === 'order') {
      routeTimer = setInterval(function () {
        const order = state.orders.find(function (o) { return o.id === route.param; });
        if (!order || order.statusIndex >= 4) { clearInterval(routeTimer); return; }
        advanceOrder(order.id);
      }, 12000);
    }
  }

  if (!location.hash) location.replace('#/home');
  render();
})();
