const images = {
  community: "/ndonesian%20volunteers%20helping%20community.webp",
  treePlanting: "/Young%20people%20planting%20trees%20Indonesia.jpg",
  bloodDonation: "/Blood%20donation%20volunteers%20smiling.png",
  teachingChildren: "/Teachers%20teaching%20children%20village%20Indonesia.jpg",
  floodRelief: "/Flood%20relief%20volunteers%20Indonesia.webp",
  beachCleanup: "/Community%20service%20cleaning%20beach.png",
  elderlyCare: "/Elderly%20care%20volunteers%20Indonesia.jpg",
  youthVolunteers: "/Youth%20social%20work%20group%20photo.jpg",
  disasterResponse: "/Disaster%20response%20team%20helping%20victims.jpeg",
  literacy: "/Women%20volunteers%20teaching%20literacy.jpg",
  environment: "/Environmental%20conservation%20volunteers.webp",
  medical: "/Medical%20volunteers%20checking%20patients.jpg",
  youngVolunteers: "/Group%20of%20young%20Indonesians%20volunteering.jpg",
  foodDistribution: "/Charity%20food%20distribution%20Indonesia.jpg",
  outdoorClass: "/Children%20learning%20outdoor%20class%20Indonesia.jpg",
  packingSupplies: "/Volunteers%20packing%20relief%20supplies.jpg",
  happyVolunteers: "/Happy%20volunteers%20group%20photo%20diverse.jpg",
  empowerment: "/Community%20empowerment%20workshop%20Indonesia.webp",
  mangrove: "/People%20planting%20mangrove%20Indonesia.jpg",
  disasterSocialWorkers: "/Social%20workers%20helping%20disaster%20victims.avif"
};

function chooseDisasterImage(activity) {
  const details = `${activity.title || ""} ${activity.description || ""}`.toLowerCase();
  if (/banjir/.test(details)) return images.floodRelief;
  if (/gempa|longsor|karhutla|kebakaran hutan/.test(details)) return images.disasterResponse;
  if (/logistik|kemas|packing|perlengkapan/.test(details)) return images.packingSupplies;
  return images.disasterSocialWorkers;
}

export function getActivityImage(activity) {
  if (activity.imageUrl) return activity.imageUrl;

  const details = `${activity.category || ""} ${activity.title || ""} ${activity.description || ""}`.toLowerCase();
  if (/donor darah/.test(details)) return images.bloodDonation;
  if (/kesehatan lansia|lansia/.test(details)) return images.elderlyCare;
  if (/kesehatan|medis|medical|pasien/.test(details)) return images.medical;
  if (/mangrove/.test(details)) return images.mangrove;
  if (/pantai|beach|bersih pantai/.test(details)) return images.beachCleanup;
  if (/literasi|membaca|baca tulis/.test(details)) return images.literacy;
  if (/kelas luar|kelas terbuka|outdoor class/.test(details)) return images.outdoorClass;
  if (/pendidikan|mengajar|belajar|anak-anak|anak/.test(details)) return images.teachingChildren;
  if (/tanam pohon|menanam pohon|penanaman pohon|bibit pohon|penghijauan/.test(details)) return images.treePlanting;
  if (/lingkungan|konservasi|lingkungan hidup/.test(details)) return images.environment;
  if (/tanggap bencana|semua bencana|bantuan bencana|banjir|gempa|longsor|karhutla|kebakaran hutan/.test(details)) {
    return chooseDisasterImage(activity);
  }
  if (/logistik|kemas|packing|perlengkapan/.test(details)) return images.packingSupplies;
  if (/makanan|pangan|dapur umum|distribusi.*(makan|paket)|food/.test(details)) return images.foodDistribution;
  if (/pemberdayaan|umkm|workshop|pelatihan/.test(details)) return images.empowerment;
  if (/relawan muda|komunitas|kelompok relawan/.test(details)) return images.youthVolunteers;
  if (/bakti sosial|sosial|kemanusiaan/.test(details)) return images.community;
  if (/kelompok|bersama|relawan/.test(details)) return images.happyVolunteers;

  return images.youngVolunteers;
}

export const featuredCategories = [
  { label: "Bakti Sosial", category: "Bakti Sosial", icon: "✳", image: images.community },
  { label: "Kesehatan & Donor Darah", category: "Kesehatan & Lansia", icon: "♡", image: images.bloodDonation },
  { label: "Kesehatan Lansia", category: "Kesehatan & Lansia", icon: "＋", image: images.elderlyCare },
  { label: "Pendidikan", category: "Pendidikan & Anak", icon: "▤", image: images.teachingChildren },
  { label: "Kebudayaan", category: "Kebudayaan", icon: "◇", image: images.happyVolunteers },
  { label: "Pemberdayaan Masyarakat", category: "Pemberdayaan UMKM", icon: "♧", image: images.empowerment },
  { label: "Bantuan Bencana", category: "Semua Bencana", icon: "⌂", image: images.floodRelief },
  { label: "Kategori Lainnya", category: "Lainnya", icon: "＋", image: images.youngVolunteers }
];
