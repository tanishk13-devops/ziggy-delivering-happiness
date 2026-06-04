---
title: Ziggy Delivering Happiness
emoji: 🍕
colorFrom: orange
colorTo: red
sdk: docker
app_port: 7860
pinned: false
---

# 🚀 Ziggy: Delivering Happiness

Ziggy is a production-grade, full-stack online food delivery application (similar to Swiggy or Zomato) engineered with a robust .NET Web API backend and a responsive Angular SPA frontend. 

It is designed for **unified single-container hosting**, allowing the entire frontend and backend to build and run together as a single service.

---

## 🌟 Features & Stack

* **Frontend**: Angular 17 SPA, responsive layout, dynamic cart, checkout flows, and real-time order tracking.
* **Backend**: ASP.NET Core Web API + EF Core + In-Memory/PostgreSQL database compatibility.
* **Security**: JWT Authentication & Role-Based Authorization (`Admin`, `Customer`, `DeliveryAgent`).
* **Visual Excellence**: Curated, harmonious color palette with 25 unique seeded restaurants and 250 dishes loaded with authentic high-resolution images.
* **Deploy-Ready**: Fully configured Docker file and Render blueprint for one-click free hosting.

---

## 🚀 One-Click Cloud Hosting (Free & 24/7)

You can host this combined application (both backend and frontend) for **free** on **Hugging Face Spaces (Docker SDK)** with no credit card and 24/7 online availability:

1. Create a free account on [Hugging Face](https://huggingface.co/).
2. Click **New Space** (under your profile menu) -> Name it `ziggy-delivering-happiness` -> Select **Docker** as the SDK -> Select **Blank** template -> Set space visibility to Public.
3. Go to your Hugging Face Account Settings -> **Access Tokens** -> **Create New Token** -> Role: **Write** -> Name: `GitHub Deploy`. Copy the token value.
4. Go to your GitHub repository Settings -> **Secrets and variables** -> **Actions** -> **New repository secret**.
   - Name: `HF_TOKEN`
   - Value: *Paste the Hugging Face access token*
5. Every time you push a commit to the `main` branch, the GitHub Actions workflow will automatically push the code to Hugging Face, building and launching your live website!


---

## 💻 Local Running & Development

You can run the application locally on your machine with no external databases required (defaults to In-Memory mode).

### Prerequisite
* [.NET 8.0 SDK](https://dotnet.microsoft.com/download)
* [Node.js 18+](https://nodejs.org/)

### 1. Running Backend & Frontend Together (Easiest)
Navigate to the root directory and build/run:

```bash
# 1. Compile the Angular frontend
cd frontend
npm install
npm run build:prod

# 2. Start the combined application
cd ../backend
dotnet run --launch-profile http
```
The application will be live at: **`http://localhost:5000`** (serving both the API and the Angular frontend page!).

---

### 2. Separate Development Mode (For Live Coding)
If you want to edit code and see changes in real-time:

#### Backend API:
```bash
cd backend
dotnet run --launch-profile http
# API live at http://localhost:5000
# Swagger UI docs at http://localhost:5000/swagger
```

#### Frontend SPA:
```bash
cd frontend
npm install
npm start
# App live at http://localhost:4200 (reloads automatically on edit)
```

---

## 🔑 Sample Test Accounts

* **Admin User**: `admin@ziggy.com` / `Admin@123`
* **Customer User**: `customer@ziggy.com` / `Customer@123`
* **Delivery Agent User**: `delivery@ziggy.com` / `Delivery@123`

---

## 📂 Project Structure

```text
ziggy-delivering-happiness/
├── frontend/                 # Angular 17 client code
│   ├── src/                  # App components, services, environments
│   ├── angular.json          # Angular CLI workspace config
│   └── package.json          # Frontend dependencies & scripts
├── backend/                  # ASP.NET Core 8 Web API
│   ├── Controllers/          # API Controllers
│   ├── Models/               # C# database entities
│   ├── Data/                 # DbContext and EF settings
│   ├── Program.cs            # App configuration and entry point
│   └── appsettings.json      # Backend application configurations
├── Dockerfile                # Root multi-stage Docker build pipeline
├── render.yaml               # Render blueprint file
└── README.md                 # Project documentation
```

---
**Happy Coding! 🚀**
