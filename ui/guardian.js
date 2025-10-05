
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById('guardianForm');
    const firstEl = document.getElementById('guardianFirstName');
    const middleEl = document.getElementById('guardianMiddleName');
    const lastEl = document.getElementById('guardianLastName');
    const suffixEl = document.getElementById('guardianSuffix');
    const mobileEl = document.getElementById('guardianMobile');
    const emailEl = document.getElementById('guardianEmail');
    const relationEl = document.getElementById('guardianRelation');
    const backBtn = document.getElementById('backBtn');

    // Pre-fill if data exists
    const savedGuardian = sessionStorage.getItem('guardianInfo');
    if (savedGuardian) {
        try {
            const g = JSON.parse(savedGuardian);
            firstEl.value = g.firstName || "";
            middleEl.value = g.middleName || "";
            lastEl.value = g.lastName || "";
            suffixEl.value = g.suffixName || "";
            mobileEl.value = g.contact || "";
            emailEl.value = g.email || "";
            relationEl.value = g.relation || "";
        } catch {
            console.warn("Could not parse guardian info");
        }
    }

    // Keep mobile numbers numeric only, max 11 digits
    mobileEl.addEventListener('input', () => {
        mobileEl.value = mobileEl.value.replace(/\D/g, "").slice(0, 11);
    });

    // Back button saves current progress
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            const partial = {
                firstName: firstEl.value.trim(),
                middleName: middleEl.value.trim(),
                lastName: lastEl.value.trim(),
                suffixName: suffixEl.value.trim(),
                relation: relationEl.value,
                contact: mobileEl.value.trim(),
                email: emailEl.value.trim()
            };
            sessionStorage.setItem('guardianInfo', JSON.stringify(partial));
            window.location.href = 'personal-info.html';
        });
    }

    // Handle submit
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            let valid = true;

            if (!firstEl.value.trim()) valid = false;
            if (!lastEl.value.trim()) valid = false;
            if (!relationEl.value) valid = false;
            if (!/^\d{11}$/.test(mobileEl.value.trim())) valid = false;
            if (!emailEl.value.trim()) valid = false;

            if (!valid) {
                form.reportValidity();
                return;
            }

            const guardianInfo = {
                firstName: firstEl.value.trim(),
                middleName: middleEl.value.trim(),
                lastName: lastEl.value.trim(),
                suffixName: suffixEl.value.trim(),
                relation: relationEl.value,
                contact: mobileEl.value.trim(),
                email: emailEl.value.trim()
            };

            sessionStorage.setItem('guardianInfo', JSON.stringify(guardianInfo));
            console.log("Stored semester in sessionStorage:", sessionStorage.getItem('semester'));
            window.location.href = 'enrollment-file.html';
        });
    }
});
