
document.addEventListener("DOMContentLoaded", () => {
  // Populate hidden fields with sessionStorage data
  const personal = JSON.parse(sessionStorage.getItem("personalInfo") || "{}");
  const guardian = JSON.parse(sessionStorage.getItem("guardianInfo") || "{}");
  const strand = sessionStorage.getItem("strand") || "";
  const gradeLevel = sessionStorage.getItem("gradeLevel") || "";
  const semester = sessionStorage.getItem("semester") || "";

  document.getElementById("hidden_track").value = strand || "";
  document.getElementById("hidden_grade_level").value = gradeLevel || "";
  document.getElementById("hidden_semester").value = semester || "";

  // Build student full name
  const studentFullName = [personal.firstName, personal.middleName, personal.lastName, personal.suffixName]
    .filter(Boolean)
    .join(" ");
  document.getElementById("hidden_student_name").value = studentFullName;

  document.getElementById("hidden_gender").value = personal.gender || "";
  document.getElementById("hidden_birthdate").value = personal.dateOfBirth || personal.birthdate || "";

  const studentAddress = [personal.streetHouse, personal.barangay, personal.municipalityCity, personal.province]
    .filter(Boolean)
    .join(", ");
  document.getElementById("hidden_address").value = studentAddress;

  document.getElementById("hidden_contact").value = personal.cellphoneNumber || personal.telephoneNumber || "";
  document.getElementById("hidden_email").value = personal.emailAddress || "";

  // Guardian full name
  const guardianFullName = [guardian.firstName, guardian.middleName, guardian.lastName, guardian.suffixName]
    .filter(Boolean)
    .join(" ");
  document.getElementById("hidden_guardian_name").value = guardianFullName;

  document.getElementById("hidden_guardian_relation").value = guardian.relation || "";
  document.getElementById("hidden_guardian_contact").value = guardian.contact || "";

  // Attach file button opens hidden input
  document.querySelectorAll('.attach-file-btn').forEach(button => {
    button.addEventListener('click', () => {
      const targetInputId = button.dataset.targetInput;
      const fileInput = document.getElementById(targetInputId);
      if (fileInput) {
        fileInput.click();
      } else {
        console.error(`File input with ID '${targetInputId}' not found.`);
      }
    });
  });

  // Show selected filename
  document.querySelectorAll('input[type="file"]').forEach(input => {
    input.addEventListener('change', (event) => {
      const container = event.target.parentElement;
      const fileNameSpan = container.querySelector('.filename-text');
      if (fileNameSpan) {
        fileNameSpan.textContent = event.target.files.length > 0
          ? event.target.files[0].name
          : 'No file chosen';
      }
    });
  });

  // Handle form submission
  const form = document.getElementById('document-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Stop default POST
  
    // Validate required files
    const allFileInputs = Array.from(form.querySelectorAll('input[type="file"][required]'));
    const missingFiles = allFileInputs.filter(input => input.files.length === 0);
  
    if (missingFiles.length > 0) {
      alert('Please attach all required documents before proceeding.');
      missingFiles[0].focus();
      return;
    }
  
    // Convert all files to Base64 so we can store them temporarily
    const uploadedDocs = {};
    for (const input of allFileInputs) {
      const file = input.files[0];
      uploadedDocs[input.name] = {
        name: file.name,
        type: file.type,
        data: await fileToBase64(file)
      };
    }
  
    // Store files in sessionStorage
    sessionStorage.setItem('uploadedDocs', JSON.stringify(uploadedDocs));
  
    // Merge hidden fields with existing personalInfo
    const personalInfo = JSON.parse(sessionStorage.getItem("personalInfo") || "{}");
    form.querySelectorAll('input[type="hidden"]').forEach(hidden => {
      personalInfo[hidden.name] = hidden.value;
    });
    sessionStorage.setItem('personalInfo', JSON.stringify(personalInfo));
  
    // ✅ Always store strand, gradeLevel, and semester from hidden fields
    sessionStorage.setItem('strand', document.getElementById("hidden_track")?.value || "");
    sessionStorage.setItem('gradeLevel', document.getElementById("hidden_grade_level")?.value || "");
    sessionStorage.setItem('semester', document.getElementById("hidden_semester")?.value || "");
  
    console.log("Stored in sessionStorage:", {
      strand: sessionStorage.getItem('strand'),
      gradeLevel: sessionStorage.getItem('gradeLevel'),
      semester: sessionStorage.getItem('semester')
    });
    console.log("Stored semester in sessionStorage:", sessionStorage.getItem('semester'));
    // Go to step 3
    window.location.href = 'validateInfo.html';
  });
  
  // Helper function to convert file to Base64
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }
  
});
