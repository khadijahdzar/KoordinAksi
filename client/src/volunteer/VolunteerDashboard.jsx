import React, { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../AuthContext";
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
    <section className="volunteer-stats-banner">
      <div className="volunteer-stats-intro">
        <span className="eyebrow">Ruang relawan</span>
        <h1>Halo, {user.name.split(" ")[0]}.</h1>
        <p>Setiap langkahmu membawa dampak. Ini ringkasan perjalananmu.</p>
      </div>
      <div className="volunteer-stats">
        <div><span>Kegiatan diikuti</span><strong>{loadingRegistrations ? "—" : stats.joined}</strong></div>
        <div><span>Akan datang</span><strong>{loadingRegistrations ? "—" : stats.upcoming}</strong></div>
        <div><span>Dikonfirmasi</span><strong>{loadingRegistrations ? "—" : stats.confirmed}</strong></div>
      </div>
    </section>
    <ActivityFeed />
  </div>;
}
