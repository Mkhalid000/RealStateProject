import {Routes, Route, Outlet, useLocation} from 'react-router-dom';
import {lazy, Suspense, useCallback, useEffect, useState} from 'react';

// Public website
import {Navbar} from './site/components/Navbar';
import {Footer} from './site/components/Footer';
import {AuroraBackground} from './site/components/AuroraBackground';
import {SmoothScroll} from './site/components/SmoothScroll';
import {CursorGlow} from './site/components/CursorGlow';
import {ScrollProgress} from './site/components/ScrollProgress';
import {Loader} from './site/components/Loader';
import {PageTransition} from './site/components/PageTransition';
import {PostPropertyBanner} from './site/components/PostPropertyBanner';
import {CookieNotice} from './site/components/CookieNotice';
import {MapFab} from './site/components/MapFab';
import {AdFloating, AdModal} from './site/components/AdInterrupt';
import Home from './site/pages/Home';
import Properties from './site/pages/Properties';
import PropertyDetail from './site/pages/PropertyDetail';
import PostProperty from './site/pages/PostProperty';
import ReelsFeed from './site/pages/Reels';
import About from './site/pages/About';
import Contact from './site/pages/Contact';
import Blog from './site/pages/Blog';
import BlogPost from './site/pages/BlogPost';
import Privacy from './site/pages/Privacy';

// Google Maps + its React bindings are heavy — keep them out of the main bundle.
const MapExplore = lazy(() => import('./site/pages/MapExplore'));

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
import Ads from './dashboard/ads/Ads';
import AdminBlog from './dashboard/blog/Blog';
import BlogForm from './dashboard/blog/BlogForm';
import BlogCategories from './dashboard/blog/BlogCategories';
import BlogComments from './dashboard/blog/BlogComments';
import AdForm from './dashboard/ads/AdForm';

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
  // The bottom-right corner holds one widget at a time: the post-property
  // advert has first claim, and the map button takes over once it's gone.
  const [cornerTaken, setCornerTaken] = useState(true);
  const claimCorner = useCallback(taken => setCornerTaken(taken), []);

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
      <PostPropertyBanner onOccupyChange={claimCorner} />
      {!cornerTaken && <MapFab />}
      {/* interrupting ad placements — they decide for themselves when to appear */}
      <AdFloating />
      <AdModal />
      <CookieNotice />
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
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/privacy" element={<Privacy />} />
        </Route>

        {/* Immersive public reels feed (its own full-screen chrome) */}
        <Route path="/reels" element={<ReelsFeed />} />
        <Route path="/reels/:id" element={<ReelsFeed />} />

        {/* Full-screen map explorer (own chrome, like the reels feed) */}
        <Route
          path="/map"
          element={
            <Suspense fallback={<div className="fixed inset-0 bg-bg" />}>
              <MapExplore />
            </Suspense>
          }
        />

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
          <Route path="ads" element={<Ads />} />
          <Route path="ads/new" element={<AdForm />} />
          <Route path="ads/:id/edit" element={<AdForm />} />
          <Route path="blog" element={<AdminBlog />} />
          <Route path="blog/new" element={<BlogForm />} />
          <Route path="blog/categories" element={<BlogCategories />} />
          <Route path="blog/comments" element={<BlogComments />} />
          <Route path="blog/:id/edit" element={<BlogForm />} />
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
