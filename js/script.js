function showToast(pesan) {
  const toast = document.getElementById("toast");
  toast.textContent = pesan;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

let dataKeuangan = JSON.parse(localStorage.getItem("keuangan")) || [];

function formatRupiah(angka) {
  return "Rp " + angka.toLocaleString("id-ID");
}

function formatTanggalIndo(tanggal) {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(tanggal).toLocaleDateString("id-ID", options);
}

function hitungSaldo(data) {
  let saldo = 0;
  return data.map((entry) => {
    saldo += entry.masuk - entry.keluar;
    return { ...entry, saldo };
  });
}

function simpanData() {
  localStorage.setItem("keuangan", JSON.stringify(dataKeuangan));
}

function tambahData() {
  const tanggal = document.getElementById("tanggal").value;
  const keterangan = document.getElementById("keterangan").value.trim();
  const masuk = parseInt(document.getElementById("uangMasuk").value) || 0;
  const keluar = parseInt(document.getElementById("uangKeluar").value) || 0;

  if (!tanggal || !keterangan) {
    alert("Isi tanggal dan keterangan!");
    return;
  }

  if (masuk === 0 && keluar === 0) {
    alert("Isi salah satu: uang masuk atau uang keluar!");
    return;
  }

  if (masuk < 0 || keluar < 0) {
    alert("Nilai uang tidak boleh negatif!");
    return;
  }

  let idTerakhir = parseInt(localStorage.getItem("idTerakhir")) || 0;
  idTerakhir++;
  localStorage.setItem("idTerakhir", idTerakhir);

  dataKeuangan.push({
    id: idTerakhir,
    tanggal,
    keterangan,
    masuk,
    keluar,
  });

  simpanData();
  renderTabel();

  // Reset input dan isi ulang tanggal dengan tanggal hari ini
  document.getElementById("tanggal").value = new Date().toISOString().split("T")[0];
  document.getElementById("keterangan").value = "";
  document.getElementById("uangMasuk").value = "";
  document.getElementById("uangKeluar").value = "";
  showToast("Data berhasil ditambahkan!");
}

function editData(id, field, value) {
  if (field === "masuk" || field === "keluar") {
    value = parseInt(value.replace(/\D/g, "")) || 0;
    if (value < 0) {
      alert("Nilai tidak boleh negatif!");
      return;
    }
  }
  const index = dataKeuangan.findIndex((e) => e.id === id);
  if (index > -1) {
    dataKeuangan[index][field] = value;
    simpanData();
    renderTabel();
    showToast("Data berhasil diperbarui!");
  }
}

function hapusData(id) {
  if (confirm("Yakin ingin menghapus data ini?")) {
    dataKeuangan = dataKeuangan.filter((e) => e.id !== id);
    simpanData();
    renderTabel();
    showToast("Data berhasil dihapus!");
  }
}

function filterData() {
  const awal = document.getElementById("filterAwal").value;
  const akhir = document.getElementById("filterAkhir").value;
  const filterKet = document.getElementById("filterKeterangan").value.toLowerCase();

  return dataKeuangan.filter((item) => {
    return (
      (!awal || item.tanggal >= awal) &&
      (!akhir || item.tanggal <= akhir) &&
      (!filterKet || item.keterangan.toLowerCase().includes(filterKet))
    );
  });
}

function renderTabel() {
  const tbody = document.getElementById("tabelData");
  tbody.innerHTML = "";

  const dataFilter = filterData();
  const dataDenganSaldo = hitungSaldo(dataFilter);

  let totalMasuk = 0;
  let totalKeluar = 0;

  dataDenganSaldo.forEach((item) => {
    totalMasuk += item.masuk;
    totalKeluar += item.keluar;

    const tr = document.createElement("tr");
    const idFormat = "CK" + String(item.id).padStart(4, "0");

    tr.innerHTML = `
      <td>${idFormat}</td>
      <td>${formatTanggalIndo(item.tanggal)}</td>
      <td contenteditable="true" onblur="editData(${item.id}, 'keterangan', this.innerText)">${item.keterangan}</td>
      <td contenteditable="true" onblur="editData(${item.id}, 'masuk', this.innerText)">${formatRupiah(item.masuk)}</td>
      <td contenteditable="true" onblur="editData(${item.id}, 'keluar', this.innerText)">${formatRupiah(item.keluar)}</td>
      <td>${formatRupiah(item.saldo)}</td>
      <td><button class="action-btn hapus" onclick="hapusData(${item.id})">Hapus</button></td>
    `;

    tbody.appendChild(tr);
  });

  const totalSaldo = dataDenganSaldo.length
    ? dataDenganSaldo[dataDenganSaldo.length - 1].saldo
    : 0;

  document.getElementById("totalSaldo").innerHTML = `
    <div style="font-size: 16px; padding: 10px;">
      Total Uang Masuk: <span style="color: green">${formatRupiah(totalMasuk)}</span> |
      Total Uang Keluar: <span style="color: red">${formatRupiah(totalKeluar)}</span><br>
      Saldo Akhir: <strong style="font-size: 18px;">${formatRupiah(totalSaldo)}</strong>
    </div>`;
}

function exportExcel() {
  const dataExport = filterData().map((item, i, arr) => {
    let saldo = arr
      .slice(0, i + 1)
      .reduce((s, e) => s + e.masuk - e.keluar, 0);
    return {
      Tanggal: item.tanggal,
      Keterangan: item.keterangan,
      "Uang Masuk": item.masuk,
      "Uang Keluar": item.keluar,
      Saldo: saldo,
    };
  });
  const ws = XLSX.utils.json_to_sheet(dataExport);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Keuangan");
  XLSX.writeFile(wb, "catatan_keuangan.xlsx");
}

function exportPDF() {
  const element = document.getElementById("printArea");
  html2pdf()
    .set({
      margin: 10,
      filename: "catatan_keuangan.pdf",
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
    })
    .from(element)
    .save();
}

function resetSemuaData() {
  if (confirm("Yakin ingin menghapus SEMUA data?")) {
    dataKeuangan = [];
    simpanData();
    renderTabel();
    showToast("Semua data berhasil dihapus!");
  }
}

renderTabel();

// Otomatis isi tanggal hari ini saat halaman dimuat
document.addEventListener("DOMContentLoaded", function () {
  const inputTanggal = document.getElementById("tanggal");
  const today = new Date().toISOString().split("T")[0];
  inputTanggal.value = today;
});
