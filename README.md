# 🍽️ Foondo

**AI-Powered Personalized Restaurant Recommendation System**

Foondo is an AI-based restaurant recommendation system for travelers. Select a city and food, set your priorities, and get personalized restaurant recommendations powered by AI analysis of real reviews.

<!-- **🔗 Live Demo**: [Coming Soon] -->


<br/>

## 📋 Project Overview

AI-powered restaurant recommendation system that analyzes real reviews and provides personalized rankings based on user preferences.

**How it works:**
- 🔍 Restaurant search via **Google Places API**
- 🤖 Review analysis using **OpenAI**
- 📊 Personalized ranking with real-time streaming progress


<br/>

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🏙️ **City & Food Selection** | Choose destination and cuisine with AI-generated local recommendations |
| ⚖️ **Priority-Based Ranking** | Customize weights for taste, price, atmosphere, service, quantity, and accessibility |
| 🤖 **AI Analysis** | Automated review analysis and scoring using OpenAI |
| 📡 **Real-Time Updates** | Streaming API for live progress tracking |


<br/>

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Framework** | Next.js 15, React 19, TypeScript |
| **Styling** | Tailwind CSS 4, shadcn/ui |
| **Database** | PostgreSQL, Prisma |
| **State Management** | React Query |
| **APIs** | OpenAI, Google Places, Mapbox |
| **Tools** | Turbopack, pnpm |


<br/>

## 📁 Project Structure

```
src/
├── app/              # Next.js App Router
│   ├── api/          # API Routes
│   ├── api-client/   # Client-side API wrappers
│   ├── components/   # App components (layout, search, results)
│   ├── data/         # Constants and mocks
│   ├── hooks/        # Custom React hooks
│   └── types/        # TypeScript types
├── components/       # Shared UI (shadcn/ui)
├── lib/              # External integrations (server logic, API clients)
└── utils/            # Utility functions
```
