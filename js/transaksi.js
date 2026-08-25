// ==========================================
// FORM TRANSAKSI DANA
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    const formDana = document.getElementById('formDana');
    if (!formDana) return;

    // Variabel untuk menyimpan data sementara
    let pendingTransaksi = null;

    formDana.addEventListener('submit', function(e) {
        e.preventDefault();

        const tipe = document.getElementById('dana-tipe').value;
        const nominal = parseInt(document.getElementById('dana-nominal').value);
        const biayaAdmin = parseInt(document.getElementById('dana-biaya-admin').value) || 0;

        if (!nominal || nominal <= 0) {
            alert('Masukkan nominal yang valid!');
            return;
        }

        // Simpan data ke variabel sementara
        pendingTransaksi = { tipe, nominal, biayaAdmin};

        // Tampilkan modal konfirmasi pertama
        const modal = document.getElementById('modalKonfirmasiDana');
        const detail = document.getElementById('konfirmasi-detail');

        const tipeLabel = tipe === 'topup' ? 'Top Up Dana' : 'Tarik Tunai';

        detail.innerHTML = `
            <p><strong>Jenis:</strong> ${tipeLabel}</p>
            <p><strong>Nominal:</strong> Rp ${nominal.toLocaleString('id-ID')}</p>
            <p><strong>Biaya Admin:</strong> Rp ${biayaAdmin.toLocaleString('id-ID')}</p>
            <p style="color: rgba(255,255,255,0.3); font-size: 12px; margin-top: 8px;">
                ${tipe === 'topup' ? '💡 Dana akan bertambah, Cash akan bertambah (dari pembayaran customer).' : '💡 Dana akan bertambah (dari customer), Cash akan berkurang (ke customer).'}
            </p>
        `;

        // Simpan biaya admin ke pendingTransaksi juga
        pendingTransaksi.biayaAdmin = biayaAdmin;

        modal.style.display = 'flex';
    });

    // ===== TOMBOL "YA, POTONG" =====
    document.getElementById('konfirmasi-potong').addEventListener('click', function() {
        if (!pendingTransaksi) return;
        const { tipe, nominal, biayaAdmin } = pendingTransaksi;
        
        // Proses transaksi dengan potong admin dari nominal
        prosesTransaksi(tipe, nominal, biayaAdmin, true, null);
        
        document.getElementById('modalKonfirmasiDana').style.display = 'none';
        pendingTransaksi = null;
    });

    // ===== TOMBOL "TIDAK, PISAHKAN" =====
    document.getElementById('konfirmasi-pisahkan').addEventListener('click', function() {
        if (!pendingTransaksi) return;
        
        // Tutup modal pertama, buka modal kedua
        document.getElementById('modalKonfirmasiDana').style.display = 'none';
        document.getElementById('modalMetodeAdmin').style.display = 'flex';
    });

    // ===== TOMBOL METODE ADMIN =====
    document.getElementById('metode-admin-cash').addEventListener('click', function() {
        if (!pendingTransaksi) return;
        const { tipe, nominal, biayaAdmin } = pendingTransaksi;
        
        // Proses transaksi dengan admin terpisah ke Cash
        prosesTransaksi(tipe, nominal, biayaAdmin, false, 'cash');
        
        document.getElementById('modalMetodeAdmin').style.display = 'none';
        pendingTransaksi = null;
    });

    document.getElementById('metode-admin-dana').addEventListener('click', function() {
        if (!pendingTransaksi) return;
        const { tipe, nominal, biayaAdmin } = pendingTransaksi;
        
        // Proses transaksi dengan admin terpisah ke Dana
        prosesTransaksi(tipe, nominal, biayaAdmin, false, 'dana');
        
        document.getElementById('modalMetodeAdmin').style.display = 'none';
        pendingTransaksi = null;
    });

    // Tutup modal jika klik di luar
    document.getElementById('modalKonfirmasiDana').addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
            pendingTransaksi = null;
        }
    });

    document.getElementById('modalMetodeAdmin').addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
            pendingTransaksi = null;
        }
    });
});

// ==========================================
// FUNGSI PROSES TRANSAKSI DANA
// ==========================================
function prosesTransaksi(tipe, nominal, biayaAdmin, potongDariNominal, metodeAdmin) {
    if (tipe === 'topup') {
        // ===== TOP UP =====
        let danaKeluar = potongDariNominal ? (nominal - biayaAdmin) : nominal;
        
        transactions.push({
            id: Date.now(),
            kategori: 'Dana',
            deskripsi: 'Top Up Dana (Dana Keluar)',
            nominal: danaKeluar,
            wallet: 'dana',
            tipe: 'pengeluaran',
            biayaAdmin, metodeAdmin, potongDariNominal,
            timestamp: new Date().toISOString()
        });

        transactions.push({
            id: Date.now() + 1,
            kategori: 'Dana',
            deskripsi: 'Top Up Dana (Cash Masuk)',
            nominal: nominal,
            wallet: 'cash',
            tipe: 'pemasukan',
            biayaAdmin, metodeAdmin, potongDariNominal,
            timestamp: new Date().toISOString()
        });

        if (!potongDariNominal && biayaAdmin > 0 && metodeAdmin) {
            transactions.push({
                id: Date.now() + 2,
                kategori: 'Dana',
                deskripsi: `Biaya Admin Top Up (via ${metodeAdmin})`,
                nominal: biayaAdmin,
                wallet: metodeAdmin,
                tipe: 'pemasukan',
                biayaAdmin, metodeAdmin, potongDariNominal,
                timestamp: new Date().toISOString()
            });
        }

    } else {
        // ===== TARIK TUNAI =====
        let cashKeluar = potongDariNominal ? (nominal - biayaAdmin) : nominal;

        transactions.push({
            id: Date.now(),
            kategori: 'Dana',
            deskripsi: 'Tarik Dana (Dana Masuk)',
            nominal: nominal,
            wallet: 'dana',
            tipe: 'pemasukan',
            biayaAdmin, metodeAdmin, potongDariNominal,
            timestamp: new Date().toISOString()
        });

        transactions.push({
            id: Date.now() + 1,
            kategori: 'Dana',
            deskripsi: 'Tarik Dana (Cash Keluar)',
            nominal: cashKeluar,
            wallet: 'cash',
            tipe: 'pengeluaran',
            biayaAdmin, metodeAdmin, potongDariNominal,
            timestamp: new Date().toISOString()
        });

        if (!potongDariNominal && biayaAdmin > 0 && metodeAdmin) {
            transactions.push({
                id: Date.now() + 2,
                kategori: 'Dana',
                deskripsi: `Biaya Admin Tarik Dana (via ${metodeAdmin})`,
                nominal: biayaAdmin,
                wallet: metodeAdmin,
                tipe: 'pemasukan',
                biayaAdmin, metodeAdmin, potongDariNominal,
                timestamp: new Date().toISOString()
            });
        }
    }

    saveAllData();
    updateSaldo();
    renderRiwayatSingkat();
    document.getElementById('formDana').reset();
    addLog('tambah_transaksi', null, { tipe, nominal, biayaAdmin, potongDariNominal, metodeAdmin });
    alert('✅ Transaksi Dana berhasil disimpan!');
}
// ==========================================
// DANA SECTION ENDS
// ==========================================

// ==========================================
// FORM TRANSAKSI AKSESORIS & KARTU
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    const formAksesoris = document.getElementById('formAksesoris');
    if (!formAksesoris) return;
    
    formAksesoris.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const nama = document.getElementById('aksesoris-nama').value.trim();
        const nominal = parseInt(document.getElementById('aksesoris-nominal').value);
        const metode = document.getElementById('aksesoris-metode-bayar').value;
        
        if (!nama) {
            alert('Masukkan nama aksesoris!');
            return;
        }
        
        if (!nominal || nominal <= 0) {
            alert('Masukkan harga yang valid!');
            return;
        }
        
        // Simpan transaksi
        transactions.push({
            id: Date.now(),
            kategori: 'Aksesoris & Kartu',
            deskripsi: `Jual ${nama}`,
            keterangan: `Penjualan ${nama}`,
            nominal: nominal,
            wallet: metode, // uang masuk ke wallet sesuai metode bayar
            tipe: 'pemasukan',
            metodeBayar: metode,
            timestamp: new Date().toISOString()
        });
        
        // Simpan dan update
        saveAllData();
        updateSaldo();
        renderRiwayatSingkat();
        
        // Reset form
        formAksesoris.reset();
        
        // Log
        addLog('tambah_transaksi', null, {
            kategori: 'Aksesoris & Kartu',
            nama: nama,
            nominal: nominal,
            metode: metode
        });
        
        alert(`✅ Transaksi Aksesoris berhasil disimpan!\n${nama} - Rp ${nominal.toLocaleString('id-ID')}`);
    });
});
// ==========================================
// FORM TRANSAKSI AKSESORIS & KARTU ENDS
// ==========================================

// ==========================================
// FORM TRANSAKSI RESTOCK
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    const formRestock = document.getElementById('formRestock');
    if (!formRestock) return;
    
    formRestock.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const nama = document.getElementById('restock-nama').value.trim();
        const jumlah = parseInt(document.getElementById('restock-jumlah').value);
        const nominal = parseInt(document.getElementById('restock-nominal').value);
        const metode = document.getElementById('restock-metode-bayar').value;
        
        if (!nama) {
            alert('Masukkan nama barang!');
            return;
        }
        
        if (!jumlah || jumlah <= 0) {
            alert('Masukkan jumlah yang valid!');
            return;
        }
        
        if (!nominal || nominal <= 0) {
            alert('Masukkan nominal harga yang valid!');
            return;
        }
        
        // Simpan transaksi (pengeluaran)
        transactions.push({
            id: Date.now(),
            kategori: 'Restock',
            deskripsi: `Restock ${nama}`,
            keterangan: `Beli ${nama} x${jumlah}`,
            nominal: nominal,
            wallet: metode, // uang keluar dari wallet yang dipilih
            tipe: 'pengeluaran',
            metodeBayar: metode,
            jumlah: jumlah,
            timestamp: new Date().toISOString()
        });
        
        // Simpan dan update
        saveAllData();
        updateSaldo();
        renderRiwayatSingkat();
        
        // Reset form
        formRestock.reset();
        
        // Log
        addLog('tambah_transaksi', null, {
            kategori: 'Restock',
            nama: nama,
            jumlah: jumlah,
            nominal: nominal,
            metode: metode
        });
        
        alert(`✅ Transaksi Restock berhasil disimpan!\n${nama} x${jumlah} - Rp ${nominal.toLocaleString('id-ID')}`);
    });
});
// ==========================================
// FORM TRANSAKSI RESTOCK ENDS
// ==========================================

// ==========================================
// FORM TRANSAKSI AGEN PULSA
// ==========================================
// ==========================================
// FORM TRANSAKSI AGEN PULSA
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    const formAgen = document.getElementById('formAgen');
    if (!formAgen) return;
    
    // === TOGGLE INPUT "LAINNYA" ===
    const kategoriSelect = document.getElementById('agen-kategori');
    const kategoriLain = document.getElementById('agen-kategori-lain');
    
    kategoriSelect.addEventListener('change', function() {
        if (this.value === 'lainnya') {
            kategoriLain.style.display = 'block';
            kategoriLain.required = true;
        } else {
            kategoriLain.style.display = 'none';
            kategoriLain.required = false;
            kategoriLain.value = '';
        }
    });
    
    // === SUBMIT FORM ===
    formAgen.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Ambil kategori
        let kategori = kategoriSelect.value;
        if (kategori === 'lainnya') {
            kategori = kategoriLain.value.trim();
            if (!kategori) {
                alert('Masukkan kategori yang valid!');
                return;
            }
        }
        
        const kategoriMap = {
            'pulsa': 'Pulsa HP',
            'token': 'Token Listrik',
            'pdam': 'PDAM',
            'kuota': 'Kuota Data'
        };
        const kategoriLabel = kategoriMap[kategori] || kategori;
        
        const nominal = parseInt(document.getElementById('agen-nominal').value);
        const biayaAdmin = parseInt(document.getElementById('agen-biaya-admin').value) || 0;
        const metode = document.getElementById('agen-metode-bayar').value;
        const keterangan = document.getElementById('agen-keterangan').value.trim() || '-';
    
        if (!nominal || nominal <= 0) {
            alert('Masukkan nominal yang valid!');
            return;
        }
        
        // ===== TRANSAKSI DOUBLE WALLET + ADMIN =====
        
        // 1. Saldo Agen Pulsa berkurang (pengeluaran)
        transactions.push({
            id: Date.now(),
            kategori: 'Agen Pulsa',
            deskripsi: `Beli ${kategoriLabel}`,
            keterangan: keterangan,
            nominal: nominal,
            wallet: 'agen',
            tipe: 'pengeluaran',
            metodeBayar: metode,
            biayaAdmin: biayaAdmin,
            kategoriProduk: kategoriLabel,
            timestamp: new Date().toISOString()
        });
        
        // 2. Uang masuk ke wallet sesuai metode bayar (pemasukan dari pembeli)
        transactions.push({
            id: Date.now() + 1,
            kategori: 'Agen Pulsa',
            deskripsi: `Pembayaran ${kategoriLabel}`,
            keterangan: keterangan,
            nominal: nominal,
            wallet: metode,
            tipe: 'pemasukan',
            metodeBayar: metode,
            biayaAdmin: biayaAdmin,
            kategoriProduk: kategoriLabel,
            timestamp: new Date().toISOString()
        });
        
        // 3. Biaya admin otomatis masuk ke wallet yang sama (jika ada)
        if (biayaAdmin > 0) {
            transactions.push({
                id: Date.now() + 2,
                kategori: 'Agen Pulsa',
                deskripsi: `Biaya Admin ${kategoriLabel}`,
                keterangan: keterangan,
                nominal: biayaAdmin,
                wallet: metode, // admin mengikuti metode bayar
                tipe: 'pemasukan',
                metodeBayar: metode,
                biayaAdmin: biayaAdmin,
                kategoriProduk: kategoriLabel,
                timestamp: new Date().toISOString()
            });
        }
        
        // Simpan dan update
        saveAllData();
        updateSaldo();
        renderRiwayatSingkat();
        
        // Reset form
        document.getElementById('agen-nominal').value = '';
        document.getElementById('agen-biaya-admin').value = '0';
        document.getElementById('agen-metode-bayar').value = 'cash';
        document.getElementById('agen-keterangan').value = '';
        kategoriLain.style.display = 'none';
        kategoriLain.value = '';
        kategoriSelect.value = 'pulsa';
        
        // Log
        addLog('tambah_transaksi', null, {
            kategori: 'Agen Pulsa',
            produk: kategoriLabel,
            nominal: nominal,
            biayaAdmin: biayaAdmin,
            metode: metode,
            keterangan: keterangan
        });
        
        let msg = `✅ Transaksi Agen Pulsa berhasil disimpan!\n${kategoriLabel} - Rp ${nominal.toLocaleString('id-ID')}`;
        if (biayaAdmin > 0) {
            msg += `\n💳 Biaya Admin Rp ${biayaAdmin.toLocaleString('id-ID')} masuk ke ${metode === 'cash' ? 'Cash' : 'Dana'}`;
        }
        if (keterangan !== '-') {
            msg += `\n📝 Keterangan: ${keterangan}`; // 👈 BARU! tambahkan ke alert
        }
        alert(msg);
    });
});
// ==========================================
// FORM TRANSAKSI AGEN PULSA ENDS
// ==========================================

// ==========================================
// FORM TRANSAKSI SERVIS HP
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    const formServis = document.getElementById('formServis');
    if (!formServis) return;
    
    // === TOGGLE SPAREPART ===
    const perluSparepart = document.getElementById('servis-perlu-sparepart');
    const sparepartDetail = document.getElementById('servis-sparepart-detail');
    
    perluSparepart.addEventListener('change', function() {
        if (this.value === 'ya') {
            sparepartDetail.style.display = 'block';
            // Wajibkan field sparepart
            document.getElementById('servis-sparepart-nama').required = true;
            document.getElementById('servis-sparepart-harga').required = true;
        } else {
            sparepartDetail.style.display = 'none';
            document.getElementById('servis-sparepart-nama').required = false;
            document.getElementById('servis-sparepart-harga').required = false;
            // Reset nilai
            document.getElementById('servis-sparepart-nama').value = '';
            document.getElementById('servis-sparepart-harga').value = '';
        }
    });
    
    // === SUBMIT FORM ===
    formServis.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 1. Data Servis
        const kerusakan = document.getElementById('servis-kerusakan').value.trim();
        const hargaServis = parseInt(document.getElementById('servis-harga').value);
        const metodeBayar = document.getElementById('servis-metode-bayar').value;
        
        if (!kerusakan) {
            alert('Masukkan deskripsi kerusakan!');
            return;
        }
        
        if (!hargaServis || hargaServis <= 0) {
            alert('Masukkan harga servis yang valid!');
            return;
        }
        
        // 2. Data Sparepart (jika ada)
        const perluSparepartValue = perluSparepart.value;
        let sparepartNama = '';
        let sparepartHarga = 0;
        let sparepartSumber = 'cash';
        
        if (perluSparepartValue === 'ya') {
            sparepartNama = document.getElementById('servis-sparepart-nama').value.trim();
            sparepartHarga = parseInt(document.getElementById('servis-sparepart-harga').value);
            sparepartSumber = document.getElementById('servis-sparepart-sumber').value;
            
            if (!sparepartNama) {
                alert('Masukkan nama sparepart!');
                return;
            }
            
            if (!sparepartHarga || sparepartHarga <= 0) {
                alert('Masukkan harga sparepart yang valid!');
                return;
            }
        }
        
        // ===== TRANSAKSI =====
        let idCounter = Date.now();
        
        // 1. Transaksi Servis (Pemasukan ke wallet metode bayar)
        transactions.push({
            id: idCounter++,
            kategori: 'Servis HP',
            deskripsi: `Servis HP - ${kerusakan}`,
            keterangan: `Servis HP: ${kerusakan}`,
            nominal: hargaServis,
            wallet: metodeBayar,
            tipe: 'pemasukan',
            metodeBayar: metodeBayar,
            kerusakan: kerusakan,
            perluSparepart: perluSparepartValue,
            timestamp: new Date().toISOString()
        });
        
        // 2. Jika beli sparepart, catat sebagai pengeluaran terpisah
        if (perluSparepartValue === 'ya' && sparepartHarga > 0) {
            transactions.push({
                id: idCounter++,
                kategori: 'Servis HP (Sparepart)',
                deskripsi: `Beli ${sparepartNama}`,
                keterangan: `Sparepart untuk servis ${kerusakan}`,
                nominal: sparepartHarga,
                wallet: sparepartSumber,
                tipe: 'pengeluaran',
                metodeBayar: sparepartSumber,
                sparepartNama: sparepartNama,
                timestamp: new Date().toISOString()
            });
        }
        
        // Simpan dan update
        saveAllData();
        updateSaldo();
        renderRiwayatSingkat();
        
        // Reset form
        formServis.reset();
        sparepartDetail.style.display = 'none';
        document.getElementById('servis-sparepart-nama').required = false;
        document.getElementById('servis-sparepart-harga').required = false;
        
        // Log
        addLog('tambah_transaksi', null, {
            kategori: 'Servis HP',
            kerusakan: kerusakan,
            hargaServis: hargaServis,
            metodeBayar: metodeBayar,
            perluSparepart: perluSparepartValue,
            sparepart: perluSparepartValue === 'ya' ? {
                nama: sparepartNama,
                harga: sparepartHarga,
                sumber: sparepartSumber
            } : null
        });
        
        let msg = `✅ Transaksi Servis HP berhasil disimpan!\n${kerusakan} - Rp ${hargaServis.toLocaleString('id-ID')}`;
        if (perluSparepartValue === 'ya') {
            msg += `\n🔩 Sparepart: ${sparepartNama} (Rp ${sparepartHarga.toLocaleString('id-ID')})`;
            msg += `\n💰 Sumber Dana: ${sparepartSumber === 'cash' ? 'Cash' : 'Dana'}`;
        }
        alert(msg);
    });
});
// ==========================================
// FORM TRANSAKSI SERVIS HP ENDS
// ==========================================