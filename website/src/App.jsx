import {Routes, Route, Outlet, useLocation} from 'react-router-dom';
import {useEffect} from 'react';

// Public website
import {Navbar} from './site/components/Navbar';
import {Footer} from './site/components/Footer';
import {AuroraBackground} from './site/components/AuroraBackground';
import {SmoothScroll} from './site/components/SmoothScroll';
import {CursorGlow} from './site/components/CursorGlow';
import {ScrollProgress} from './site/components/ScrollProgress';
import {Loader} from './site/components/Loader';
import {PageTransition} from './site/components/PageTransition';
import Home from './site/pages/Home';
import Properties from './site/pages/Properties';
import PropertyDetail from './site/pages/PropertyDetail';
import PostProperty from './site/pages/PostProperty';
import ReelsFeed from './site/pages/Reels';
import About from './site/pages/About';
import Contact from './site/pages/Contact';

// Dashboard (admin)
import {ProtectedRoute} from './dashboard/components/ProtectedRoute';
import Login from './dashboard/auth/Login';
import AdminLayout from './dashboard/layout/AdminLayout';
import Overview from './dashboard/overview/Overview';
import Users from './dashboard/users/Users';
import ManageProperties from './dashboard/properties/ManageProperties';
import PropertyForm from './dashboard/properties/PropertyForm';
import PropertyDetails from './dashboard/properties/PropertyDetails';
import Reels from './dashboard/reels/Reels';
import Boosts from './dashboard/boosts/Boosts';
import Leads from './dashboard/leads/Leads';

// Agent portal
import AgentLayout from './agent/pages/AgentLayout';
import AgentOverview from './agent/pages/AgentOverview';
import AgentProperties from './agent/pages/AgentProperties';
import AgentReels from './agent/pages/AgentReels';
import ReelForm from './agent/pages/ReelForm';

// User account (buyers who post their own listings)
import AccountLayout from './account/pages/AccountLayout';
import AccountProperties from './account/pages/AccountProperties';

function ScrollToTop() {
  const {pathname} = useLocation();
  useEffect(() => {
    if (window.__lenis) window.__lenis.scrollTo(0, {immediate: true});
    else window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/** Persistent public layout — mounts smooth scroll, cursor, loader once. */
function PublicLayout() {
  return (
    <>
      <Loader />
      <SmoothScroll />
      <CursorGlow />
      <ScrollProgress />
      <PageTransition />
      <AuroraBackground />
      <Navbar />
      <main className="relative z-10">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public website */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/properties/:id/:slug?" element={<PropertyDetail />} />
          <Route path="/post-property" element={<PostProperty />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        {/* Immersive public reels feed (its own full-screen chrome) */}
        <Route path="/reels" element={<ReelsFeed />} />
        <Route path="/reels/:id" element={<ReelsFeed />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminLayout />
            </ProtectedRoute>
          }>
          <Route index element={<Overview />} />
          <Route path="users" element={<Users />} />
          <Route path="properties" element={<ManageProperties />} />
          <Route path="properties/new" element={<PropertyForm />} />
          <Route path="properties/:id" element={<PropertyDetails />} />
          <Route path="properties/:id/edit" element={<PropertyForm />} />
          <Route path="reels" element={<Reels />} />
          <Route path="reels/new" element={<ReelForm />} />
          <Route path="boosts" element={<Boosts />} />
          <Route path="leads/:source" element={<Leads />} />
        </Route>

        {/* Agent */}
        <Route
          path="/agent"
          element={
            <ProtectedRoute role="agent">
              <AgentLayout />
            </ProtectedRoute>
          }>
          <Route index element={<AgentOverview />} />
          <Route path="properties" element={<AgentProperties />} />
          <Route path="properties/new" element={<PropertyForm />} />
          <Route path="properties/:id/edit" element={<PropertyForm />} />
          <Route path="reels" element={<AgentReels />} />
          <Route path="reels/new" element={<ReelForm />} />
        </Route>

        {/* User account — any signed-in user can post & manage their own listings */}
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <AccountLayout />
            </ProtectedRoute>
          }>
          <Route index element={<AccountProperties />} />
          <Route path="properties" element={<AccountProperties />} />
          <Route path="properties/new" element={<PropertyForm />} />
          <Route path="properties/:id/edit" element={<PropertyForm />} />
        </Route>
      </Routes>
    </>
  );
}
