const disasterImages = ["/banjir.jpg", "/gempa.jpg", "/tanahlongsor.jpg", "/karhutla.jpg"];

function chooseDisasterImage(activity) {
  const details = `${activity.title || ""} ${activity.description || ""}`.toLowerCase();
  if (/banjir/.test(details)) return "/banjir.jpg";
  if (/gempa/.test(details)) return "/gempa.jpg";
  if (/longsor/.test(details)) return "/tanahlongsor.jpg";
  if (/karhutla|kebakaran hutan/.test(details)) return "/karhutla.jpg";

  const stableId = String(activity._id || activity.title || "");
  const index = [...stableId].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return disasterImages[index % disasterImages.length];
}

export function getActivityImage(activity) {
  if (activity.imageUrl) return activity.imageUrl;

  const details = `${activity.category || ""} ${activity.title || ""} ${activity.description || ""}`.toLowerCase();
  if (/donor darah/.test(details)) return "/donordarah.jpeg";
  if (/kesehatan lansia|lansia/.test(details)) return "/kesehatan%20lansia.jpg";
  if (/kesehatan/.test(details)) return "/donordarah.jpeg";
  if (/bantuan bencana|banjir|gempa|longsor|karhutla|kebakaran hutan/.test(details)) {
    return chooseDisasterImage(activity);
  }
  if (/bakti sosial/.test(details)) return "/baktisosial.jpeg";
  if (/pendidikan|mengajar|belajar/.test(details)) return "/pendidikan.jpeg";
  if (/kebudayaan|budaya/.test(details)) return "/kebudayaan.jpeg";
  if (/pemberdayaan|umkm/.test(details)) return "/pemberdayaan%20umkm.jpg";
  if (/lingkungan hidup|penghijauan/.test(details)) return "/karhutla.jpg";

  return "/othercategory.jpg";
}

export const featuredCategories = [
  { label: "Bakti Sosial", category: "Bakti Sosial", icon: "✳", image: "/baktisosial.jpeg" },
  { label: "Kesehatan & Donor Darah", category: "Kesehatan & Lansia", icon: "♡", image: "/donordarah.jpeg" },
  { label: "Kesehatan Lansia", category: "Kesehatan & Lansia", icon: "＋", image: "/kesehatan%20lansia.jpg" },
  { label: "Pendidikan", category: "Pendidikan & Anak", icon: "▤", image: "/pendidikan.jpeg" },
  { label: "Kebudayaan", category: "Kebudayaan", icon: "◇", image: "/kebudayaan.jpeg" },
  { label: "Pemberdayaan Masyarakat", category: "Pemberdayaan UMKM", icon: "♧", image: "/pemberdayaan%20umkm.jpg" },
  { label: "Bantuan Bencana", category: "Semua Bencana", icon: "⌂", image: "/banjir.jpg" },
  { label: "Kategori Lainnya", category: "Lainnya", icon: "＋", image: "/othercategory.jpg" }
];
