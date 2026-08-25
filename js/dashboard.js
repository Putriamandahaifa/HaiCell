// ==========================================
// DASHBOARD - MENU NAVIGASI
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Dashboard.js loaded');
    
    // Semua tombol menu di dashboard
    const menuButtons = document.querySelectorAll('.menu-btn');
    console.log('📌 Menu buttons found:', menuButtons.length);
    
    menuButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const kategori = this.dataset.kategori;
            console.log('🖱️ Menu clicked:', kategori);
            bukaFormTransaksi(kategori);
        });
    });
});

// ==========================================
// FUNGSI BUKA FORM TRANSAKSI
// ==========================================
function bukaFormTransaksi(kategori) {
    console.log('📂 Opening form for:', kategori);
    
    // Sembunyikan semua page
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    
    // Tampilkan halaman transaksi
    const transaksiPage = document.getElementById('page-transaksi');
    if (transaksiPage) {
        transaksiPage.style.display = 'block';
        console.log('✅ Transaksi page shown');
    } else {
        console.error('❌ Transaksi page not found');
        return;
    }
    
    // Sembunyikan semua form
    document.querySelectorAll('.form-category').forEach(f => f.style.display = 'none');
    
    // Tampilkan form yang sesuai
    const formMap = {
        'Dana': 'form-dana',
        'Servis HP': 'form-servis',
        'Agen Pulsa': 'form-agen',
        'Aksesoris & Kartu': 'form-aksesoris',
        'Restock': 'form-restock'
    };
    
    const formId = formMap[kategori];
    if (formId) {
        const targetForm = document.getElementById(formId);
        if (targetForm) {
            targetForm.style.display = 'block';
            console.log('✅ Form shown:', formId);
        } else {
            console.error('❌ Form not found:', formId);
        }
    } else {
        console.error('❌ No form mapping for:', kategori);
    }
    
    // Update judul & info
    const titleEl = document.getElementById('transaksi-title');
    const infoEl = document.getElementById('walletInfo');
    if (titleEl) titleEl.textContent = `Tambah Transaksi - ${kategori}`;
    if (infoEl) infoEl.textContent = `📌 Kategori: ${kategori}`;
}

// ==========================================
// TOMBOL KEMBALI KE DASHBOARD
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    const btnBack = document.getElementById('btnBackDashboard');
    if (btnBack) {
        btnBack.addEventListener('click', function() {
            console.log('🔙 Back to dashboard');
            document.getElementById('page-transaksi').style.display = 'none';
            document.getElementById('page-dashboard').style.display = 'block';
            updateSaldo();
        });
    }
});

// ==========================================
// RENDER RIWAYAT SINGKAT DI DASHBOARD
// ==========================================
function renderRiwayatSingkat() {
    const list = document.getElementById('listTransaksiSingkat');
    if (!list) return;
    
    const walletMap = { dana: 'Dana', cash: 'Cash', agen: 'Agen' };
    const sorted = [...transactions].reverse().slice(0, 5);
    
    if (sorted.length === 0) {
        list.innerHTML = '<li style="text-align:center; color:rgba(255,255,255,0.3); padding:20px;">Belum ada transaksi</li>';
        return;
    }
    
    list.innerHTML = sorted.map(t => `
        <li class="${t.tipe}">
            <div>
                <strong>${t.deskripsi || t.keterangan || 'Transaksi'}</strong>
                <span class="kategori-badge">${t.kategori}</span>
            </div>
            <span style="color:${t.tipe === 'pemasukan' ? '#4ade80' : '#f87171'}; font-weight:700;">
                ${t.tipe === 'pemasukan' ? '+' : '-'} Rp ${t.nominal.toLocaleString('id-ID')}
            </span>
        </li>
    `).join('');
}

// Override updateSaldo dari app.js biar juga refresh riwayat singkat
const originalUpdateSaldo = window.updateSaldo || function() {};
window.updateSaldo = function() {
    if (typeof originalUpdateSaldo === 'function') originalUpdateSaldo();
    renderRiwayatSingkat();
};

//====================
//=== Tombol Reset ===
//====================
document.addEventListener('DOMContentLoaded', function() {
    const btnReset = document.getElementById('btnResetData');
    if (btnReset) {
        btnReset.addEventListener('click', function() {
            if (confirm('Yakin mau reset semua data ke 0? Ini tidak bisa dibatalkan!')) {
                initialBalances = { dana: 0, cash: 0, agen: 0 };
                transactions = [];
                logs = [];
                
                db.balances.put({ id: 'initial', ...initialBalances });
                db.transactions.clear();
                db.logs.clear();
                
                updateSaldo();
                renderRiwayatSingkat();
                alert('✅ Semua data berhasil di-reset!');
            }
        });
    }
});