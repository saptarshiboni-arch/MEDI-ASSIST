const fileInput = document.getElementById("fileInput");
const preview = document.getElementById("preview");
const output = document.getElementById("output");

/* Show image preview */
fileInput.addEventListener("change", function () {
  const file = this.files[0];

  if (file) {
    const reader = new FileReader();

    reader.onload = function () {
      preview.src = reader.result;
      preview.style.display = "block";
    };

    reader.readAsDataURL(file);
  }
});

/* Fake AI Analysis (you can replace with real API later) */
function analyzePrescription() {
  output.innerHTML = `
    <p><strong>Medicine:</strong> Paracetamol</p>
    <p><strong>Dosage:</strong> 500mg</p>
    <p><strong>Frequency:</strong> Twice a day</p>
    <p style="color:#00e5ff;">✔ AI Analysis Complete</p>
  `;
}