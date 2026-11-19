/* ==========================================
   MODULE: PERMOHONAN PINJAMAN FAIL
   Satu fungsi dikongsi oleh Fail Umum dan
   Fail Peribadi. Status hanya berubah selepas
   kelulusan Pentadbir.
========================================== */

const konfigurasiPinjaman = {
    umum: { page: "page-permohonan", form: "formPinjaman", select: "pinjamanFailSelect", noFail: "pinjamanNoFail", jilid: "pinjamanJilid" },
    peribadi: { page: "page-permohonanp", form: "formPinjamanPeribadi", select: "pinjamanFailSelectPeribadi", noFail: "pinjamanNoFailPeribadi", jilid: "pinjamanJilidPeribadi" }
};

let senaraiPilihanPinjaman = { umum: [], peribadi: [] };

function dapatkanKonfigurasiPinjaman(kategori) {
    if (kategori && konfigurasiPinjaman[kategori]) return { kategori, ...konfigurasiPinjaman[kategori] };
    const halamanAktif = document.querySelector("#page-permohonan.page--active, #page-permohonanp.page--active");
    const kod = halamanAktif?.id === "page-permohonanp" ? "peribadi" : "umum";
    return { kategori: kod, ...konfigurasiPinjaman[kod] };
}

function dapatkanPilihanPinjaman(kategori) {
    const masterlist = typeof carianRekodFail === "function"
    ? carianRekodFail(kategori)
    : (typeof dapatkanMasterlist === "function" ? dapatkanMasterlist() : []);
    const semuaPermohonan = dapatkanSenaraiPermohonan();
    const hasil = new Map();

    masterlist.filter(item => item.kategoriKod === kategori).forEach(item => {
        const jilid = Number(item.jilid) || 1;
        const kunci = `${item.idFail || item.id}-${jilid}`;
        if (hasil.has(kunci)) {
            hasil.set(kunci, { ...hasil.get(kunci), ...item });
        } else {
            hasil.set(kunci, item);
        }
    });

    return Array.from(hasil.values()).filter(item => {
        if (String(item.statusPinjaman || "Tersedia").toLowerCase() === "dipinjam") return false;
        const adaPermohonanMenunggu = semuaPermohonan.some(request =>
            String(request.failId || "") === String(item.idFail || item.id) &&
            Number(request.jilid) === Number(item.jilid) &&
            String(request.modul || "").toLowerCase().includes("pinjaman") &&
            normalisasiStatus(request.status) === "pending"
        );
        return !adaPermohonanMenunggu;
    }).map(item => ({
        failId: item.idFail || item.id,
        noFail: item.noFail || "",
        tajuk: item.tajuk || "",
        jilid: Number(item.jilid) || 1,
        kategori,
        kategoriLabel: kategori === "peribadi" ? "Fail Peribadi" : "Fail Umum",
        peringkat: item.peringkat || "",
        lokasi: item.lokasi || "",
        statusJilid: item.statusJilid || "Aktif"
    })).sort((a, b) => String(a.noFail).localeCompare(String(b.noFail), "ms") || a.jilid - b.jilid);
}

function paparPilihanFailPinjaman(kategori) {
    const config = dapatkanKonfigurasiPinjaman(kategori);
    const select = document.getElementById(config.select);
    if (!select) return;

    senaraiPilihanPinjaman[config.kategori] = dapatkanPilihanPinjaman(config.kategori);
    select.innerHTML = '<option value="">-- Pilih fail dan jilid yang tersedia --</option>';

    senaraiPilihanPinjaman[config.kategori].forEach((item, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = `${item.noFail || "No. Fail belum ditetapkan"} · ${item.tajuk} · Jilid ${item.jilid}`;
        select.appendChild(option);
    });
}
function refreshPilihanPinjaman() {
    Object.keys(konfigurasiPinjaman).forEach(kategori => {
        paparPilihanFailPinjaman(kategori);
    });
}

function pilihFailPinjaman(kategori) {
    const config = dapatkanKonfigurasiPinjaman(kategori);
    const select = document.getElementById(config.select);
    const form = document.getElementById(config.form);
    if (!form) return;

    const pilihan = senaraiPilihanPinjaman[config.kategori]?.[Number(select?.value)];
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
            input.value = option ? option.value : "";
        } else input.value = nilai || "";
    };

    document.getElementById(config.noFail).value = pilihan?.noFail || "";
    document.getElementById(config.jilid).value = pilihan ? String(pilihan.jilid) : "";
    setMedan("Tajuk Fail", pilihan?.tajuk || "");
    setMedan("Taraf Fail", pilihan?.peringkat || "");
    setMedan("Kategori Fail", pilihan?.kategori === "peribadi" ? "Peribadi" : "Umum");
    setMedan("Lokasi Fail", pilihan?.lokasi || "");
}

function hantarPermohonanPinjaman(kategori) {
    const config = dapatkanKonfigurasiPinjaman(kategori);
    const form = document.getElementById(config.form);
    if (!form) return;

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const select = document.getElementById(config.select);
    const pilihan = senaraiPilihanPinjaman[config.kategori]?.[Number(select?.value)];
    if (!pilihan) {
        alert("Sila pilih fail dan jilid yang tersedia.");
        return;
    }

    const maklumat = {};
    form.querySelectorAll(".field").forEach(field => {
        const label = field.querySelector("label");
        const input = field.querySelector("input, select, textarea");
        if (!label || !input) return;
        maklumat[label.textContent.replace("*", "").trim()] = input.value.trim();
    });
    maklumat["No. Fail"] = pilihan.noFail;
    maklumat["Tajuk Fail"] = pilihan.tajuk;
    maklumat["Jilid"] = String(pilihan.jilid);
    maklumat["Kategori Fail"] = pilihan.kategoriLabel;

    const permohonan = {
        id: "EF-PJ-" + Date.now(),
        modul: config.kategori === "peribadi" ? "Pinjaman Fail - Fail Peribadi" : "Pinjaman Fail - Fail Umum",
        jenisTransaksi: "pinjaman",
        maklumat,
        sokongan: {},
        failId: pilihan.failId,
        noFail: pilihan.noFail,
        jilid: pilihan.jilid,
        kategori: config.kategori,
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

alert("Permohonan Pinjaman Fail berjaya dihantar untuk pengesahan Pentadbir.\n\nNo. Fail: " + pilihan.noFail + "\nJilid: " + pilihan.jilid + "\nNo. Rujukan: " + permohonan.id);

form.reset();
document.getElementById(config.noFail).value = "";
document.getElementById(config.jilid).value = "";
paparPilihanFailPinjaman(config.kategori);
}

document.addEventListener("DOMContentLoaded", function () {
    Object.keys(konfigurasiPinjaman).forEach(kategori => {
        const config = konfigurasiPinjaman[kategori];
        document.getElementById(config.select)?.addEventListener("change", () => pilihFailPinjaman(kategori));
        paparPilihanFailPinjaman(kategori);
    });
});
