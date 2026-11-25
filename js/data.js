/* Bundled mock data. No network required — the prototype works fully offline. */
(function () {
  const spiceGroup = {
    title: 'Choose spice level',
    required: true,
    choices: [
      { name: 'Mild', delta: 0 },
      { name: 'Medium', delta: 0 },
      { name: 'Extra spicy', delta: 0 }
    ]
  };

  function dish(id, name, price, emoji, desc, opts) {
    opts = opts || {};
    return {
      id: id,
      name: name,
      price: price,
      emoji: emoji,
      desc: desc,
      veg: opts.veg !== false,
      rating: opts.rating || 4.3,
      popular: !!opts.popular,
      customizations: opts.spice ? [spiceGroup] : (opts.customizations || [])
    };
  }

  const sizeGroup = {
    title: 'Choose a size',
    required: true,
    choices: [
      { name: 'Regular', delta: 0 },
      { name: 'Large', delta: 60 },
      { name: 'Family pack', delta: 140 }
    ]
  };

  const restaurants = [
    {
      id: 'r1', name: 'Truffles', cuisines: ['Burgers', 'American', 'Fast Food'],
      rating: 4.6, ratingCount: '12.4K', deliveryTime: '25–35 min', distance: '1.8 km',
      costForTwo: '₹600 for two', emoji: '🍔', colors: ['#ffe0b2', '#ff8f3d'],
      offer: '50% OFF up to ₹100', offerCode: 'WELCOME50', promoted: true, pureVeg: false,
      address: '12, 100 Feet Road, Indiranagar, Bengaluru', timings: '11:00 am – 11:30 pm',
      menu: [
        { category: 'Recommended', items: [
          dish('r1-i1', 'Classic Veg Burger', 189, '🍔', 'Crispy potato patty, lettuce, cheese and house sauce in a toasted bun.', { popular: true, spice: true }),
          dish('r1-i2', 'Smoky Chicken Burger', 249, '🍗', 'Grilled chicken with smoked mayo, caramelised onions and cheddar.', { veg: false, popular: true, spice: true }),
          dish('r1-i3', 'Loaded Cheese Fries', 179, '🍟', 'Golden fries smothered in cheese sauce and herbs.', { popular: true })
        ]},
        { category: 'Main Course', items: [
          dish('r1-i4', 'Truffle Mushroom Pasta', 329, '🍝', 'Creamy mushroom pasta finished with truffle oil and parmesan.', { spice: true }),
          dish('r1-i5', 'Chicken Steak', 389, '🥩', 'Juicy pan-seared chicken with sautéed vegetables.', { veg: false, spice: true }),
          dish('r1-i6', 'Veg Sizzler', 349, '🍳', 'Assorted grilled veggies with rice and tangy dip.', { spice: true })
        ]},
        { category: 'Beverages & Desserts', items: [
          dish('r1-i7', 'Chocolate Shake', 169, '🥤', 'Thick chocolate shake topped with whipped cream.'),
          dish('r1-i8', 'Brownie with Ice Cream', 199, '🍨', 'Warm chocolate brownie with a scoop of vanilla ice cream.'),
          dish('r1-i9', 'Fresh Lime Soda', 119, '🍋', 'Refreshing lime soda, sweet or salted.')
        ]}
      ]
    },
    {
      id: 'r2', name: 'MTR', cuisines: ['South Indian', 'Breakfast', 'Idli'],
      rating: 4.7, ratingCount: '28.1K', deliveryTime: '20–30 min', distance: '2.4 km',
      costForTwo: '₹400 for two', emoji: '🥞', colors: ['#fff3c4', '#f2c14e'],
      offer: '₹125 OFF above ₹249', offerCode: 'MTR125', promoted: false, pureVeg: true,
      address: '30, Lalbagh Road, Jayanagar, Bengaluru', timings: '6:30 am – 10:30 pm',
      menu: [
        { category: 'Breakfast Specials', items: [
          dish('r2-i1', 'Plain Idli (2 pcs)', 89, '🍚', 'Soft, fluffy idlis served with sambar and chutney.', { popular: true }),
          dish('r2-i2', 'Ghee Roast Dosa', 169, '🥞', 'Crisp dosa roasted with pure ghee, served with sambar.', { popular: true }),
          dish('r2-i3', 'Vada (2 pcs)', 99, '🍩', 'Golden, crispy ulundu vadas with coconut chutney.', { popular: true })
        ]},
        { category: 'Meals', items: [
          dish('r2-i4', 'MTR Special Thali', 249, '🍱', 'A complete meal with rice, sambar, curries, curd and sweet.', { customizations: [sizeGroup] }),
          dish('r2-i5', 'Bisibele Bath', 179, '🍛', 'Spicy lentil and vegetable rice with raita.', { spice: true }),
          dish('r2-i6', 'Pongal', 129, '🥣', 'Creamy rice and lentil porridge with ghee and pepper.')
        ]},
        { category: 'Sweets & Drinks', items: [
          dish('r2-i7', 'Mysore Pak', 89, '🍬', 'Rich, melt-in-the-mouth gram flour sweet.'),
          dish('r2-i8', 'Filter Coffee', 59, '☕', 'Authentic South Indian filter coffee.'),
          dish('r2-i9', 'Badam Milk', 89, '🥛', 'Warm almond milk with saffron and cardamom.')
        ]}
      ]
    },
    {
      id: 'r3', name: 'Meghana Foods', cuisines: ['Biryani', 'Andhra', 'South Indian'],
      rating: 4.5, ratingCount: '19.8K', deliveryTime: '35–45 min', distance: '4.1 km',
      costForTwo: '₹700 for two', emoji: '🍛', colors: ['#ffd6c9', '#e8542f'],
      offer: '40% OFF up to ₹80', offerCode: 'MEGHA40', promoted: true, pureVeg: false,
      address: '5th Block, Koramangala, Bengaluru', timings: '11:30 am – 11:00 pm',
      menu: [
        { category: 'Signature Biryanis', items: [
          dish('r3-i1', 'Boneless Chicken Biryani', 329, '🍛', 'Long-grain basmati layered with spicy boneless chicken.', { veg: false, popular: true, spice: true, customizations: [{ title: 'Choose portion', required: true, choices: [{ name: 'Single', delta: 0 }, { name: 'Double', delta: 150 }] }] }),
          dish('r3-i2', 'Paneer Biryani', 299, '🍚', 'Fragrant basmati rice with marinated paneer and spices.', { popular: true, spice: true }),
          dish('r3-i3', 'Veg Biryani', 219, '🍛', 'Seasonal vegetables and rice with Andhra-style masala.', { spice: true })
        ]},
        { category: 'Starters', items: [
          dish('r3-i4', 'Chilli Chicken', 249, '🍗', 'Crispy chicken tossed with peppers and chilli sauce.', { veg: false, popular: true, spice: true }),
          dish('r3-i5', 'Paneer 65', 229, '🧀', 'Crispy paneer cubes with curry leaves and green chilli.', { spice: true }),
          dish('r3-i6', 'Apollo Fish', 289, '🐟', 'Spicy fried fish bites with a tangy glaze.', { veg: false, spice: true })
        ]},
        { category: 'Accompaniments', items: [
          dish('r3-i7', 'Raita', 59, '🥣', 'Cool curd with cucumber and roasted cumin.'),
          dish('r3-i8', 'Onion Salan', 69, '🧅', 'Spicy onion and garlic chutney.'),
          dish('r3-i9', 'Gulab Jamun (2 pcs)', 99, '🍮', 'Soft khoya dumplings in warm sugar syrup.')
        ]}
      ]
    },
    {
      id: 'r4', name: 'Pizza Hut', cuisines: ['Pizza', 'Italian', 'Fast Food'],
      rating: 4.2, ratingCount: '9.6K', deliveryTime: '30–40 min', distance: '3.2 km',
      costForTwo: '₹800 for two', emoji: '🍕', colors: ['#ffe0e0', '#e53935'],
      offer: '60% OFF up to ₹120', offerCode: 'PIZZA60', promoted: false, pureVeg: false,
      address: ' rooftop, 80 Feet Road, Koramangala, Bengaluru', timings: '11:00 am – 11:00 pm',
      menu: [
        { category: 'Bestsellers', items: [
          dish('r4-i1', 'Margherita — Medium', 299, '🍕', 'Classic tomato sauce, mozzarella and oregano.', { popular: true, customizations: [sizeGroup] }),
          dish('r4-i2', 'Farmhouse — Medium', 399, '🍕', 'Onions, capsicum, sweet corn, tomatoes and mushrooms.', { popular: true, customizations: [sizeGroup] }),
          dish('r4-i3', 'Chicken Dominator', 449, '🍕', 'Loaded with chicken, pepperoni and sausage.', { veg: false, popular: true, spice: true })
        ]},
        { category: 'Pastas & Sides', items: [
          dish('r4-i4', 'Alfredo Pasta', 289, '🍝', 'Creamy white sauce pasta with parmesan.', { spice: true }),
          dish('r4-i5', 'Garlic Breadsticks', 149, '🥖', 'Warm breadsticks with garlic butter and herbs.'),
          dish('r4-i6', 'Chicken Wings (6 pcs)', 299, '🍗', 'Spicy baked wings with dipping sauce.', { veg: false, spice: true })
        ]},
        { category: 'Desserts & Drinks', items: [
          dish('r4-i7', 'Choco Lava Cake', 159, '🍫', 'Molten chocolate cake, served warm.'),
          dish('r4-i8', 'Pepsi (500 ml)', 60, '🥤', 'Chilled soft drink.'),
          dish('r4-i9', 'Tiramisu', 189, '🍰', 'Coffee-soaked layers with mascarpone cream.')
        ]}
      ]
    },
    {
      id: 'r5', name: 'KFC', cuisines: ['Chicken', 'Fast Food', 'American'],
      rating: 4.4, ratingCount: '15.2K', deliveryTime: '20–30 min', distance: '2.9 km',
      costForTwo: '₹550 for two', emoji: '🍗', colors: ['#ffe0dc', '#c62828'],
      offer: '20% OFF on orders above ₹399', offerCode: 'KFC20', promoted: false, pureVeg: false,
      address: 'MG Road, Bengaluru', timings: '10:30 am – 11:00 pm',
      menu: [
        { category: 'Buckets & Combos', items: [
          dish('r5-i1', 'Chicken Bucket (5 pcs)', 549, '🍗', 'Five pieces of signature crispy fried chicken.', { veg: false, popular: true, spice: true }),
          dish('r5-i2', 'Veg Zinger Burger', 219, '🍔', 'Crispy veg patty with lettuce and mayo.', { popular: true }),
          dish('r5-i3', 'Chicken Zinger Burger', 249, '🍔', 'Spicy crispy chicken fillet with lettuce and mayo.', { veg: false, popular: true, spice: true })
        ]},
        { category: 'Snacks', items: [
          dish('r5-i4', 'Popcorn Chicken', 189, '🍿', 'Bite-sized crispy chicken pieces.', { veg: false, spice: true }),
          dish('r5-i5', 'French Fries (Regular)', 99, '🍟', 'Salted, crispy fries.'),
          dish('r5-i6', 'Chicken Wrap', 199, '🌯', 'Grilled chicken, lettuce and wraps in a soft tortilla.', { veg: false, spice: true })
        ]},
        { category: 'Beverages', items: [
          dish('r5-i7', 'Chilled Coke', 60, '🥤', '500 ml chilled cola.'),
          dish('r5-i8', 'Iced Tea', 99, '🧋', 'Refreshing peach iced tea.'),
          dish('r5-i9', 'Sundae', 129, '🍨', 'Ice cream sundae with chocolate sauce.')
        ]}
      ]
    },
    {
      id: 'r6', name: 'Cafe Coffee Day', cuisines: ['Cafe', 'Beverages', 'Desserts'],
      rating: 4.1, ratingCount: '7.3K', deliveryTime: '15–25 min', distance: '1.2 km',
      costForTwo: '₹450 for two', emoji: '☕', colors: ['#e8d5c4', '#795548'],
      offer: 'Free delivery on ₹199+', offerCode: 'CCD-FREE', promoted: false, pureVeg: true,
      address: 'Residency Road, Bengaluru', timings: '9:00 am – 11:00 pm',
      menu: [
        { category: 'Coffee', items: [
          dish('r6-i1', 'Café Latte', 159, '☕', 'Espresso with steamed milk and a light layer of foam.', { popular: true }),
          dish('r6-i2', 'Iced Mocha', 179, '🧋', 'Chocolate and espresso over ice.', { popular: true }),
          dish('r6-i3', 'Flat White', 169, '☕', 'Double espresso with silky microfoam.')
        ]},
        { category: 'Bites', items: [
          dish('r6-i4', 'Grilled Cheese Sandwich', 189, '🥪', 'Toasted sandwich with gooey cheese and herbs.', { popular: true }),
          dish('r6-i5', 'Veg Sandwich', 169, '🥪', 'Fresh vegetables, cheese and chutney.'),
          dish('r6-i6', 'Chocolate Chip Cookie', 89, '🍪', 'Warm, chewy cookie with chocolate chips.')
        ]},
        { category: 'Desserts', items: [
          dish('r6-i7', 'Chocolate Brownie', 139, '🍫', 'Rich, fudgy chocolate brownie.'),
          dish('r6-i8', 'Blueberry Cheesecake', 199, '🍰', 'Creamy cheesecake with blueberry topping.'),
          dish('r6-i9', 'Vanilla Ice Cream', 99, '🍦', 'Classic vanilla scoop.')
        ]}
      ]
    },
    {
      id: 'r7', name: 'The Biryani Life', cuisines: ['Biryani', 'Mughlai', 'Kebabs'],
      rating: 4.3, ratingCount: '5.8K', deliveryTime: '30–40 min', distance: '5.6 km',
      costForTwo: '₹650 for two', emoji: '🍚', colors: ['#e6d7ff', '#7e57c2'],
      offer: '₹100 OFF above ₹399', offerCode: 'BIRYANI100', promoted: true, pureVeg: false,
      address: 'HSR Layout, Sector 2, Bengaluru', timings: '11:00 am – 11:30 pm',
      menu: [
        { category: 'Biryanis', items: [
          dish('r7-i1', 'Chicken Dum Biryani', 319, '🍛', 'Slow-cooked dum biryani with tender chicken.', { veg: false, popular: true, spice: true }),
          dish('r7-i2', 'Mutton Biryani', 389, '🍚', 'Aromatic basmati with succulent mutton pieces.', { veg: false, popular: true, spice: true }),
          dish('r7-i3', 'Paneer Tikka Biryani', 299, '🍚', 'Smoky paneer tikka layered with fragrant rice.', { spice: true })
        ]},
        { category: 'Kebabs', items: [
          dish('r7-i4', 'Chicken Tikka (4 pcs)', 249, '🍢', 'Char-grilled chicken tikka with mint chutney.', { veg: false, spice: true }),
          dish('r7-i5', 'Paneer Tikka (4 pcs)', 229, '🧀', 'Tandoor-roasted paneer with peppers and onions.', { spice: true }),
          dish('r7-i6', 'Seekh Kebab (4 pcs)', 269, '🍢', 'Spicy minced meat skewers.', { veg: false, spice: true })
        ]},
        { category: 'Sides', items: [
          dish('r7-i7', 'Mirchi Ka Salan', 79, '🌶️', 'Spicy peanut and chilli gravy.'),
          dish('r7-i8', 'Cucumber Raita', 69, '🥒', 'Cool curd with cucumber.'),
          dish('r7-i9', 'Kheer', 109, '🥛', 'Creamy rice pudding with nuts.')
        ]}
      ]
    },
    {
      id: 'r8', name: 'Freeze Bell', cuisines: ['Ice Cream', 'Desserts', 'Bakery'],
      rating: 4.5, ratingCount: '4.1K', deliveryTime: '15–25 min', distance: '1.5 km',
      costForTwo: '₹350 for two', emoji: '🍦', colors: ['#ffe0ec', '#ec407a'],
      offer: '30% OFF on all sundaes', offerCode: 'FREEZE30', promoted: false, pureVeg: true,
      address: 'Church Street, Bengaluru', timings: '11:00 am – 12:00 am',
      menu: [
        { category: 'Sundaes', items: [
          dish('r8-i1', 'Death by Chocolate', 219, '🍨', 'Chocolate ice cream, brownie chunks and hot fudge.', { popular: true }),
          dish('r8-i2', 'Strawberry Delight', 199, '🍓', 'Strawberry ice cream with fresh fruit and syrup.', { popular: true }),
          dish('r8-i3', 'Oreo Sundae', 209, '🍪', 'Vanilla ice cream loaded with crushed Oreos.')
        ]},
        { category: 'Scoops', items: [
          dish('r8-i4', 'Vanilla Scoop', 79, '🍦', 'Classic creamy vanilla.'),
          dish('r8-i5', 'Chocolate Scoop', 79, '🍫', 'Rich dark chocolate.'),
          dish('r8-i6', 'Mango Scoop', 89, '🥭', 'Seasonal Alphonso mango.')
        ]},
        { category: 'Bakery', items: [
          dish('r8-i7', 'Choco Lava Cake', 149, '🍰', 'Warm cake with a molten chocolate centre.', { popular: true }),
          dish('r8-i8', 'Red Velvet Pastry', 139, '🧁', 'Soft red velvet with cream cheese frosting.'),
          dish('r8-i9', 'Cookie Platter', 179, '🍪', 'Assorted freshly baked cookies.')
        ]}
      ]
    },
    {
      id: 'r9', name: 'Green Bowl', cuisines: ['Healthy Food', 'Salads', 'North Indian'],
      rating: 4.4, ratingCount: '3.2K', deliveryTime: '25–35 min', distance: '3.7 km',
      costForTwo: '₹500 for two', emoji: '🥗', colors: ['#dcedc8', '#689f38'],
      offer: 'Free dessert on ₹299+', offerCode: 'GREENFREE', promoted: false, pureVeg: true,
      address: 'Indiranagar 2nd Stage, Bengaluru', timings: '8:00 am – 10:00 pm',
      menu: [
        { category: 'Power Bowls', items: [
          dish('r9-i1', 'Quinoa Veggie Bowl', 269, '🥗', 'Quinoa, roasted veggies, chickpeas and hummus.', { popular: true }),
          dish('r9-i2', 'Paneer Protein Bowl', 299, '🧀', 'Grilled paneer, brown rice and fresh greens.', { popular: true }),
          dish('r9-i3', 'Buddha Bowl', 279, '🥙', 'Brown rice, tofu, avocado and tahini dressing.')
        ]},
        { category: 'Wraps & Sandwiches', items: [
          dish('r9-i4', 'Grilled Veg Wrap', 199, '🌯', 'Whole wheat wrap with spiced vegetables.', { spice: true }),
          dish('r9-i5', 'Avocado Toast', 209, '🥑', 'Sourdough toast with smashed avocado and seeds.'),
          dish('r9-i6', 'Cheese Veg Sandwich', 179, '🥪', 'Multigrain bread with cheese and fresh veggies.')
        ]},
        { category: 'Drinks', items: [
          dish('r9-i7', 'Green Smoothie', 189, '🥤', 'Spinach, banana, apple and chia.'),
          dish('r9-i8', 'Cold Pressed Juice', 159, '🧃', 'Fresh orange and carrot juice.'),
          dish('r9-i9', 'Herbal Tea', 99, '🍵', 'Caffeine-free calming herbal blend.')
        ]}
      ]
    },
    {
      id: 'r10', name: "Singh's Dhaba", cuisines: ['North Indian', 'Punjabi', 'Thali'],
      rating: 4.2, ratingCount: '11.7K', deliveryTime: '35–45 min', distance: '6.2 km',
      costForTwo: '₹550 for two', emoji: '🍲', colors: ['#ffecb3', '#ef6c00'],
      offer: '15% OFF on all orders', offerCode: 'DHABA15', promoted: false, pureVeg: false,
      address: 'Tumkur Road, Bengaluru', timings: '10:00 am – 11:00 pm',
      menu: [
        { category: 'Main Course', items: [
          dish('r10-i1', 'Butter Chicken', 329, '🍛', 'Tandoori chicken in a rich tomato and butter gravy.', { veg: false, popular: true, spice: true }),
          dish('r10-i2', 'Paneer Butter Masala', 289, '🧀', 'Paneer cubes in a creamy, tangy gravy.', { popular: true, spice: true }),
          dish('r10-i3', 'Dal Makhani', 219, '🍲', 'Black lentils simmered overnight with cream and butter.', { spice: true })
        ]},
        { category: 'Breads & Rice', items: [
          dish('r10-i4', 'Butter Naan (2 pcs)', 99, '🫓', 'Soft tandoor-baked naan brushed with butter.'),
          dish('r10-i5', 'Jeera Rice', 159, '🍚', 'Basmati rice tempered with cumin.'),
          dish('r10-i6', 'Tandoori Roti (2 pcs)', 69, '🫓', 'Whole wheat roti baked in a tandoor.')
        ]},
        { category: 'Thalis', items: [
          dish('r10-i7', 'Veg Thali', 249, '🍱', 'Dal, two curries, rice, breads, salad and sweet.', { popular: true }),
          dish('r10-i8', 'Non-Veg Thali', 329, '🍱', 'Chicken curry, dal, rice, breads and dessert.', { veg: false }),
          dish('r10-i9', 'Chicken Tikka', 259, '🍢', 'Smoky tandoor-grilled chicken tikka.', { veg: false, spice: true })
        ]}
      ]
    }
  ];

  const reviewPool = [
    { name: 'Ananya R.', rating: 5, time: '2 days ago', text: 'Absolutely loved it! Food arrived hot and packed really well. Will order again.', initials: 'AR', color: '#f48fb1' },
    { name: 'Vikram S.', rating: 4, time: '1 week ago', text: 'Great taste and generous portions. Delivery was a little late but worth the wait.', initials: 'VS', color: '#90caf9' },
    { name: 'Priya M.', rating: 5, time: '2 weeks ago', text: 'Consistently good quality. The packaging was neat and the food was fresh.', initials: 'PM', color: '#a5d6a7' },
    { name: 'Rahul K.', rating: 4, time: '3 weeks ago', text: 'Good value for money. Would recommend trying their signature dishes.', initials: 'RK', color: '#ffcc80' },
    { name: 'Sneha D.', rating: 5, time: '1 month ago', text: 'My go-to place for weekend orders. Never been disappointed!', initials: 'SD', color: '#ce93d8' }
  ];

  restaurants.forEach(function (restaurant, index) {
    restaurant.reviews = [
      reviewPool[index % reviewPool.length],
      reviewPool[(index + 2) % reviewPool.length]
    ];
  });

  window.APP_DATA = {
    cuisines: [
      { name: 'Biryani', emoji: '🍛', color: '#ffe0d2' },
      { name: 'Pizza', emoji: '🍕', color: '#ffd9d9' },
      { name: 'Burger', emoji: '🍔', color: '#ffe6c7' },
      { name: 'South Indian', emoji: '🥞', color: '#fff1c2' },
      { name: 'North Indian', emoji: '🍲', color: '#ffe2c2' },
      { name: 'Chicken', emoji: '🍗', color: '#fbdcd8' },
      { name: 'Cake', emoji: '🍰', color: '#f8dcec' },
      { name: 'Healthy', emoji: '🥗', color: '#dff0d0' },
      { name: 'Coffee', emoji: '☕', color: '#e8d9c8' },
      { name: 'Ice Cream', emoji: '🍦', color: '#fbdce8' }
    ],
    banners: [
      { title: 'Flat 50% OFF', subtitle: 'On your first order · Use code WELCOME50', emoji: '🎉', colors: ['#fc8019', '#ff6b4a'] },
      { title: 'Free Delivery', subtitle: 'On orders above ₹199 from select restaurants', emoji: '🛵', colors: ['#3949ab', '#5c6bc0'] },
      { title: 'Late Night Cravings?', subtitle: 'Order till 12 AM · 100+ restaurants open', emoji: '🌙', colors: ['#6a1b9a', '#8e24aa'] }
    ],
    restaurants: restaurants,
    addresses: [
      { id: 'a1', label: 'Home', line: '12, 5th Cross, Indiranagar', city: 'Bengaluru', pin: '560038' },
      { id: 'a2', label: 'Work', line: '3rd Floor, MG Road', city: 'Bengaluru', pin: '560001' }
    ],
    coupons: [
      { code: 'WELCOME50', type: 'percent', value: 50, max: 100, min: 199, label: '50% OFF up to ₹100' },
      { code: 'FREEDEL', type: 'delivery', value: 0, max: 0, min: 0, label: 'Free delivery' },
      { code: 'SAVE100', type: 'flat', value: 100, max: 100, min: 499, label: '₹100 OFF above ₹499' }
    ],
    orderStatuses: ['Order placed', 'Restaurant confirmed', 'Preparing your food', 'Out for delivery', 'Delivered'],
    deliveryPartners: [
      { name: 'Ravi Kumar', rating: 4.8, vehicle: 'KA-03-MN-4821' },
      { name: 'Imran Shaikh', rating: 4.9, vehicle: 'KA-01-HJ-7734' },
      { name: 'Deepa N.', rating: 4.7, vehicle: 'KA-05-QP-1129' }
    ]
  };
})();
