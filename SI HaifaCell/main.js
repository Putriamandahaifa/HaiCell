// ===== DATABASE =====
const db = new Dexie('KeuanganDatabase');
db.version(1).stores({
    balances: 'id',
    transactions: 'id'
});

const defaultBalances = { cash: 1500000, dana: 500000, agen: 250000 };

// ===== DATA GLOBAL =====
let initialBalances = { cash: 1500000, dana: 500000, agen: 250000 };
let transactions = [];
let activityLogs = [];

// ===== SAVE DATA =====
async function saveAllData() {
    try {
        await db.balances.put({ id: 'initial', ...initialBalances });
        await db.transactions.bulkPut(transactions);
        console.log('Data saved successfully!');
    } catch (error) {
        console.error('Failed to save data:', error);
    }
}

// ===== LOAD DATA =====
async function loadAllData() {
    try {
        const savedBalance = await db.balances.get('initial');
        if (savedBalance) {
            initialBalances = savedBalance;
            delete initialBalances.id;
        } else {
            initialBalances = { ...defaultBalances };
            await saveAllData();
        }

        const savedTransactions = await db.transactions.toArray();
        if (savedTransactions.length > 0) {
            transactions = savedTransactions;
        } else {
            transactions = [];
        }

        renderTransaksi();
        updateSaldo();
    } catch (error) {
        console.error('Failed to load data:', error);
    }
}

// ===== SPLASH SCREEN =====
document.addEventListener('DOMContentLoaded', function() {
    const splash = document.getElementById('splash-screen');
    const dashboard = document.getElementById('page-dashboard');
    const progress = document.getElementById('progress');

    let progressValue = 0;
    const duration = 2000;
    const interval = 50;

    const timer = setInterval(() => {
        progressValue += (interval / duration) * 100;
        if (progressValue >= 100) {
            progressValue = 100;
            clearInterval(timer);
            setTimeout(() => {
                splash.classList.add('hide');
                dashboard.style.display = 'block';
                setTimeout(() => {
                    splash.style.display = 'none';
                }, 800);
                initApp();
                loadAllData();
            }, 500);
        }
        progress.style.width = progressValue + '%';
    }, interval);
});

// ===== INIT APP =====
function initApp() {
    const dashboardPage = document.getElementById('page-dashboard');
    const transaksiPage = document.getElementById('page-transaksi');
    const btnBack = document.getElementById('btnBackDashboard');
    const btnEdit = document.getElementById('btnEditSaldo');
    const modal = document.getElementById('editSaldoModal');
    const btnCancel = document.getElementById('btnCancelEdit');
    const btnSave = document.getElementById('btnSaveEdit');

    // ===== SIDEBAR NAVIGATION =====
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    function toggleSidebar() {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    }

    hamburgerBtn.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', closeSidebar);

    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;

            document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.page').forEach(p => p.style.display = 'none');

            const targetPage = document.getElementById(`page-${page}`);
            if (targetPage) targetPage.style.display = 'block';

            if (page === 'log') renderLog();
            if (page === 'kelola') renderRiwayat();
            if (page === 'grafik') renderGrafik();
            if (page === 'laporan') renderLaporan();
            if (page === 'pengaturan') updatePengaturan();

            closeSidebar();
        });
    });

    // ===== NAVBAR: TAMPILKAN FORM KATEGORI =====
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const kategori = this.dataset.kategori;

            document.querySelectorAll('.form-category').forEach(f => f.style.display = 'none');

            const formMap = {
                'Servis HP': 'form-servis',
                'Aksesoris': 'form-aksesoris',
                'Dana': 'form-dana',
                'Agen Pulsa': 'form-agen'
            };
            const targetForm = document.getElementById(formMap[kategori]);
            if (targetForm) targetForm.style.display = 'block';

            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            dashboardPage.style.display = 'none';
            transaksiPage.style.display = 'block';
            document.getElementById('transaksi-title').textContent = `Tambah Transaksi - ${kategori}`;
            document.getElementById('walletInfo').textContent = `📌 Kategori: ${kategori}`;
        });
    });

    // ===== TOMBOL KEMBALI =====
    btnBack.addEventListener('click', function() {
        transaksiPage.style.display = 'none';
        dashboardPage.style.display = 'block';
        updateSaldo();
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    });

    // ===== MODAL EDIT SALDO =====
    btnEdit.addEventListener('click', function() {
        document.getElementById('editCash').value = initialBalances.cash;
        document.getElementById('editDana').value = initialBalances.dana;
        document.getElementById('editAgen').value = initialBalances.agen;
        modal.style.display = 'flex';
    });
    btnCancel.addEventListener('click', function() { modal.style.display = 'none'; });
    btnSave.addEventListener('click', function() {
        initialBalances.cash = parseInt(document.getElementById('editCash').value) || 0;
        initialBalances.dana = parseInt(document.getElementById('editDana').value) || 0;
        initialBalances.agen = parseInt(document.getElementById('editAgen').value) || 0;
        modal.style.display = 'none';
        saveAllData();
        updateSaldo();
        alert('Saldo awal berhasil diupdate!');
    });
    modal.addEventListener('click', function(e) { if (e.target === this) this.style.display = 'none'; });

    // ===== TOGGLE SPAREPART =====
    const sparepartSelect = document.getElementById('servis-perlu-sparepart');
    const sparepartDetail = document.getElementById('servis-sparepart-detail');
    if (sparepartSelect && sparepartDetail) {
        sparepartSelect.addEventListener('change', function() {
            sparepartDetail.style.display = this.value === 'ya' ? 'block' : 'none';
        });
    }

    // ===== FORM SERVIS =====
    document.getElementById('formServis').addEventListener('submit', function(e) {
        e.preventDefault();
        const perluSparepart = document.getElementById('servis-perlu-sparepart').value;
        const sparepartNama = document.getElementById('servis-sparepart-nama')?.value || '';
        const sparepartHarga = parseInt(document.getElementById('servis-sparepart-harga')?.value) || 0;
        const sparepartSumber = document.getElementById('servis-sparepart-sumber')?.value || 'cash';

        const data = {
            kategori: 'Servis HP',
            kerusakan: document.getElementById('servis-kerusakan').value,
            nominal: parseInt(document.getElementById('servis-nominal').value),
            metode: document.getElementById('servis-metode-bayar').value,
            perluSparepart: perluSparepart,
            sparepart: perluSparepart === 'ya' ? { nama: sparepartNama, harga: sparepartHarga, sumber: sparepartSumber } : null
        };

        transactions.push({ id: Date.now(), ...data, wallet: data.metode, tipe: 'pemasukan' });

        if (perluSparepart === 'ya' && sparepartHarga > 0) {
            transactions.push({
                id: Date.now() + 1,
                kategori: 'Servis HP (Sparepart)',
                deskripsi: `Beli ${sparepartNama}`,
                nominal: sparepartHarga,
                wallet: sparepartSumber,
                tipe: 'pengeluaran'
            });
        }

        this.reset();
        document.getElementById('servis-sparepart-detail').style.display = 'none';
        renderTransaksi();
        updateSaldo();
        saveAllData();
        alert('✅ Transaksi Servis disimpan!');
    });

    // ===== FORM AKSESORIS =====
    document.getElementById('formAksesoris').addEventListener('submit', function(e) {
        e.preventDefault();
        const data = {
            kategori: 'Aksesoris',
            nama: document.getElementById('aksesoris-nama').value,
            nominal: parseInt(document.getElementById('aksesoris-nominal').value),
            metode: document.getElementById('aksesoris-metode-bayar').value,
        };
        transactions.push({ id: Date.now(), ...data, wallet: data.metode, tipe: 'pemasukan' });
        this.reset();
        renderTransaksi();
        updateSaldo();
        saveAllData();
        alert('✅ Transaksi Aksesoris disimpan!');
    });

    // ===== FORM DANA =====
    document.getElementById('formDana').addEventListener('submit', function(e) {
        e.preventDefault();
        const tipe = document.getElementById('dana-tipe').value;
        const nominal = parseInt(document.getElementById('dana-nominal').value);

        if (tipe === 'topup') {
            transactions.push({ id: Date.now(), kategori: 'Dana', deskripsi: 'Top Up Dana', nominal: nominal, wallet: 'dana', tipe: 'pengeluaran' });
            transactions.push({ id: Date.now()+1, kategori: 'Dana', deskripsi: 'Top Up Dana (Cash Masuk)', nominal: nominal, wallet: 'cash', tipe: 'pemasukan' });
        } else {
            transactions.push({ id: Date.now(), kategori: 'Dana', deskripsi: 'Tarik Dana', nominal: nominal, wallet: 'dana', tipe: 'pemasukan' });
            transactions.push({ id: Date.now()+1, kategori: 'Dana', deskripsi: 'Tarik Dana (Cash Keluar)', nominal: nominal, wallet: 'cash', tipe: 'pengeluaran' });
        }
        this.reset();
        renderTransaksi();
        updateSaldo();
        saveAllData();
        alert('✅ Transaksi Dana disimpan!');
    });

    // ===== FORM AGEN =====
    document.getElementById('formAgen').addEventListener('submit', function(e) {
        e.preventDefault();
        const produk = document.getElementById('agen-produk').value;
        const nominal = parseInt(document.getElementById('agen-nominal').value);
        const metode = document.getElementById('agen-metode-bayar').value;

        transactions.push({ id: Date.now(), kategori: 'Agen Pulsa', deskripsi: `Beli ${produk}`, nominal: nominal, wallet: 'agen', tipe: 'pengeluaran' });
        transactions.push({ id: Date.now()+1, kategori: 'Agen Pulsa', deskripsi: `Pembayaran ${produk}`, nominal: nominal, wallet: metode, tipe: 'pemasukan' });

        this.reset();
        renderTransaksi();
        updateSaldo();
        saveAllData();
        alert('✅ Transaksi Agen Pulsa disimpan!');
    });

    // ===== MODAL EDIT TRANSAKSI =====
    document.getElementById('btnCancelEditTransaksi').addEventListener('click', function() {
        document.getElementById('editTransaksiModal').style.display = 'none';
    });

    document.getElementById('formEditTransaksi').addEventListener('submit', function(e) {
        e.preventDefault();
        const id = parseInt(document.getElementById('edit-transaction-id').value);
        const index = transactions.findIndex(t => t.id === id);
        if (index === -1) return;

        const oldData = { ...transactions[index] };

        transactions[index] = {
            ...transactions[index],
            deskripsi: document.getElementById('edit-deskripsi').value,
            nominal: parseInt(document.getElementById('edit-nominal').value),
            tipe: document.getElementById('edit-tipe').value,
            wallet: document.getElementById('edit-wallet').value
        };

        addActivityLog('edited', id, { before: oldData, after: transactions[index] });

        document.getElementById('editTransaksiModal').style.display = 'none';
        renderRiwayat();
        renderTransaksi();
        updateSaldo();
        saveAllData();
        alert('✅ Transaksi berhasil diupdate!');
    });

    // ===== FILTER KATEGORI =====
    document.getElementById('filterKategori')?.addEventListener('change', renderRiwayat);

    // ===== FILTER BULAN =====
    document.getElementById('filterBulan')?.addEventListener('change', renderLaporan);

    // ===== EXPORT LAPORAN =====
    document.getElementById('btnExportLaporan')?.addEventListener('click', exportCSV);

    // ===== BACKUP & RESTORE =====
    document.getElementById('btnBackupData')?.addEventListener('click', function() {
        const data = { balances: initialBalances, transactions: transactions, logs: activityLogs };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-keuangan-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        alert('✅ Backup berhasil!');
    });

    document.getElementById('btnRestoreData')?.addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = function(e) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const data = JSON.parse(event.target.result);
                    initialBalances = data.balances || initialBalances;
                    transactions = data.transactions || [];
                    activityLogs = data.logs || [];
                    saveAllData();
                    renderTransaksi();
                    updateSaldo();
                    alert('✅ Restore berhasil!');
                } catch (err) {
                    alert('❌ File tidak valid!');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    });

    // ===== INISIALISASI =====
    renderTransaksi();
    updateSaldo();
}

// ===== HITUNG SALDO =====
function calculateBalance(wallet) {
    let total = initialBalances[wallet] || 0;
    transactions.forEach(t => {
        if (t.wallet === wallet) {
            if (t.tipe === 'pemasukan') total += t.nominal;
            else total -= t.nominal;
        }
    });
    return total;
}

// ===== UPDATE SALDO =====
function updateSaldo() {
    document.getElementById('saldo-cash').textContent = 'Rp ' + calculateBalance('cash').toLocaleString('id-ID');
    document.getElementById('saldo-dana').textContent = 'Rp ' + calculateBalance('dana').toLocaleString('id-ID');
    document.getElementById('saldo-agen').textContent = 'Rp ' + calculateBalance('agen').toLocaleString('id-ID');
}

// ===== RENDER TRANSAKSI (di dashboard) =====
function renderTransaksi() {
    const list = document.getElementById('listTransaksi');
    const walletMap = { cash: 'Cash', dana: 'Dana', agen: 'Agen' };

    if (transactions.length === 0) {
        list.innerHTML = '<li style="text-align:center; color:rgba(255,255,255,0.3); padding:20px;">Belum ada transaksi</li>';
        return;
    }

    const sorted = [...transactions].reverse().slice(0, 10);
    list.innerHTML = sorted.map(t => `
        <li class="${t.tipe}">
            <div>
                <strong>${t.deskripsi || t.nama || '-'}</strong>
                <span class="kategori">${walletMap[t.wallet] || t.wallet}</span>
                <span style="font-size:11px;color:rgba(255,255,255,0.3);margin-left:6px;">${t.kategori}</span>
            </div>
            <span class="nominal" style="color:${t.tipe === 'pemasukan' ? '#4ade80' : '#f87171'}">
                ${t.tipe === 'pemasukan' ? '+' : '-'} Rp ${t.nominal.toLocaleString('id-ID')}
            </span>
        </li>
    `).join('');
}

// ===== RENDER RIWAYAT (halaman kelola) =====
function renderRiwayat() {
    const list = document.getElementById('listRiwayat');
    const filter = document.getElementById('filterKategori').value;

    let filtered = transactions;
    if (filter !== 'all') {
        filtered = transactions.filter(t => t.kategori === filter);
    }

    if (filtered.length === 0) {
        list.innerHTML = '<li style="text-align:center; color:rgba(255,255,255,0.3); padding:20px;">Belum ada transaksi</li>';
        return;
    }

    const sorted = [...filtered].reverse();
    list.innerHTML = sorted.map(t => `
        <li class="${t.tipe}">
            <div>
                <strong>${t.deskripsi || t.nama || '-'}</strong>
                <span class="kategori">${t.kategori}</span>
                <span style="font-size:11px;color:rgba(255,255,255,0.3);margin-left:6px;">
                    ${t.wallet === 'cash' ? '💰' : t.wallet === 'dana' ? '💳' : '📱'}
                </span>
            </div>
            <div class="aksi">
                <button class="edit" onclick="openEditModal(${t.id})">✏️</button>
                <button class="delete" onclick="deleteTransaksi(${t.id})">🗑️</button>
            </div>
        </li>
    `).join('');
}

// ===== OPEN EDIT MODAL =====
function openEditModal(id) {
    const transaksi = transactions.find(t => t.id === id);
    if (!transaksi) return;

    document.getElementById('edit-transaction-id').value = id;
    document.getElementById('edit-deskripsi').value = transaksi.deskripsi || transaksi.nama || '';
    document.getElementById('edit-nominal').value = transaksi.nominal;
    document.getElementById('edit-tipe').value = transaksi.tipe;
    document.getElementById('edit-wallet').value = transaksi.wallet;

    document.getElementById('editTransaksiModal').style.display = 'flex';
}

// ===== DELETE TRANSAKSI =====
async function deleteTransaksi(id) {
    if (!confirm('Yakin mau hapus transaksi ini?')) return;

    const transaksi = transactions.find(t => t.id === id);
    if (!transaksi) return;

    addActivityLog('deleted', id, { before: transaksi });

    transactions = transactions.filter(t => t.id !== id);
    renderRiwayat();
    renderTransaksi();
    updateSaldo();
    saveAllData();
    alert('🗑️ Transaksi berhasil dihapus!');
}

// ===== ADD ACTIVITY LOG =====
function addActivityLog(action, transactionId, details) {
    const log = {
        timestamp: new Date().toLocaleString('id-ID', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        }),
        action: action,
        transactionId: transactionId,
        details: details
    };
    activityLogs.push(log);
}

// ===== RENDER LOG =====
function renderLog() {
    const list = document.getElementById('listLog');

    if (activityLogs.length === 0) {
        list.innerHTML = '<li style="text-align:center; color:rgba(255,255,255,0.3); padding:20px;">Belum ada aktivitas</li>';
        return;
    }

    const sorted = [...activityLogs].reverse();
    list.innerHTML = sorted.map(log => `
        <li class="action-${log.action}">
            <div>
                ${log.action === 'added' ? '✅' : log.action === 'edited' ? '✏️' : '🗑️'}
                ${log.action === 'edited' ? 'Mengedit' : log.action === 'deleted' ? 'Menghapus' : 'Menambah'} transaksi
                ${log.transactionId ? `(ID: ${log.transactionId})` : ''}
            </div>
            <div class="time">${log.timestamp}</div>
        </li>
    `).join('');
}

// ===== RENDER GRAFIK =====
function renderGrafik() {
    let pemasukan = 0, pengeluaran = 0;
    transactions.forEach(t => {
        if (t.tipe === 'pemasukan') pemasukan += t.nominal;
        else pengeluaran += t.nominal;
    });

    const ctx1 = document.getElementById('chartKeuangan');
    if (ctx1) {
        new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: ['Pemasukan', 'Pengeluaran'],
                datasets: [{
                    data: [pemasukan, pengeluaran],
                    backgroundColor: ['#4ade80', '#f87171'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { labels: { color: 'white' } } }
            }
        });
    }

    const kategoriMap = {};
    transactions.forEach(t => {
        if (t.tipe === 'pemasukan') {
            kategoriMap[t.kategori] = (kategoriMap[t.kategori] || 0) + t.nominal;
        }
    });
    const labels = Object.keys(kategoriMap);
    const data = Object.values(kategoriMap);
    const colors = ['#e94560', '#f5a623', '#60a5fa', '#4ade80', '#a78bfa'];

    const ctx2 = document.getElementById('chartKategori');
    if (ctx2) {
        new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Pemasukan per Kategori',
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { color: 'rgba(255,255,255,0.5)' } },
                    x: { ticks: { color: 'rgba(255,255,255,0.5)' } }
                }
            }
        });
    }
}

// ===== RENDER LAPORAN =====
function renderLaporan() {
    const content = document.getElementById('laporanContent');
    const filterBulan = document.getElementById('filterBulan').value;

    let filtered = transactions;
    if (filterBulan !== 'all') {
        filtered = transactions.filter(t => {
            const date = new Date(t.id);
            const bulan = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
            return bulan === filterBulan;
        });
    }

    const totalPemasukan = filtered.filter(t => t.tipe === 'pemasukan').reduce((sum, t) => sum + t.nominal, 0);
    const totalPengeluaran = filtered.filter(t => t.tipe === 'pengeluaran').reduce((sum, t) => sum + t.nominal, 0);
    const saldo = totalPemasukan - totalPengeluaran;

    content.innerHTML = `
        <div style="background:rgba(255,255,255,0.04);border-radius:16px;padding:20px;">
            <h3 style="color:rgba(255,255,255,0.6);font-size:14px;">Ringkasan</h3>
            <p style="color:#4ade80;font-size:24px;font-weight:700;">+ Rp ${totalPemasukan.toLocaleString('id-ID')}</p>
            <p style="color:#f87171;font-size:24px;font-weight:700;">- Rp ${totalPengeluaran.toLocaleString('id-ID')}</p>
            <p style="color:white;font-size:20px;font-weight:700;margin-top:8px;border-top:1px solid rgba(255,255,255,0.06);padding-top:8px;">
                Saldo: Rp ${saldo.toLocaleString('id-ID')}
            </p>
            <p style="color:rgba(255,255,255,0.3);font-size:12px;margin-top:8px;">
                ${filtered.length} transaksi
            </p>
        </div>
    `;
}

// ===== EXPORT CSV =====
function exportCSV() {
    if (transactions.length === 0) {
        alert('Belum ada transaksi untuk diexport!');
        return;
    }

    let csv = 'Tanggal,Kategori,Deskripsi,Nominal,Tipe,Wallet\n';
    transactions.forEach(t => {
        const date = new Date(t.id).toLocaleDateString('id-ID');
        csv += `${date},${t.kategori},${t.deskripsi || ''},${t.nominal},${t.tipe},${t.wallet}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-keuangan-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ===== UPDATE PENGATURAN =====
function updatePengaturan() {
    document.getElementById('totalTransaksi').textContent = transactions.length;
    document.getElementById('infoCash').textContent = `Rp ${calculateBalance('cash').toLocaleString('id-ID')}`;
    document.getElementById('infoDana').textContent = `Rp ${calculateBalance('dana').toLocaleString('id-ID')}`;
    document.getElementById('infoAgen').textContent = `Rp ${calculateBalance('agen').toLocaleString('id-ID')}`;
}