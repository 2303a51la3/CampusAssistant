// src/App.js
import React, { useState } from "react";
import ChatWidget from "./ChatWidget";
import AdminPanel from "./AdminPanel";
import "./App.css";

function App() {
  const [view, setView] = useState("student"); // "student" or "admin"
  const [quickAsk, setQuickAsk] = useState(null); // for quick cards -> ChatWidget

  const handleQuickQuestion = (text) => {
    setView("student"); // ensure student view is active
    setQuickAsk({
      text,
      at: Date.now(), // unique timestamp so ChatWidget reacts every click
    });
  };

  return (
    <div className="sru-app">
      {/* ====== SRU TOP BAR ====== */}
      <header className="sru-header">
        <div className="sru-header-left">
          <div className="sru-logo-text">sru</div>
          <div className="sru-header-subtitle">SR UNIVERSITY</div>
        </div>

        <div className="sru-header-right">
          <button
            className={`sru-nav-btn ${
              view === "student" ? "sru-nav-btn-active" : ""
            }`}
            onClick={() => setView("student")}
          >
            STUDENT
          </button>
          <button
            className={`sru-nav-btn ${
              view === "admin" ? "sru-nav-btn-active" : ""
            }`}
            onClick={() => setView("admin")}
          >
            ADMIN
          </button>
        </div>
      </header>

      {/* ====== MAIN CONTENT ====== */}
      <main className="sru-main">
        {view === "student" ? (
          <div className="student-page">
            {/* OLD hero layout + cards */}
            <section className="hero-card">
              {/* LEFT SIDE: title, text, bullets, CARDS */}
              <div className="hero-left">
                <p className="hero-section-label">STUDENT ASSISTANT</p>
                <h1 className="hero-title">SRU Campus Assistant</h1>

                <p className="hero-desc">
                  A smart chatbot that instantly answers campus-related queries
                  like exam schedules, placement cell information, project
                  submission deadlines, faculty contact details and graduation
                  requirements.
                </p>

                {/* ========== QUICK CARDS (inside same rectangle) ========== */}
                <div className="quick-cards">
                  <h3 className="quick-cards-title">Ask quickly about</h3>

                  <div className="quick-cards-grid">
                    {/* Exam schedule */}
                    <button
                      className="quick-card"
                      onClick={() =>
                        handleQuickQuestion("What is the exam schedule?")
                      }
                    >
                      <div className="quick-card-icon">📘</div>
                      <div className="quick-card-text">
                        <div className="quick-card-title">Exam schedule</div>
                        <div className="quick-card-sub">
                          Get current semester timetable.
                        </div>
                      </div>
                    </button>

                    {/* Placement cell */}
                    <button
                      className="quick-card"
                      onClick={() =>
                        handleQuickQuestion("Placement cell contact info")
                      }
                    >
                      <div className="quick-card-icon">💼</div>
                      <div className="quick-card-text">
                        <div className="quick-card-title">Placement cell</div>
                        <div className="quick-card-sub">
                          Email, location & support.
                        </div>
                      </div>
                    </button>

                    {/* Project deadlines */}
                    <button
                      className="quick-card"
                      onClick={() =>
                        handleQuickQuestion("Project submission deadlines")
                      }
                    >
                      <div className="quick-card-icon">📑</div>
                      <div className="quick-card-text">
                        <div className="quick-card-title">Project deadlines</div>
                        <div className="quick-card-sub">
                          Synopsis & viva dates.
                        </div>
                      </div>
                    </button>

                    {/* Graduation requirements */}
                    <button
                      className="quick-card"
                      onClick={() =>
                        handleQuickQuestion(
                          "Graduation requirements and rules"
                        )
                      }
                    >
                      <div className="quick-card-icon">🎓</div>
                      <div className="quick-card-text">
                        <div className="quick-card-title">Graduation rules</div>
                        <div className="quick-card-sub">
                          Credits, CGPA & clearances.
                        </div>
                      </div>
                    </button>

                    {/* Faculty contacts */}
                    <button
                      className="quick-card"
                      onClick={() =>
                        handleQuickQuestion("Faculty contact details")
                      }
                    >
                      <div className="quick-card-icon">👩‍🏫</div>
                      <div className="quick-card-text">
                        <div className="quick-card-title">Faculty contacts</div>
                        <div className="quick-card-sub">
                          Department-wise faculty details.
                        </div>
                      </div>
                    </button>

                    {/* Hostel info */}
                    <button
                      className="quick-card"
                      onClick={() =>
                        handleQuickQuestion("Hostel office contact details")
                      }
                    >
                      <div className="quick-card-icon">🏠</div>
                      <div className="quick-card-text">
                        <div className="quick-card-title">Hostel information</div>
                        <div className="quick-card-sub">
                          Warden & office details.
                        </div>
                      </div>
                    </button>

                    {/* Library */}
                    <button
                      className="quick-card"
                      onClick={() =>
                        handleQuickQuestion("Library timings and rules")
                      }
                    >
                      <div className="quick-card-icon">📚</div>
                      <div className="quick-card-text">
                        <div className="quick-card-title">Library</div>
                        <div className="quick-card-sub">
                          Timings & borrowing rules.
                        </div>
                      </div>
                    </button>

                    {/* Scholarships */}
                    <button
                      className="quick-card"
                      onClick={() =>
                        handleQuickQuestion("Scholarship eligibility details")
                      }
                    >
                      <div className="quick-card-icon">💰</div>
                      <div className="quick-card-text">
                        <div className="quick-card-title">Scholarships</div>
                        <div className="quick-card-sub">
                          Eligibility & deadlines.
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                <p className="hero-note">
                  Click the chat icon at the bottom-right corner or use the
                  quick cards above to start your conversation.
                </p>
              </div>

              {/* RIGHT SIDE: small gradient rectangle (old design) */}
              <div className="hero-right">
                <div className="hero-right-inner">
                  <div className="hero-right-title">SRU CAMPUS ASSISTANT</div>
                  <div className="hero-right-subtitle">
                    Integrated with SRU Student Portal (SRAaP)
                  </div>
                </div>
              </div>
            </section>

            {/* FLOATING CHAT BUBBLE + POPUP */}
            <ChatWidget externalQuestion={quickAsk} />
          </div>
        ) : (
          <div className="admin-page-wrapper">
            <AdminPanel />
          </div>
        )}
      </main>

      {/* ====== FOOTER ====== */}
      <footer className="sru-footer">
        © 2025, SR University. All Rights Reserved.
      </footer>
    </div>
  );
}

export default App;
