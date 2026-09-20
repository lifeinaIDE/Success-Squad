# Success Squad React — Migration README

## Overview
Full 1:1 React 18 + Vite port of the Success Squad static site. All 7 pages share a single Navbar/Footer via a Layout route.

## Install & Run

`
cd success-squad-react
npm install
npm run dev
`

Dev server: http://localhost:5173/Success-Squad/

## Build for Production

`
npm run build
`

Output in dist/

## Deploy to GitHub Pages

1. Install: 
pm install --save-dev gh-pages
2. Add to package.json scripts:
   - "predeploy": "npm run build"
   - "deploy": "gh-pages -d dist"
3. vite.config.js already has: base: '/Success-Squad---EDC-/'
4. Add public/404.html for SPA routing — it redirects unknown URLs to index.html via query string so React Router can handle the path.
5. Run: 
pm run deploy

## Project Structure

src/
  main.jsx           — entry, imports style.css once
  App.jsx            — BrowserRouter + Routes
  styles/style.css   — global CSS (identical to original)
  components/layout/ — Navbar, Footer, Layout
  components/ui/     — FeaturedTeamCard, TeamCard, AlumniCard, PillarCard, EventCard, StartupCard, ValueItem
  components/gallery/ — GalleryCarousel, MemoriesSection
  pages/             — Home, About, Team, Events, Gallery, Startups, Contact, NotFound
  hooks/             — useScrolled, useCounter, useScrollReveal, useLightbox, useDocumentTitle
  data/              — navData, homeData, valuesData, teamData, eventsData, galleryData, startupsData
public/
  images/            — team photos
  Success Squad.jpg  — logo
