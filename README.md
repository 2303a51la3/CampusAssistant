📘 SRU Campus Assistant – Student Support Chatbot
  A smart web-based chatbot designed to help SR University students instantly access campus information.
  🧠 Overview
      The SRU Campus Assistant is an intelligent student-support chatbot that provides fast and accurate answers to common campus-related queries. It simplifies access to exam schedules, deadlines, placements, library timings, hostel details, faculty contacts, and more—without the need to browse multiple websites or portals.
Built using React, Node.js, Express, and MongoDB, this system includes a floating chat widget for students and a full-featured admin panel for managing FAQs and analyzing student interactions.
  🚀 Features
       🎓 Student Features
          --> Interactive chat assistant
          --> Department & Year–specific responses
          --> Quick answer suggestions
          --> Clean floating chat UI
          --> Smart keyword-based matching
          --> Accurate FAQ retrieval
          --> Fast, responsive experience
         🛠️ Admin Features
          --> Add / Edit / Delete FAQs
          --> Assign tags, department, and year
          --> View detailed chat history
          --> Search and filter by:
               Date range,Department,Year,Tags,Keywords.
          --> Visual Analytics:
               -Total queries
               -Daily queries
               -Top department
               -Most asked FAQ
          --> Export entire chat history as CSV
          --> (Optional) Auto-clean chat logs using cron
   🏗️ System Architecture
       --> Frontend → React.js (Chat widget + Admin panel UI)
       --> Backend → Node.js + Express (REST API handling)
       --> Database → MongoDB + Mongoose
       --> Keyword Engine → Tag-based FAQ matching
       --> Admin Control → CRUD API + Analytics + Logs viewer
  🛠️ Tech Stack
       --> Frontend
           .React.js
           .Axios
           .HTML, CSS
           .Custom-designed UI
      --> Backend
           .Node.js
           .Express.js
           .Mongoose
           .REST API
      --> Database
           .MongoDB
  📂 Project Structure
        CampusChatbot/
        │── backend/
        │   ├── server.js
        │   ├── models/
        │   └── package.json
        │
        │── frontend/
        │   ├── src/
        │   │   ├── App.js
        │   │   ├── ChatWidget.js
        │   │   ├── AdminPanel.js
        │   │   └── styles/
        │   ├── public/
        │   └── package.json
        │
        └── README.md
  ⚙️ Installation & Setup
      1️⃣ Clone the Project
        git clone https://github.com/your-username/CampusChatbot.git
        cd CampusChatbot
      🔧 Backend Setup (Node.js + Express)
      2️⃣ Go to Backend Folder
        cd backend
      3️⃣ Install Dependencies
        npm install
      4️⃣ Start Backend Server
        npm run dev
        Backend runs at:
        ➡ [http://localhost:5000/](http://localhost:5000/)
      🎨 Frontend Setup (React)
      5️⃣ Go to Frontend Folder
         cd frontend
      6️⃣ Install Dependencies
          npm install
      7️⃣ Start Frontend
          npm start
          Frontend runs at:
          ➡ [http://localhost:3000](http://localhost:3000)
  🔍 How the Chatbot Works
      1.Student selects department + year
      2.Sends query
      3.Backend extracts keywords
      4.Matches best FAQ from MongoDB using tag ranking
      5.Returns answer
      6.Logs conversation in database
      7.Admin can view all logs
      🧹 (Optional) Auto Clean Chat Logs Daily
        Add this to server.js:
          const cron = require("node-cron");
          cron.schedule("0 0 * * *", async () => {
          await ChatLog.deleteMany({});
          console.log("Daily chat logs cleared ✓");});
  ✨ Future Enhancements
      .AI / NLP-powered question understanding
      .Multi-language support (Telugu, Hindi)
      .SRAaP login integration
      .Voice assistant
      .Dynamic timetable & deadline syncing
👩‍💻 Developed By
Sathvika Mugithe
B.Tech CSE, SR University (2026)

