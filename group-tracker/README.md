# Minimalist Debt Tracker 💸

A blazing-fast, offline-first Progressive Web App (PWA) designed to track personal debts, loans, and shared expenses. Built with a focus on simplicity, speed, and a native iOS-like user experience.

🔗 **[Live Demo](https://nh4tkunlk123.github.io/debt-tracker/)**

## ✨ Features

- **Offline-First**: Works 100% offline. All data is securely stored locally on your device. No cloud sync, no accounts, complete privacy.
- **Progressive Web App (PWA)**: Installable on iOS and Android. Feels like a native app with gesture-based interactions (swipe-to-dismiss) and iOS safe-area notch support.
- **Context-Aware UI**: The transaction interface intelligently adapts its terminology (e.g., "Lent", "Borrowed", "Repaid") and colors based on the current context of your balance.
- **Dual Theme Support**: Beautifully crafted Light and Dark modes with automatic system-preference fallback.
- **Multi-language**: Fully localized in English and Vietnamese.
- **Zero Dependencies Clutter**: Built using vanilla CSS and native APIs to keep the bundle size extremely lightweight.

## 🛠 Tech Stack

- **Core**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: Vanilla CSS (CSS Variables, Flexbox)
- **Icons**: [Lucide React](https://lucide.dev/)
- **PWA Integration**: `vite-plugin-pwa`
- **Deployment**: GitHub Actions -> GitHub Pages

## 🚀 Getting Started

To run this project locally on your machine:

### 1. Clone the repository
```bash
git clone https://github.com/nh4tkunlk123/debt-tracker.git
cd debt-tracker
```

### 2. Install dependencies
```bash
npm install
# Note: Use `npm install --legacy-peer-deps` if you encounter PWA plugin peer conflicts.
```

### 3. Start the development server
```bash
npm run dev
```

### 4. Build for production
```bash
npm run build
```

## 💡 Motivation

This app was built to solve the common UX flaws in traditional ledger apps. Instead of forcing the user to think in abstract positive/negative numbers, the UI dynamically changes to reflect real-world financial relationships (e.g., automatically switching the button from "Lent" to "Repaid" based on who owes who).

## 📜 License

This project is open-source and available under the MIT License.
