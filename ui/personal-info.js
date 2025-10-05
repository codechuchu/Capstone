document.addEventListener("DOMContentLoaded", () => {
    const personalInfoForm = document.getElementById("personalInfoForm");

    const inputs = {
        firstNameInput: document.getElementById("firstName"),
        middleNameInput: document.getElementById("middleName"),
        lastNameInput: document.getElementById("lastName"),
        suffixNameInput: document.getElementById("suffixName"),
        genderSelect: document.getElementById("gender"),
        dateOfBirthInput: document.getElementById("dateOfBirth"),
        streetHouseInput: document.getElementById("streetHouse"),
        barangayInput: document.getElementById("barangay"),
        municipalityCityInput: document.getElementById("municipalityCity"),
        provinceInput: document.getElementById("province"),
        cellphoneNumberInput: document.getElementById("cellphoneNumber"),
        emailAddressInput: document.getElementById("emailAddress"),
        lrnInput: document.getElementById("lrn") // LRN added
    };

    // Pre-fill from sessionStorage
    const saved = sessionStorage.getItem("personalInfo");
    if (saved) {
        try {
            const data = JSON.parse(saved);
            Object.keys(inputs).forEach(key => {
                const field = inputs[key];
                if (field && data[field.id] !== undefined) field.value = data[field.id] || "";
            });
        } catch {
            console.warn("Failed to parse saved personal info");
        }
    }

    // Numeric filtering for cellphone
    inputs.cellphoneNumberInput?.addEventListener("input", () => {
        inputs.cellphoneNumberInput.value = inputs.cellphoneNumberInput.value.replace(/\D/g, "").slice(0, 11);
    });

    // Numeric filtering for LRN
    inputs.lrnInput?.addEventListener("input", () => {
        inputs.lrnInput.value = inputs.lrnInput.value.replace(/\D/g, "").slice(0, 12);

        // Remove any old LRN error while typing
        const oldMsg = inputs.lrnInput.parentElement.querySelector('.error-message');
        if (oldMsg) oldMsg.remove();
        inputs.lrnInput.classList.remove("error");
    });

    // Name filtering
    [inputs.firstNameInput, inputs.middleNameInput, inputs.lastNameInput, inputs.suffixNameInput].forEach(input => {
        input?.addEventListener("input", () => {
            input.value = input.value.replace(/[^a-zA-Z\s.-]/g, "");
        });
    });

    // Remove email error on typing
    inputs.emailAddressInput?.addEventListener("input", () => {
        const oldMsg = inputs.emailAddressInput.parentElement.querySelector('.error-message');
        if (oldMsg) oldMsg.remove();
        inputs.emailAddressInput.classList.remove("error");
    });

    // ---- EMAIL VALIDATION ----
    async function validateEmail(fieldId) {
        const field = document.getElementById(fieldId);
        const email = field.value.trim();

        const oldMsg = field.parentElement.querySelector(".error-message");
        if (oldMsg) oldMsg.remove();
        field.classList.remove("error");

        if (!email) return false;

        try {
            const res = await fetch(`/Capstone/php/validate-email.php?email=${encodeURIComponent(email)}`);
            const data = await res.json();
            console.log("Email validation response:", data);

            if (!data.validations?.mailbox_exists) {
                field.classList.add("error");
                const msg = document.createElement("span");
                msg.className = "error-message absolute bg-red-500 text-white text-xs px-2 py-1 rounded shadow-md -top-6 left-0";
                msg.textContent = "⚠️ Email does not exist";
                field.parentElement.style.position = "relative";
                field.parentElement.appendChild(msg);
                field.focus();
                return false;
            }

            return true;
        } catch (err) {
            console.error("Email check failed:", err);
            alert("⚠️ Could not verify email right now. Try again later.");
            return false;
        }
    }

    personalInfoForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        let isValid = true;
        const nameRegex = /^[a-zA-Z\s.-]+$/;
        const optNameRegex = /^[a-zA-Z\s.-]*$/;
        const addressRegex = /^[a-zA-Z0-9\s.,\-\/#]*$/;

        const validateField = (field, regex, errorMsg) => {
            if (!field) return;
            const value = field.value.trim();
            if (field.required && value === "") {
                field.setCustomValidity("This field is required.");
                isValid = false;
            } else if (value && !regex.test(value)) {
                field.setCustomValidity(errorMsg);
                isValid = false;
            } else {
                field.setCustomValidity("");
            }
        };

        // Name validations
        validateField(inputs.firstNameInput, nameRegex, "Only letters, spaces, hyphens, or periods.");
        validateField(inputs.middleNameInput, optNameRegex, "Only letters, spaces, hyphens, or periods.");
        validateField(inputs.lastNameInput, nameRegex, "Only letters, spaces, hyphens, or periods.");
        validateField(inputs.suffixNameInput, optNameRegex, "Only letters, spaces, hyphens, or periods.");

        // Gender
        if (!inputs.genderSelect.value) {
            inputs.genderSelect.setCustomValidity("Please select a gender.");
            isValid = false;
        } else {
            inputs.genderSelect.setCustomValidity("");
        }

        // Address
        validateField(inputs.streetHouseInput, addressRegex, "Invalid address characters.");
        validateField(inputs.barangayInput, addressRegex, "Invalid barangay format.");
        validateField(inputs.municipalityCityInput, addressRegex, "Invalid city/municipality format.");
        validateField(inputs.provinceInput, addressRegex, "Invalid province format.");

        // Cellphone
        const cellDigits = inputs.cellphoneNumberInput.value.replace(/\D/g, "");
        if (cellDigits.length !== 11) {
            inputs.cellphoneNumberInput.classList.add("error");
            const oldMsg = inputs.cellphoneNumberInput.parentElement.querySelector('.error-message');
            if (!oldMsg) {
                const msg = document.createElement("span");
                msg.className = "error-message absolute bg-red-500 text-white text-xs px-2 py-1 rounded shadow-md -top-6 left-0";
                msg.textContent = "⚠️ Cellphone must be exactly 11 digits";
                inputs.cellphoneNumberInput.parentElement.style.position = "relative";
                inputs.cellphoneNumberInput.parentElement.appendChild(msg);
            }
            isValid = false;
        } else {
            inputs.cellphoneNumberInput.classList.remove("error");
            const oldMsg = inputs.cellphoneNumberInput.parentElement.querySelector('.error-message');
            if (oldMsg) oldMsg.remove();
        }

        // LRN
        const lrnDigits = inputs.lrnInput.value.replace(/\D/g, "");
        if (lrnDigits.length !== 12) {
            inputs.lrnInput.classList.add("error");
            const oldMsg = inputs.lrnInput.parentElement.querySelector('.error-message');
            if (!oldMsg) {
                const msg = document.createElement("span");
                msg.className = "error-message absolute bg-red-500 text-white text-xs px-2 py-1 rounded shadow-md -top-6 left-0";
                msg.textContent = "⚠️ LRN must be exactly 12 digits";
                inputs.lrnInput.parentElement.style.position = "relative";
                inputs.lrnInput.parentElement.appendChild(msg);
            }
            inputs.lrnInput.focus();
            isValid = false;
        } else {
            inputs.lrnInput.classList.remove("error");
            const oldMsg = inputs.lrnInput.parentElement.querySelector('.error-message');
            if (oldMsg) oldMsg.remove();
        }

        // Email required
        if (!inputs.emailAddressInput.value.trim()) {
            inputs.emailAddressInput.setCustomValidity("Email is required.");
            isValid = false;
        } else {
            inputs.emailAddressInput.setCustomValidity("");
        }

        if (!isValid) {
            personalInfoForm.reportValidity();
            return;
        }

        // Always validate the current email value
        const emailValid = await validateEmail("emailAddress");
        if (!emailValid) return;

        // Save current values to sessionStorage
        const personalInfo = {};
        Object.keys(inputs).forEach(key => {
            const field = inputs[key];
            if (field) personalInfo[field.id] = field.value.trim();
        });
        personalInfo.cellphoneNumber = cellDigits;
        personalInfo.lrn = lrnDigits;

        sessionStorage.setItem("personalInfo", JSON.stringify(personalInfo));

        // Proceed
        window.location.href = "guardian.html";
    });
});
