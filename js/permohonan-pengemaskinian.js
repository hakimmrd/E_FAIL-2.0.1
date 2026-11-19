/* ==========================================
   MODULE: PENGEMASKINIAN FAIL
   Tujuan: Pilih fail/jilid berdaftar dan pautkan permohonan kepada rekod asal.
========================================== */

// FUNCTION: dapatkanPilihanNaikTaraf
// PURPOSE: Mendapatkan senarai fail dan jilid bagi kategori modul.
function dapatkanPilihanNaikTaraf(kategori) {
    const masterlist = typeof carianRekodFail === "function"
    ? carianRekodFail(kategori)
    : (typeof dapatkanMasterlist === "function" ? dapatkanMasterlist() : []);
    return masterlist.filter(item => item.kategoriKod === kategori).map(item => ({
        failId: item.idFail || item.id,
        noFail: item.noFail || "",
        tajuk: item.tajuk || "",
        jilid: Number(item.jilid) || 1,
        kategori,
        peringkat: item.peringkat || ""
    }));
}

// FUNCTION: paparPilihanFailNaikTaraf
// PURPOSE: Memaparkan senarai fail mengikut kategori halaman aktif.
function paparPilihanFailNaikTaraf(halaman) {
    const kategori = halaman.id === "page-naik-tarafp" ? "peribadi" : "umum";
    const select = halaman.querySelector("[data-naik-taraf-fail-select]");
    if (!select) return;

    const pilihan = dapatkanPilihanNaikTaraf(kategori);
    select.innerHTML = '<option value="">-- Pilih fail dan jilid --</option>';

    pilihan.forEach((item, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = `${item.noFail} · ${item.tajuk} · Jilid ${item.jilid}`;
        select.appendChild(option);
    });

    select._senaraiPilihan = pilihan;
}

// FUNCTION: pilihFailNaikTaraf
// PURPOSE: Mengisi maklumat fail berdasarkan pilihan pengguna.
function pilihFailNaikTaraf(halaman) {
    const select = halaman.querySelector("[data-naik-taraf-fail-select]");
    const pilihan = select?._senaraiPilihan?.[Number(select.value)];
    const form = halaman.querySelector(halaman.id === "page-naik-tarafp" ? "#formPembukaanPeribadi" : "#formPembukaan");
    if (!form) return;

    halaman.querySelector("[data-naik-taraf-no-fail]").value = pilihan?.noFail || "";
    halaman.querySelector("[data-naik-taraf-jilid]").value = pilihan ? String(pilihan.jilid) : "";

    const setMedan = (labelCari, nilai) => {
        const field = Array.from(form.querySelectorAll(".field")).find(item =>
            (item.querySelector("label")?.textContent || "").toLowerCase().includes(labelCari.toLowerCase())
        );
        const input = field?.querySelector("input, select, textarea");
        if (!input) return;

        if (input.tagName === "SELECT") {
            const option = Array.from(input.options).find(opt =>
                opt.value.toLowerCase() === String(nilai).toLowerCase() ||
                opt.textContent.trim().toLowerCase().startsWith(String(nilai).toLowerCase())
            );
            if (option) input.value = option.value;
        } else {
            input.value = nilai || "";
        }
    };

    setMedan("Tajuk Fail", pilihan?.tajuk || "");
    setMedan("Taraf Fail", pilihan?.peringkat || "");
    setMedan("Kategori Fail", pilihan?.kategori === "peribadi" ? "Peribadi" : "Umum");
}

// FUNCTION: hantarPermohonan
// PURPOSE: Menghantar permohonan pengemaskinian dengan pautan kepada fail sedia ada.
function hantarPermohonan(button) {
    const halaman = button?.closest(".page") ||
        document.querySelector(".page--active#page-naik-taraf, .page--active#page-naik-tarafp");

    if (!halaman) {
        alert("Modul Naik Taraf tidak dikenal pasti.");
        return;
    }

    const peribadi = halaman.id === "page-naik-tarafp";
    const formUtama = halaman.querySelector(peribadi ? "#formPembukaanPeribadi" : "#formPembukaan");
    const formSokongan = halaman.querySelector(peribadi ? "#formSokonganPeribadi" : "#formSokongan");
    const selectFail = halaman.querySelector("[data-naik-taraf-fail-select]");
    const pilihan = selectFail?._senaraiPilihan?.[Number(selectFail.value)];

    if (!pilihan) {
        alert("Sila pilih fail berdaftar terlebih dahulu.");
        selectFail?.focus();
        return;
    }

    if (!formUtama || !formSokongan) {
        alert("Borang pengemaskinian tidak lengkap.");
        return;
    }

    if (!formUtama.checkValidity()) {
        formUtama.reportValidity();
        return;
    }

    if (!formSokongan.checkValidity()) {
        formSokongan.reportValidity();
        return;
    }

    function kumpulMaklumat(form) {
        const data = {};
        form.querySelectorAll(".field").forEach(field => {
            const label = field.querySelector("label");
            const input = field.querySelector("input, select, textarea");
            if (label && input) {
                data[label.textContent.replace("*", "").trim()] = input.value.trim();
            }
        });
        return data;
    }

    const maklumat = kumpulMaklumat(formUtama);
    const sokongan = kumpulMaklumat(formSokongan);

    maklumat["No. Fail"] = pilihan.noFail;
    maklumat["Tajuk Fail"] = pilihan.tajuk;
    maklumat["Jilid"] = String(pilihan.jilid);

    const permohonan = {
        id: "EF-NT-" + Date.now(),
        modul: "Pengemaskinian Fail",
        maklumat,
        sokongan,
        failId: pilihan.failId,
        noFail: pilihan.noFail,
        jilid: pilihan.jilid,
        kategori: pilihan.kategori,
        kategoriAsal: pilihan.kategori,
        jenisTransaksi: "naik-taraf",
        status: "Menunggu Pengesahan",
        catatanPentadbir: "",
        tarikhPermohonan: new Date().toLocaleString("ms-MY")
    };

   if (!simpanPermohonan(permohonan)) return;

    refreshPaparanPermohonan();

    // REFRESH NOTIFICATION COUNT
    if (typeof paparNotifikasi === "function") {
      paparNotifikasi();
   }

    alert(
        "Permohonan Pengemaskinian Fail berjaya dihantar!\n\n" +
        "No. Fail: " + pilihan.noFail +
        "\nJilid: " + pilihan.jilid +
        "\nNo. Rujukan: " + permohonan.id
    );

    formUtama.reset();
    formSokongan.reset();
    halaman.querySelector("[data-naik-taraf-no-fail]").value = "";
    halaman.querySelector("[data-naik-taraf-jilid]").value = "";
    selectFail.value = "";
    if (typeof isiMaklumatPemohonSemuaBorang === "function") {
        isiMaklumatPemohonSemuaBorang();
    }
}

document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("#page-naik-taraf, #page-naik-tarafp").forEach(halaman => {
        const select = halaman.querySelector("[data-naik-taraf-fail-select]");
        select?.addEventListener("change", () => pilihFailNaikTaraf(halaman));
        paparPilihanFailNaikTaraf(halaman);
    });
});
