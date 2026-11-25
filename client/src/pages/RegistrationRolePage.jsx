import React, { useEffect } from "react";
import { Link } from "react-router-dom";

function RegistrationRolePage() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Pilih Peran Pendaftaran - KoordinAksi";
    return () => { document.title = previousTitle; };
  }, []);

  const roles = [
    {
      name: "Volunteer",
      title: "Daftar sebagai Volunteer",
      icon: "♡",
      description: "Jadilah bagian dari aksi nyata dan salurkan kepedulianmu.",
      benefits: ["Temukan kegiatan yang sesuai minatmu", "Terhubung dengan organisasi terpercaya", "Catat kontribusi dan pengalamanmu"],
      estimate: "~2 menit",
      action: "Pilih Volunteer",
      role: "volunteer"
    },
    {
      name: "Organisasi",
      title: "Daftar sebagai Organisasi",
      icon: "▤",
      description: "Wujudkan lebih banyak kebaikan bersama komunitasmu.",
      benefits: ["Kelola kegiatan sosial dengan mudah", "Temukan relawan yang siap membantu", "Pantau pendaftaran dalam satu tempat"],
      estimate: "~5 menit",
      action: "Pilih Organisasi",
      role: "organization"
    }
  ];

  return (
    <div className="container page-space registration-role-page">
      <span className="eyebrow">Langkah pertama</span>
      <h1>Pilih peranmu di KoordinAksi</h1>
      <p className="lead">Setiap peran punya jalur pendaftaran sendiri. Pilih yang paling sesuai.</p>
      <div className="role-choice-grid">
        {roles.map((role) => (
          <article className="role-choice-card" key={role.role}>
            <span className="role-choice-icon">{role.icon}</span>
            <h2>{role.title}</h2>
            <p>{role.description}</p>
            <ul>{role.benefits.map((item) => <li key={item}>{item}</li>)}</ul>
            <small>{role.estimate}</small>
            <Link className="button" to={role.role === "volunteer" ? "/register/volunteer" : "/register/organization"}>{role.action} <span>→</span></Link>
          </article>
        ))}
      </div>
    </div>
  );
}

export default RegistrationRolePage;
