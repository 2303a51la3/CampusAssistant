// server.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cron = require("node-cron");

const app = express();

// ===== MIDDLEWARES =====
app.use(cors());
app.use(express.json());

// ===== MongoDB connection =====
mongoose
  .connect("mongodb://127.0.0.1:27017/campus-chatbot", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("Mongo error:", err));

// ===== FAQ model =====
const faqSchema = new mongoose.Schema({
  question: String,
  answer: String,
  tags: [String],

  department: {
    type: String,
    default: "all",
  },
  year: {
    type: String,
    default: "all",
  },
});

const FAQ = mongoose.model("FAQ", faqSchema);

// ===== Chat usage log model (for analytics + history) =====
const chatLogSchema = new mongoose.Schema({
  message: String,
  department: String,
  year: String,
  faqId: { type: mongoose.Schema.Types.ObjectId, ref: "FAQ" },
  createdAt: { type: Date, default: Date.now },
});

const ChatLog = mongoose.model("ChatLog", chatLogSchema);

// ===== Keyword helpers =====
const STOP_WORDS = new Set([
  "what","when","where","which","who",
  "whom",
  "whose",
  "why",
  "how",
  "is",
  "are",
  "am",
  "was",
  "were",
  "will",
  "shall",
  "do",
  "does",
  "did",
  "the",
  "a",
  "an",
  "for",
  "to",
  "of",
  "in",
  "on",
  "at",
  "and",
  "or",
  "with",
  "this",
  "that",
  "these",
  "those",
  "please",
  "tell",
  "me",
  "about",
]);

function getKeywords(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

// FAQ nundi keywords set
function getFaqKeywords(faq) {
  const q = faq.question || "";
  const tagsString = (faq.tags || []).join(" ");
  const combined = `${q} ${tagsString}`;
  return new Set(getKeywords(combined));
}

// userKeywords mariyu faqKeywords madhya overlap score
function getMatchScore(userKeywords, faqKeywordSet) {
  let score = 0;
  for (const k of userKeywords) {
    if (faqKeywordSet.has(k)) score++;
  }
  return score;
}

// ===== Simple seed route (optional – run once) =====
app.get("/api/seed", async (req, res) => {
  try {
    await FAQ.deleteMany({});
    await ChatLog.deleteMany({}); // clear logs as well

    await FAQ.insertMany([
      {
        question: "When are the semester exams?",
        answer:
          "Semester exams are usually held in December and May. Please check the official exam timetable on the SRU Student Portal (SRAaP) for exact dates.",
        tags: ["exam", "timetable", "schedule"],
        department: "all",
        year: "all",
      },
      {
        question: "Placement cell contact info",
        answer:
          "You can reach the Training & Placement Cell at placement@sru.edu or visit the T&P office in the main campus during working hours.",
        tags: ["placement", "contact", "tnp"],
        department: "all",
        year: "all",
      },
      {
        question: "Project submission deadlines",
        answer:
          "Project synopsis and final report deadlines are announced by each department. Please refer to your department notice board or SRU portal for the current academic year schedule.",
        tags: ["project", "deadline"],
        department: "all",
        year: "4",
      },
    ]);

    res.json({ message: "Seeded FAQs successfully ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Seeding failed" });
  }
});

// ===== Chat endpoint (new logic with scoring) =====
app.post("/api/chat", async (req, res) => {
  const { message, department, year } = req.body;

  if (!message || !message.trim()) {
    return res.json({
      reply: "Please type a question so I can help you 😊",
    });
  }

  const dept = (department || "all").toLowerCase();
  const yr = year || "all";

  const userKeywords = getKeywords(message);
  if (!userKeywords.length) {
    return res.json({
      reply:
        "I couldn't understand the question clearly. Please rephrase your query with a few more words.",
    });
  }

  try {
    // 1) Dept / Year scope: only FAQs that match this department & year (or ALL)
    const filter = {
      $and: [
        {
          $or: [
            { department: dept },
            { department: "all" },
            { department: { $exists: false } },
          ],
        },
        {
          $or: [{ year: yr }, { year: "all" }, { year: { $exists: false } }],
        },
      ],
    };

    const faqs = await FAQ.find(filter);

    if (!faqs.length) {
      // nothing available in DB for this dept/year
      try {
        await ChatLog.create({
          message,
          department: dept,
          year: yr,
          faqId: null,
        });
      } catch (logErr) {
        console.error("Error logging unanswered chat:", logErr);
      }

      return res.json({
        reply:
          "I couldn't find any information for this query. Please contact your department office for more details.",
      });
    }

    // 2) Score every FAQ for keyword overlap
    let bestFaq = null;
    let bestScore = 0;

    for (const faq of faqs) {
      const faqKeywordSet = getFaqKeywords(faq);
      const score = getMatchScore(userKeywords, faqKeywordSet);

      if (score > bestScore) {
        bestScore = score;
        bestFaq = faq;
      }
    }

    const MIN_SCORE = 2; // 👈 at least 2 keywords must match

    if (!bestFaq || bestScore < MIN_SCORE) {
      // low confidence → generic response
      try {
        await ChatLog.create({
          message,
          department: dept,
          year: yr,
          faqId: null,
        });
      } catch (logErr) {
        console.error("Error logging unanswered chat:", logErr);
      }

      return res.json({
        reply:
          "I couldn't find an exact answer for that. Please check with your department office or try asking in a different way.",
      });
    }

    // 3) Good match found → log & reply
    try {
      await ChatLog.create({
        message,
        department: dept,
        year: yr,
        faqId: bestFaq._id,
      });
    } catch (logErr) {
      console.error("Error logging chat:", logErr);
    }

    return res.json({ reply: bestFaq.answer });
  } catch (err) {
    console.error("Chat error:", err);
    return res.status(500).json({
      reply: "Something went wrong on the server. Please try again later.",
    });
  }
});

// ===== CRUD APIs for FAQs (Admin) =====

// get all FAQs
app.get("/api/faqs", async (req, res) => {
  const faqs = await FAQ.find().sort({ _id: -1 });
  res.json(faqs);
});

// create FAQ
app.post("/api/faqs", async (req, res) => {
  try {
    const { question, answer, tags, department, year } = req.body;
    const faq = await FAQ.create({
      question,
      answer,
      tags: tags || [],
      department: (department || "all").toLowerCase(),
      year: year || "all",
    });
    res.json(faq);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Error creating FAQ" });
  }
});

// update FAQ
app.put("/api/faqs/:id", async (req, res) => {
  try {
    const { question, answer, tags, department, year } = req.body;
    const faq = await FAQ.findByIdAndUpdate(
      req.params.id,
      {
        question,
        answer,
        tags: tags || [],
        department: (department || "all").toLowerCase(),
        year: year || "all",
      },
      { new: true }
    );
    res.json(faq);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Error updating FAQ" });
  }
});

// delete FAQ
app.delete("/api/faqs/:id", async (req, res) => {
  try {
    await FAQ.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(400).json({ message: "Error deleting FAQ" });
  }
});

// ===== Analytics summary for Admin =====
app.get("/api/stats/summary", async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const totalAllTime = await ChatLog.countDocuments({});
    const totalToday = await ChatLog.countDocuments({
      createdAt: { $gte: todayStart },
    });

    const byDept = await ChatLog.aggregate([
      { $group: { _id: "$department", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const byYear = await ChatLog.aggregate([
      { $group: { _id: "$year", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const topFaqsAgg = await ChatLog.aggregate([
      { $match: { faqId: { $ne: null } } },
      { $group: { _id: "$faqId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const faqIds = topFaqsAgg.map((x) => x._id);
    const faqs = await FAQ.find({ _id: { $in: faqIds } });

    const topFaqs = topFaqsAgg.map((row) => {
      const faq = faqs.find((f) => f._id.toString() === row._id.toString());
      return {
        id: row._id,
        question: faq ? faq.question : "Unknown FAQ",
        count: row.count,
      };
    });

    res.json({
      totalAllTime,
      totalToday,
      byDept,
      byYear,
      topFaqs,
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ message: "Error computing stats" });
  }
});

// ===== Recent Chat History for Admin =====
app.get("/api/chatlogs/recent", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;

    const logs = await ChatLog.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("faqId", "question tags");

    res.json(logs);
  } catch (err) {
    console.error("Chat history error:", err);
    res.status(500).json({ message: "Error loading chat history" });
  }
});
// Auto-delete chat logs every day at midnight (12:00 AM)
cron.schedule("0 0 * * *", async () => {
  try {
    await ChatLog.deleteMany({});
    console.log("🧹 Daily Cleanup: Chat logs cleared successfully!");
  } catch (err) {
    console.error("Cleanup error:", err);
  }
});

// ===== Start server =====
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
