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
}