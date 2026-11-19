
/* ==========================================
   E-FAIL 2.0
   MODULE: PELUPUSAN

   - Tempoh tidak aktif: 5 tahun
   - Amaran awal: 1 bulan sebelum 5 tahun
   - Sumber aktiviti: Audit Trail
   - Buat masa ini: Fail Umum sahaja
========================================== */

const TEMPOH_PELUPUSAN_TAHUN = 5;
const AMARAN_PELUPUSAN_BULAN = 1;


// ==========================================
// 1. PARSE TARIKH
// ==========================================

function parseTarikhPelupusan(nilai) {
    if (!nilai) return null;

    if (nilai instanceof Date) {
        return Number.isNaN(nilai.getTime()) ? null : new Date(nilai);
    }

    const teks = String(nilai).trim();

    if (!teks || teks === "-") return null;

    // Format dd/mm/yyyy atau dd-mm-yyyy
    const padananMY = teks.match(
        /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/
    );

    if (padananMY) {
        const [, hari, bulan, tahun, jam = "0", minit = "0", saat = "0"] = padananMY;

        const tarikh = new Date(
            Number(tahun),
            Number(bulan) - 1,
            Number(hari),
            Number(jam),
            Number(minit),
            Number(saat)
        );

        return Number.isNaN(tarikh.getTime()) ? null : tarikh;
    }

    const tarikh = new Date(teks);

    return Number.isNaN(tarikh.getTime()) ? null : tarikh;
}


// ==========================================
// 2. TAMBAH TEMPOH KALENDAR
// ==========================================

function tambahTempohPelupusan(tarikhAsal, tahun = 0, bulan = 0) {
    const hasil = new Date(tarikhAsal);
    const hariAsal = hasil.getDate();

    hasil.setDate(1);
    hasil.setMonth(hasil.getMonth() + bulan);
    hasil.setFullYear(hasil.getFullYear() + tahun);

    const hariAkhir = new Date(
        hasil.getFullYear(),
        hasil.getMonth() + 1,
        0
    ).getDate();

    hasil.setDate(Math.min(hariAsal, hariAkhir));

    return hasil;
}


function formatTarikhPelupusan(tarikh) {
    if (!tarikh) return "-";

    return tarikh.toLocaleDateString("ms-MY", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}


function hariAntaraPelupusan(tarikhMula, tarikhAkhir) {
    const satuHari = 24 * 60 * 60 * 1000;

    const mula = new Date(
        tarikhMula.getFullYear(),
        tarikhMula.getMonth(),
        tarikhMula.getDate()
    );

    const akhir = new Date(
        tarikhAkhir.getFullYear(),
        tarikhAkhir.getMonth(),
        tarikhAkhir.getDate()
    );

    return Math.ceil((akhir - mula) / satuHari);
}


// ==========================================
// 3. SEMAK AKTIVITI AUDIT TRAIL
// ==========================================

function auditLayakUntukPelupusan(rekod) {
    const aktiviti = String(
        rekod.aktiviti || rekod.tindakan || ""
    ).toLowerCase();

    const status = String(
        rekod.status || ""
    ).toLowerCase();

    if (!aktiviti) return false;

    // Aktiviti yang tidak dikira
    if (/lihat|papar|view|carian/.test(aktiviti)) {
        return false;
    }

    // Aktiviti yang layak
    if (!/pinjam|pulang|pemulangan|pergerakan|pindah|kemaskini|kemas kini|naik taraf|daftar jilid|pembukaan jilid/.test(aktiviti)) {
        return false;
    }

    // Jika status tersedia, pastikan transaksi selesai
    if (status && !/selesai|completed|diluluskan|approved/.test(status)) {
        return false;
    }

    return true;
}


// ==========================================
// 4. PADANKAN AUDIT DENGAN JILID
// ==========================================

function rekodAuditPadanJilid(rekodAudit, jilid) {
    const idAudit = rekodAudit.failId || "";
    const noAudit = rekodAudit.noFail || "";

    const padanFail =
        (idAudit && String(idAudit) === String(jilid.failId)) ||
        (noAudit && String(noAudit) === String(jilid.noFail));

    if (!padanFail) return false;

    // Aktiviti tanpa nombor jilid dianggap aktiviti fail
    return !rekodAudit.jilid ||
        Number(rekodAudit.jilid) === Number(jilid.jilid);
}


// ==========================================
// 5. DAPATKAN TARIKH ASAS JILID
// ==========================================

function dapatkanTarikhAsasJilid(jilid, failAsal) {
    const tarikhJilid = [
        jilid.tarikhDaftar,
        jilid.tarikhPendaftaran,
        jilid.tarikhKelulusan,
        jilid.tarikhDibuka,
        jilid.created_at,
        jilid.createdAt
    ];

    for (const nilai of tarikhJilid) {
        const tarikh = parseTarikhPelupusan(nilai);

        if (tarikh) return tarikh;
    }

    const tarikhFail = [
        failAsal?.tarikhDaftar,
        failAsal?.tarikhPendaftaran,
        failAsal?.tarikhDibuka,
        failAsal?.tarikhKelulusan,
        failAsal?.created_at,
        failAsal?.createdAt
    ];

    for (const nilai of tarikhFail) {
        const tarikh = parseTarikhPelupusan(nilai);

        if (tarikh) return tarikh;
    }

    return null;
}


// ==========================================
// 6. DAPATKAN SENARAI JILID FAIL UMUM
// ==========================================

function binaSenaraiJilidUmumUntukPelupusan() {
    const failUmum =
        typeof dapatkanSenaraiFailUmum === "function"
            ? dapatkanSenaraiFailUmum()
            : [];

    const jilidUmum =
        typeof dapatkanSenaraiJilidUmum === "function"
            ? dapatkanSenaraiJilidUmum()
            : [];

    const hasil = [];

    failUmum.forEach(fail => {
        const failId = fail.id || fail.failId || "";
        const noFail = fail.noFail || "";

        const jilidFail = jilidUmum.filter(item =>
            (failId && String(item.failId) === String(failId)) ||
            (!failId && String(item.noFail) === String(noFail))
        );

        const jilidAsal = Number(fail.jilid) || 1;

        const rekodAsal = jilidFail.find(
            item => Number(item.jilid) === jilidAsal
        );

        hasil.push({
            ...fail,
            ...(rekodAsal || {}),
            failId,
            noFail,
            tajuk: rekodAsal?.tajuk || fail.tajuk || "-",
            jilid: jilidAsal,
            kategori: "Fail Umum"
        });

        jilidFail
            .filter(item => Number(item.jilid) !== jilidAsal)
            .forEach(item => {
                hasil.push({
                    ...fail,
                    ...item,
                    failId: item.failId || failId,
                    noFail: item.noFail || noFail,
                    kategori: "Fail Umum"
                });
            });
    });

    // Tambah rekod jilid tanpa rekod induk
    jilidUmum.forEach(item => {
        const sudahAda = hasil.some(x =>
            String(x.failId || "") === String(item.failId || "") &&
            String(x.noFail || "") === String(item.noFail || "") &&
            Number(x.jilid) === Number(item.jilid)
        );

        if (!sudahAda) {
            hasil.push({
                ...item,
                kategori: "Fail Umum"
            });
        }
    });

    return hasil;
}


// ==========================================
// 7. KIRA COUNTDOWN PELUPUSAN
// ==========================================

function kiraStatusPelupusan(jilid, auditSemua, hariIni = new Date()) {
    const tarikhAsas = dapatkanTarikhAsasJilid(jilid, jilid);

    const auditPadan = auditSemua
        .filter(item =>
            rekodAuditPadanJilid(item, jilid) &&
            auditLayakUntukPelupusan(item)
        )
        .map(item =>
            parseTarikhPelupusan(
                item.tarikhMasa ||
                item.tarikh ||
                item.created_at
            )
        )
        .filter(Boolean);

    const tarikhTerakhir = [
        tarikhAsas,
        ...auditPadan
    ]
        .filter(Boolean)
        .sort((a, b) => b - a)[0] || null;

    if (!tarikhTerakhir) {
        return {
            tarikhTerakhir: null,
            tarikhAmaran: null,
            tarikhLayak: null,
            status: "Perlu Tarikh Rekod",
            bakiHari: null
        };
    }

    // Tarikh genap lima tahun
    const tarikhLayak = tambahTempohPelupusan(
        tarikhTerakhir,
        TEMPOH_PELUPUSAN_TAHUN,
        0
    );

    // Amaran satu bulan lebih awal
    const tarikhAmaran = tambahTempohPelupusan(
        tarikhLayak,
        0,
        -AMARAN_PELUPUSAN_BULAN
    );

    const bakiHari = hariAntaraPelupusan(
        hariIni,
        tarikhLayak
    );

    let status = "Dalam Tempoh";

    if (hariIni >= tarikhLayak) {
        status = "Tempoh Dicapai";
    } else if (hariIni >= tarikhAmaran) {
        status = "Hampir Tempoh";
    }

    return {
        tarikhTerakhir,
        tarikhAmaran,
        tarikhLayak,
        status,
        bakiHari
    };
}


// ==========================================
// 8. PAPARKAN SENARAI PELUPUSAN
// ==========================================

function paparSenaraiPelupusan() {
    const halaman = document.getElementById("page-pelupusan");

    const tbody = halaman?.querySelector(
        ".panel .data-table tbody"
    );

    if (!halaman || !tbody) return;

    const audit =
        typeof dapatkanSenaraiAuditTrail === "function"
            ? dapatkanSenaraiAuditTrail()
            : [];

    const hariIni = new Date();

    const senarai = binaSenaraiJilidUmumUntukPelupusan().map(jilid => ({
        jilid,
        kiraan: kiraStatusPelupusan(jilid, audit, hariIni)
    }));

    const untukTindakan = senarai.filter(item =>
        item.kiraan.status === "Hampir Tempoh" ||
        item.kiraan.status === "Tempoh Dicapai"
    );

    const susunan = [
        ...untukTindakan,
        ...senarai.filter(item => !untukTindakan.includes(item))
    ].sort((a, b) => {
        const tarikhA =
            a.kiraan.tarikhLayak?.getTime() ??
            Number.MAX_SAFE_INTEGER;

        const tarikhB =
            b.kiraan.tarikhLayak?.getTime() ??
            Number.MAX_SAFE_INTEGER;

        return tarikhA - tarikhB;
    });

    tbody.innerHTML = susunan.length
        ? susunan.map(({ jilid, kiraan }) => {
            const tahun = kiraan.tarikhLayak
                ? kiraan.tarikhLayak.getFullYear()
                : "-";

            let label = "Dalam Tempoh";
            let kelas = "";
            let tindakan = "Pemantauan";

            if (kiraan.status === "Hampir Tempoh") {
                label = `Amaran awal · ${kiraan.bakiHari} hari lagi`;
                kelas = "pill--orange";
                tindakan = "Semak";
            } else if (kiraan.status === "Tempoh Dicapai") {
                label = "Tempoh dicapai — semakan";
                kelas = "pill--orange";
                tindakan = "Semak";
            } else if (kiraan.status === "Perlu Tarikh Rekod") {
                label = "Tarikh rekod tiada";
                tindakan = "Semak rekod";
            }

            const butiranJilid = `Jilid ${jilid.jilid || 1}`;
            const noFail = jilid.noFail || "-";

            const tarikhAsas = kiraan.tarikhTerakhir
                ? `Aktiviti terakhir: ${formatTarikhPelupusan(kiraan.tarikhTerakhir)}`
                : "Tarikh asas belum direkodkan";

            const tarikhLayak = kiraan.tarikhLayak
                ? `Tarikh layak: ${formatTarikhPelupusan(kiraan.tarikhLayak)}`
                : "";

            return `
                <tr>
                    <td>
                        <b>${escapeHTML(noFail)}</b><br>
                        <small>${escapeHTML(butiranJilid)}</small><br>
                        <small>${escapeHTML(tarikhAsas)}</small>
                    </td>
                    <td>${escapeHTML(tahun)}</td>
                    <td>
                        <span class="pill ${kelas}">
                            ${escapeHTML(label)}
                        </span><br>
                        <small>${escapeHTML(tarikhLayak)}</small>
                    </td>
                    <td>${escapeHTML(tindakan)}</td>
                </tr>
            `;
        }).join("")
        : `
            <tr>
                <td colspan="4" class="muted">
                    Tiada rekod fail umum untuk dipantau.
                </td>
            </tr>
        `;

    const jumlahEl = halaman.querySelector(
        ".release-progress__number"
    );

    if (jumlahEl) {
        jumlahEl.innerHTML = `
            ${untukTindakan.length}
            <span style="font-size:10px;color:var(--muted)">
                fail/jilid untuk semakan
            </span>
        `;
    }

    const caption = halaman.querySelector(
        ".release-progress__caption"
    );

    if (caption) {
        caption.textContent =
            "Fail/jilid hampir atau telah mencapai tempoh lima tahun";
    }
}


// ==========================================
// 9. JALANKAN SELEPAS HALAMAN DIMUATKAN
// ==========================================

document.addEventListener("DOMContentLoaded", function () {
    paparSenaraiPelupusan();
});
