# AI Powered Career Readiness Platform

## Overview

The AI Powered Career Readiness Platform is a web application designed to help students become job-ready by identifying skill gaps, generating personalized learning roadmaps, providing AI-powered interview practice, resume assistance, and real-time technology updates.

Many students graduate with strong academic knowledge but lack practical industry skills, interview experience, and career guidance. This platform aims to bridge the gap between college education and industry expectations using Artificial Intelligence and real-time industry data.

---

## Problem Statement

Students often struggle to secure their first job because:

* College syllabi focus heavily on theory rather than practical industry skills.
* Students lack clear guidance on what technologies and skills to learn.
* Interview preparation is often neglected.
* Students do not know how their skills compare to current industry requirements.

This platform provides a centralized solution that guides students throughout their career readiness journey.

---

## Features

### User Authentication

* Student Registration
* Secure Login System
* Session Management
* Logout Functionality

### Skill Assessment

* Evaluate current skill levels
* Store user skills in database


### AI Skill Gap Analysis

* Analyze existing skills
* Compare skills with industry expectations
* Identify missing competencies

### Personalized Learning Roadmap

* Generate learning paths based on skill levels
* Provide structured career guidance
* Recommend technologies and learning sequence

### AI Interview Practice

* Dynamic interview questions
* AI-generated feedback
* Practice technical and HR interviews

### Resume Builder

* Create professional resumes
* AI-based resume evaluation
* Improvement suggestions

### Tech News Feed

* Real-time technology news
* Industry trend updates
* Latest developments in software and AI

### Learning Resources

* Curated educational resources

### Progress Tracking

* Dashboard with career readiness metrics
* User activity tracking
* Skill growth monitoring

---

## Technology Stack

### Frontend

* HTML5
* CSS3
* Bootstrap 5
* JavaScript

### Backend

* Python
* Flask

### Database

* MySQL

### Artificial Intelligence

* Groq AI API

### External APIs

* News API


### Version Control

* Git & GitHub

---

## Project Structure

```text
AI-Career-Readiness-Platform/
│
├── app.py
│
├── templates/
│   ├── home.html
│   ├── register.html
│   ├── login.html
│   ├── dashboard.html
│   ├── skill.html
│   ├── roadmap.html
│   ├── interview.html
│   ├── resume.html
│   └── news.html
│
├── static/
│   ├── css/
│   ├── js/
│   └── images/
│
├── database/
│   └── SQL files
│
└── README.md
```

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Shankhadeep-Bhowmik/AI_Career_Readiness_Platform.git
cd AI-Career-Readiness-Platform
```

### 2. Create Virtual Environment

```bash
python -m venv venv
```

### 3. Activate Virtual Environment

Windows:

```bash
venv\Scripts\activate
```

Linux/Mac:

```bash
source venv/bin/activate
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

### 5. Configure MySQL Database

Create a database:

```sql
CREATE DATABASE career_readiness_db;
```

Update database credentials inside:

```python
app.py
```

```python
MYSQL_HOST = 'localhost'
MYSQL_USER = 'root'
MYSQL_PASSWORD = 'your_password'
MYSQL_DB = 'career_readiness_db'
```

### 6. Configure API Keys

Add your API keys inside the project configuration:

* Groq AI API Key
* News API Key


### 7. Run the Application

```bash
python app.py
```

Open browser:

```text
http://127.0.0.1:5000
```

---

## Future Enhancements

* AI Resume Scoring System
* Interview Preparation
* Resume PDF Export
* Student Leaderboards
* Career Analytics Dashboard

---

## Learning Outcomes

Through this project, I gained practical experience in:

* Full Stack Web Development
* Python Flask Framework
* MySQL Database Integration
* REST API Integration
* Session Management
* Frontend Development
* Responsive Web Design
* AI Integration using Groq API
* Git and GitHub

---

## Author

Shankhadeep Bhowmik

Master of Computer Applications (MCA)

Garden City University

---

## License

This project is developed for educational and academic purposes.
