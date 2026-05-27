import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import * as pdfjsLib from "pdfjs-dist";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FaGithub } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

// Framer Motion Variants for staggered entrance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 90,
      damping: 14,
    },
  },
};

const planContainerVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.99 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 70,
      damping: 15,
      when: "beforeChildren",
      staggerChildren: 0.08,
    },
  },
};

const markdownItemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

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

      setPlan(error.message);

    }

    setLoading(false);
  }

  function downloadPDF() {

    const doc = new jsPDF();

    let y = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);

    doc.text("AI Personalized Study Plan", 15, y);

    y += 15;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    doc.setTextColor(100);

    doc.text(
      "Generated using AI Study Planner",
      15,
      y
    );

    y += 15;

    doc.setDrawColor(180);

    doc.line(15, y, 195, y);

    y += 10;

    const sections = plan.split("#").filter(Boolean);

    sections.forEach((section) => {

      const lines = section.trim().split("\n");

      const title = lines[0];

      const content = lines.slice(1).join("\n");

      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);

      doc.setTextColor(40);

      doc.text(title, 15, y);

      y += 10;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);

      doc.setTextColor(70);

      const splitText = doc.splitTextToSize(content, 170);

      doc.text(splitText, 15, y);

      y += splitText.length * 7 + 12;

    });

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
      
      {/* Dynamic Floating Glow Effects */}
      <motion.div
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 30, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute w-72 h-72 bg-purple-500 rounded-full blur-3xl opacity-20 top-10 left-10"
      />

      <motion.div
        animate={{
          x: [0, -30, 40, 0],
          y: [0, 40, -20, 0],
          scale: [1, 0.9, 1.15, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute w-72 h-72 bg-blue-500 rounded-full blur-3xl opacity-20 bottom-10 right-10"
      />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", duration: 1.2, bounce: 0.15 }}
        className="backdrop-blur-lg bg-white/10 border border-white/20 p-8 rounded-3xl w-full max-w-5xl shadow-2xl z-10"
      >
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="text-5xl font-extrabold text-center mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-purple-400"
        >
          AI Study Planner
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center text-zinc-300 mb-8"
        >
          Generate intelligent AI-powered study roadmaps
        </motion.p>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Upload */}
          <motion.label variants={itemVariants} className="block">
            <motion.div
              whileHover={{
                scale: 1.015,
                borderColor: "rgba(168, 85, 247, 0.4)",
                backgroundColor: "rgba(255, 255, 255, 0.07)",
              }}
              whileTap={{ scale: 0.99 }}
              className="cursor-pointer bg-white/5 transition-all duration-200 border border-dashed border-white/20 rounded-3xl p-8 text-center group"
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                📄
              </div>

              <h2 className="text-2xl font-bold mb-2">
                Upload Syllabus PDF
              </h2>

              <p className="text-zinc-400">
                Click to upload your syllabus document
              </p>

              <AnimatePresence mode="wait">
                {uploadedFileName && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -5 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="mt-4 text-green-400 font-semibold flex items-center justify-center gap-2"
                  >
                    <span>✅ Uploaded: {uploadedFileName}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <input
              type="file"
              accept=".pdf"
              onChange={handlePDFUpload}
              className="hidden"
            />
          </motion.label>

          {/* Textarea */}
          <motion.div variants={itemVariants}>
            <textarea
              placeholder="Paste your syllabus/topics here..."
              value={syllabus}
              onChange={(e) => setSyllabus(e.target.value)}
              rows={8}
              className="w-full p-5 rounded-3xl bg-white/10 border border-white/10 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 resize-none transition-all duration-200"
            />
          </motion.div>

          {/* Days */}
          <motion.div variants={itemVariants}>
            <input
              type="number"
              placeholder="Days left for exam"
              value={daysLeft}
              onChange={(e) => setDaysLeft(e.target.value)}
              className="w-full p-5 rounded-3xl bg-white/10 border border-white/10 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-200"
            />
          </motion.div>

          {/* Hours */}
          <motion.div variants={itemVariants}>
            <input
              type="number"
              placeholder="Study hours available per day"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full p-5 rounded-3xl bg-white/10 border border-white/10 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-200"
            />
          </motion.div>

          {/* Generate Button */}
          <motion.button
            variants={itemVariants}
            onClick={generatePlan}
            disabled={loading}
            whileHover={loading ? {} : {
              scale: 1.015,
              boxShadow: "0 20px 40px -15px rgba(168, 85, 247, 0.4)",
              backgroundColor: "#f3e8ff",
            }}
            whileTap={loading ? {} : { scale: 0.985 }}
            className="w-full bg-white text-black py-5 rounded-3xl font-bold text-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-2xl cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
          >
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-5 h-5 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating Plan...</span>
                </motion.div>
              ) : (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex items-center gap-2"
                >
                  ✨ Generate AI Study Plan
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Output with AnimatePresence */}
          <AnimatePresence>
            {plan && (
              <motion.div
                variants={planContainerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-black/40 border border-white/10 p-10 rounded-3xl mt-10 text-zinc-100 shadow-2xl"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 border-b border-white/10 pb-5">
                  <h2 className="text-4xl font-bold">
                    Your Personalized Study Plan
                  </h2>

                  <motion.button
                    onClick={downloadPDF}
                    whileHover={{ scale: 1.05, backgroundColor: "#a855f7" }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-purple-500 transition-colors duration-200 px-6 py-3 rounded-2xl font-semibold shadow-xl cursor-pointer text-white"
                  >
                    Download PDF
                  </motion.button>
                </div>

                <div className="text-zinc-300 leading-8 space-y-6">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ node, ...props }) => (
                        <motion.h1
                          variants={markdownItemVariants}
                          className="text-4xl font-bold mt-10 mb-6 text-white"
                          {...props}
                        />
                      ),
                      h2: ({ node, ...props }) => (
                        <motion.h2
                          variants={markdownItemVariants}
                          className="text-3xl font-bold mt-8 mb-5 text-white"
                          {...props}
                        />
                      ),
                      h3: ({ node, ...props }) => (
                        <motion.h3
                          variants={markdownItemVariants}
                          className="text-2xl font-semibold mt-6 mb-4 text-white"
                          {...props}
                        />
                      ),
                      p: ({ node, ...props }) => (
                        <motion.p
                          variants={markdownItemVariants}
                          className="mb-5 text-zinc-300 leading-8"
                          {...props}
                        />
                      ),
                      li: ({ node, ...props }) => (
                        <motion.li
                          variants={markdownItemVariants}
                          className="ml-6 mb-2 list-disc text-zinc-300"
                          {...props}
                        />
                      ),
                      table: ({ node, ...props }) => (
                        <motion.table
                          variants={markdownItemVariants}
                          className="w-full border-collapse border border-white/20 my-6 overflow-hidden rounded-xl"
                          {...props}
                        />
                      ),
                      th: ({ node, ...props }) => (
                        <th className="border border-white/20 bg-white/10 p-4 text-left font-semibold text-white" {...props} />
                      ),
                      td: ({ node, ...props }) => (
                        <td className="border border-white/20 p-4 text-zinc-300" {...props} />
                      ),
                    }}
                  >
                    {plan}
                  </ReactMarkdown>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-zinc-400">
          <p className="text-sm">
            © 2026 AI Study Planner • Built by Tanmay Patil
          </p>

          <a
            href="https://github.com/tannysard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 hover:text-white transition-colors duration-300"
          >
            <FaGithub className="text-2xl" />
            <span className="font-medium">github.com/tannysard</span>
          </a>
        </div>
      </motion.div>
    </div>
  );
}