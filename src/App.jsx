import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import Layout           from './components/layout/Layout.jsx'
import Home             from './pages/Home.jsx'
import About            from './pages/About.jsx'
import Team             from './pages/Team.jsx'
import Events           from './pages/Events.jsx'
import Gallery          from './pages/Gallery.jsx'
import Sponsors         from './pages/Sponsors.jsx'
import Startups         from './pages/Startups.jsx'
import Blogs            from './pages/Blogs.jsx'
import BlogPost         from './pages/BlogPost.jsx'
import Contact          from './pages/Contact.jsx'
import PrivacyPolicy    from './pages/PrivacyPolicy.jsx'
import NotFound         from './pages/NotFound.jsx'

// Hidden / unlisted routes - NOT referenced in any <nav> or <Link> elsewhere.
// The only entry point to RegistrationHub is the "Register Now" button in EFestHero.
// StatusLookup is linked only from the ConfirmationStep inside the modal.
// AdminDashboard is only shared internally with the admin team.
import RegistrationHub  from './pages/RegistrationHub.jsx'
import StatusLookup     from './pages/StatusLookup.jsx'
import AdminDashboard   from './pages/AdminDashboard.jsx'

// The hidden hub slug comes from a Vite env var so it's not visible
// in a plain grep of the source. See .env.example for setup instructions.
const FEST_SLUG = import.meta.env.VITE_FEST_SLUG || 'e-fest-26'

export default function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

  return (
    <HelmetProvider>
      <BrowserRouter basename={basename === '/' ? '' : basename}>
        <Routes>
          {/* ── Public routes rendered inside the site Layout ── */}
          <Route path="/" element={<Layout />}>
            <Route index                    element={<Home />} />
            <Route path="about"             element={<About />} />
            <Route path="team"              element={<Team />} />
            <Route path="events"            element={<Events />} />
            <Route path="gallery"           element={<Gallery />} />
            <Route path="sponsors"          element={<Sponsors />} />
            <Route path="startups"          element={<Startups />} />
            <Route path="blogs"             element={<Blogs />} />
            <Route path="blogs/:slug"       element={<BlogPost />} />
            <Route path="contact"           element={<Contact />} />
            <Route path="privacy-policy"    element={<PrivacyPolicy />} />
            <Route path="privacy"           element={<Navigate to="/privacy-policy" replace />} />

            {/* ── Hidden / unlisted routes (inside Layout for consistent chrome) ── */}
            {/* Registration hub: only reachable via the "Register Now" button     */}
            <Route path={`fest/${FEST_SLUG}`} element={<RegistrationHub />} />

            {/* Status lookup: only reachable via Team ID from confirmation screen */}
            <Route path="status"            element={<StatusLookup />} />

            {/* Admin dashboard: shared internally only, protected by auth         */}
            <Route path="admin"             element={<AdminDashboard />} />
            <Route path="admin/*"           element={<AdminDashboard />} />
            <Route path="dashboard"         element={<Navigate to="/admin" replace />} />

            <Route path="*"                 element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  )
}
