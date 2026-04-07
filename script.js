// Initialize icons safely
if (window.lucide) lucide.createIcons();

// --------------------
// ELEMENTS
// --------------------
const fileInput = document.getElementById("file-input");
const dropZone = document.getElementById("drop-zone");
const analyzeBtn = document.getElementById("analyze-btn");
const imagePreview = document.getElementById("image-preview");
const queryBtn = document.getElementById("query-btn");

// ⚠️ Your Groq API Key
const GROQ_API_KEY = "YOUR_GROQ_API_KEY";

// --------------------
// SAFE JSON PARSER
// --------------------
function safeParse(text) {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch {
    return null;
  }
}

// --------------------
// IMAGE UPLOAD
// --------------------
if (dropZone) dropZone.onclick = () => fileInput.click();

if (fileInput) {
  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Upload a valid image");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      imagePreview.src = ev.target.result;

      document.getElementById("upload-ui")?.classList.add("hidden");
      document.getElementById("preview-container")?.classList.remove("hidden");

      analyzeBtn.disabled = false;
    };
    reader.readAsDataURL(file);
  };
}

// --------------------
// ANALYZE PRESCRIPTION (OCR + AI)
// --------------------
analyzeBtn.onclick = async () => {
  try {
    if (!imagePreview.src) {
      alert("Upload image first");
      return;
    }

    analyzeBtn.innerText = "🧠 Analyzing...";
    analyzeBtn.disabled = true;

    // ⚡ OCR (faster config)
    const ocr = await Tesseract.recognize(imagePreview.src, "eng", {
      logger: (m) => console.log(m),
    });

    const extractedText = ocr.data.text.trim();
    console.log("OCR TEXT:", extractedText);

    if (!extractedText || extractedText.length < 5) {
      throw new Error("Prescription not clear");
    }

    // ⚡ AI CALL (dynamic + real)
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          temperature: 0.9, // 🔥 makes responses different each time
          messages: [
            {
              role: "system",
              content: `
You are an advanced medical prescription analyzer.

From the given OCR text:
- Extract medicine names
- Extract dosage
- Extract usage if possible

Return ONLY JSON:
{
  "name": "",
  "dose": "",
  "usage": ""
}

If unclear, make intelligent guesses.
                        `,
            },
            {
              role: "user",
              content: extractedText,
            },
          ],
        }),
      },
    );

    const data = await response.json();
    console.log("AI RAW:", data);

    if (data.error) throw new Error(data.error.message);

    const raw = data.choices?.[0]?.message?.content || "";
    const result = safeParse(raw);

    // ✅ Always show something (even if JSON fails)
    document.getElementById("res-name").innerText =
      result?.name || raw || "Unknown";

    document.getElementById("res-dose").innerText = result?.dose || "Not found";

    document.getElementById("results").classList.remove("hidden");
  } catch (err) {
    console.error(err);
    alert("⚠️ " + err.message);
  } finally {
    analyzeBtn.innerText = "RUN AI ANALYSIS";
    analyzeBtn.disabled = false;
  }
};

// --------------------
// MEDICAL QUERY AI (REAL RESPONSE)
// --------------------
if (queryBtn) {
  queryBtn.onclick = async () => {
    const text = document.getElementById("user-query").value.trim();
    const aiText = document.getElementById("ai-text");

    if (!text) return;

    aiText.innerText = "🧠 Thinking...";
    document.getElementById("query-response").classList.remove("hidden");

    try {
      const res = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama3-8b-8192",
            temperature: 1, // 🔥 makes answers unique every time
            messages: [
              {
                role: "system",
                content: `
You are a professional medical AI.

For each query:
- Explain cause
- Give precautions
- Suggest remedies
- Add disclaimer

Respond naturally like a doctor.
                            `,
              },
              {
                role: "user",
                content: text,
              },
            ],
          }),
        },
      );

      const data = await res.json();
      console.log("QUERY:", data);

      if (data.error) throw new Error(data.error.message);

      aiText.innerText = data.choices?.[0]?.message?.content || "No response";
    } catch (err) {
      console.error(err);
      aiText.innerText = "⚠️ API Error / Internet issue";
    }
  };
}
