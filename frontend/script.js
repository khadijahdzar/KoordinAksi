/**
 * KoordinAksi - Single Page Application Router & Interactive UI Engine
 * Handles View Switching, Auth State Management, Dynamic Filtering, Activity Detail Modal, Portfolio Upload/Delete, Org Follow Toggle, Sub-Tabs, and Toast Notifications.
 */

// Global Auth State (Default: Logged Out false for testing, set true upon Login)
let isLoggedIn = true;
let currentActivityData = null;

// Portfolio Array
let userPortfolioItems = [
    { id: 1, url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80', caption: 'Penanaman bibit pohon mahoni di lereng Bogor' },
    { id: 2, url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600&q=80', caption: 'Berbagi santunan & kebahagiaan di panti asuhan' },
    { id: 3, url: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=600&q=80', caption: 'Aksi donor darah bersama PMI Jakarta' }
];

const volunteersDatabase = {
    'siti': {
        name: 'Siti Nurhaliza',
        role: 'Relawan Aktif - Tanggap Bencana & Kemanusiaan',
        email: 'siti.nurhaliza@email.com',
        phone: '0812-3456-7890',
        location: 'Jakarta, Indonesia',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
        kegiatanCount: 12,
        jamCount: 86,
        sertifikatCount: 5
    },
    'ricky': {
        name: 'Ricky Maulana',
        role: 'Relawan Aktif - Penghijauan & Lingkungan',
        email: 'ricky.maulana@email.com',
        phone: '0813-9876-5432',
        location: 'Bekasi, Jawa Barat',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        kegiatanCount: 10,
        jamCount: 64,
        sertifikatCount: 4
    },
    'dewi': {
        name: 'Dewi Anjani',
        role: 'Relawan Aktif - Pendidikan & Kesehatan',
        email: 'dewi.anjani@email.com',
        phone: '0815-1122-3344',
        location: 'Bogor, Jawa Barat',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        kegiatanCount: 8,
        jamCount: 52,
        sertifikatCount: 3
    },
    'budi': {
        name: 'Budi Santoso',
        role: 'Relawan Senior - Logistik & Lapangan',
        email: 'budi.santoso@email.com',
        phone: '0811-2233-4455',
        location: 'Depok, Jawa Barat',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
        kegiatanCount: 15,
        jamCount: 98,
        sertifikatCount: 6
    }
};

const activitiesDatabase = {
    'donor-darah': {
        title: 'Donor Darah untuk Kemanusiaan',
        category: 'Donor Darah',
        badgeClass: 'badge-donor',
        org: 'PMI DKI Jakarta & Yayasan Peduli Negeri',
        location: 'Gedung PMI Jakarta Selatan',
        date: '25 Mei 2025',
        fee: 'Gratis (Termasuk Lunch Box & Snack)',
        image: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1200&q=80',
        desc: 'Aksi donor darah serentak membantu persediaan darah PMI untuk rumah sakit di wilayah Jakarta Selatan.',
        cpName: 'Bambang Setyawan (Koordinator PMI)',
        cpPhone: '6281299887766'
    },
    'bencana-banjir': {
        title: 'Aksi Peduli Bencana Banjir',
        category: 'Bantuan Bencana',
        badgeClass: 'badge-bencana',
        org: 'Tim Tanggap Bencana KoordinAksi',
        location: 'Bekasi, Jawa Barat',
        date: '2 Juni 2025',
        fee: 'Rp 50.000 (Donasi Paket Sembako)',
        image: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1200&q=80',
        desc: 'Penyaluran logistik makanan, sembako, dan pembersihan fasilitas umum terdampak banjir di Bekasi.',
        cpName: 'Rian Pratama (Ketua Posko)',
        cpPhone: '6281311223344'
    },
    'bakti-sosial': {
        title: 'Bakti Sosial untuk Anak Yatim',
        category: 'Bakti Sosial',
        badgeClass: 'badge-baksos',
        org: 'Komunitas Kasih Nusantara',
        location: 'Depok, Jawa Barat',
        date: '15 Juni 2025',
        fee: 'Rp 35.000 (Donasi Paket Alat Tulis)',
        image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80',
        desc: 'Berbagi santunan, perlengkapan sekolah, serta kelas motivasi keceriaan untuk panti asuhan.',
        cpName: 'Sinta Dewi (Pengurus Yayasan)',
        cpPhone: '6281555667788'
    }
};

const orgDatabase = {
    'ypn': {
        name: 'Yayasan Peduli Negeri',
        desc: 'Lembaga sosial nirlaba yang berfokus pada penanggulangan bencana, bantuan kemanusiaan, dan bakti sosial anak yatim piatu di Indonesia.',
        relawanCount: 320,
        img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80'
    }
};

let isFollowingOrg = false;

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initInternalTabs();
    initKegiatanFilter();
    initClickListeners();
    initFollowOrgButton();
    initPortfolioEngine();
    initRegistrationFormModal();
    initModals();
    initAuthEngine();
    updateAuthUI();
});

function initNavigation() {
    const navLinks = document.querySelectorAll('[data-target-view]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetViewId = link.getAttribute('data-target-view');
            switchView(targetViewId);
        });
    });

    const btnMyProfile = document.getElementById('btn-my-profile');
    if (btnMyProfile) {
        btnMyProfile.addEventListener('click', () => {
            if (!isLoggedIn) {
                switchView('view-relawan-profile');
            } else {
                openVolunteerProfile('siti');
            }
        });
    }
}

function switchView(targetViewId) {
    const allViews = document.querySelectorAll('.app-view');
    const allNavLinks = document.querySelectorAll('.nav-link-item');
    
    allViews.forEach(view => view.classList.remove('active'));

    const targetView = document.getElementById(targetViewId);
    if (targetView) {
        targetView.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Sync Nav Active Indicator accurately for all views
    allNavLinks.forEach(link => {
        const linkView = link.getAttribute('data-target-view');
        let isActive = false;

        if (linkView === targetViewId) isActive = true;
        if ((targetViewId === 'view-organisasi-detail' || targetViewId === 'view-organisasi-public') && linkView === 'view-organisasi-public') isActive = true;
        if ((targetViewId === 'view-relawan-profile' || targetViewId === 'view-relawan-public') && linkView === 'view-relawan-public') isActive = true;

        if (isActive) {
            link.classList.add('active', 'text-emerald-700', 'border-b-2', 'border-emerald-600', 'font-bold');
            link.classList.remove('text-slate-600');
        } else {
            link.classList.remove('active', 'text-emerald-700', 'border-b-2', 'border-emerald-600', 'font-bold');
            link.classList.add('text-slate-600');
        }
    });

    // Handle Profile Logged Out State View
    if (targetViewId === 'view-relawan-profile') {
        const loggedInContainer = document.getElementById('profile-logged-in-container');
        const loggedOutState = document.getElementById('profile-logged-out-state');
        if (!isLoggedIn) {
            loggedInContainer?.classList.add('hidden');
            loggedOutState?.classList.remove('hidden');
        } else {
            loggedInContainer?.classList.remove('hidden');
            loggedOutState?.classList.add('hidden');
        }
    }
}

function updateAuthUI() {
    const loggedOutNav = document.getElementById('nav-auth-logged-out');
    const loggedInNav = document.getElementById('nav-auth-logged-in');
    
    if (isLoggedIn) {
        loggedOutNav?.classList.add('hidden');
        loggedInNav?.classList.remove('hidden');
    } else {
        loggedOutNav?.classList.remove('hidden');
        loggedInNav?.classList.add('hidden');
    }
}

function initAuthEngine() {
    document.getElementById('btn-logout')?.addEventListener('click', () => {
        isLoggedIn = false;
        updateAuthUI();
        showToast('Anda telah keluar dari akun.', 'info');
        switchView('view-home');
    });

    document.getElementById('form-login')?.addEventListener('submit', (e) => {
        e.preventDefault();
        isLoggedIn = true;
        updateAuthUI();
        showToast('Berhasil Masuk! Selamat datang kembali, Siti Nurhaliza.', 'success');
        document.getElementById('modal-login')?.classList.add('hidden');
        openVolunteerProfile('siti');
    });

    document.getElementById('form-register')?.addEventListener('submit', (e) => {
        e.preventDefault();
        isLoggedIn = true;
        updateAuthUI();
        showToast('Pendaftaran Akun Berhasil! Selamat datang di KoordinAksi.', 'success');
        document.getElementById('modal-register')?.classList.add('hidden');
        openVolunteerProfile('siti');
    });
}

function initClickListeners() {
    document.querySelectorAll('.org-card').forEach(card => {
        card.addEventListener('click', () => openOrgDetail('ypn'));
    });

    document.querySelectorAll('.btn-volunteer-item, .relawan-card').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const volId = item.getAttribute('data-volunteer-id') || 'siti';
            openVolunteerProfile(volId);
        });
    });

    document.querySelectorAll('.kegiatan-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const activityId = card.getAttribute('data-activity-id') || 'donor-darah';
            openActivityDetailModal(activityId);
        });
    });
}

function openVolunteerProfile(volunteerId) {
    const data = volunteersDatabase[volunteerId] || volunteersDatabase['siti'];
    
    document.getElementById('vol-profile-avatar').src = data.avatar;
    document.getElementById('vol-profile-name').textContent = data.name;
    document.getElementById('vol-profile-role').textContent = data.role;
    
    // Dynamic Interactive Contact Links
    const linkEmail = document.getElementById('vol-link-email');
    if (linkEmail) {
        linkEmail.textContent = data.email;
        linkEmail.href = `mailto:${data.email}`;
    }

    const linkPhone = document.getElementById('vol-link-phone');
    if (linkPhone) {
        const cleanPhone = data.phone.replace(/[^0-9]/g, '');
        linkPhone.textContent = data.phone;
        linkPhone.href = `https://wa.me/62${cleanPhone.substring(1)}`;
    }

    const linkLoc = document.getElementById('vol-link-location');
    if (linkLoc) {
        linkLoc.textContent = `${data.location} (Maps)`;
        linkLoc.href = `https://maps.google.com/?q=${encodeURIComponent(data.location)}`;
    }
    
    document.getElementById('vol-profile-kegiatan-count').textContent = data.kegiatanCount;
    document.getElementById('vol-profile-jam-count').textContent = data.jamCount;
    document.getElementById('vol-profile-sertifikat-count').textContent = data.sertifikatCount;

    switchView('view-relawan-profile');
}

function initFollowOrgButton() {
    const btnFollowOrg = document.getElementById('btn-follow-org');
    if (!btnFollowOrg) return;

    btnFollowOrg.addEventListener('click', () => {
        const statElem = document.getElementById('detail-org-stat-relawan');
        const listContainer = document.getElementById('detail-org-volunteers-list');
        let currentCount = parseInt(statElem.textContent) || 320;

        if (!isFollowingOrg) {
            isFollowingOrg = true;
            currentCount++;
            statElem.textContent = currentCount;
            btnFollowOrg.innerHTML = '<i class="fas fa-check-circle mr-1.5"></i> Mengikuti';
            btnFollowOrg.className = 'px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm transition-all';
            showToast('Anda sekarang mengikuti Yayasan Peduli Negeri.', 'success');

            if (listContainer) {
                const userItem = document.createElement('div');
                userItem.id = 'org-follower-siti-item';
                userItem.className = 'btn-volunteer-item p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between cursor-pointer';
                userItem.innerHTML = `
                    <div class="flex items-center gap-3">
                        <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80" class="w-10 h-10 rounded-full object-cover border border-emerald-500">
                        <div>
                            <div class="text-xs font-bold text-navy-900">Siti Nurhaliza (Anda)</div>
                            <div class="text-[10px] text-emerald-700 font-semibold">Baru Saja Bergabung</div>
                        </div>
                    </div>
                    <span class="px-2 py-0.5 rounded-full text-[10px] bg-emerald-200 text-emerald-800 font-bold">Mengikuti</span>
                `;
                userItem.onclick = () => openVolunteerProfile('siti');
                listContainer.prepend(userItem);
            }
        } else {
            isFollowingOrg = false;
            currentCount--;
            statElem.textContent = currentCount;
            btnFollowOrg.innerHTML = '<i class="fas fa-plus mr-1.5"></i> Ikuti Organisasi';
            btnFollowOrg.className = 'btn-primary-emerald px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all';
            showToast('Anda telah berhenti mengikuti organisasi ini.', 'info');

            document.getElementById('org-follower-siti-item')?.remove();
        }
    });
}

function openOrgDetail(orgId) {
    const orgData = orgDatabase[orgId] || orgDatabase['ypn'];
    document.getElementById('detail-org-name').textContent = orgData.name;
    document.getElementById('detail-org-desc').textContent = orgData.desc;
    document.getElementById('detail-org-image').src = orgData.img;
    document.getElementById('detail-org-stat-relawan').textContent = orgData.relawanCount;
    switchView('view-organisasi-detail');
}

function openActivityDetailModal(activityId) {
    const data = activitiesDatabase[activityId] || activitiesDatabase['donor-darah'];
    currentActivityData = data;
    const modal = document.getElementById('modal-detail-kegiatan');
    if (!modal) return;

    document.getElementById('detail-activity-image').src = data.image;
    document.getElementById('detail-activity-title').textContent = data.title;
    document.getElementById('detail-activity-org').textContent = `Penyelenggara: ${data.org}`;
    document.getElementById('detail-activity-location').innerHTML = `<i class="fas fa-map-marker-alt text-red-500 mr-1"></i> ${data.location}`;
    document.getElementById('detail-activity-date').innerHTML = `<i class="fas fa-calendar-alt text-blue-500 mr-1"></i> ${data.date}`;
    document.getElementById('detail-activity-desc').textContent = data.desc;
    document.getElementById('detail-activity-fee').innerHTML = `<i class="fas fa-tag mr-1"></i> Biaya: ${data.fee}`;

    if (data.cpName) document.getElementById('detail-activity-cp-name').textContent = data.cpName;
    if (data.cpPhone) {
        const btnCp = document.getElementById('btn-cp-whatsapp');
        if (btnCp) btnCp.href = `https://wa.me/${data.cpPhone}`;
    }

    const badgeElem = document.getElementById('detail-activity-badge');
    badgeElem.textContent = data.category;
    badgeElem.className = `px-3.5 py-1.5 rounded-full text-xs font-bold shadow-md ${data.badgeClass}`;

    document.getElementById('btn-open-form-pendaftaran').onclick = () => {
        modal.classList.add('hidden');
        openRegistrationFormModal(data);
    };

    modal.classList.remove('hidden');
}

function openRegistrationFormModal(activityData) {
    const regModal = document.getElementById('modal-form-pendaftaran');
    document.getElementById('reg-form-activity-title').textContent = activityData.title;
    document.getElementById('reg-form-fee-amount').textContent = activityData.fee;
    regModal.classList.remove('hidden');
}

function initRegistrationFormModal() {
    document.getElementById('form-submit-registration')?.addEventListener('submit', (e) => {
        e.preventDefault();
        showToast(`Pendaftaran & Bukti Pembayaran untuk "${currentActivityData ? currentActivityData.title : 'Kegiatan'}" Berhasil Terkirim!`, 'success');
        document.getElementById('modal-form-pendaftaran')?.classList.add('hidden');
    });
}

function initPortfolioEngine() {
    const form = document.getElementById('form-add-portfolio');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const urlInput = document.getElementById('portfolio-img-url');
            const captionInput = document.getElementById('portfolio-caption');

            const newItem = {
                id: Date.now(),
                url: urlInput.value,
                caption: captionInput.value
            };

            userPortfolioItems.unshift(newItem);
            renderPortfolioGallery();
            form.reset();
            showToast('Foto portofolio baru berhasil ditambahkan!', 'success');
        });
    }

    renderPortfolioGallery();
}

function renderPortfolioGallery() {
    const container = document.getElementById('portfolio-gallery-container');
    if (!container) return;

    container.innerHTML = userPortfolioItems.map(item => `
        <div class="group relative bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col justify-between">
            <div class="relative h-40 overflow-hidden bg-slate-900">
                <img src="${item.url}" alt="${item.caption}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                <button onclick="deletePortfolioItem(${item.id})" class="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold shadow-md hover:bg-red-700 transition-colors" title="Hapus Foto">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="p-3 bg-white">
                <p class="text-xs text-slate-700 font-medium line-clamp-2">${item.caption}</p>
            </div>
        </div>
    `).join('');
}

function deletePortfolioItem(id) {
    userPortfolioItems = userPortfolioItems.filter(item => item.id !== id);
    renderPortfolioGallery();
    showToast('Foto portofolio telah dihapus.', 'info');
}

function initInternalTabs() {
    const setupSubTabs = (tabSelector, contentSelector) => {
        const tabs = document.querySelectorAll(tabSelector);
        const contents = document.querySelectorAll(contentSelector);

        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const targetKey = tab.getAttribute('data-tab');
                
                tabs.forEach(t => t.classList.remove('active', 'bg-emerald-600', 'text-white', 'bg-blue-600'));
                tab.classList.add('active');

                if (tab.classList.contains('sidebar-item')) {
                    if (tab.classList.contains('sidebar-item-admin')) {
                        tab.classList.add('bg-blue-600', 'text-white');
                    } else {
                        tab.classList.add('bg-emerald-600', 'text-white');
                    }
                }

                contents.forEach(c => {
                    if (c.getAttribute('data-tab-content') === targetKey) {
                        c.classList.remove('hidden');
                    } else {
                        c.classList.add('hidden');
                    }
                });
            });
        });
    };

    setupSubTabs('.relawan-sub-tab', '.relawan-sub-tab-content');
    setupSubTabs('.admin-sidebar-tab', '.admin-tab-content');
}

function initKegiatanFilter() {
    const searchInput = document.getElementById('search-kegiatan');
    const categorySelect = document.getElementById('filter-kategori');
    const locationSelect = document.getElementById('filter-lokasi');
    const filterBtn = document.getElementById('btn-apply-filter');
    const cards = document.querySelectorAll('.kegiatan-grid-item');

    function applyFilter() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const selectedCat = categorySelect ? categorySelect.value.toLowerCase() : 'semua';
        const selectedLoc = locationSelect ? locationSelect.value.toLowerCase() : 'semua';

        cards.forEach(card => {
            const title = card.getAttribute('data-title')?.toLowerCase() || '';
            const category = card.getAttribute('data-category')?.toLowerCase() || '';
            const location = card.getAttribute('data-location')?.toLowerCase() || '';

            const matchesSearch = title.includes(searchTerm) || category.includes(searchTerm) || location.includes(searchTerm);
            const matchesCategory = selectedCat === 'semua' || category.includes(selectedCat);
            const matchesLocation = selectedLoc === 'semua' || location.includes(selectedLoc);

            if (matchesSearch && matchesCategory && matchesLocation) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });
    }

    if (filterBtn) filterBtn.addEventListener('click', applyFilter);
    if (searchInput) searchInput.addEventListener('input', applyFilter);
    if (categorySelect) categorySelect.addEventListener('change', applyFilter);
    if (locationSelect) locationSelect.addEventListener('change', applyFilter);
}

function initModals() {
    const modalLogin = document.getElementById('modal-login');
    const modalRegister = document.getElementById('modal-register');
    const modalDetail = document.getElementById('modal-detail-kegiatan');
    const modalPendaftaran = document.getElementById('modal-form-pendaftaran');

    document.querySelectorAll('.btn-open-login').forEach(btn => {
        btn.addEventListener('click', () => modalLogin?.classList.remove('hidden'));
    });

    document.querySelectorAll('.btn-open-register').forEach(btn => {
        btn.addEventListener('click', () => modalRegister?.classList.remove('hidden'));
    });

    document.querySelectorAll('.btn-close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            modalLogin?.classList.add('hidden');
            modalRegister?.classList.add('hidden');
            modalDetail?.classList.add('hidden');
            modalPendaftaran?.classList.add('hidden');
        });
    });

    document.querySelectorAll('.modal-backdrop-area').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                modalLogin?.classList.add('hidden');
                modalRegister?.classList.add('hidden');
                modalDetail?.classList.add('hidden');
                modalPendaftaran?.classList.add('hidden');
            }
        });
    });
}

function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full px-4';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `flex items-center gap-3 p-4 rounded-xl shadow-xl text-white transform transition-all duration-300 translate-y-4 opacity-0 ${
        type === 'success' ? 'bg-emerald-700' : 'bg-blue-600'
    }`;
    
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'} text-xl"></i>
        <div class="flex-1 text-sm font-medium">${message}</div>
        <button class="text-white opacity-70 hover:opacity-100">&times;</button>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.remove('translate-y-4', 'opacity-0'), 10);

    const removeToast = () => {
        toast.classList.add('opacity-0', 'translate-y-4');
        setTimeout(() => toast.remove(), 300);
    };

    toast.querySelector('button').addEventListener('click', removeToast);
    setTimeout(removeToast, 4000);
}
