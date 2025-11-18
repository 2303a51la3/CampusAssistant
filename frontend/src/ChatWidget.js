// src/ChatWidget.js
import React, { useState, useEffect, useRef } from "react";
import "./ChatWidget.css";
function ChatWidget({ externalQuestion }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [department, setDepartment] = useState("cse");
  const [year, setYear] = useState("4");
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hi! I’m your SRU Campus Assistant 🤖. Select your department and year, then ask any campus-related question.",
      time: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatBodyRef = useRef(null);
  const toggleOpen = () => setIsOpen((prev) => !prev);
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isLoading]);
  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  const sendToServer = async (userText) => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          department,
          year,
        }),
      });
      const data = await res.json();
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: data.reply || "Sorry, I did not get that.",
            time: new Date(),
          },
        ]);
        setIsLoading(false);
      }, 500);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "Oops! I couldn't reach the server. Please try again.",
          time: new Date(),
        },
      ]);
      setIsLoading(false);
    }
  };
  const handleSend = () => {
    if (!input.trim()) return;
    const userText = input.trim();
    setMessages((prev) => [
      ...prev,
      { from: "user", text: userText, time: new Date() },
    ]);
    setInput("");
    sendToServer(userText);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };
  const handleQuick = (text) => setInput(text);
  /* ==== NEW: react to external quick questions from student page ==== */
  useEffect(() => {
    if (!externalQuestion || !externalQuestion.text) return;
    const userText = externalQuestion.text.trim();
    if (!userText) return;
    // Open chat, add user message, send to server
    setIsOpen(true);
    setMessages((prev) => [
      ...prev,
      { from: "user", text: userText, time: new Date() },
    ]);
    sendToServer(userText);
  }, [externalQuestion]);
  /* ================================================================ */
  return (
    <>
      {!isOpen && (
        <button className="chat-launcher" onClick={toggleOpen}>
          💬
        </button>
      )}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-header-left">
              <div className="bot-avatar">SR</div>
              <div>
                <div className="chat-title">SRU Campus Assistant</div>
                <div className="chat-subtitle">
                  <span className="status-dot" /> Online · SRU Student Support
                </div>
              </div>
            </div>
            <button className="chat-close" onClick={toggleOpen}>
              ✕
            </button>
          </div>
          {/* profile bar */}
          <div className="chat-profile-bar">
            <div className="profile-label">Your details</div>
            <div className="profile-fields">
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}>
                <option value="cse">CSE</option>
                <option value="ece">ECE</option>
                <option value="eee">EEE</option>
                <option value="civil">CIVIL</option>
                <option value="mech">MECH</option>
                <option value="other">OTHER</option>
              </select>
              <select value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="1">1st</option>
                <option value="2">2nd</option>
                <option value="3">3rd</option>
                <option value="4">4th</option>
              </select>
            </div>
          </div>
          <div className="chat-body" ref={chatBodyRef}>
            {messages.map((m, index) => (
              <div
                key={index}
                className={
                  m.from === "user" ? "chat-row user-row" : "chat-row bot-row"
                }>
                {m.from === "bot" && (
                  <div className="bubble-avatar small-avatar">🤖</div>
                )}
                <div
                  className={
                    m.from === "user"
                      ? "chat-message user"
                      : "chat-message bot"
                  }>
                  <div className="msg-text">{m.text}</div>
                  <div className="msg-time">{formatTime(m.time)}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="chat-row bot-row">
                <div className="bubble-avatar small-avatar">🤖</div>
                <div className="chat-message bot typing">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
          </div>
          <div className="chat-footer">
            <input
              type="text"
              placeholder="Type your question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button onClick={handleSend}>Send</button>
          </div>
          <div className="quick-suggestions">
            <button onClick={() => handleQuick("What is the exam schedule?")}>
              Exam Schedule
            </button>
            <button onClick={() => handleQuick("Placement cell info")}>
              Placement
            </button>
            <button
              onClick={() => handleQuick("Project submission deadlines")}
            >
              Project Deadline
            </button>
          </div>
          <div className="powered">
            Powered by <span>Node.js · React · MongoDB</span>
          </div>
        </div>
      )}
    </>
  );
}
export default ChatWidget;
