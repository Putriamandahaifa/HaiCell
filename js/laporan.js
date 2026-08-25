// ==========================================
// HALAMAN LAPORAN - VERSI SUPER SIMPEL
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ laporan.js loaded');

    // Ambil semua elemen tab
    const tabKeuangan = document.getElementById('tab-keuangan');
    const tabTransaksi = document.getElementById('tab-transaksi');
    const tabSparepart = document.getElementById('tab-sparepart');

    // Ambil semua tombol
    const btnKeuangan = document.querySelector('.tab-btn-laporan[data-tab="keuangan"]');
    const btnTransaksi = document.querySelector('.tab-btn-laporan[data-tab="transaksi"]');
    const btnSparepart = document.querySelector('.tab-btn-laporan[data-tab="sparepart"]');

    // ===== FUNGSI UNTUK MENAMPILKAN TAB =====
    function tampilkanTab(namaTab) {
        console.log('📌 Menampilkan tab:', namaTab);

        // Sembunyikan semua tab
        document.querySelectorAll('.tab-laporan').forEach(tab => {
            tab.style.display = 'none';
        });

        // Tampilkan tab yang dipilih
        let targetTab = null;
        if (namaTab === 'keuangan') targetTab = document.getElementById('tab-keuangan');
        else if (namaTab === 'transaksi') targetTab = document.getElementById('tab-transaksi');
        else if (namaTab === 'sparepart') targetTab = document.getElementById('tab-sparepart');
        
        if (targetTab) {
            targetTab.style.display = 'block';
            console.log('✅ Tab ditampilkan:', namaTab);
        } else {
            console.warn('❌ Tab tidak ditemukan:', namaTab);
        }

        // Hapus class active dari semua tombol dulu, baru tambahkan ke yang dipilih
        document.querySelectorAll('.tab-btn-laporan').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`.tab-btn-laporan[data-tab="${namaTab}"]`);
        if (activeBtn) activeBtn.classList.add('active');
    }

    // ===== EVENT LISTENER UNTUK TOMBOL =====
    if (btnKeuangan) {
        btnKeuangan.addEventListener('click', function() {
            tampilkanTab('keuangan');
            renderLaporanKeuangan();
        });
    }
    if (btnTransaksi) {
        btnTransaksi.addEventListener('click', function() {
            tampilkanTab('transaksi');
            renderLaporanTransaksi();
        });
    }
    if (btnSparepart) {
        btnSparepart.addEventListener('click', function() {
            tampilkanTab('sparepart');
            renderLaporanSparepart();
        });
    }

    // ===== INISIALISASI: TAMPILKAN TAB KEUANGAN =====
    tampilkanTab('keuangan');
    renderLaporanKeuangan();

    // ===== FILTER BULAN =====
    document.getElementById('filterBulanLaporan').addEventListener('change', function() {
        const activeTab = document.querySelector('.tab-btn-laporan.active');
        if (activeTab) {
            const tab = activeTab.dataset.tab;
            if (tab === 'keuangan') renderLaporanKeuangan();
            else if (tab === 'transaksi') renderLaporanTransaksi();
            else if (tab === 'sparepart') renderLaporanSparepart();
        }
    });

    // ===== EXPORT CSV =====
    document.getElementById('btnExportLaporan').addEventListener('click', function() {
        const activeTab = document.querySelector('.tab-btn-laporan.active');
        if (!activeTab) return;
        const tab = activeTab.dataset.tab;
        if (tab === 'keuangan') exportCSVKeuangan();
        else if (tab === 'transaksi') exportCSVTransaksi();
        else if (tab === 'sparepart') exportCSVSparepart();
    });
});

// ==========================================
// FILTER BULAN
// ==========================================
function getFilterBulan() {
    return document.getElementById('filterBulanLaporan').value;
}

function filterByBulan(transaksiList) {
    const bulan = getFilterBulan();
    if (bulan === 'all') return transaksiList;
    return transaksiList.filter(t => {
        const date = new Date(t.id);
        const tahunBulan = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return tahunBulan === bulan;
    });
}

// ==========================================
// RENDER LAPORAN KEUANGAN
// ==========================================
function renderLaporanKeuangan() {
    const tbody = document.getElementById('tbodyKeuangan');
    if (!tbody) return;
    const filtered = filterByBulan(transactions);
    const sorted = filtered.sort((a, b) => a.id - b.id);
    if (sorted.length === 0) {
        tbody.innerHTML = `<tr><td colspan="11" style="text-align:center;color:rgba(255,255,255,0.3);padding:30px;">Belum ada transaksi</td></tr>`;
        return;
    }
    let saldoDana = 0, saldoCash = 0, saldoAgen = 0, no = 1;
    tbody.innerHTML = sorted.map(t => {
        if (t.wallet === 'dana') saldoDana += t.tipe === 'pemasukan' ? t.nominal : -t.nominal;
        else if (t.wallet === 'cash') saldoCash += t.tipe === 'pemasukan' ? t.nominal : -t.nominal;
        else if (t.wallet === 'agen') saldoAgen += t.tipe === 'pemasukan' ? t.nominal : -t.nominal;
        const date = new Date(t.id);
        const tanggal = date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const uangKeluar = t.tipe === 'pengeluaran' ? t.nominal : 0;
        const uangMasuk = t.tipe === 'pemasukan' ? t.nominal : 0;
        const walletLabel = t.wallet === 'cash' ? 'Cash' : t.wallet === 'dana' ? 'Dana' : 'Agen Pulsa';
        return `
            <tr>
                <td>${no++}</td>
                <td>${tanggal}</td>
                <td>${t.kategori}</td>
                <td>${t.deskripsi || '-'}${t.keterangan && t.keterangan !== '-' ? ' - ' + t.keterangan : ''}</td>
                <td>${t.tipe === 'pengeluaran' ? walletLabel : '-'}</td>
                <td>${t.tipe === 'pemasukan' ? walletLabel : '-'}</td>
                <td class="nominal-minus">${uangKeluar > 0 ? 'Rp ' + uangKeluar.toLocaleString('id-ID') : '-'}</td>
                <td class="nominal-plus">${uangMasuk > 0 ? 'Rp ' + uangMasuk.toLocaleString('id-ID') : '-'}</td>
                <td class="nominal-neutral">Rp ${saldoDana.toLocaleString('id-ID')}</td>
                <td class="nominal-neutral">Rp ${saldoCash.toLocaleString('id-ID')}</td>
                <td class="nominal-neutral">Rp ${saldoAgen.toLocaleString('id-ID')}</td>
            </tr>
        `;
    }).join('');
}

// ==========================================
// RENDER LAPORAN TRANSAKSI
// ==========================================
function renderLaporanTransaksi() {
    const tbody = document.getElementById('tbodyTransaksi');
    if (!tbody) return;
    const sorted = [...transactions].sort((a, b) => a.id - b.id);
    if (sorted.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:rgba(255,255,255,0.3);padding:30px;">📭 Belum ada transaksi</td></tr>`;
        return;
    }
    let rows = '';
    sorted.forEach((t, index) => {
        try {
            const date = new Date(t.id);
            const tanggal = date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
            let metode = t.metodeBayar || t.metode || '';
            if (!metode) {
                if (t.wallet === 'cash') metode = 'Cash';
                else if (t.wallet === 'dana') metode = 'Dana';
                else if (t.wallet === 'agen') metode = 'Agen Pulsa';
                else metode = '-';
            }
            const keterangan = (t.deskripsi || '') + (t.keterangan && t.keterangan !== '-' ? ' - ' + t.keterangan : '') || '-';
            const nominal = Number(t.nominal) || 0;
            rows += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${tanggal}</td>
                    <td>${t.kategori || '-'}</td>
                    <td>${keterangan}</td>
                    <td>Rp ${nominal.toLocaleString('id-ID')}</td>
                    <td>${metode}</td>
                </tr>
            `;
        } catch (err) {
            console.error('Error processing transaction:', t, err);
        }
    });
    tbody.innerHTML = rows;
    console.log(`✅ Tabel transaksi diisi dengan ${sorted.length} baris.`);
}

// ==========================================
// RENDER LAPORAN SPAREPART
// ==========================================
function renderLaporanSparepart() {
    const tbody = document.getElementById('tbodySparepart');
    if (!tbody) return;
    let sparepartTrans = transactions.filter(t => 
        t.kategori === 'Servis HP (Sparepart)' || 
        (t.kategori === 'Servis HP' && t.perluSparepart === 'ya')
    );
    const filtered = filterByBulan(sparepartTrans);
    const sorted = filtered.sort((a, b) => a.id - b.id);
    if (sorted.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:rgba(255,255,255,0.3);padding:30px;">Belum ada transaksi sparepart</td></tr>`;
        return;
    }
    let no = 1;
    tbody.innerHTML = sorted.map(t => {
        const date = new Date(t.id);
        const tanggal = date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const namaSparepart = t.sparepartNama || t.deskripsi?.replace('Beli ', '') || '-';
        const metode = t.metodeBayar || t.wallet || 'Cash';
        const jumlah = t.jumlah || 1;
        return `
            <tr>
                <td>${no++}</td>
                <td>${tanggal}</td>
                <td>${namaSparepart}</td>
                <td>${jumlah}</td>
                <td>Rp ${t.nominal.toLocaleString('id-ID')}</td>
                <td>${metode}</td>
            </tr>
        `;
    }).join('');
}

// ==========================================
// EXPORT CSV
// ==========================================
function exportCSVKeuangan() {
    const filtered = filterByBulan(transactions);
    const sorted = filtered.sort((a, b) => a.id - b.id);
    if (sorted.length === 0) { alert('Tidak ada data untuk diexport!'); return; }
    let csv = 'NO,Tanggal,Jenis Transaksi,Keterangan,Uang Keluar Dari,Uang Masuk Dari,Uang Keluar,Uang Masuk,Saldo Dana,Saldo Cash,Saldo Agen Pulsa\n';
    let saldoDana = 0, saldoCash = 0, saldoAgen = 0, no = 1;
    sorted.forEach(t => {
        if (t.wallet === 'dana') saldoDana += t.tipe === 'pemasukan' ? t.nominal : -t.nominal;
        else if (t.wallet === 'cash') saldoCash += t.tipe === 'pemasukan' ? t.nominal : -t.nominal;
        else if (t.wallet === 'agen') saldoAgen += t.tipe === 'pemasukan' ? t.nominal : -t.nominal;
        const date = new Date(t.id);
        const tanggal = date.toLocaleDateString('id-ID');
        const walletLabel = t.wallet === 'cash' ? 'Cash' : t.wallet === 'dana' ? 'Dana' : 'Agen Pulsa';
        const uangKeluar = t.tipe === 'pengeluaran' ? t.nominal : 0;
        const uangMasuk = t.tipe === 'pemasukan' ? t.nominal : 0;
        csv += `${no++},${tanggal},${t.kategori},${t.deskripsi || t.keterangan || '-'},${t.tipe === 'pengeluaran' ? walletLabel : '-'},${t.tipe === 'pemasukan' ? walletLabel : '-'},${uangKeluar},${uangMasuk},${saldoDana},${saldoCash},${saldoAgen}\n`;
    });
    downloadCSV(csv, 'laporan-keuangan');
}

function exportCSVTransaksi() {
    const filtered = filterByBulan(transactions);
    const sorted = filtered.sort((a, b) => a.id - b.id);
    if (sorted.length === 0) { alert('Tidak ada data untuk diexport!'); return; }
    let csv = 'NO,Tanggal,Jenis Transaksi,Keterangan,Harga,Metode Pembayaran\n';
    let no = 1;
    sorted.forEach(t => {
        const date = new Date(t.id);
        const tanggal = date.toLocaleDateString('id-ID');
        const metode = t.metodeBayar || t.metode || (t.wallet === 'cash' ? 'Cash' : t.wallet === 'dana' ? 'Dana' : 'Agen');
        csv += `${no++},${tanggal},${t.kategori},${t.deskripsi || t.keterangan || '-'},${t.nominal},${metode}\n`;
    });
    downloadCSV(csv, 'laporan-transaksi');
}

function exportCSVSparepart() {
    let sparepartTrans = transactions.filter(t => t.kategori === 'Servis HP (Sparepart)' || (t.kategori === 'Servis HP' && t.perluSparepart === 'ya'));
    const filtered = filterByBulan(sparepartTrans);
    const sorted = filtered.sort((a, b) => a.id - b.id);
    if (sorted.length === 0) { alert('Tidak ada data sparepart untuk diexport!'); return; }
    let csv = 'NO,Tanggal,Nama Sparepart,Jumlah,Nominal Harga,Metode Pembayaran\n';
    let no = 1;
    sorted.forEach(t => {
        const date = new Date(t.id);
        const tanggal = date.toLocaleDateString('id-ID');
        const namaSparepart = t.sparepartNama || t.deskripsi?.replace('Beli ', '') || '-';
        const metode = t.metodeBayar || t.wallet || 'Cash';
        const jumlah = t.jumlah || 1;
        csv += `${no++},${tanggal},${namaSparepart},${jumlah},${t.nominal},${metode}\n`;
    });
    downloadCSV(csv, 'laporan-sparepart');
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}-${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}