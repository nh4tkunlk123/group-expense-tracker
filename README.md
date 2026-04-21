# 💸 Group Expense Tracker

A professional, real-time group expense management system featuring a mobile-first web interface and a Discord integration bot. Built to keep track of shared expenses, personal loans, and debt settlements seamlessly.

---

## 🌟 Features

- **Mobile-First Web App (Frontend)**: A clean, SaaS-like interface built with React + Vite. Includes offline support (PWA) and real-time syncing.
- **Discord Bot (Backend/Notifier)**: A robust Discord bot that listens to slash commands (`/expense`, `/lend`, `/settle`, `/summary`) to record transactions instantly without leaving Discord.
- **Real-time Sync**: Powered by Supabase to ensure that any transaction recorded via the Web App or Discord is immediately reflected everywhere.
- **Granular Settlement**: Split expenses equally among a specific group of people, track 1-on-1 personal loans, and settle debts down to the last penny.
- **Professional Reporting**: Instant, comprehensive financial summaries right in your Discord server.

---

## 📂 Project Structure

This repository contains two separate applications that work together:

- **`/group-tracker`**: The React + Vite frontend Web Application.
- **`/discord-bot`**: The Node.js + Discord.js bot.

---

## 🚀 Deployment Guide

### 1. Web Application (`group-tracker`)
The frontend is a static React application that can be hosted on any static hosting provider.
- **Recommended**: [Vercel](https://vercel.com) or [Netlify](https://netlify.com)
- **Steps**:
  1. Import this repository into Vercel/Netlify.
  2. Set the Root Directory to `group-tracker`.
  3. Set the Build Command to `npm run build`.
  4. Add your Environment Variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_DISCORD_WEBHOOK_URL`).
  5. Deploy!

### 2. Discord Bot (`discord-bot`)
The bot needs a Node.js runtime that stays alive 24/7.
- **Recommended**: [Render](https://render.com), [Koyeb](https://koyeb.com), or [Discloud](https://discloudbot.com/).
- **Steps**:
  1. Create a new Web Service or Bot instance on your provider.
  2. Set the Root Directory to `discord-bot`.
  3. Set the Start Command to `node bot.js` (or `npm start`).
  4. Add your Environment Variables (`DISCORD_BOT_TOKEN`, `SUPABASE_URL`, `SUPABASE_KEY`).
  5. Deploy!

---

## 🛠️ Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, TypeScript
- **Backend/Bot**: Node.js, Discord.js
- **Database**: Supabase (PostgreSQL)

*Built for transparency, simplicity, and zero arguments over who owes what.*
