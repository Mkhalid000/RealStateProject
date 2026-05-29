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
import About from './site/pages/About';
import Contact from './site/pages/Contact';

// Dashboard (admin)
import {ProtectedRoute} from './dashboard/components/ProtectedRoute';
import Login from './dashboard/pages/Login';
import AdminLayout from './dashboard/pages/AdminLayout';
import Overview from './dashboard/pages/Overview';
import Users from './dashboard/pages/Users';
import ManageProperties from './dashboard/pages/ManageProperties';
import PropertyForm from './dashboard/pages/PropertyForm';
import Reels from './dashboard/pages/Reels';
import Boosts from './dashboard/pages/Boosts';

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
          <Route path="/properties/:id" element={<PropertyDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        {/* Admin */}
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
          <Route index element={<Overview />} />
          <Route path="users" element={<Users />} />
          <Route path="properties" element={<ManageProperties />} />
          <Route path="properties/new" element={<PropertyForm />} />
          <Route path="properties/:id/edit" element={<PropertyForm />} />
          <Route path="reels" element={<Reels />} />
          <Route path="boosts" element={<Boosts />} />
        </Route>
      </Routes>
    </>
  );
}
