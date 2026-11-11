import React, { useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, Building2, CalendarDays, UserRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import HeroSection from "../components/HeroSection";
import kabarAksiData from "./kabarAksiData";

const categories = ["Semua", ...new Set(kabarAksiData.map((item) => item.kategori))];

function KabarAksiCard({ item }) {
  return <article className="kabar-card">
    <Link className="kabar-card-image" to={`/kabar-aksi/${item.id}`} aria-label={`Baca ${item.judul}`}>
      <img src={item.gambar} alt={`Dokumentasi kegiatan ${item.kategori.toLowerCase()}`} loading="lazy" />
      <span>{item.kategori}</span>
    </Link>
    <div className="kabar-card-content">
      <time>{item.tanggal}</time>
      <h2><Link to={`/kabar-aksi/${item.id}`}>{item.judul}</Link></h2>
      <p>{item.ringkasan}</p>
      <div className="kabar-card-footer">
        <div className="kabar-card-byline">
          <span><UserRound size={13} aria-hidden="true" />{item.penulis}</span>
          <span><Building2 size={13} aria-hidden="true" />{item.organisasi}</span>
        </div>
        <Link to={`/kabar-aksi/${item.id}`} aria-label={`Baca selengkapnya: ${item.judul}`}>
          Baca selengkapnya <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </div>
  </article>;
}

export default function KabarAksi() {
  const { id } = useParams();
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const article = id ? kabarAksiData.find((item) => String(item.id) === id) : null;
  const visibleArticles = useMemo(() => selectedCategory === "Semua"
    ? kabarAksiData
    : kabarAksiData.filter((item) => item.kategori === selectedCategory), [selectedCategory]);

  if (id) {
    if (!article) {
      return <main className="container kabar-not-found">
        <span className="eyebrow">Kabar tidak ditemukan</span>
        <h1>Berita aksi ini belum tersedia.</h1>
        <Link className="button" to="/kabar-aksi">Kembali ke Kabar Aksi</Link>
      </main>;
    }

    return <article className="kabar-detail">
      <HeroSection
        className="kabar-detail-hero"
        eyebrow={article.kategori}
        title={article.judul}
        subtitle={article.ringkasan}
      />
      <div className="container kabar-detail-content">
        <Link className="kabar-back-link" to="/kabar-aksi"><ArrowLeft size={16} /> Kembali ke Kabar Aksi</Link>
        <img className="kabar-detail-image" src={article.gambar} alt={`Dokumentasi kegiatan ${article.kategori.toLowerCase()}`} />
        <div className="kabar-byline">
          <span><UserRound size={15} /> Ditulis oleh {article.penulis}</span>
          <time><CalendarDays size={15} /> {article.tanggal}</time>
        </div>
        <p className="kabar-article-copy">{article.konten}</p>
        <p className="kabar-organization">Diselenggarakan oleh <strong>{article.organisasi}</strong></p>
      </div>
    </article>;
  }

  return <main className="kabar-page">
    <HeroSection
      className="kabar-list-hero"
      eyebrow="Cerita dari seluruh Indonesia"
      title="Kabar Aksi"
      subtitle="Cerita tentang kepedulian, kolaborasi, dan perubahan nyata yang tumbuh dari langkah bersama."
    />
    <section className="container kabar-list-section" aria-label="Berita kegiatan sosial">
      <div className="kabar-category-filters" aria-label="Filter kategori berita">
        {categories.map((category) => <button
          key={category}
          type="button"
          className={selectedCategory === category ? "is-active" : ""}
          aria-pressed={selectedCategory === category}
          onClick={() => setSelectedCategory(category)}
        >{category}</button>)}
      </div>
      <div className="kabar-grid">
        {visibleArticles.map((item) => <KabarAksiCard key={item.id} item={item} />)}
      </div>
    </section>
  </main>;
}
