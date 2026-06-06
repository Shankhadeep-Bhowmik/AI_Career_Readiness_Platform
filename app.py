# Main Python File
import pymysql
import pymysql.cursors
from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
import os
from datetime import datetime
import json
from groq import Groq
import requests

app = Flask(__name__)
app.secret_key = os.urandom(24)

# Groq AI and api
groq_api_key = os.environ.get("GROQ_API_KEY", "")
if not groq_api_key:
    try:
        with open("Api.txt", "r") as file:
            groq_api_key = file.read().strip()
    except FileNotFoundError:
        print("ERROR: Api.txt not found")
        groq_api_key = ""

ai = Groq(api_key=groq_api_key)

# News API Key
news_api_key = os.environ.get("NEWS_API_KEY", "")
if not news_api_key:
    try:
        with open("News_API.txt", "r") as file:
            news_api_key = file.read().strip()
    except FileNotFoundError:
        print("ERROR: News_Api.txt not found")
        news_api_key = ""

# MySQL Configuration - Aiven Cloud Database
DB_CONFIG = {
    'host': os.environ.get('DB_HOST', 'localhost'),
    'user': os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASSWORD', 'root@123'),
    'database': os.environ.get('DB_NAME', 'career_readiness_db'),
    'port': int(os.environ.get('DB_PORT', 3306)),
    'cursorclass': pymysql.cursors.DictCursor,
    'autocommit': True
}

def get_db():
    return pymysql.connect(**DB_CONFIG)

# Global login protection route wrapper
def check_session():
    return 'user_id' in session

# Routes
# Home / Landing page
@app.route('/')
def home():
    return render_template('home.html')

# Registration page
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '').strip()
        course = request.form.get('course', '').strip()

        if not name or not email or not password or not course:
            flash('All fields are required. Please fill in the form completely.', 'danger')
            return redirect(url_for('register'))

        try:
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('SELECT user_id FROM user WHERE email = %s', (email,))
            existing = cursor.fetchone()
            if existing:
                cursor.close()
                conn.close()
                flash('User already exists with this email address.', 'warning')
                return redirect(url_for('register'))

            cursor.execute(
                'INSERT INTO user(name, email, password, course) VALUES (%s, %s, %s, %s)',
                (name, email, password, course)
            )
            cursor.close()
            conn.close()
            flash('Registration successful! Please log in.', 'success')
            return redirect(url_for('login'))
        except Exception as e:
            flash(f'Error: Registration failed! {e}', 'danger')
    return render_template('register.html')

# Registration API for frontend (JSON)
@app.route('/api/register', methods=['POST'])
def api_register():
    data = request.get_json(silent=True) or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    course = data.get('course', '').strip()

    if not name or not email or not password or not course:
        return jsonify({
            'success': False,
            'message': 'All fields are required. Please fill in the form completely.'
        }), 400

    if len(password) < 8:
        return jsonify({
            'success': False,
            'message': 'Password must be at least 8 characters long.'
        }), 400

    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT user_id FROM user WHERE email = %s', (email,))
        existing = cursor.fetchone()

        if existing:
            cursor.close()
            conn.close()
            return jsonify({
                'success': False,
                'message': 'This email is already registered. Please login instead.'
            }), 409

        cursor.execute(
            'INSERT INTO user(name, email, password, course) VALUES (%s, %s, %s, %s)',
            (name, email, password, course)
        )
        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Registration successful! Please log in.',
            'redirect': '/login?registered=success'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Registration failed. {str(e)}'
        }), 500

# Login page
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            'SELECT * FROM user WHERE email = %s AND password = %s', (email, password)
        )
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        if user:
            session['user_id'] = user['user_id']
            session['name'] = user['name']
            session['email'] = user['email']
            session['course'] = user['course']
            flash(f"Welcome back, {user['name']}!", "success")
            return redirect(url_for('dashboard'))
        else:
            flash("Invalid Email or Password.", "danger")
    return render_template('login.html')

# Login API for frontend (JSON)
@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json(silent=True) or {}
    email = data.get('email', '').strip()
    password = data.get('password', '').strip()

    if not email or not password:
        return jsonify({
            'success': False,
            'message': 'Email and password are required.'
        }), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT * FROM user WHERE email = %s AND password = %s', (email, password)
    )
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if user:
        session['user_id'] = user['user_id']
        session['name'] = user['name']
        session['email'] = user['email']
        session['course'] = user['course']
        return jsonify({
            'success': True,
            'message': f"Welcome back, {user['name']}!",
            'redirect': '/dashboard'
        })

    return jsonify({
        'success': False,
        'message': 'Invalid email or password. Please try again.'
    }), 401

# Student Dashboard Page
@app.route('/dashboard')
def dashboard():
    if not check_session():
        return redirect(url_for('login'))

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM progress WHERE user_id = %s ORDER BY date DESC', (session['user_id'],))
    progress_history = cursor.fetchall()
    cursor.close()
    conn.close()

    return render_template('dashboard.html', name=session['name'], course=session['course'], progress=progress_history)

# Dashboard API for frontend (JSON)
@app.route('/api/dashboard')
def api_dashboard():
    if not check_session():
        return jsonify({'success': False, 'message': 'Not logged in'}), 401

    user_id = session['user_id']
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        'SELECT skill_name, current_level, target_level FROM skill WHERE user_id = %s',
        (user_id,)
    )
    skills_rows = cursor.fetchall()

    cursor.execute(
        'SELECT COUNT(*) AS cnt FROM interview WHERE user_id = %s',
        (user_id,)
    )
    interview_row = cursor.fetchone()

    cursor.execute(
        'SELECT name, created_at FROM user WHERE user_id = %s',
        (user_id,)
    )
    user_row = cursor.fetchone()

    cursor.execute(
        'SELECT overall_score FROM progress WHERE user_id = %s ORDER BY date DESC LIMIT 1',
        (user_id,)
    )
    progress_row = cursor.fetchone()

    cursor.execute(
        'SELECT date, skill_score, overall_score FROM progress WHERE user_id = %s ORDER BY date DESC LIMIT 4',
        (user_id,)
    )
    progress_history = cursor.fetchall()

    cursor.close()
    conn.close()

    skills = [
        {
            'name': row['skill_name'],
            'current': row['current_level'],
            'target': row['target_level']
        }
        for row in skills_rows
    ] if skills_rows else []

    career_score = 0
    if skills:
        avg = sum(s['current'] for s in skills) / len(skills)
        career_score = round(avg * 10)

    days_active = 0
    if user_row and user_row.get('created_at'):
        days_active = (datetime.now() - user_row['created_at']).days

    interviews_practiced = interview_row['cnt'] if interview_row else 0
    roadmap_progress = progress_row['overall_score'] if progress_row else 0

    def time_ago(dt):
        if isinstance(dt, str):
            dt = datetime.strptime(dt, '%Y-%m-%d')
        diff = datetime.now() - datetime.combine(dt, datetime.min.time()) if hasattr(dt, 'year') and not hasattr(dt, 'hour') else datetime.now() - dt
        if diff.days == 0:
            return "Today"
        elif diff.days == 1:
            return "1 day ago"
        else:
            return f"{diff.days} days ago"

    recent_activity = []
    for row in progress_history:
        recent_activity.append({
            'icon': 'fa-chart-line',
            'text': f"Progress recorded — Skill score: {row['skill_score']}, Overall: {row['overall_score']}",
            'time': time_ago(row['date'])
        })

    if not recent_activity:
        recent_activity = [
            {'icon': 'fa-circle-info', 'text': 'No recent activity yet. Start exploring!', 'time': ''}
        ]

    name = session['name']
    initials = ''.join([part[0].upper() for part in name.split()[:2]])

    return jsonify({
        'success': True,
        'student': {
            'name': name,
            'course': session['course'],
            'initials': initials
        },
        'stats': {
            'skillsAssessed': len(skills),
            'roadmapProgress': roadmap_progress,
            'interviewsPracticed': interviews_practiced,
            'daysActive': days_active
        },
        'careerScore': career_score,
        'skills': skills,
        'recentActivity': recent_activity
    })

@app.route('/api/skills', methods=['POST'])
def api_skills():
    if not check_session():
        return jsonify({'success': False, 'message': 'Not logged in'}), 401

    data = request.get_json(silent=True) or {}
    technical = data.get('technical', {})
    soft = data.get('soft', {})
    all_skills = {**technical, **soft}

    if not all_skills:
        return jsonify({'success': False, 'message': 'No skills provided'}), 400

    user_id = session['user_id']
    conn = get_db()
    cursor = conn.cursor()

    for skill_name, level in all_skills.items():
        cursor.execute('''
            INSERT INTO skill(user_id, skill_name, current_level)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE current_level = %s
        ''', (user_id, skill_name, int(level), int(level)))

    cursor.close()
    conn.close()

    skill_lines = '\n'.join([f'- {name}: {level}/10' for name, level in all_skills.items()])

    prompt = f"""
You are a career readiness AI. A student has rated their skills below.
Analyze the skill gaps and return ONLY a valid JSON object. No explanation, no markdown, no extra text.

Student skills:
{skill_lines}

Return this exact JSON structure:
{{
  "careerScore": <integer 0-100>,
  "gaps": [
    {{
      "skill": "<skill name>",
      "priority": "<high | medium | low>",
      "current": <integer>,
      "required": <integer>,
      "message": "<one sentence advice>"
    }}
  ],
  "radar": {{
    "labels": ["<skill1>", "<skill2>", "<skill3>", "<skill4>", "<skill5>"],
    "yourSkills": [<level1>, <level2>, <level3>, <level4>, <level5>],
    "industryRequired": [<req1>, <req2>, <req3>, <req4>, <req5>]
  }}
}}

Rules:
- careerScore: overall readiness percentage based on skill levels vs industry needs
- gaps: only skills that need improvement, sorted high to low priority
- radar: pick top 5 skills from the list
- industryRequired: realistic industry expectations for each skill (1-10)
- Return ONLY the JSON, nothing else
"""

    try:
        response = ai.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=[{'role': 'user', 'content': prompt}],
            temperature=0.3
        )

        raw = response.choices[0].message.content.strip()

        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        result = json.loads(raw)
        result['success'] = True
        return jsonify(result)

    except json.JSONDecodeError:
        return jsonify({'success': False, 'message': 'AI returned invalid response. Please try again.'}), 500
    except Exception as e:
        return jsonify({'success': False, 'message': f'AI analysis failed: {str(e)}'}), 500

# Skill assessment
@app.route('/skills', methods=['GET', 'POST'])
def skills():
    if not check_session():
        return redirect(url_for('login'))
    if request.method == 'POST':
        skills_names = request.form.getlist('skill_name')
        current_levels = request.form.getlist('current_level')
        conn = get_db()
        cursor = conn.cursor()

        for skill_name, current_level in zip(skills_names, current_levels):
            if skill_name.strip() == '' or current_level.strip() == '':
                continue
            if not current_level.isdigit():
                flash('Please enter valid number', 'danger')
                cursor.close()
                conn.close()
                return redirect(url_for('skills'))
            if not (1 <= int(current_level) <= 10):
                flash('Skill level must be between 1 and 10', 'danger')
                cursor.close()
                conn.close()
                return redirect(url_for('skills'))
            cursor.execute('''
                INSERT INTO skill(user_id, skill_name, current_level) VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE current_level = %s
            ''', (session['user_id'], skill_name, int(current_level), int(current_level)))

        cursor.close()
        conn.close()
        flash('Skills updated! Ready to see your roadmap!', 'success')
        return redirect(url_for('roadmap'))
    return render_template('skill.html')

@app.route('/roadmap')
def roadmap():
    if not check_session():
        return redirect(url_for('login'))
    return render_template('roadmap.html')

@app.route('/interview')
def interview():
    if not check_session():
        return redirect(url_for('login'))
    return render_template('interview.html')

@app.route('/api/interview/start', methods=['POST'])
def api_interview_start():
    if not check_session():
        return jsonify({'success': False, 'message': 'Not logged in'}), 401

    data = request.get_json(silent=True) or {}
    interview_type = data.get('type', 'Technical Interview')
    difficulty = data.get('difficulty', 'Beginner')
    question_count = int(data.get('questionCount', 5))
    user_id = session['user_id']

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT skill_name, current_level FROM skill WHERE user_id = %s', (user_id,))
    skills = cursor.fetchall()
    cursor.close()
    conn.close()

    skill_lines = '\n'.join([
        f"{s['skill_name']}: {s['current_level']}/10"
        for s in skills
    ]) if skills else "General student with no specific skills assessed yet."

    prompt = f"""
You are a professional interviewer conducting a {interview_type} at {difficulty} level.
The student has these skills:
{skill_lines}

Generate exactly {question_count} interview questions personalized to their skill level.
Return ONLY valid JSON, no explanation, no markdown:
{{
  "sessionId": "ai_session_{user_id}",
  "questions": [
    "<question 1>",
    "<question 2>",
    "<question 3>"
  ]
}}

Rules:
- Questions must match {interview_type} style
- Difficulty must be {difficulty} level
- Personalize based on student skills listed above
- For Technical Interview: ask about their specific skills
- For HR Interview: ask career goals and personality questions
- For Behavioral Interview: use STAR method style questions
- For Mixed Interview: mix of technical and HR questions
- Return ONLY the JSON nothing else
"""
    try:
        response = ai.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=[{'role': 'user', 'content': prompt}],
            temperature=0.7
        )
        raw = response.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        result = json.loads(raw)
        result['success'] = True
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/interview/answer', methods=['POST'])
def api_interview_answer():
    if not check_session():
        return jsonify({'success': False, 'message': 'Not logged in'}), 401

    data = request.get_json(silent=True) or {}
    question = data.get('question', '')
    answer = data.get('answer', '')
    interview_type = data.get('type', 'Technical Interview')
    difficulty = data.get('difficulty', 'Beginner')

    if not question or not answer:
        return jsonify({'success': False, 'message': 'Question and answer required'}), 400

    prompt = f"""
You are a professional interviewer evaluating a candidate's answer.

Interview Type: {interview_type}
Difficulty: {difficulty}
Question: {question}
Candidate Answer: {answer}

Evaluate honestly and return ONLY valid JSON, no explanation, no markdown:
{{
  "score": <integer 1-10>,
  "good": [
    "<genuine positive point 1>",
    "<genuine positive point 2>"
  ],
  "improve": [
    "<specific improvement 1>",
    "<specific improvement 2>"
  ],
  "idealAnswer": "<what a perfect answer would include in 2-3 sentences>"
}}

Scoring:
- 1-4: Poor
- 5-6: Average
- 7-8: Good
- 9-10: Excellent
- Return ONLY the JSON nothing else
"""

    try:
        response = ai.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=[{'role': 'user', 'content': prompt}],
            temperature=0.3
        )

        raw = response.choices[0].message.content.strip()

        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        result = json.loads(raw)

        user_id = session['user_id']
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO interview(user_id, question, answer, feedback, score)
            VALUES (%s, %s, %s, %s, %s)
        ''', (
            user_id,
            question,
            answer,
            json.dumps({
                'good': result.get('good', []),
                'improve': result.get('improve', [])
            }),
            result.get('score', 5)
        ))
        cursor.close()
        conn.close()

        result['success'] = True
        return jsonify(result)

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/interview/stats')
def api_interview_stats():
    if not check_session():
        return jsonify({'success': False}), 401

    user_id = session['user_id']
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT score FROM interview WHERE user_id = %s AND score IS NOT NULL',
        (user_id,)
    )
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    if not rows:
        return jsonify({'success': True, 'total': 0, 'average': 0, 'best': 0})

    scores = [r['score'] for r in rows]
    total = len(scores)
    average = round(sum(scores) / total)
    best = max(scores)

    return jsonify({
        'success': True,
        'total': total,
        'average': average,
        'best': best
    })

@app.route('/resume')
def resume():
    if not check_session():
        return redirect(url_for('login'))
    return render_template('resume.html')

@app.route('/news')
def news():
    if not check_session():
        return redirect(url_for('login'))
    return render_template('news.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))

@app.route('/api/roadmap')
def api_roadmap():
    if not check_session():
        return jsonify({'success': False, 'message': 'Not logged in'}), 401

    user_id = session['user_id']
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT skill_name, current_level FROM skill WHERE user_id = %s', (user_id,)
    )
    skills = cursor.fetchall()
    cursor.close()
    conn.close()

    if not skills:
        return jsonify({'success': False, 'message': 'No skills found'}), 404

    skill_lines = '\n'.join([
        f"- {s['skill_name']}: {s['current_level']}/10"
        for s in skills
    ])

    prompt = f"""
You are a career roadmap AI for 2026-2027.
A student has these skills:
{skill_lines}

Your job:
1. Understand what career path this student is heading towards
2. Generate a personalized step by step learning roadmap for 2026-2027
3. Include skills the student doesn't know yet but industry demands in 2026-2027
4. If student knows HTML CSS JS — understand they want web development and add React, TypeScript, Tailwind etc.
5. Each step should build on the previous one logically

Return ONLY valid JSON, no explanation, no markdown:
{{
  "careerPath": "<detected career path like Full Stack Developer>",
  "summary": "<2 sentence overview of this roadmap>",
  "phases": [
    {{
      "phaseNumber": 1,
      "phaseTitle": "<phase name like Frontend Fundamentals>",
      "skills": [
        {{
          "id": 1,
          "skillName": "<skill name like HTML5>",
          "icon": "<font awesome class>",
          "status": "current",
          "description": "<one line what this skill is>",
          "whyImportant": "<one line why industry needs this in 2026-2027>",
          "estimatedTime": "<like 1 week>",
          "difficulty": "<Beginner or Intermediate or Advanced>"
        }}
      ]
    }}
  ]
}}

Rules:
- Group skills into phases like Frontend, Backend, Tools, Advanced
- Each phase has 3 to 5 skills maximum
- First phase covers gaps in existing skills
- Later phases add new 2026-2027 industry demanded skills
- Skills go from Beginner to Advanced progressively
- NO youtube links, NO articles, NO courses, NO exercises
- This is a ROADMAP not a course provider
- Return ONLY the JSON nothing else
"""
    try:
        response = ai.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=[{'role': 'user', 'content': prompt}],
            temperature=0.4
        )

        raw = response.choices[0].message.content.strip()

        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        result = json.loads(raw)
        result['success'] = True
        return jsonify(result)

    except json.JSONDecodeError:
        return jsonify({'success': False, 'message': 'AI returned invalid response'}), 500
    except Exception as e:
        return jsonify({'success': False, 'message': f'AI failed: {str(e)}'}), 500

@app.route('/api/roadmap/regenrate', methods=['POST'])
def api_roadmap_regenrate():
    return api_roadmap()

@app.route('/api/resume/feedback', methods=['POST'])
def api_resume_feedback():
    if not check_session():
        return jsonify({'success': False, 'message': 'Not logged in'}), 401

    data = request.get_json(silent=True) or {}

    personal = data.get('personal', {})
    objective = data.get('objective', '')
    education = data.get('education', [])
    skills = data.get('skills', [])
    projects = data.get('projects', [])
    certifications = data.get('certifications', [])

    resume_summary = f"""
Name: {personal.get('fullName', 'Not provided')}
Email: {personal.get('email', 'Not provided')}
Phone: {personal.get('phone', 'Not provided')}
City: {personal.get('city', 'Not provided')}
LinkedIn: {personal.get('linkedin', 'Not provided')}
GitHub: {personal.get('github', 'Not provided')}

Career Objective: {objective or 'Not provided'}

Education: {json.dumps(education)}
Skills: {', '.join(skills) if skills else 'None'}
Projects: {json.dumps(projects)}
Certifications: {json.dumps(certifications)}
"""

    prompt = f"""
You are a professional resume reviewer helping a student get their first job.
Review this resume and give honest, constructive feedback.

RESUME CONTENT:
{resume_summary}

Return ONLY valid JSON, no explanation, no markdown:
{{
  "score": <integer 0-100>,
  "good": [
    "<genuine positive point 1>",
    "<genuine positive point 2>",
    "<genuine positive point 3>"
  ],
  "improve": [
    "<specific improvement 1>",
    "<specific improvement 2>",
    "<specific improvement 3>"
  ],
  "missing": [
    "<missing section or detail 1>",
    "<missing section or detail 2>"
  ],
  "suggestions": {{
    "personal": "<specific suggestion for personal section>",
    "objective": "<specific suggestion for career objective>",
    "skills": "<specific suggestion for skills section>",
    "projects": "<specific suggestion for projects section>"
  }}
}}

Scoring guide:
- Start at 40 base score
- Add points for each complete section
- Deduct for missing or weak sections
- Maximum 100
- Be honest — a weak resume should score 40-50
- Return ONLY the JSON nothing else
"""

    try:
        response = ai.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=[{'role': 'user', 'content': prompt}],
            temperature=0.3
        )

        raw = response.choices[0].message.content.strip()

        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        result = json.loads(raw)
        result['success'] = True
        return jsonify(result)

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/news')
def api_news():
    if not check_session():
        return jsonify({'success': False, 'message': 'Not logged in'}), 401

    page = request.args.get('page', default=1, type=int)
    page_size = request.args.get('pageSize', default=9, type=int)
    category = request.args.get('category', default='all')
    search_keyword = request.args.get('q', default='').strip()

    if not news_api_key:
        return jsonify({'success': False, 'message': 'News API key is missing on the server.'}), 500

    category_keywords = {
        'ai': 'artificial intelligence OR machine learning OR deep learning',
        'web': 'web development OR javascript OR reactjs OR nodejs',
        'data': 'data science OR big data OR python programming OR sql',
        'cyber': 'cybersecurity OR ethical hacking OR infoSec',
        'cloud': 'cloud computing OR aws OR azure OR devops'
    }

    if search_keyword:
        query = search_keyword
    elif category in category_keywords:
        query = category_keywords[category]
    else:
        query = 'technology OR tech software OR computer science'

    news_url = f"https://newsapi.org/v2/everything?q={query}&language=en&sortBy=publishedAt&pageSize={page_size}&page={page}&apiKey={news_api_key}"

    try:
        response = requests.get(news_url, timeout=10)
        news_data = response.json()

        if news_data.get('status') == 'ok':
            articles = news_data.get('articles', [])
            total_results = news_data.get('totalResults', 0)
            has_more = (page * page_size) < total_results

            return jsonify({
                'success': True,
                'articles': articles,
                'hasMore': has_more
            })
        else:
            return jsonify({'success': False, 'message': news_data.get('message', 'Failed to fetch news')}), 400

    except Exception as e:
        return jsonify({'success': False, 'message': f"Internet connectivity error: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(debug=True)