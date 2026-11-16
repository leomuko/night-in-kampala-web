import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { LoadingState, ErrorState } from '../components/UI.jsx';
import { HelpPage, LookbookPage, LookbooksPage, SitePage } from '../features/editorial/SitePages.jsx';
import { EventPage, EventsPage } from '../features/editorial/EventPages.jsx';
import { DropPage, DropsPage } from '../features/editorial/DropPages.jsx';
import ArchivePage from '../features/catalogue/ArchivePage.jsx';
import ProductPage from '../features/catalogue/ProductPage.jsx';
import ShopPage from '../features/catalogue/ShopPage.jsx';
import HomePage from '../features/home/HomePage.jsx';
import PlaceholderPage from './PlaceholderPage.jsx';
import NotFoundPage from './NotFoundPage.jsx';
import { createRouteHeadManager } from './routeHead.js';
const AdminShell = lazy(() => import('../features/admin/AdminShell.jsx'));
const ComponentPage = import.meta.env.DEV ? lazy(() => import('./ComponentPage.jsx')) : null;

function Layout() {
  const location = useLocation();
  const [routeHead] = useState(() => createRouteHeadManager(document));
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (location.pathname !== '/') document.getElementById('main-content')?.focus({ preventScroll: true });
    const section = location.pathname.split('/')[1];
    const names = { shop: 'Shop', archive: 'Sold archive', collections: 'Drops', about: 'Our process', contact: 'Contact', help: 'Help', lookbooks: 'Lookbook', events: 'Events', cart: 'Your bag', admin: 'Staff access' };
    routeHead.apply(location.pathname, `${names[section] || 'Reworked in Kampala'} — Night in Kampala`);
  }, [location.pathname, routeHead]);
  const serverStatus = routeHead.statusFor(location.pathname);
  const page = serverStatus === 404 ? <NotFoundPage /> : serverStatus === 503 ? <div className="container page-section"><ErrorState>This page is temporarily unavailable. Please refresh to try again.</ErrorState></div> : <Outlet context={routeHead} />;
  const admin = /^\/admin(?:\/|$)/.test(location.pathname);
  return <><a className="skip-link" href="#main-content">Skip to content</a>{!admin && <Header />}<main id="main-content" tabIndex="-1"><Suspense fallback={<div className="container page-section"><LoadingState /></div>}>{page}</Suspense></main>{!admin && <Footer />}</>;
}

export default function App() {
  return <Routes><Route element={<Layout />}>
    <Route index element={<HomePage />} />
    <Route path="shop" element={<ShopPage />} />
    <Route path="collections" element={<DropsPage />} />
    <Route path="collections/:slug" element={<DropPage />} />
    <Route path="archive" element={<ArchivePage />} />
    <Route path="events" element={<EventsPage />} />
    <Route path="events/:slug" element={<EventPage />} />
    <Route path="about" element={<SitePage slug="our-process" heading="Our process" />} />
    <Route path="contact" element={<SitePage slug="contact" heading="Contact" />} />
    <Route path="help/:slug" element={<HelpPage />} />
    <Route path="lookbooks" element={<LookbooksPage />} />
    <Route path="lookbooks/:slug" element={<LookbookPage />} />
    {['cart', 'checkout'].map(page => <Route key={page} path={page} element={<PlaceholderPage page={page} />} />)}
    <Route path="products/:slug" element={<ProductPage />} />
    <Route path="orders/:id" element={<PlaceholderPage page="orders" />} />
    <Route path="admin/*" element={<AdminShell />} />
    {ComponentPage && <Route path="components" element={<ComponentPage />} />}
    <Route path="*" element={<NotFoundPage />} />
  </Route></Routes>;
}
