// Menunggu sampai seluruh konten HTML dimuat sebelum menjalankan JavaScript
document.addEventListener('DOMContentLoaded', function() {

  // === Pengaturan Awal & Selektor Elemen ===
  const addItemForm = document.getElementById("addItemForm");
  const itemTable = document.getElementById("itemTable");
  const importBtn = document.getElementById("importBtn");
  const exportBtn = document.getElementById("exportBtn");
  const addLokasiForm = document.getElementById("addLokasiUmumForm");
  const lokasiList = document.getElementById("lokasiUmumList");
  const tabNav = document.querySelector(".tab-nav");

  // === Logika untuk Tab ===
  function showTab(tabId) {
    document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    
    document.getElementById(tabId).classList.add("active");
    document.querySelector(`.tab-btn[data-tab='${tabId}']`).classList.add("active");
  }

  if (tabNav) {
    tabNav.addEventListener('click', function(e) {
      if (e.target.matches('.tab-btn')) {
        showTab(e.target.dataset.tab);
      }
    });
  }

  // === Logika MASTER ITEM ===
  function refreshMasterItemTable() {
    if (!itemTable) return;
    const items = JSON.parse(localStorage.getItem("masterItems")) || [];
    itemTable.innerHTML = "";
    items.forEach(item => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.kode}</td>
        <td>${item.nama}</td>
        <td>${item.satuan}</td>
        <td><button class="delete-item-btn" data-kode="${item.kode}">🗑️ Hapus</button></td>
      `;
      itemTable.appendChild(tr);
    });
  }

  if (addItemForm) {
    addItemForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const kode = document.getElementById("kodeBarang").value.trim();
      const nama = document.getElementById("namaBarang").value.trim();
      const satuan = document.getElementById("satuan").value.trim();
      if (!kode || !nama || !satuan) return;

      let items = JSON.parse(localStorage.getItem("masterItems")) || [];
      // Cek duplikat kode
      if (items.some(item => item.kode === kode)) {
          alert(`⚠️ Kode barang "${kode}" sudah ada!`);
          return;
      }
      items.push({ kode, nama, satuan });
      localStorage.setItem("masterItems", JSON.stringify(items));

      this.reset();
      refreshMasterItemTable();
    });
  }

  if (itemTable) {
      itemTable.addEventListener('click', function(e) {
          if (e.target.matches('.delete-item-btn')) {
              const kode = e.target.dataset.kode;
              if (confirm(`Yakin ingin menghapus item dengan kode ${kode}?`)) {
                  let items = JSON.parse(localStorage.getItem("masterItems")) || [];
                  items = items.filter(item => item.kode !== kode);
                  localStorage.setItem("masterItems", JSON.stringify(items));
                  refreshMasterItemTable();
              }
          }
      });
  }

  // === Logika MASTER LOKASI UMUM ===
  function refreshMasterLokasiUmumList() {
    if (!lokasiList) return;
    const lokasi = JSON.parse(localStorage.getItem("masterLokasiUmum")) || [];
    lokasiList.innerHTML = "";
    lokasi.forEach(loc => {
      const li = document.createElement("li");
      li.textContent = loc;
      const btn = document.createElement("button");
      btn.textContent = "🗑️";
      btn.className = 'delete-lokasi-btn';
      btn.dataset.lokasi = loc;
      li.appendChild(btn);
      lokasiList.appendChild(li);
    });
  }

function switchTab(id) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-buttons button').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');

  // tandai tombol aktif berdasarkan ID tab
  document.querySelectorAll('.tab-buttons button').forEach(btn => {
    if (btn.textContent.toLowerCase().includes(id)) btn.classList.add('active');
  });

  loadData();
}

  if (addLokasiForm) {
    addLokasiForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const nama = document.getElementById("namaLokasiUmum").value.trim();
      if (!nama) return;

      let lokasi = JSON.parse(localStorage.getItem("masterLokasiUmum")) || [];
       if (lokasi.includes(nama)) {
          alert(`⚠️ Lokasi "${nama}" sudah ada!`);
          return;
      }
      lokasi.push(nama);
      localStorage.setItem("masterLokasiUmum", JSON.stringify(lokasi));
      this.reset();
      refreshMasterLokasiUmumList();
    });
  }

  if (lokasiList) {
      lokasiList.addEventListener('click', function(e) {
          if (e.target.matches('.delete-lokasi-btn')) {
              const nama = e.target.dataset.lokasi;
              if (confirm(`Yakin ingin menghapus lokasi ${nama}?`)) {
                  let lokasi = JSON.parse(localStorage.getItem("masterLokasiUmum")) || [];
                  lokasi = lokasi.filter(loc => loc !== nama);
                  localStorage.setItem("masterLokasiUmum", JSON.stringify(lokasi));
                  refreshMasterLokasiUmumList();
              }
          }
      });
  }

  // === Logika EXPORT KE EXCEL ===
  if (exportBtn) {
    exportBtn.addEventListener('click', function() {
      const items = JSON.parse(localStorage.getItem("masterItems")) || [];
      if (items.length === 0) {
          alert("Tidak ada data untuk diekspor.");
          return;
      }
      const ws = XLSX.utils.json_to_sheet(items);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Master_Item");
      XLSX.writeFile(wb, "Master_Item_Global.xlsx");
    });
  }

  // === Logika IMPORT DARI EXCEL ===
  if (importBtn) {
    importBtn.addEventListener('click', function() {
        const fileInput = document.getElementById("importExcel");
        if (!fileInput.files[0]) return alert("Pilih file Excel terlebih dahulu.");
        
        const reader = new FileReader();
        reader.onload = function (e) {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(sheet);

            const validKeys = ["kode", "nama", "satuan"];
            const isValidFormat = json.length > 0 && validKeys.every(key => json[0].hasOwnProperty(key));
            if (!isValidFormat) {
              alert("⚠️ Format file tidak sesuai. Harus ada kolom: kode, nama, satuan");
              return;
            }

            if (confirm("Ini akan menimpa semua data master item yang ada. Lanjutkan?")) {
                localStorage.setItem("masterItems", JSON.stringify(json));
                alert("✅ Data berhasil diimpor dari Excel.");
                refreshMasterItemTable();
                fileInput.value = ""; // Reset file input
            }
          } catch (error) {
            console.error(error);
            alert("⚠️ Terjadi kesalahan saat membaca file.");
          }
        };
        reader.readAsArrayBuffer(fileInput.files[0]);
    });
  }

  // === Memuat data saat halaman pertama kali dibuka ===
  refreshMasterItemTable();
  refreshMasterLokasiUmumList();
});