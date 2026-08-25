// ==========================================
// HALAMAN RIWAYAT
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    // ===== TAB NAVIGATION =====
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = {
        riwayat: document.getElementById('tab-riwayat'),
        log: document.getElementById('tab-log')
    };
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            
            // Update aktif tab
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Tampilkan konten tab yang sesuai
            Object.keys(tabContents).forEach(key => {
                tabContents[key].style.display = (key === tab) ? 'block' : 'none';
            });
            
            // Refresh konten
            if (tab === 'riwayat') renderRiwayatTransaksi();
            if (tab === 'log') renderLogAktivitas();
        });
    });
    
    // ===== FILTER =====
    document.getElementById('filterKategori').addEventListener('change', renderRiwayatTransaksi);
    document.getElementById('filterWallet').addEventListener('change', renderRiwayatTransaksi);
});

// ==========================================
// RENDER RIWAYAT TRANSAKSI
// ==========================================
function renderRiwayatTransaksi() {
    const list = document.getElementById('listRiwayatTransaksi');
    const filterKategori = document.getElementById('filterKategori').value;
    const filterWallet = document.getElementById('filterWallet').value;
    
    let filtered = [...transactions];
    
    // Filter kategori
    if (filterKategori !== 'all') {
        filtered = filtered.filter(t => t.kategori === filterKategori);
    }
    
    // Filter wallet
    if (filterWallet !== 'all') {
        filtered = filtered.filter(t => t.wallet === filterWallet);
    }
    
    // Urutkan dari terbaru
    const sorted = filtered.sort((a, b) => b.id - a.id);
    
    if (sorted.length === 0) {
        list.innerHTML = `
            <li style="text-align:center; color:rgba(255,255,255,0.3); padding:30px;">
                📭 Belum ada transaksi
            </li>
        `;
        return;
    }
    
    list.innerHTML = sorted.map(t => {
        const walletLabel = t.wallet === 'cash' ? 'Cash' : t.wallet === 'dana' ? 'Dana' : 'Agen';
        const tipeClass = t.tipe === 'pemasukan' ? 'plus' : 'minus';
        const tipeLabel = t.tipe === 'pemasukan' ? '+' : '-';
        
        // Format waktu
        const date = new Date(t.id);
        const waktu = date.toLocaleString('id-ID', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        
        return `
            <li class="${t.tipe}">
                <div class="row-top">
                    <span class="deskripsi">${t.deskripsi || 'Transaksi'}${t.keterangan && t.keterangan !== '-' ? ' - ' + t.keterangan : ''}</span>
                    <span class="nominal ${tipeClass}">${tipeLabel} Rp ${t.nominal.toLocaleString('id-ID')}</span>
                </div>
                <div class="row-bottom">
                    <span class="kategori-badge">${t.kategori}</span>
                    <span>
                        <span class="wallet-badge">💼 ${walletLabel}</span>
                        <span style="margin-left:8px;">${waktu}</span>
                    </span>
                </div>
            </li>
        `;
    }).join('');
}

// ==========================================
// RENDER LOG AKTIVITAS
// ==========================================
function renderLogAktivitas() {
    const list = document.getElementById('listLogAktivitas');
    
    if (logs.length === 0) {
        list.innerHTML = `
            <li style="text-align:center; color:rgba(255,255,255,0.3); padding:30px;">
                📭 Belum ada aktivitas
            </li>
        `;
        return;
    }
    
    const sorted = [...logs].reverse();
    list.innerHTML = sorted.map(log => {
        const actionMap = {
            'tambah_transaksi': '➕ Menambah transaksi',
            'edit_transaksi': '✏️ Mengedit transaksi',
            'hapus_transaksi': '🗑️ Menghapus transaksi',
            'edit_saldo': '💰 Mengedit saldo'
        };
        const actionLabel = actionMap[log.action] || log.action;
        
        // Detail tambahan
        let detail = '';
        if (log.details) {
            if (log.action === 'tambah_transaksi') {
                const d = log.details;
                detail = `${d.kategori || ''} - Rp ${(d.nominal || 0).toLocaleString('id-ID')}`;
                if (d.biayaAdmin) detail += ` (admin: Rp ${d.biayaAdmin.toLocaleString('id-ID')})`;
            } else if (log.action === 'edit_saldo') {
                const before = log.details.before || {};
                const after = log.details.after || {};
                detail = `Dana: ${before.dana||0} → ${after.dana||0}, Cash: ${before.cash||0} → ${after.cash||0}`;
            } else if (log.action === 'hapus_transaksi') {
                const d = log.details;
                detail = `${d.kategori || ''} - Rp ${(d.nominal || 0).toLocaleString('id-ID')}`;
            }
        }
        
        return `
            <li class="log-${log.action.replace(/_/g, '-')}">
                <div class="log-action">${actionLabel}</div>
                ${detail ? `<div class="log-detail">${detail}</div>` : ''}
                <div class="log-time">🕐 ${log.timestamp}</div>
            </li>
        `;
    }).join('');
}

// ==========================================
// OVERRIDE FUNGSI ADD LOG
// ==========================================
const originalAddLog = window.addLog || function() {};
window.addLog = function(action, transactionId, details) {
    // Panggil original untuk menyimpan
    if (typeof originalAddLog === 'function') originalAddLog(action, transactionId, details);
    
    // Refresh log jika halaman riwayat sedang terbuka
    const pageRiwayat = document.getElementById('page-riwayat');
    if (pageRiwayat && pageRiwayat.style.display !== 'none') {
        renderLogAktivitas();
    }
};