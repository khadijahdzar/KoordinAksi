import dotenv from "dotenv";
import mongoose from "mongoose";
import Activity from "../models/Activity.js";
import Organization from "../models/Organization.js";
import Registration from "../models/Registration.js";
import User from "../models/User.js";
import VolunteerLog from "../models/VolunteerLog.js";

dotenv.config();

const organizations = [
  {
    name: "Sahabat Pesisir Nusantara",
    email: "seed-org-pesisir@example.com",
    focusCategory: "Lingkungan & Konservasi",
    address: "Jakarta Utara, DKI Jakarta",
    bannerUrl: "/People%20planting%20mangrove%20Indonesia.jpg",
    description: "Mengajak warga pesisir memulihkan mangrove, menjaga laut, dan membangun mata pencaharian yang berkelanjutan."
  },
  {
    name: "Lentera Baca Pelosok",
    email: "seed-org-literasi@example.com",
    focusCategory: "Pendidikan & Literasi",
    address: "Kupang, Nusa Tenggara Timur",
    bannerUrl: "/Women%20volunteers%20teaching%20literacy.jpg",
    description: "Menghadirkan ruang belajar, buku, dan pendampingan literasi bagi anak serta keluarga di wilayah yang akses belajarnya terbatas."
  },
  {
    name: "Gerak Cepat Tanggap",
    email: "seed-org-tanggap@example.com",
    focusCategory: "Tanggap Bencana",
    address: "Medan, Sumatera Utara",
    bannerUrl: "/Social%20workers%20helping%20disaster%20victims.avif",
    description: "Menguatkan kesiapsiagaan warga dan koordinasi bantuan kemanusiaan sebelum, saat, dan setelah bencana."
  },
  {
    name: "Ruang Tumbuh UMKM",
    email: "seed-org-umkm@example.com",
    focusCategory: "Pemberdayaan Masyarakat",
    address: "Bandung, Jawa Barat",
    bannerUrl: "/Community%20empowerment%20workshop%20Indonesia.webp",
    description: "Mendampingi usaha mikro lokal melalui pelatihan, jejaring pasar, dan pemanfaatan teknologi yang mudah diterapkan."
  },
  {
    name: "Sehat Bersama Indonesia",
    email: "seed-org-sehat@example.com",
    focusCategory: "Kesehatan & Medis",
    address: "Semarang, Jawa Tengah",
    bannerUrl: "/Medical%20volunteers%20checking%20patients.jpg",
    description: "Mendekatkan edukasi kesehatan, pemeriksaan dasar, dan layanan donor darah kepada masyarakat."
  },
  {
    name: "Sahabat Warga Nusantara",
    email: "seed-org-warga@example.com",
    focusCategory: "Sosial & Kemanusiaan",
    address: "Surabaya, Jawa Timur",
    bannerUrl: "/ndonesian%20volunteers%20helping%20community.webp",
    description: "Bergerak bersama warga untuk memperkuat kepedulian sosial, dukungan keluarga, dan kegiatan lintas generasi."
  },
  {
    name: "Komunitas Hijau Bogor",
    email: "seed-org-hijau@example.com",
    focusCategory: "Lingkungan & Konservasi",
    address: "Bogor, Jawa Barat",
    bannerUrl: "/Environmental%20conservation%20volunteers.webp",
    description: "Menggerakkan penanaman pohon, perawatan ruang hijau, dan aksi bersih lingkungan bersama komunitas."
  },
  {
    name: "Rumah Cerita Nusantara",
    email: "seed-org-cerita@example.com",
    focusCategory: "Pendidikan & Literasi",
    address: "Yogyakarta, DI Yogyakarta",
    bannerUrl: "/Children%20learning%20outdoor%20class%20Indonesia.jpg",
    description: "Mendukung anak dan remaja untuk belajar, bercerita, dan mengembangkan rasa percaya diri melalui kelas komunitas."
  },
  {
    name: "Donor Darah untuk Negeri",
    email: "seed-org-donor@example.com",
    focusCategory: "Kesehatan & Medis",
    address: "Bekasi, Jawa Barat",
    bannerUrl: "/Blood%20donation%20volunteers%20smiling.png",
    description: "Membangun kebiasaan donor darah sukarela dan membantu masyarakat memperoleh informasi kesehatan yang tepercaya."
  },
  {
    name: "Jejak Budaya Bersama",
    email: "seed-org-budaya@example.com",
    focusCategory: "Sosial & Kemanusiaan",
    address: "Denpasar, Bali",
    bannerUrl: "/Happy%20volunteers%20group%20photo%20diverse.jpg",
    description: "Merawat pengetahuan dan tradisi lokal melalui kegiatan belajar lintas generasi yang inklusif."
  }
];

const activities = [
  {
    title: "Aksi Tanam 1.000 Mangrove Pesisir Utara",
    organization: "Sahabat Pesisir Nusantara",
    category: "Lingkungan Hidup",
    location: "Pantai Marunda, Jakarta Utara",
    daysFromNow: 4,
    capacity: 36,
    activeRegistrations: 21,
    imageUrl: "/People%20planting%20mangrove%20Indonesia.jpg",
    description: "Tanam dan rawat bibit mangrove bersama warga pesisir, sekaligus belajar menjaga ekosistem pantai."
  },
  {
    title: "Kelas Literasi & Dongeng Anak Pesisir",
    organization: "Lentera Baca Pelosok",
    category: "Pendidikan & Anak",
    location: "Oesapa, Kupang, Nusa Tenggara Timur",
    daysFromNow: 6,
    capacity: 28,
    activeRegistrations: 17,
    imageUrl: "/Women%20volunteers%20teaching%20literacy.jpg",
    description: "Dampingi anak membaca, bermain kata, dan menulis cerita dalam kelas komunitas yang menyenangkan."
  },
  {
    title: "Dapur Umum & Logistik Tanggap Bencana",
    organization: "Gerak Cepat Tanggap",
    category: "Semua Bencana",
    location: "Medan, Sumatera Utara",
    daysFromNow: 8,
    capacity: 40,
    activeRegistrations: 26,
    imageUrl: "/Charity%20food%20distribution%20Indonesia.jpg",
    description: "Siapkan paket kebutuhan keluarga dan latihan alur distribusi bantuan bersama relawan lapangan."
  },
  {
    title: "Pendampingan Digitalisasi UMKM Kuliner",
    organization: "Ruang Tumbuh UMKM",
    category: "Pemberdayaan UMKM",
    location: "Cibadak, Bandung, Jawa Barat",
    daysFromNow: 9,
    capacity: 24,
    activeRegistrations: 14,
    imageUrl: "/Community%20empowerment%20workshop%20Indonesia.webp",
    description: "Bantu pelaku usaha kuliner memperbarui katalog produk, foto sederhana, dan profil usaha daring."
  },
  {
    title: "Pemeriksaan Kesehatan & Donor Darah Warga",
    organization: "Sehat Bersama Indonesia",
    category: "Kesehatan & Lansia",
    location: "Candisari, Semarang, Jawa Tengah",
    daysFromNow: 11,
    capacity: 32,
    activeRegistrations: 19,
    imageUrl: "/Blood%20donation%20volunteers%20smiling.png",
    description: "Bantu alur registrasi dan edukasi peserta pada kegiatan pemeriksaan dasar serta donor darah."
  },
  {
    title: "Bakti Sosial dan Temu Hangat Lansia",
    organization: "Sahabat Warga Nusantara",
    category: "Bakti Sosial",
    location: "Wonokromo, Surabaya, Jawa Timur",
    daysFromNow: 12,
    capacity: 26,
    activeRegistrations: 16,
    imageUrl: "/Elderly%20care%20volunteers%20Indonesia.jpg",
    description: "Temani warga lanjut usia dalam kegiatan bersama, pemeriksaan ringan, dan sesi berbagi cerita."
  },
  {
    title: "Bersih Pantai dan Penanaman Cemara Laut",
    organization: "Sahabat Pesisir Nusantara",
    category: "Lingkungan Hidup",
    location: "Pantai Muara Gembong, Bekasi, Jawa Barat",
    daysFromNow: 14,
    capacity: 34,
    activeRegistrations: 22,
    imageUrl: "/Community%20service%20cleaning%20beach.png",
    description: "Kumpulkan sampah terpilah dan tanam vegetasi pantai bersama kelompok warga setempat."
  },
  {
    title: "Kelas Belajar Terbuka Anak Kampung Kota",
    organization: "Rumah Cerita Nusantara",
    category: "Pendidikan & Anak",
    location: "Kotagede, Yogyakarta, DI Yogyakarta",
    daysFromNow: 15,
    capacity: 30,
    activeRegistrations: 18,
    imageUrl: "/Children%20learning%20outdoor%20class%20Indonesia.jpg",
    description: "Dampingi anak belajar membaca, berhitung, dan berkarya dalam kelas terbuka akhir pekan."
  },
  {
    title: "Layanan Kesehatan Bergerak untuk Warga",
    organization: "Sehat Bersama Indonesia",
    category: "Kesehatan & Lansia",
    location: "Cibinong, Bogor, Jawa Barat",
    daysFromNow: 17,
    capacity: 28,
    activeRegistrations: 13,
    imageUrl: "/Medical%20volunteers%20checking%20patients.jpg",
    description: "Bantu tim kesehatan mengatur antrean, pencatatan, dan edukasi kesehatan masyarakat."
  },
  {
    title: "Pelatihan Respons Cepat & Pengemasan Bantuan",
    organization: "Gerak Cepat Tanggap",
    category: "Semua Bencana",
    location: "Bantul, Yogyakarta, DI Yogyakarta",
    daysFromNow: 18,
    capacity: 35,
    activeRegistrations: 23,
    imageUrl: "/Volunteers%20packing%20relief%20supplies.jpg",
    description: "Pelajari koordinasi dasar, pengecekan barang, dan pengemasan bantuan secara aman dan tertib."
  },
  {
    title: "Festival Cerita dan Warisan Budaya Lokal",
    organization: "Jejak Budaya Bersama",
    category: "Kebudayaan",
    location: "Denpasar, Bali",
    daysFromNow: 20,
    capacity: 32,
    activeRegistrations: 20,
    imageUrl: "/Happy%20volunteers%20group%20photo%20diverse.jpg",
    description: "Dukung ruang temu lintas generasi melalui cerita rakyat, permainan tradisional, dan dokumentasi warga."
  },
  {
    title: "Penanaman Pohon di Daerah Aliran Sungai",
    organization: "Komunitas Hijau Bogor",
    category: "Lingkungan Hidup",
    location: "Dramaga, Bogor, Jawa Barat",
    daysFromNow: 22,
    capacity: 30,
    activeRegistrations: 17,
    imageUrl: "/Young%20people%20planting%20trees%20Indonesia.jpg",
    description: "Tanam pohon lokal dan siapkan jadwal pemantauan bibit bersama kelompok warga sekitar."
  },
  {
    title: "Literasi Digital untuk Ibu dan Remaja",
    organization: "Lentera Baca Pelosok",
    category: "Pendidikan & Anak",
    location: "Maumere, Nusa Tenggara Timur",
    daysFromNow: 24,
    capacity: 25,
    activeRegistrations: 12,
    imageUrl: "/Teachers%20teaching%20children%20village%20Indonesia.jpg",
    description: "Dampingi peserta mengenali informasi tepercaya, menggunakan layanan digital, dan menjaga privasi daring."
  },
  {
    title: "Paket Pangan untuk Keluarga Rentan",
    organization: "Sahabat Warga Nusantara",
    category: "Bakti Sosial",
    location: "Tegalsari, Surabaya, Jawa Timur",
    daysFromNow: 26,
    capacity: 30,
    activeRegistrations: 19,
    imageUrl: "/Charity%20food%20distribution%20Indonesia.jpg",
    description: "Bantu pengemasan dan penyaluran paket pangan berdasarkan pendataan kebutuhan keluarga setempat."
  },
  {
    title: "Klinik Foto Produk dan Pemasaran UMKM",
    organization: "Ruang Tumbuh UMKM",
    category: "Pemberdayaan UMKM",
    location: "Bekasi Selatan, Bekasi, Jawa Barat",
    daysFromNow: 28,
    capacity: 22,
    activeRegistrations: 11,
    imageUrl: "/Community%20empowerment%20workshop%20Indonesia.webp",
    description: "Bantu usaha mikro membuat foto produk dan materi promosi sederhana untuk menjangkau pelanggan baru."
  }
];

const pastActivities = [
  {
    title: "Pemulihan Mangrove Bersama Warga Muara Angke",
    organization: "Sahabat Pesisir Nusantara",
    category: "Penghijauan",
    location: "Muara Angke, Jakarta Utara",
    daysAgo: 2,
    imageUrl: "/Environmental%20conservation%20volunteers.webp",
    description: "Kegiatan perawatan bibit mangrove dan pemantauan kawasan pesisir bersama warga."
  },
  {
    title: "Aksi Bersih Saluran Air dan Lingkungan Kampung",
    organization: "Sahabat Pesisir Nusantara",
    category: "Penghijauan",
    location: "Penjaringan, Jakarta Utara",
    daysAgo: 5,
    imageUrl: "/Community%20service%20cleaning%20beach.png",
    description: "Warga dan relawan bergotong royong membersihkan saluran air dan memilah sampah."
  },
  {
    title: "Distribusi Bantuan Pascabanjir untuk Warga",
    organization: "Gerak Cepat Tanggap",
    category: "Bantuan Bencana",
    location: "Langkat, Sumatera Utara",
    daysAgo: 3,
    imageUrl: "/Social%20workers%20helping%20disaster%20victims.avif",
    description: "Relawan menyalurkan paket kebutuhan rumah tangga bersama koordinator warga."
  },
  {
    title: "Simulasi Kesiapsiagaan Keluarga dan Komunitas",
    organization: "Gerak Cepat Tanggap",
    category: "Bantuan Bencana",
    location: "Deli Serdang, Sumatera Utara",
    daysAgo: 8,
    imageUrl: "/Disaster%20response%20team%20helping%20victims.jpeg",
    description: "Warga berlatih menyusun rencana komunikasi dan mengenali jalur aman di lingkungan."
  },
  {
    title: "Pos Baca Akhir Pekan untuk Anak",
    organization: "Lentera Baca Pelosok",
    category: "Pendidikan",
    location: "Kupang, Nusa Tenggara Timur",
    daysAgo: 6,
    imageUrl: "/Children%20learning%20outdoor%20class%20Indonesia.jpg",
    description: "Relawan membuka kelas membaca dan permainan edukatif di ruang belajar komunitas."
  },
  {
    title: "Donor Darah dan Edukasi Kesehatan Komunitas",
    organization: "Sehat Bersama Indonesia",
    category: "Donor Darah",
    location: "Semarang, Jawa Tengah",
    daysAgo: 9,
    imageUrl: "/Blood%20donation%20volunteers%20smiling.png",
    description: "Kegiatan donor darah disertai informasi kesehatan dan pendampingan peserta."
  }
];

const volunteers = [
  { name: "Alya Putri Ramadhani", city: "Jakarta", hours: [18, 15, 13, 11, 9, 8] },
  { name: "Rizky Maulana", city: "Bogor", hours: [16, 14, 12, 10, 8, 7] },
  { name: "Nabila Zahra", city: "Bandung", hours: [14, 13, 11, 9, 8, 6] },
  { name: "Dimas Pratama", city: "Semarang", hours: [12, 11, 10, 8, 7, 6] },
  { name: "Ayu Lestari", city: "Yogyakarta", hours: [10, 9, 8, 7, 6, 5] },
  { name: "Fajar Nugroho", city: "Surabaya", hours: [9, 8, 7, 6, 5, 4] },
  { name: "Intan Permata", city: "Bekasi", hours: [8, 7, 6, 5, 4, 3] },
  { name: "Bima Saputra", city: "Medan", hours: [7, 6, 5, 4, 3, 2] },
  { name: "Salsabila Putri", city: "Kupang", hours: [6, 5, 4, 3, 2, 1] },
  { name: "Arif Hidayat", city: "Jakarta", hours: [5, 4, 3, 2, 1, 1] },
  { name: "Putri Maharani", city: "Bogor", hours: [4, 3, 2, 1, 1, 1] },
  { name: "Rafi Kurniawan", city: "Bandung", hours: [3, 2, 1, 1, 1, 1] },
  { name: "Nadia Safitri", city: "Semarang", hours: [3, 2, 2, 1, 1, 1] },
  { name: "Bagas Setiawan", city: "Surabaya", hours: [2, 2, 1, 1, 1, 1] },
  { name: "Dewi Anggraini", city: "Yogyakarta", hours: [2, 1, 1, 1, 1, 1] },
  { name: "Yoga Prasetyo", city: "Medan", hours: [2, 1, 1, 1, 1, 1] },
  { name: "Maya Puspitasari", city: "Kupang", hours: [1, 1, 1, 1, 1, 1] },
  { name: "Andi Firmansyah", city: "Bekasi", hours: [1, 1, 1, 1, 1, 1] }
];

function assertSafeTarget() {

  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not configured.");
  if (process.env.NODE_ENV === "production") {
    throw new Error("Public directory seed data can only be loaded outside production.");
  }

  const parsedUri = new URL(process.env.MONGO_URI
    .replace(/^mongodb\+srv:/, "https:")
    .replace(/^mongodb:/, "http:"));
  if (!["localhost", "127.0.0.1", "::1"].includes(parsedUri.hostname)) {
    throw new Error("Public directory seed data can only be loaded into a local MongoDB instance.");
  }
}

function dateFromToday(days, hour = 10) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function dateFromEarlierThisMonth(daysAgo) {
  const now = new Date();
  const day = Math.max(1, now.getDate() - daysAgo);
  return new Date(now.getFullYear(), now.getMonth(), day, 9, 0, 0, 0);
}

async function seed() {
  assertSafeTarget();
  await mongoose.connect(process.env.MONGO_URI);

  const now = new Date();
  if (now.getFullYear() !== 2026) {
    throw new Error("Update the scheduled activity dates before seeding outside 2026.");
  }

  const organizationByName = new Map();
  for (const [index, details] of organizations.entries()) {
    const owner = await User.findOneAndUpdate({ email: details.email }, {
      $set: {
        name: `Koordinator ${details.name}`,
        role: "organization",
        city: details.address.split(",")[0],
        acceptedTerms: true
      },
      $setOnInsert: { username: `seed_org_${index + 1}` }
    }, { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true });

    const organization = await Organization.findOneAndUpdate({ name: details.name }, {
      $set: {
        ...details,
        owner: owner._id,
        verified: true,
        verificationStatus: "verified",
        verifiedAt: now,
        stats: { impactScore: (organizations.length - index) * 10 }
      }
    }, { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true });
    owner.organization = organization._id;
    await owner.save();
    organizationByName.set(details.name, organization);
  }

  const volunteerDocuments = [];
  for (const [index, details] of volunteers.entries()) {
    volunteerDocuments.push(await User.findOneAndUpdate({ email: `seed-volunteer-${index + 1}@example.com` }, {
      $set: {
        name: details.name,
        role: "volunteer",
        city: details.city,
        interests: ["Lingkungan & Konservasi", "Pendidikan & Literasi"],
        acceptedTerms: true,
        stats: { totalHours: details.hours.reduce((sum, hours) => sum + hours, 0), totalActions: 6 }
      },
      $setOnInsert: { username: `seed_volunteer_${index + 1}` }
    }, { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }));
  }

  async function saveActivity(details, date, isHistorical = false) {
    const organization = organizationByName.get(details.organization);
    if (!organization) throw new Error(`Unknown organization: ${details.organization}`);
    const activity = await Activity.findOneAndUpdate({
      title: details.title,
      organization: organization._id
    }, {
      $set: {
        ...details,
        organization: organization._id,
        date,
        capacity: details.capacity || 30,
        activeRegistrations: 0,
        status: "published",
        isVerified: true,
        verificationStatus: "approved"
      }
    }, { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true });

    const registrationCount = isHistorical ? 8 : details.activeRegistrations;
    const startIndex = isHistorical ? details.daysAgo : details.daysFromNow;
    for (let index = 0; index < registrationCount; index += 1) {
      const volunteer = volunteerDocuments[(startIndex * 3 + index) % volunteerDocuments.length];
      const attended = isHistorical && index < 6;
      await Registration.findOneAndUpdate({ activity: activity._id, volunteer: volunteer._id }, {
        $set: { status: attended ? "attended" : "approved" }
      }, { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true });

      if (attended) {
        const volunteerIndex = volunteerDocuments.findIndex((entry) => entry._id.equals(volunteer._id));
        const hours = volunteers[volunteerIndex].hours[details.daysAgo % 6];
        await VolunteerLog.findOneAndUpdate({
          actionId: activity._id,
          volunteerId: volunteer._id
        }, {
          $set: { attendanceStatus: "Hadir", hoursLogged: hours }
        }, { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true });
      }
    }

    const activeRegistrations = await Registration.countDocuments({
      activity: activity._id,
      status: { $in: ["pending", "approved", "attended"] }
    });
    activity.activeRegistrations = activeRegistrations;
    await activity.save();
    return activity;
  }

  const futureActivities = [];
  for (const details of activities) {
    const date = dateFromToday(details.daysFromNow);
    if (date.getFullYear() !== 2026 || date <= now) {
      throw new Error(`Scheduled activity is not in the future in 2026: ${details.title}`);
    }
    futureActivities.push(await saveActivity(details, date));
  }

  const completedActivities = [];
  for (const details of pastActivities) {
    completedActivities.push(await saveActivity(details, dateFromEarlierThisMonth(details.daysAgo), true));
  }

  console.log(`Seeded ${organizations.length} organizations, ${futureActivities.length} upcoming activities, ${completedActivities.length} completed activities, and ${volunteerDocuments.length} volunteers.`);
}

try {
  await seed();
} finally {
  await mongoose.disconnect();
}
