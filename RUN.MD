# How to Run VirtuHeal from Command Prompt (`RUN.MD`)

---

## 🚀 Quick Start (2 Steps)

Open two Command Prompt (cmd) or PowerShell windows in this project directory:

### Terminal 1: Start the Backend Server (Express + Socket.io + Database)
```cmd
cd "C:\Users\shiri\Open mini"
npm run backend
```
*(Alternatively, you can also run `cd "C:\Users\shiri\Open mini\backend"` followed by `npm run dev`)*
- **Backend URL**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/api/health`

---

### Terminal 2: Start the Frontend Website (React + Vite)
```cmd
cd "C:\Users\shiri\Open mini"
npm run dev
```
- **Frontend URL**: `http://localhost:5173`

---

## 🌐 Open the Website in Your Browser

Once both terminals are running, open your browser and navigate to:
👉 **[http://localhost:5173](http://localhost:5173)**

---

## 🔑 Useful Credentials & Portal Roles

| Portal Role | First Screen Action | Details |
| :--- | :--- | :--- |
| **Unified Login Screen** | Initial website screen (`http://localhost:5173`) | Clean, dual-portal entry: **Patient Portal** and **Doctor Portal** |
| **Patient Sign In** | Enter Medical ID / Name + PIN `1234` | Direct login form with quick clinical demo shortcuts for Sarah, Marcus, Elena |
| **I am a Patient** | Click **"I am a Patient"** tab | Fill personal details, upload hospital report (PDF/MRI), select assigned doctor & enter portal |
| **Doctor Sign In** | Click **"Staff Sign In"** in Doctor Card | Select Dr. Alex Vance, Dr. Sarah Lin, Dr. David Miller + enter PIN: **`1234`** |
| **Doctor Registration** | Click **"Register as Doctor"** in Doctor Card | Register clinician name, hospital/clinic, department, specialty, and set PIN |
| **Sign Out** | Click **"Sign Out"** in top bar | Instantly returns to the clean Unified Login Screen from either portal |
| **AI Camera Coach** | Click **"Start AI Camera Coach"** on any exercise | Dual view (Webcam on left, Demo video on right) with real-time posture goniometers |

---

## 🔄 Optional: Reset / Re-seed Database

If you ever need to reset all patients and exercises to default:
```cmd
npm run backend:seed
```
*(or `npm run server:seed`)*

---

## 🛑 How to Stop the Servers

In each terminal window, press:
```cmd
Ctrl + C
```
Type `Y` and hit `Enter` when prompted.

