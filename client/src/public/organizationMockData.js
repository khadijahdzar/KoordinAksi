const organizationMockData = [
  {
    _id: "demo-dompet-kemanusiaan",
    name: "Dompet Kemanusiaan Nusantara",
    logoUrl: "/banjir.jpg",
    bannerUrl: "/gempa.jpg",
    focusCategory: "Tanggap Bencana",
    address: "Jakarta",
    description: "Contoh lembaga kemanusiaan yang mengoordinasikan bantuan darurat dan pemulihan bersama warga terdampak.",
    verified: false,
    simulated: true,
    gallery: ["/banjir.jpg", "/gempa.jpg", "/tanahlongsor.jpg"],
    volunteers: ["Alya Prameswari", "Bima Adinata", "Siti Rahmawati"],
    stats: { totalVolunteers: 1240, activeActionsCount: 6, completedActions: 38 }
  },
  {
    _id: "demo-yayasan-asa",
    name: "Yayasan ASA Indonesia",
    logoUrl: "/baktisosial.jpeg",
    bannerUrl: "/baktisosial.jpeg",
    focusCategory: "Sosial & Kemanusiaan",
    address: "Bandung, Jawa Barat",
    description: "Contoh yayasan yang mendukung keluarga rentan melalui layanan sosial dan program komunitas.",
    verified: false,
    simulated: true,
    gallery: ["/baktisosial.jpeg", "/othercategory.jpg", "/pendidikan.jpeg"],
    volunteers: ["Nadia Putri", "Raka Pratama", "Dewi Lestari"],
    stats: { totalVolunteers: 385, activeActionsCount: 4, completedActions: 21 }
  },
  {
    _id: "demo-sobat-bumi",
    name: "Sobat Bumi Hijau",
    logoUrl: "/karhutla.jpg",
    bannerUrl: "/karhutla.jpg",
    focusCategory: "Lingkungan & Konservasi",
    address: "Bogor, Jawa Barat",
    description: "Contoh komunitas yang mengajak warga menjaga lingkungan melalui edukasi dan aksi konservasi.",
    verified: false,
    simulated: true,
    gallery: ["/karhutla.jpg", "/tanahlongsor.jpg", "/banjir.jpg"],
    volunteers: ["Raka Aditya", "Dian Kartika", "Arif Wibowo"],
    stats: { totalVolunteers: 570, activeActionsCount: 5, completedActions: 29 }
  },
  {
    _id: "demo-relawan-muda",
    name: "Relawan Muda Mengajar",
    logoUrl: "/pendidikan.jpeg",
    bannerUrl: "/pendidikan.jpeg",
    focusCategory: "Pendidikan & Literasi",
    address: "Yogyakarta",
    description: "Contoh komunitas relawan yang membuka ruang belajar dan kegiatan literasi untuk anak.",
    verified: false,
    simulated: true,
    gallery: ["/pendidikan.jpeg", "/kebudayaan.jpeg", "/baktisosial.jpeg"],
    volunteers: ["Nadia Putri", "Alya Prameswari", "Bima Adinata"],
    stats: { totalVolunteers: 218, activeActionsCount: 3, completedActions: 17 }
  },
  {
    _id: "demo-palang-merah-siaga",
    name: "Palang Merah Siaga",
    logoUrl: "/donordarah.jpeg",
    bannerUrl: "/donordarah.jpeg",
    focusCategory: "Kesehatan & Medis",
    address: "Surabaya, Jawa Timur",
    description: "Contoh komunitas kesehatan yang mengadakan edukasi pertolongan pertama dan kegiatan donor darah.",
    verified: false,
    simulated: true,
    gallery: ["/donordarah.jpeg", "/kesehatan%20lansia.jpg", "/baktisosial.jpeg"],
    volunteers: ["Siti Rahmawati", "Dewi Lestari", "Raka Aditya"],
    stats: { totalVolunteers: 760, activeActionsCount: 4, completedActions: 32 }
  },
  {
    _id: "demo-sahabat-lansia",
    name: "Sahabat Lansia Nusantara",
    logoUrl: "/kesehatan%20lansia.jpg",
    bannerUrl: "/kesehatan%20lansia.jpg",
    focusCategory: "Kesehatan & Medis",
    address: "Semarang, Jawa Tengah",
    description: "Contoh komunitas yang mengadakan kunjungan, pendampingan, dan edukasi kesehatan bagi lansia.",
    verified: false,
    simulated: true,
    gallery: ["/kesehatan%20lansia.jpg", "/donordarah.jpeg", "/baktisosial.jpeg"],
    volunteers: ["Dewi Lestari", "Alya Prameswari", "Nadia Putri"],
    stats: { totalVolunteers: 146, activeActionsCount: 2, completedActions: 12 }
  },
  {
    _id: "demo-rumah-belajar",
    name: "Rumah Belajar Anak Bangsa",
    logoUrl: "/kebudayaan.jpeg",
    bannerUrl: "/kebudayaan.jpeg",
    focusCategory: "Pendidikan & Literasi",
    address: "Nusa Tenggara Timur",
    description: "Contoh inisiatif belajar komunitas yang menggabungkan literasi, kreativitas, dan pengenalan budaya lokal.",
    verified: false,
    simulated: true,
    gallery: ["/kebudayaan.jpeg", "/pendidikan.jpeg", "/baktisosial.jpeg"],
    volunteers: ["Bima Adinata", "Siti Rahmawati", "Dian Kartika"],
    stats: { totalVolunteers: 92, activeActionsCount: 2, completedActions: 9 }
  }
];

export function getMockOrganizationById(id) {
  return organizationMockData.find((organization) => organization._id === id) || null;
}

export const featuredOrganizations = [
  organizationMockData[0],
  organizationMockData[2],
  organizationMockData[1],
  organizationMockData[4]
];

export const organizationLeaderboard = [
  { name: "Dompet Kemanusiaan Nusantara", actions: 38 },
  { name: "Palang Merah Siaga", actions: 32 },
  { name: "Sobat Bumi Hijau", actions: 29 }
];

export function getOrganizationActivitiesUrl(organization) {
  if (!organization.simulated) {
    return `/jelajah?organization=${encodeURIComponent(organization._id)}`;
  }
  const category = {
    "Tanggap Bencana": "Semua Bencana",
    "Lingkungan & Konservasi": "Lingkungan Hidup",
    "Pendidikan & Literasi": "Pendidikan & Anak",
    "Kesehatan & Medis": "Kesehatan & Lansia",
    "Sosial & Kemanusiaan": "Bakti Sosial"
  }[organization.focusCategory] || "Semua Kategori";
  return `/jelajah?category=${encodeURIComponent(category)}`;
}

export function getMockOrganizations(params, limit) {
  const search = (params.get("search") || "").trim().toLowerCase();
  const focus = params.get("focus") || "";
  const region = (params.get("region") || "").toLowerCase();
  const scale = params.get("scale") || "";
  const matchingOrganizations = organizationMockData.filter((organization) =>
    (!search || `${organization.name} ${organization.description} ${organization.address} ${organization.focusCategory}`.toLowerCase().includes(search)) &&
    (!focus || organization.focusCategory === focus) &&
    (!region || organization.address.toLowerCase().includes(region)) &&
    (!scale || (scale === "local" ? organization.stats.totalVolunteers < 50
      : scale === "growing" ? organization.stats.totalVolunteers >= 50 && organization.stats.totalVolunteers < 200
        : organization.stats.totalVolunteers >= 200)) &&
    params.get("legalRegistered") !== "true"
  );
  const page = Math.max(1, Number(params.get("page")) || 1);
  const start = (page - 1) * limit;

  return {
    organizations: matchingOrganizations.slice(start, start + limit),
    pagination: {
      total: matchingOrganizations.length,
      page,
      pages: Math.ceil(matchingOrganizations.length / limit)
    }
  };
}

export default organizationMockData;
