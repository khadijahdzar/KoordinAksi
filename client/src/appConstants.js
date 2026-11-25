/** Shared registration constants */
export const volunteerInterests = ["Lingkungan & Konservasi", "Pendidikan & Literasi", "Medis & PKS", "Tanggap Bencana", "Logistik", "Dokumen & Media"];
export const organizationFocusCategories = ["Lingkungan & Konservasi", "Pendidikan & Literasi", "Kesehatan & Medis", "Tanggap Bencana", "Pemberdayaan Masyarakat", "Sosial & Kemanusiaan", "Lainnya"];
export const organizationDocumentTypes = [
  { key: "skDocument", title: "SK Kemenkumham", detail: "Surat keputusan pengesahan atau akta notaris", icon: "▤" },
  { key: "taxDocument", title: "NPWP Lembaga", detail: "Kartu atau surat keterangan NPWP lembaga", icon: "▣" }
];
export const organizationRegistrationDraftKey = "koordinaksi_organization_verification_draft";
export const formatDate = (date) => new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(date));
