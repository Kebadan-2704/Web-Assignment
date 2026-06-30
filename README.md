# LUXE - Premium E-Commerce Platform

A production-ready, premium e-commerce platform built from scratch using **exclusively HTML5, CSS3, and Vanilla JavaScript (ES6+)**. No frameworks, no libraries, no CSS utilities.

## ✨ Features

- **Custom SPA Router:** Lightning-fast page transitions using the History API without full page reloads.
- **Premium Design System:** Hybrid Glassmorphism + Skeuomorphism design with a fully handwritten CSS framework.
- **Dynamic Theming:** Built-in Dark and Light mode with system preference detection (`prefers-color-scheme`).
- **State Management:** Reactive local state management for Cart, Wishlist, Compare, and User sessions using `localStorage` and custom EventEmitters.
- **E-Commerce Functionality:** 
  - Complex product filtering and instant search.
  - Multi-step checkout flow with form validation.
  - Cart with tax, shipping estimations, and coupon codes.
  - User accounts and order tracking.
- **Performance Optimized:** Zero dependencies, inline SVG icons, CSS-based placeholder images, and lazy-evaluated components. Lighthouse target: 100/100.
- **25+ Custom Pages:** Everything from shop catalogs to legal pages and dynamic 404s.

## 🚀 Setup & Usage

Because the application uses modern JavaScript ES6 modules (`type="module"`) and the History API, **it must be run through a local web server**. Opening `index.html` directly in the browser (`file://`) will result in CORS errors.

### Option 1: Node.js (npx)
If you have Node.js installed, simply run this in the project root:
```bash
npx serve .
```

### Option 2: VS Code Live Server
1. Open the project folder in VS Code.
2. Install the "Live Server" extension by Ritwick Dey.
3. Right-click on `index.html` and select **"Open with Live Server"**.

### Option 3: Python
If you have Python installed, run this in the project root:
```bash
# Python 3
python -m http.server 8000
```
Then navigate to `http://localhost:8000` in your browser.

## 🔑 Demo Credentials

To test out the account dashboard, order history, and authenticated checkout flow, use the following mock user credentials on the `/login` page:

- **Email:** `demo@luxe.com`
- **Password:** `Demo@123`

## 📁 Project Structure

```
├── index.html                    # Main SPA shell
├── README.md                     # Documentation
├── css/
│   ├── variables.css             # Design tokens & colors
│   ├── reset.css                 # Modern CSS reset
│   ├── typography.css            # Fluid type scale
│   ├── themes.css                # Dark/light mode
│   ├── layout.css                # Grid & containers
│   ├── animations.css            # Micro-interactions
│   ├── components.css            # Buttons, cards, modals
│   ├── utilities.css             # Helper classes
│   └── responsive.css            # Media queries
├── js/
│   ├── app.js                    # Application bootstrap
│   ├── router.js                 # SPA routing engine
│   ├── state managers...         # cart, auth, wishlist, etc.
│   └── utilities...              # utils, helpers, config, validation
├── data/
│   ├── products.json             # Mock product database
│   ├── categories.json           # Mock categories
│   ├── banners.json              # Mock hero slides
│   └── users.json                # Mock user accounts
└── pages/
    ├── home.js                   # Home page renderer
    ├── shop.js                   # Shop/catalog renderer
    ├── product.js                # Product detail renderer
    ├── cart.js                   # Cart renderer
    ├── checkout.js               # Checkout flow renderer
    ├── auth.js                   # Login/register renderers
    └── secondary.js              # 15+ secondary page renderers (blog, FAQ, etc.)
```

## 🛠️ Technology Stack

- **HTML5:** Semantic markup, ARIA labels, fully accessible structure.
- **CSS3:** Custom properties (variables), Grid, Flexbox, `clamp()` fluid sizing, `backdrop-filter`, container queries, and native keyframe animations.
- **JavaScript (ES6+):** ES Modules, Classes, Arrow Functions, Fetch API, History API, IntersectionObserver, and `localStorage`.

## 📈 Browser Support

- Chrome (Latest)
- Safari (Latest)
- Firefox (Latest)
- Edge (Latest)
- Mobile Safari / Chrome for Android

## 📝 License

This project was built as a demonstration of advanced vanilla web development architecture.
