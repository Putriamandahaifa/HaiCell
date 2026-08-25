// ==========================================
// HEADER - PENGATURAN
// ==========================================
document.getElementById('headerSettingsBtn')?.addEventListener('click', function() {
    // Pindah ke halaman Pengaturan
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    
    const pagePengaturan = document.getElementById('page-pengaturan');
    if (pagePengaturan) {
        pagePengaturan.style.display = 'block';
    }

    // Update active state di bottom nav (opsional)
    document.querySelectorAll('.bottom-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.page === 'pengaturan') {
            btn.classList.add('active');
        }
    });

     // Update active state di sidebar (opsional)
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === 'pengaturan') {
            item.classList.add('active');
        }
    });
});

// ==========================================
// DATABASE (IndexedDB)
// ==========================================
const db = new Dexie('HaifaCellDB');
db.version(1).stores({
    balances: 'id',
    transactions: 'id',
    logs: '++id, timestamp, action'
});

// Data awal
const defaultBalances = { dana: 0, cash: 0, agen: 0 };

// State global
let initialBalances = { ...defaultBalances };
let transactions = [];
let logs = [];

// ==========================================
// SPLASH SCREEN
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    const splash = document.getElementById('splash-screen');
    const progress = document.getElementById('progress');
    let progressValue = 0;

    const timer = setInterval(() => {
        progressValue += 2.5;
        if (progressValue >= 100) {
            progressValue = 100;
            clearInterval(timer);
            setTimeout(() => {
                splash.classList.add('hide');
                setTimeout(() => splash.style.display = 'none', 800);
                initApp();
                loadAllData();
            }, 500);
        }
        progress.style.width = progressValue + '%';
    }, 50);
});

// ==========================================
// LOAD & SAVE DATA
// ==========================================
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

        transactions = await db.transactions.toArray() || [];
        logs = await db.logs.toArray() || [];

        updateSaldo();
        renderRiwayatSingkat();
    } catch (error) {
        console.error('Gagal load data:', error);
    }
}

async function saveAllData() {
    try {
        await db.balances.put({ id: 'initial', ...initialBalances });
        await db.transactions.bulkPut(transactions);
        await db.logs.bulkPut(logs);
        console.log('✅ Data tersimpan!');
    } catch (error) {
        console.error('Gagal save data:', error);
    }
}

// ==========================================
// FUNGSI GLOBAL
// ==========================================
function calculateBalance(wallet) {
    let total = initialBalances[wallet] || 0;
    transactions.forEach(t => {
        if (t.wallet === wallet) {
            total += t.tipe === 'pemasukan' ? t.nominal : -t.nominal;
        }
    });
    return total;
}

function updateSaldo() {
    const dana = calculateBalance('dana');
    const cash = calculateBalance('cash');
    const agen = calculateBalance('agen');
    document.getElementById('saldo-dana').textContent = 'Rp ' + dana.toLocaleString('id-ID');
    document.getElementById('saldo-cash').textContent = 'Rp ' + cash.toLocaleString('id-ID');
    document.getElementById('saldo-agen').textContent = 'Rp ' + agen.toLocaleString('id-ID');
}

function addLog(action, transactionId, details) {
    logs.push({
        timestamp: new Date().toLocaleString('id-ID'),
        action: action,
        transactionId: transactionId || null,
        details: details || {}
    });
    saveAllData();
}

// ==========================================
// INISIALISASI APP
// ==========================================
function initApp() {
    // ===== EDIT SALDO =====
    const btnEdit = document.getElementById('btnEditSaldo');
    const modal = document.getElementById('editSaldoModal');
    const btnCancel = document.getElementById('btnCancelEdit');
    const btnSave = document.getElementById('btnSaveEdit');

    btnEdit.addEventListener('click', () => {
        document.getElementById('editDana').value = initialBalances.dana;
        document.getElementById('editCash').value = initialBalances.cash;
        document.getElementById('editAgen').value = initialBalances.agen;
        modal.style.display = 'flex';
    });

    btnCancel.addEventListener('click', () => modal.style.display = 'none');

    btnSave.addEventListener('click', () => {
        const oldBalances = { ...initialBalances };
        initialBalances.dana = parseInt(document.getElementById('editDana').value) || 0;
        initialBalances.cash = parseInt(document.getElementById('editCash').value) || 0;
        initialBalances.agen = parseInt(document.getElementById('editAgen').value) || 0;
        modal.style.display = 'none';
        saveAllData();
        updateSaldo();
        addLog('edit_saldo', null, { before: oldBalances, after: { ...initialBalances } });
        alert('✅ Saldo berhasil diupdate!');
    });

    // Klik di luar modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    // ===== BOTTOM NAV =====
    document.querySelectorAll('.bottom-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const page = this.dataset.page;
            document.querySelectorAll('.bottom-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
            const target = document.getElementById(`page-${page}`);
            if (target) target.style.display = 'block';
            if (page === 'riwayat') renderRiwayat();
            if (page === 'laporan') renderLaporan();
        });
    });
    
    // ===== BACKUP & RESTORE =====
    document.getElementById('btnBackupData')?.addEventListener('click', function() {
        if (transactions.length === 0) {
            alert('Belum ada data untuk di-backup!');
            return;
        }
        
        const data = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            balances: initialBalances,
            transactions: transactions,
            logs: logs
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-haifa-cell-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        alert('✅ Backup berhasil! File sudah didownload.');
    });

    document.getElementById('btnRestoreData')?.addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    if (!data.balances || !data.transactions) {
                        alert('❌ File tidak valid! Pastikan file backup dari Haifa Cell.');
                        return;
                    }
                    
                    if (!confirm('⚠️ Restore akan MENIMPA semua data yang ada saat ini. Lanjutkan?')) return;
                    
                    initialBalances = data.balances;
                    transactions = data.transactions || [];
                    logs = data.logs || [];
                    
                    saveAllData();
                    updateSaldo();
                    renderRiwayatSingkat();
                    
                    alert(`✅ Restore berhasil!\n${transactions.length} transaksi dipulihkan.`);
                    
                } catch (err) {
                    alert('❌ Gagal membaca file! Pastikan file backup valid.');
                    console.error('Restore error:', err);
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    });
}
