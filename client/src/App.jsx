import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { Instagram, Linkedin, Mail, MapPin, Menu, Phone, X } from "lucide-react";
import api, { getErrorMessage } from "./api";
import { getDashboardPath, useAuth } from "@/AuthContext";
import GoogleAuthButton from "./components/GoogleAuthButton";
import HeroSection from "./components/HeroSection";
import SiteHeader from "./components/SiteHeader";
import ActivityList from "./public/ActivityList";
import ActivityDetail from "./public/ActivityDetail";
import { featuredCategories } from "./public/activityImages";
import KabarAksi from "./public/KabarAksi";
import OrganizationDirectory from "./public/OrganizationDirectory";
import OrganizationProfile from "./public/OrganizationProfile";
import { AdminLayout } from "./AdminDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminActivityList from "./pages/admin/AdminActivityList";
import AdminVolunteerDatabase from "./pages/admin/AdminVolunteerDatabase";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminOrganizations from "./AdminOrganizations";
import AdminSystem from "./AdminSystem";
import VolunteerLayout from "./volunteer/VolunteerLayout";
import VolunteerDashboard from "./volunteer/VolunteerDashboard";
import RegistrationHistory from "./volunteer/RegistrationHistory";
import VolunteerProfile from "./volunteer/VolunteerProfile";
import VolunteerFeed from "./volunteer/VolunteerFeed";
import OrganizationLayout from "./organization/OrganizationLayout";
import OrganizationDashboard from "./organization/OrganizationDashboard";
import ActivityParticipants from "./organization/ActivityParticipants";
import VolunteerVerification from "./organization/VolunteerVerification";
import OrganizationImpactReport from "./organization/OrganizationImpactReport";

const volunteerInterests = ["Lingkungan & Konservasi", "Pendidikan & Literasi", "Medis & PKS", "Tanggap Bencana", "Logistik", "Dokumen & Media"];
const organizationFocusCategories = ["Lingkungan & Konservasi", "Pendidikan & Literasi", "Kesehatan & Medis", "Tanggap Bencana", "Pemberdayaan Masyarakat", "Sosial & Kemanusiaan", "Lainnya"];
const organizationDocumentTypes = [
  { key: "skDocument", title: "SK Kemenkumham", detail: "Surat keputusan pengesahan atau akta notaris", icon: "▤" },
  { key: "taxDocument", title: "NPWP Lembaga", detail: "Kartu atau surat keterangan NPWP lembaga", icon: "▣" }
];
const organizationRegistrationDraftKey = "koordinaksi_organization_verification_draft";
const formatDate = (date) => new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(date));

function Header() {
  return <SiteHeader />;
}

function Footer() {
  const { user } = useAuth();
  return <footer className="footer">
    <div className="container footer-main">
      <section className="footer-about">
        <Link className="brand" to={user ? getDashboardPath(user.role) : "/"}>
          <img className="brand-logo" src="/logokoordinaski.png" alt="" /> Koordin<span>Aksi</span>
        </Link>
        <p>Ruang bertemu untuk setiap niat baik. Temukan aksi, relawan, dan komunitas yang bergerak untuk Indonesia.</p>
      </section>
      <nav className="footer-column" aria-label="Tautan cepat">
        <h2>Tautan Cepat</h2>
        <Link to="/jelajah">Jelajah Kegiatan</Link>
        <Link to="/organisasi">Organisasi</Link>
        <Link to="/kabar-aksi">Kabar Aksi</Link>
        <Link to="/register">Bergabung</Link>
      </nav>
      <section className="footer-column">
        <h2>Kontak & Lokasi</h2>
        <a href="mailto:khadijahdzar2509@gmail.com"><Mail size={15} /> khadijahdzar2509@gmail.com</a>
        <a href="tel:+6282134008512"><Phone size={15} /> +62 821-3400-8512</a>
        <a href="https://maps.google.com/?q=Jl.+Sudirman+No.+45,+Jakarta+Selatan" target="_blank" rel="noreferrer">
          <MapPin size={15} /> Jl. Sudirman No. 45, Jakarta Selatan, DKI Jakarta
        </a>
      </section>
      <section className="footer-column footer-social">
        <h2>Ikuti Kami</h2>
        <a href="https://instagram.com/okeyydijah" target="_blank" rel="noreferrer"><Instagram size={17} /> @Okeyydijah</a>
        <a href="https://www.linkedin.com/in/khadijah-dzar-990355405" target="_blank" rel="noreferrer"><Linkedin size={17} /> Khadijah Dzar</a>
        </section>
    </div>
    <div className="container footer-bottom"><span>© {new Date().getFullYear()} KoordinAksi Indonesia</span><span>Ruang bertemu untuk setiap niat baik.</span></div>
  </footer>;
}

function PublicLayout() {
  return <><Header /><SessionRecoveryNotice /><main className="main-content"><Outlet /></main><Footer /></>;
}

export default function App() {
  return <div>App loading - incomplete restore, will fix</div>;
}
