import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, CheckCircle, Heart, ImagePlus, MessageCircle, Send, User } from "lucide-react";
import { getErrorMessage } from "../api";
import { createVolunteerPost, getVolunteerFeed, getVolunteerProfile } from "../services/volunteerApi";

function formatPostDate(value) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function getInitials(name = "Relawan") {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default function VolunteerFeed() {
  const [posts, setPosts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [content, setContent] = useState("");
  const [actionTitle, setActionTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([getVolunteerFeed(), getVolunteerProfile()])
      .then(([feedResponse, profileResponse]) => {
        if (!active) return;
        setPosts(feedResponse.data.posts);
        setProfile(profileResponse.data.profile);
      })
      .catch((requestError) => { if (active) setError(getErrorMessage(requestError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function submitPost(event) {
    event.preventDefault();
    if (posting || !content.trim()) return;
    setPosting(true);
    setError("");
    try {
      const { data } = await createVolunteerPost({ content: content.trim(), actionTitle: actionTitle.trim(), imageUrl: imageUrl.trim() });
      setPosts((current) => [data.post, ...current]);
      setContent("");
      setActionTitle("");
      setImageUrl("");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setPosting(false);
    }
  }

  return <section className="volunteer-dashboard volunteer-feed-page">
    <header className="volunteer-feed-heading"><div><span className="eyebrow">KOMUNITAS RELAWAN</span><h1>Kabar Aksi</h1><p>Cerita kecil dari setiap langkah baik yang dilakukan bersama.</p></div><Link className="button button-small" to="/dashboard/relawan/profile">Lihat profil <span>→</span></Link></header>
    <nav className="volunteer-profile-tabs" aria-label="Bagian relawan"><Link to="/dashboard/relawan/profile"><Calendar size={16} />Aksi Saya</Link><Link className="active" to="/dashboard/relawan/feed"><CheckCircle size={16} />Kabar Aksi</Link></nav>
    {error && <div className="notice" role="alert">{error}</div>}
    <form className="volunteer-post-composer" onSubmit={submitPost}>
      <div className="volunteer-post-compose-top"><div className="volunteer-feed-avatar">{profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : getInitials(profile?.name)}</div>
        <label className="sr-only" htmlFor="volunteer-post-content">Bagikan kabar aksi</label><textarea id="volunteer-post-content" rows="3" maxLength="2000" value={content} onChange={(event) => setContent(event.target.value)} placeholder="Apa kabar aksimu hari ini?" required /></div>
      <div className="volunteer-post-extra"><label><span>Aksi terkait</span><input value={actionTitle} maxLength="160" onChange={(event) => setActionTitle(event.target.value)} placeholder="Nama kegiatan (opsional)" /></label>
        <label className="volunteer-post-image"><ImagePlus size={16} /><span>URL foto</span><input type="url" value={imageUrl} maxLength="500" onChange={(event) => setImageUrl(event.target.value)} placeholder="https://…" /></label>
        <button className="button button-small" disabled={posting || !content.trim()}><Send size={15} />{posting ? "Mengirim…" : "Bagikan"}</button>
      </div>
    </form>
    <div className="volunteer-feed-list-heading"><div><span className="eyebrow">DARI PARA RELAWAN</span><h2>Linimasa komunitas</h2></div><span>{posts.length} kabar</span></div>
    {loading && <div className="volunteer-loading"><span className="volunteer-spinner" />Memuat kabar aksi…</div>}
    {!loading && posts.length === 0 && <div className="empty-box"><MessageCircle size={24} /><h3>Belum ada kabar aksi</h3><p>Jadi yang pertama membagikan cerita kontribusimu.</p></div>}
    <div className="volunteer-feed-posts">{posts.map((post) => <article className="volunteer-feed-post" key={post._id}>
      <header><div className="volunteer-feed-avatar">{post.author?.avatarUrl ? <img src={post.author.avatarUrl} alt="" /> : getInitials(post.author?.name)}</div><div className="volunteer-feed-author"><strong>{post.author?.name || "Relawan"}</strong><span><User size={12} />{post.author?.username ? `@${post.author.username}` : "Relawan KoordinAksi"} · {formatPostDate(post.createdAt)}</span></div></header>
      {post.actionTitle && <span className="volunteer-post-action-tag">{post.actionTitle}</span>}
      <p className="volunteer-post-content">{post.content}</p>
      {post.imageUrl && <img className="volunteer-post-photo" src={post.imageUrl} alt={post.actionTitle ? `Dokumentasi ${post.actionTitle}` : "Dokumentasi kegiatan relawan"} loading="lazy" />}
      <footer><span><Heart size={16} />{post.likesCount || 0} suka</span><span><MessageCircle size={16} />Komentar segera hadir</span></footer>
    </article>)}</div>
  </section>;
}
