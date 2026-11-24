/* MODULE: PENGURUSAN PENGGUNA
   Rekod hanya dipaparkan selepas didaftarkan melalui borang Tambah Pengguna. */
function paparSenaraiPengguna() {
    const tbody = document.getElementById("senaraiPenggunaBody");
    if (!tbody) return;

    const senarai = dapatkanSenaraiPengguna();

    const render = item => `<tr>
        <td><b>${escapeHTML(item.nama)}</b><div class="muted">${escapeHTML(item.emel)}</div></td>
        <td>${escapeHTML(item.jawatan || "-")}</td>
        <td>${escapeHTML(item.bahagian || "-")}</td>
        <td>${escapeHTML(item.peranan || "-")}</td>
        <td><span class="pill ${item.status === "Aktif" ? "pill--green" : ""}">${escapeHTML(item.status || "Aktif")}</span></td>
        <td><button type="button" class="text-link" data-edit-pengguna="${escapeHTML(item.id)}"><i class="bi bi-pencil-square"></i> Edit</button></td>
    </tr>`;

    paparPagination(tbody, senarai, "pengguna", render);

    const jumlah = document.getElementById("jumlahPengguna");
    if (jumlah) jumlah.textContent = senarai.length + " Pengguna";
}


function daftarPenggunaBaharu(event) {
    event.preventDefault();
    const pengguna = {
        id: "USR-" + Date.now(),
        nama: document.getElementById("penggunaNama").value.trim(),
        noKP: document.getElementById("penggunaNoKP").value.trim(),
        emel: document.getElementById("penggunaEmel").value.trim(),
        jawatan: document.getElementById("penggunaJawatan").value.trim(),
        telefon: document.getElementById("penggunaTelefon").value.trim(),
        bahagian: document.getElementById("penggunaBahagian").value,
        peranan: document.getElementById("penggunaPeranan").value,
        status: document.getElementById("penggunaStatus").value,
        tarikhDaftar: new Date().toLocaleString("ms-MY")
    };
    if (!simpanPengguna(pengguna)) return;
    document.getElementById("formTambahPengguna").reset();
    paparSenaraiPengguna();
    alert("Pengguna berjaya didaftarkan.");
}


document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("formTambahPengguna")?.addEventListener("submit", daftarPenggunaBaharu);

    const modalElement = document.getElementById("modalEditPengguna");
    const formEdit = document.getElementById("formEditPengguna");

    // BUKA MODAL EDIT PENGGUNA.
    document.addEventListener("click", function (event) {
        const butang = event.target.closest("[data-edit-pengguna]");
        if (!butang) return;

        const id = butang.dataset.editPengguna;
        const pengguna = dapatkanSenaraiPengguna().find(item => String(item.id) === String(id));

        if (!pengguna) {
            alert("Rekod pengguna tidak dijumpai.");
            return;
        }

        document.getElementById("editPenggunaId").value = pengguna.id;
        document.getElementById("editPenggunaNama").value = pengguna.nama || "";
        document.getElementById("editPenggunaNoKP").value = pengguna.noKP || "";
        document.getElementById("editPenggunaEmel").value = pengguna.emel || "";
        document.getElementById("editPenggunaTelefon").value = pengguna.telefon || "";
        document.getElementById("editPenggunaJawatan").value = pengguna.jawatan || "";
        document.getElementById("editPenggunaBahagian").value = pengguna.bahagian || "";
        document.getElementById("editPenggunaPeranan").value = pengguna.peranan || "";
        document.getElementById("editPenggunaStatus").value = pengguna.status || "Aktif";

        modalElement.showModal();
    });

    // SIMPAN PERUBAHAN PENGGUNA.
    formEdit?.addEventListener("submit", function (event) {
        event.preventDefault();

        const id = document.getElementById("editPenggunaId").value;
        const senarai = dapatkanSenaraiPengguna();
        const indeks = senarai.findIndex(item => String(item.id) === String(id));

        if (indeks < 0) {
            alert("Rekod pengguna tidak dijumpai.");
            return;
        }

        senarai[indeks] = {
            ...senarai[indeks],
            nama: document.getElementById("editPenggunaNama").value.trim(),
            noKP: document.getElementById("editPenggunaNoKP").value.trim(),
            emel: document.getElementById("editPenggunaEmel").value.trim(),
            telefon: document.getElementById("editPenggunaTelefon").value.trim(),
            jawatan: document.getElementById("editPenggunaJawatan").value.trim(),
            bahagian: document.getElementById("editPenggunaBahagian").value,
            peranan: document.getElementById("editPenggunaPeranan").value,
            status: document.getElementById("editPenggunaStatus").value
        };

        if (!simpanSenaraiPengguna(senarai)) {
            alert("Perubahan gagal disimpan.");
            return;
        }

        modalElement.close();
        paparSenaraiPengguna();
        alert("Maklumat pengguna berjaya dikemaskini.");
    });

    paparSenaraiPengguna();
});

