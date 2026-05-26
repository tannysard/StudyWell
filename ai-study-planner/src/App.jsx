import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import * as pdfjsLib from "pdfjs-dist";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

export default function App() {

  const [syllabus, setSyllabus] = useState("");
  const [daysLeft, setDaysLeft] = useState("");
  const [hours, setHours] = useState("");
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");

  const genAI = new GoogleGenerativeAI(
    import.meta.env.VITE_GEMINI_API_KEY
  );

  async function handlePDFUpload(event) {

    const file = event.target.files[0];

    if (!file) return;

    setUploadedFileName(file.name);

    const reader = new FileReader();

    reader.onload = async function () {

      const typedArray = new Uint8Array(this.result);

      const pdf = await pdfjsLib.getDocument(typedArray).promise;

      let extractedText = "";

      for (let i = 1; i <= pdf.numPages; i++) {

        const page = await pdf.getPage(i);

        const textContent = await page.getTextContent();

        const textItems = textContent.items
          .map(item => item.str)
          .join(" ");

        extractedText += textItems + "\n";

      }

      setSyllabus(extractedText);

    };

    reader.readAsArrayBuffer(file);
  }

  async function generatePlan() {

    if (!syllabus || !daysLeft || !hours) {
      setPlan("Please fill all fields.");
      return;
    }

    try {

      setLoading(true);

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
      });

      const prompt = `
You are an elite academic productivity mentor.

Create a highly detailed and practical study plan.

SYLLABUS:
${syllabus}

DAYS REMAINING FOR EXAM:
${daysLeft}

AVAILABLE STUDY HOURS PER DAY:
${hours}

IMPORTANT:
- Use proper markdown formatting
- Use headings and subheadings
- Use bullet points
- Use tables wherever useful
- Keep spacing clean
- Avoid giant paragraphs
- Make it visually professional

The response should contain:

# Overall Strategy

# Topic Priorities

# Day-wise Study Plan

# Revision Strategy

# Productivity Tips

# Motivation
`;

      const result = await model.generateContent(prompt);

      const response = await result.response;

      const text = response.text();

      setPlan(text);

    } catch (error) {

      console.log(error);

      setPlan("Something went wrong.");

    }

    setLoading(false);
  }

  function downloadPDF() {

    const doc = new jsPDF();

    let y = 20;

    // Title

    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);

    doc.text("AI Personalized Study Plan", 15, y);

    y += 15;

    // Subtitle

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    doc.setTextColor(100);

    doc.text(
      "Generated using AI Study Planner",
      15,
      y
    );

    y += 15;

    // Divider

    doc.setDrawColor(180);

    doc.line(15, y, 195, y);

    y += 10;

    // Process sections

    const sections = plan.split("#").filter(Boolean);

    sections.forEach((section) => {

      const lines = section.trim().split("\n");

      const title = lines[0];

      const content = lines.slice(1).join("\n");

      // New page if needed

      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      // Section Title

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);

      doc.setTextColor(40);

      doc.text(title, 15, y);

      y += 10;

      // Content

      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);

      doc.setTextColor(70);

      const splitText = doc.splitTextToSize(content, 170);

      doc.text(splitText, 15, y);

      y += splitText.length * 7 + 12;

    });

    // Summary Table

    autoTable(doc, {
      startY: y,
      head: [["Study Inputs", "Values"]],
      body: [
        ["Days Remaining", daysLeft],
        ["Study Hours Per Day", hours],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [120, 90, 255],
      },
    });

    doc.save("AI_Study_Plan.pdf");
  }

  return (

    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-zinc-800 text-white flex items-center justify-center p-6 relative overflow-hidden">

      {/* Glow Effects */}

      <div className="absolute w-72 h-72 bg-purple-500 rounded-full blur-3xl opacity-20 top-10 left-10 animate-pulse"></div>

      <div className="absolute w-72 h-72 bg-blue-500 rounded-full blur-3xl opacity-20 bottom-10 right-10 animate-pulse"></div>

      {/* Main Container */}

      <div className="backdrop-blur-lg bg-white/10 border border-white/20 p-8 rounded-3xl w-full max-w-5xl shadow-2xl z-10">

        <h1 className="text-5xl font-extrabold text-center mb-3">
          AI Study Planner
        </h1>

        <p className="text-center text-zinc-300 mb-8">
          Generate intelligent AI-powered study roadmaps
        </p>

        <div className="space-y-6">

          {/* Upload */}

          <label className="block">

            <div className="
            cursor-pointer
            bg-white/5
            hover:bg-white/10
            transition
            duration-300
            border
            border-dashed
            border-white/20
            rounded-3xl
            p-8
            text-center
            group
            ">

              <div className="text-5xl mb-4 group-hover:scale-110 transition">
                📄
              </div>

              <h2 className="text-2xl font-bold mb-2">
                Upload Syllabus PDF
              </h2>

              <p className="text-zinc-400">
                Click to upload your syllabus document
              </p>

              {uploadedFileName && (
                <p className="mt-4 text-green-400 font-semibold">
                  Uploaded: {uploadedFileName}
                </p>
              )}

            </div>

            <input
              type="file"
              accept=".pdf"
              onChange={handlePDFUpload}
              className="hidden"
            />

          </label>

          {/* Textarea */}

          <textarea
            placeholder="Paste your syllabus/topics here..."
            value={syllabus}
            onChange={(e) => setSyllabus(e.target.value)}
            rows={8}
            className="
            w-full
            p-5
            rounded-3xl
            bg-white/10
            border
            border-white/10
            outline-none
            focus:border-purple-400
            resize-none
            transition
            "
          />

          {/* Days */}

          <input
            type="number"
            placeholder="Days left for exam"
            value={daysLeft}
            onChange={(e) => setDaysLeft(e.target.value)}
            className="
            w-full
            p-5
            rounded-3xl
            bg-white/10
            border
            border-white/10
            outline-none
            focus:border-purple-400
            transition
            "
          />

          {/* Hours */}

          <input
            type="number"
            placeholder="Study hours available per day"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="
            w-full
            p-5
            rounded-3xl
            bg-white/10
            border
            border-white/10
            outline-none
            focus:border-purple-400
            transition
            "
          />

          {/* Generate Button */}

          <button
            onClick={generatePlan}
            className="
            w-full
            bg-white
            text-black
            py-5
            rounded-3xl
            font-bold
            text-xl
            hover:scale-[1.02]
            transition
            duration-300
            flex
            items-center
            justify-center
            gap-3
            shadow-2xl
            "
          >

            {loading && (
              <div className="
              w-5
              h-5
              border-4
              border-black
              border-t-transparent
              rounded-full
              animate-spin
              "></div>
            )}

            {loading ? "Generating Plan..." : "Generate AI Study Plan"}

          </button>

          {/* Output */}

          {plan && (

            <div className="
            bg-black/40
            border
            border-white/10
            p-10
            rounded-3xl
            mt-10
            text-zinc-100
            shadow-2xl
            ">

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 border-b border-white/10 pb-5">

                <h2 className="text-4xl font-bold">
                  Your Personalized Study Plan
                </h2>

                <button
                  onClick={downloadPDF}
                  className="
                  bg-purple-500
                  hover:bg-purple-600
                  transition
                  px-6
                  py-3
                  rounded-2xl
                  font-semibold
                  shadow-xl
                  "
                >
                  Download PDF
                </button>

              </div>

              <div className="
              text-zinc-300
              leading-8
              space-y-6
              ">

                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{

                    h1: ({ node, ...props }) => (
                      <h1 className="text-4xl font-bold mt-10 mb-6 text-white" {...props} />
                    ),

                    h2: ({ node, ...props }) => (
                      <h2 className="text-3xl font-bold mt-8 mb-5 text-white" {...props} />
                    ),

                    h3: ({ node, ...props }) => (
                      <h3 className="text-2xl font-semibold mt-6 mb-4 text-white" {...props} />
                    ),

                    p: ({ node, ...props }) => (
                      <p className="mb-5 text-zinc-300 leading-8" {...props} />
                    ),

                    li: ({ node, ...props }) => (
                      <li className="ml-6 mb-2 list-disc" {...props} />
                    ),

                    table: ({ node, ...props }) => (
                      <table className="w-full border-collapse border border-white/20 my-6" {...props} />
                    ),

                    th: ({ node, ...props }) => (
                      <th className="border border-white/20 bg-white/10 p-4 text-left" {...props} />
                    ),

                    td: ({ node, ...props }) => (
                      <td className="border border-white/20 p-4" {...props} />
                    ),

                  }}
                >
                  {plan}
                </ReactMarkdown>

              </div>

            </div>

          )}

        </div>

      </div>

    </div>
  );
}