const nextDate = (days, hour = 9) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

const mockActivities = [
  {
    _id: "demo-activity-donor",
    title: "Donor Darah Bersama untuk Sesama",
    category: "Donor Darah",
    description: "Kegiatan donor darah dan edukasi kesehatan untuk warga.",
    date: nextDate(3),
    endDate: nextDate(3, 13),
    startTime: "09.00–13.00 WIB",
    location: "Jakarta",
    capacity: 40,
    activeRegistrations: 18,
    participationOptions: ["Relawan Murni", "Donasi Konservasi Rp50.000"],
    facilities: ["Konsumsi", "E-sertifikat", "Atribut kegiatan"],
    organization: { name: "Palang Merah Siaga", verified: false }
  },
  {
    _id: "demo-activity-flood",
    title: "Paket Kebutuhan untuk Warga Terdampak Banjir",
    category: "Bantuan Bencana",
    description: "Pengumpulan dan penyaluran bantuan bersama komunitas lokal.",
    date: nextDate(5),
    endDate: nextDate(5, 15),
    startTime: "08.00–15.00 WIB",
    location: "Bandung",
    capacity: 30,
    activeRegistrations: 12,
    participationOptions: ["Relawan Murni", "Donasi Kemanusiaan Rp25.000"],
    facilities: ["Konsumsi", "E-sertifikat", "Perlengkapan relawan"],
    organization: { name: "Dompet Kemanusiaan Nusantara", verified: false }
  },
  {
    _id: "demo-activity-social",
    title: "Berbagi Pangan dan Kebutuhan Harian",
    category: "Bakti Sosial",
    description: "Relawan menyiapkan dan membagikan paket kebutuhan warga.",
    date: nextDate(7),
    endDate: nextDate(7, 13),
    startTime: "08.00–13.00 WIB",
    location: "Yogyakarta",
    capacity: 25,
    activeRegistrations: 9,
    participationOptions: ["Relawan Murni", "Donasi Sosial Rp25.000"],
    facilities: ["Konsumsi", "E-sertifikat", "Paket kegiatan"],
    organization: { name: "Yayasan ASA Indonesia", verified: false }
  },
  {
    _id: "demo-activity-green",
    title: "Aksi Bersih Sungai dan Penghijauan",
    category: "Penghijauan",
    description: "Bersih sungai dan penanaman pohon bersama warga.",
    date: nextDate(9),
    endDate: nextDate(9, 14),
    startTime: "07.00–14.00 WIB",
    location: "Bogor",
    capacity: 35,
    activeRegistrations: 22,
    participationOptions: ["Relawan Murni", "Donasi Konservasi Rp50.000"],
    facilities: ["Konsumsi", "E-sertifikat", "Peralatan aksi"],
    organization: { name: "Sobat Bumi Hijau", verified: false }
  },
  {
    _id: "demo-activity-education",
    title: "Kelas Baca Akhir Pekan untuk Anak",
    category: "Pendidikan",
    description: "Relawan mendampingi kegiatan membaca dan belajar anak.",
    date: nextDate(11),
    endDate: nextDate(11, 12),
    startTime: "09.00–12.00 WIB",
    location: "Semarang",
    capacity: 20,
    activeRegistrations: 11,
    participationOptions: ["Relawan Murni"],
    facilities: ["Konsumsi", "E-sertifikat", "Modul belajar"],
    organization: { name: "Relawan Muda Mengajar", verified: false }
  },
  {
    _id: "demo-activity-elderly",
    title: "Pendampingan Kesehatan untuk Lansia",
    category: "Kesehatan",
    description: "Kunjungan sosial dan edukasi kesehatan untuk warga lanjut usia.",
    date: nextDate(13),
    endDate: nextDate(13, 12),
    startTime: "09.00–12.00 WIB",
    location: "Surabaya",
    capacity: 18,
    activeRegistrations: 7,
    participationOptions: ["Relawan Murni"],
    facilities: ["Konsumsi", "E-sertifikat", "Perlengkapan kesehatan"],
    organization: { name: "Sahabat Lansia Nusantara", verified: false }
  },
  {
    _id: "demo-activity-landslide",
    title: "Dukungan Pemulihan Wilayah Longsor",
    category: "Bantuan Bencana",
    description: "Bantuan logistik dan dukungan pemulihan setelah tanah longsor.",
    date: nextDate(15),
    endDate: nextDate(15, 15),
    startTime: "08.00–15.00 WIB",
    location: "Nusa Tenggara Timur",
    capacity: 28,
    activeRegistrations: 14,
    participationOptions: ["Relawan Murni", "Donasi Pemulihan Rp25.000"],
    facilities: ["Konsumsi", "E-sertifikat", "Perlengkapan aksi"],
    organization: { name: "Dompet Kemanusiaan Nusantara", verified: false }
  },
  {
    _id: "demo-activity-other",
    title: "Ruang Kreatif dan Kegiatan Warga",
    category: "Lainnya",
    description: "Mendukung inisiatif komunitas melalui kegiatan kreatif bersama.",
    date: nextDate(17),
    endDate: nextDate(17, 12),
    startTime: "09.00–12.00 WIB",
    location: "Jakarta",
    capacity: 24,
    activeRegistrations: 10,
    participationOptions: ["Relawan Murni"],
    facilities: ["Konsumsi", "E-sertifikat", "Atribut kegiatan"],
    organization: { name: "Rumah Belajar Anak Bangsa", verified: false }
  }
];

const categoryAliases = {
  "Lingkungan Hidup": ["Penghijauan"],
  "Pendidikan & Anak": ["Pendidikan"],
  "Kesehatan & Lansia": ["Kesehatan", "Donor Darah"],
  "Bakti Sosial": ["Bakti Sosial"],
  "Semua Bencana": ["Bantuan Bencana"],
  "Pemberdayaan UMKM": ["Lainnya"],
  Kebudayaan: ["Bakti Sosial"]
};

export function getMockActivities(params, limit) {
  const requestedCategories = (params.get("category") || "")
    .split(",")
    .flatMap((category) => categoryAliases[category] || [category])
    .filter(Boolean);
  const search = (params.get("search") || "").trim().toLowerCase();
  const location = (params.get("location") || "").toLowerCase();
  const date = params.get("date");
  const matchingActivities = mockActivities.filter((activity) =>
    (!requestedCategories.length || requestedCategories.includes(activity.category)) &&
    (!search || `${activity.title} ${activity.description} ${activity.category}`.toLowerCase().includes(search)) &&
    (!location || activity.location.toLowerCase().includes(location)) &&
    (!date || activity.date.slice(0, 10) === date)
  );
  const page = Math.max(1, Number(params.get("page")) || 1);
  const start = (page - 1) * limit;

  return {
    activities: matchingActivities.slice(start, start + limit),
    pagination: {
      total: matchingActivities.length,
      page,
      pages: Math.ceil(matchingActivities.length / limit)
    }
  };
}

export function getMockActivityById(id) {
  return mockActivities.find((activity) => activity._id === id) || null;
}

export default mockActivities;
