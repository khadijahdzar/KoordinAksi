import React, { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../AuthContext";
import HeroSection from "../components/HeroSection";
import ActivityFeed from "./ActivityFeed";

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const { registrations, loadingRegistrations } = useOutletContext();
  const stats = useMemo(() => {
    const active = registrations.filter((item) => !["cancelled", "rejected"].includes(item.status));
    const upcoming = active.filter((item) => item.activity?.date && new Date(item.activity.date) > new Date());
    const confirmed = registrations.filter((item) => item.status === "approved").length;
    return { joined: active.length, upcoming: upcoming.length, confirmed };
  }, [registrations]);

  return <div className="container volunteer-dashboard-content">
    <HeroSection
      className="dashboard-hero volunteer-dashboard-hero"
      eyebrow="Ruang relawan"
      title={`Halo, ${user.name.split(" ")[0]}.`}
      subtitle="Setiap langkahmu membawa dampak. Ini ringkasan perjalananmu."
    >
      <div className="volunteer-stats hero-section-stats">
        <div><span>Kegiatan diikuti</span><strong>{loadingRegistrations ? "—" : stats.joined}</strong></div>
        <div><span>Akan datang</span><strong>{loadingRegistrations ? "—" : stats.upcoming}</strong></div>
        <div><span>Dikonfirmasi</span><strong>{loadingRegistrations ? "—" : stats.confirmed}</strong></div>
      </div>
    </HeroSection>
    <ActivityFeed />
  </div>;
}
