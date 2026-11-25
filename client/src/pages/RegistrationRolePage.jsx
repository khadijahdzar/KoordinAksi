import React, { useEffect } from "react";
import { Link } from "react-router-dom";

function RegistrationRolePage() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Pilih Peran Pendaftaran - KoordinAksi";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  const roles = [
    {
      name: "Volunteer",
      title: "Daftar sebagai Volunteer",
      icon: "♡",
      description: "Jadilah bagian dari aksi nyata dan salurkan kepedulianmu.",
      benefits: [
        "Temukan kegiatan yang sesuai minatmu",
        "Terhubung dengan organisasi terpercaya",
        "Catat kontribusi dan pengalamanmu"
      ],
      estimate: "~2 menit",
      action: "Pilih Volunteer",
      role: "volunteer"
    },
    {
      name: "Organisasi",
      title: "Daftar sebagai Organisasi",
      icon: "▤",
      description: "Wujudkan lebih banyak kebaikan bersama komunitasmu.",
      benefits: [
        "Kelola kegiatan sosial dengan mudah",
        "Temukan relawan yang siap membantu",
        "Pantau pendaftaran dalam satu tempat"
      ],
      estimate: "~5 menit",
      action: "Pilih Organisasi",
      role: "organization"
    }
  ];

  return (
    <section className="registration-choice-page">
      <div className="registration-choice-backdrop" aria-hidden="true" />
      <section className="registration-choice-card" aria-labelledby="registration-choice-title">
        <div className="registration-choice-brand">
          <img src="/logokoordinaski.png" alt="Logo KoordinAksi" />
          <span>
            Koordin<span>Aksi</span>
          </span>
        </div>
        <header className="registration-choice-heading">
          <span className="eyebrow">Langkah baik dimulai di sini</span>
          <h1 id="registration-choice-title">
            Mulai Langkah Baikmu
            <br />
            Bersama KoordinAksi
          </h1>
          <p>Pilih peran yang paling sesuai untukmu dan mari ciptakan dampak bersama.</p>
        </header>

        <div className="registration-role-grid">
          {roles.map((item) => (
            <article className={`registration-role-card registration-role-${item.role}`} key={item.role}>
              <div className="registration-role-icon" aria-hidden="true">
                {item.icon}
              </div>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
              <span className="registration-role-estimate">⏱ Estimasi: {item.estimate}</span>
              <ul>
                {item.benefits.map((benefit) => (
                  <li key={benefit}>
                    <span aria-hidden="true">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
              <Link className="button registration-role-button" to={`/register/${item.role}`}>
                {item.action}
                <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>

        <div className="registration-choice-stats" aria-label="Dampak KoordinAksi">
          <div>
            <strong>
              45.200<span>+</span>
            </strong>
            <small>Relawan Aktif</small>
          </div>
          <div>
            <strong>
              2.450<span>+</span>
            </strong>
            <small>Aksi Terlaksana</small>
          </div>
          <div>
            <strong>38</strong>
            <small>Provinsi</small>
          </div>
        </div>
        <p className="registration-choice-login">
          Sudah memiliki akun?{" "}
          <Link to="/login">
            Masuk Sekarang <span aria-hidden="true">→</span>
          </Link>
        </p>
      </section>
    </section>
  );
}

export default RegistrationRolePage;
