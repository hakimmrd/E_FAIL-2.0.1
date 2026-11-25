/* ==========================================
   E-FAIL 2.0
   MAIN INITIALISATION
========================================== */

document.addEventListener('DOMContentLoaded', function () {
    // Restore a direct URL hash only when the selected demo role can access it.
    const requestedPage = window.location.hash.replace(/^#/, '');
    if (requestedPage && document.getElementById('page-' + requestedPage) && window.showPage) {
        window.showPage(requestedPage);
    }
});

/* ==========================================
   MODULE: TOPBAR DATE AND TIME
========================================== */

// FUNCTION: updateTopbarDateTime
// PURPOSE: Mengemas kini tarikh dan masa pada topbar.
function updateTopbarDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString("ms-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const time = now.toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
    document.getElementById("liveDate").textContent = date;
    document.getElementById("liveTime").textContent = time;
}

// Paparkan serta kemas kini masa setiap saat.
document.addEventListener("DOMContentLoaded", function () {
    updateTopbarDateTime();
    setInterval(updateTopbarDateTime, 1000);
});


// Pastikan medan Taraf/Kategori Fail hanya boleh diubah dalam Pendaftaran dan Naik Taraf.
document.addEventListener("click", function () { if (typeof kawalMedanTarafKategoriFail === "function") kawalMedanTarafKategoriFail(); });

document.querySelectorAll(".sidebar__group > .sidebar__link, .sidebar__group > .sidebar__sublink").forEach(link => {
    link.addEventListener("click", function (event) {
        const group = this.closest(".sidebar__group");
        const submenu = group.querySelector(":scope > .sidebar__submenu");

        if (!submenu) return;

        event.preventDefault();

        const isOpen = group.classList.contains("active");

        // Find sibling groups at the SAME level only
        const parent = group.parentElement;

        parent.querySelectorAll(":scope > .sidebar__group").forEach(sibling => {
            if (sibling !== group) {
                sibling.classList.remove("active");
            }
        });

        // Toggle the selected group
        group.classList.toggle("active", !isOpen);
    });
});


function aktifkanTooltipJilidUmum() {

    const modal = document.getElementById("modalJilidUmum");

    if (!modal || typeof bootstrap === "undefined") {
        console.error("Modal atau Bootstrap JS tidak dijumpai.");
        return;
    }

    modal.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(element => {

        bootstrap.Tooltip.getOrCreateInstance(element, {
            container: modal,
            placement: "top",
            trigger: "hover focus",
            boundary: "window"
        });

    });
}

