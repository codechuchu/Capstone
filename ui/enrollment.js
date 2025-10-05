document.addEventListener("DOMContentLoaded", () => {
  const levelRadios = document.querySelectorAll('input[name="schoolLevel"]');
  const juniorGrades = document.getElementById('juniorGrades');
  const seniorOptions = document.getElementById('seniorOptions');
  const nextBtnContainer = document.getElementById('nextBtnContainer');
  const nextBtn = document.getElementById('nextBtn');
  const strandSelect = document.getElementById('strandSelect');
  const seniorGradeSelect = document.getElementById('seniorGradeSelect');
  const semesterWrapper = document.getElementById('semesterWrapper');
  const semesterSelect = document.getElementById('semesterSelect');

  // Load strands dynamically
  if (strandSelect) {
    fetch("../php/get_strands.php")
      .then(response => response.json())
      .then(data => {
        console.log("Strands response:", data);
  
        if (data.success && Array.isArray(data.data)) {
          data.data.forEach(strand => {
            let option = document.createElement("option");
            option.value = strand;
            option.textContent = strand;
            strandSelect.appendChild(option);
          });
          console.log("Options added:", strandSelect.options.length);
        } else {
          console.error("Error loading strands:", data.message);
        }
      })
      .catch(error => console.error("Fetch error:", error));
  }
  

  // Show grade or strand selection based on level selected
  levelRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'junior') {
        juniorGrades.style.display = 'block';
        seniorOptions.style.display = 'none';
      } else if (radio.value === 'senior') {
        seniorOptions.style.display = 'block';
        juniorGrades.style.display = 'none';
      }
      nextBtnContainer.style.display = 'block';
    });
  });

  // Show semester only if Grade 11/12 selected
  seniorGradeSelect.addEventListener("change", () => {
    if (seniorGradeSelect.value === "11" || seniorGradeSelect.value === "12") {
      semesterWrapper.style.display = "block";
    } else {
      semesterWrapper.style.display = "none";
      semesterSelect.value = "";
    }
  });

  // Handle Next button click and save selection to sessionStorage
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        // Validate level selected
        const selectedLevel = document.querySelector('input[name="schoolLevel"]:checked');
        if (!selectedLevel) {
            alert('Please select the school level.');
            return;
        }

        // Always define selectedSemester to avoid reference errors
        let selectedSemester = '';

        if (selectedLevel.value === 'junior') {
            const selectedGrade = document.querySelector('#juniorSelect')?.value;
            if (!selectedGrade) {
                alert('Please select a grade level.');
                return;
            }
            sessionStorage.setItem('gradeLevel', selectedGrade);
            sessionStorage.setItem('strand', '');
            selectedSemester = ''; // juniors have no semester
        } else if (selectedLevel.value === 'senior') {
            const selectedStrand = strandSelect.value;
            const selectedSeniorGrade = seniorGradeSelect.value;
            selectedSemester = semesterSelect.value;

            if (!selectedStrand) {
                alert('Please select a strand.');
                return;
            }
            if (!selectedSeniorGrade) {
                alert('Please select a grade.');
                return;
            }
            if (!selectedSemester) {
                alert('Please select a semester.');
                return;
            }

            sessionStorage.setItem('strand', selectedStrand);
            sessionStorage.setItem('gradeLevel', selectedSeniorGrade);
        }
        sessionStorage.setItem('semester', selectedSemester);
        console.log("Stored semester in sessionStorage before redirect:", sessionStorage.getItem('semester'));

        // Redirect to next step
        window.location.href = 'personal-info.html';
    });
}

});
