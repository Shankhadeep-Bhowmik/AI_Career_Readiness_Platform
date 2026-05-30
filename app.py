# Main Python File
from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from flask_mysqldb import MySQL
import os
from datetime import datetime
import json
from google import genai
from google.genai import types
app = Flask(__name__)
app.secret_key = os.urandom(24)

# MySQL Configuration
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'root@123'
app.config['MYSQL_DB'] = 'career_readiness_db'
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'
mysql = MySQL(app)

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
    name = request.form['name']
    email = request.form['email']
    password = request.form['password']
    course = request.form['course']

    try:
      cursor = mysql.connection.cursor()
      #Insert text details into your live user table columns
      cursor.execute(
        'INSERT INTO user(name, email, password, course) VALUES (%s, %s, %s, %s)', (name, email, password, course)
      )
      mysql.connection.commit()
      flash('Registration successful! Please log in.', 'success')
      return redirect(url_for('login'))
    except Exception as e:
      flash(f'Error: Registration failed! {e}', 'danger')
    finally:
      cursor.close()
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
    cursor = mysql.connection.cursor()
    cursor.execute('SELECT user_id FROM user WHERE email = %s', (email,))
    existing = cursor.fetchone()

    if existing:
      cursor.close()
      return jsonify({
        'success': False,
        'message': 'This email is already registered. Please login instead.'
      }), 409

    cursor.execute(
      'INSERT INTO user(name, email, password, course) VALUES (%s, %s, %s, %s)',
      (name, email, password, course)
    )
    mysql.connection.commit()
    cursor.close()

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

    cursor = mysql.connection.cursor()
    cursor.execute(
      'SELECT * FROM user WHERE email = %s AND password = %s', (email, password)
    )
    user = cursor.fetchone()
    cursor.close()

    if user:
      session['user_id'] = user['user_id']
      session['name'] = user['name']
      session['email'] = user['email']
      session['course'] = user['course']
      flash(f"Welcome back, {user['name']}!","success")
      return redirect(url_for('dashboard'))
    else:
      flash("Invalid Email or Password.","danger")
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

  cursor = mysql.connection.cursor()
  cursor.execute(
    'SELECT * FROM user WHERE email = %s AND password = %s', (email, password)
  )
  user = cursor.fetchone()
  cursor.close()

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
  
  # fetch history dynamically from progress table
  cursor = mysql.connection.cursor()
  cursor.execute('SELECT * FROM progress WHERE user_id = %s ORDER BY date DESC', (session['user_id'],))
  progress_history = cursor.fetchall()
  cursor.close()

  return render_template('dashboard.html', name=session['name'], course=session['course'], progress=progress_history)

# Dashboard API for frontend (JSON)
@app.route('/api/dashboard')
def api_dashboard():
    if not check_session():
        return jsonify({'success': False, 'message': 'Not logged in'}), 401

    user_id = session['user_id']
    cursor = mysql.connection.cursor()

    # Fetch skills (uses your skill table with target_level)
    cursor.execute(
        'SELECT skill_name, current_level, target_level FROM skill WHERE user_id = %s',
        (user_id,)
    )
    skills_rows = cursor.fetchall()

    # Fetch interview practice count (uses your interview table)
    cursor.execute(
        'SELECT COUNT(*) AS cnt FROM interview WHERE user_id = %s',
        (user_id,)
    )
    interview_row = cursor.fetchone()

    # Fetch days active from user.created_at
    cursor.execute(
        'SELECT name, created_at FROM user WHERE user_id = %s',
        (user_id,)
    )
    user_row = cursor.fetchone()

    # Fetch latest roadmap progress from progress table
    cursor.execute(
        'SELECT overall_score FROM progress WHERE user_id = %s ORDER BY date DESC LIMIT 1',
        (user_id,)
    )
    progress_row = cursor.fetchone()

    # Fetch recent progress entries as activity (latest 4)
    cursor.execute(
        'SELECT date, skill_score, overall_score FROM progress WHERE user_id = %s ORDER BY date DESC LIMIT 4',
        (user_id,)
    )
    progress_history = cursor.fetchall()

    cursor.close()

    # --- Build skills list ---
    skills = [
        {
            'name': row['skill_name'],
            'current': row['current_level'],
            'target': row['target_level']
        }
        for row in skills_rows
    ] if skills_rows else []

    # --- Career score: average current_level scaled to 100 ---
    career_score = 0
    if skills:
        avg = sum(s['current'] for s in skills) / len(skills)
        career_score = round(avg * 10)  # 0–10 scale → 0–100

    # --- Days active ---
    days_active = 0
    if user_row and user_row.get('created_at'):
        days_active = (datetime.now() - user_row['created_at']).days

    # --- Interviews practiced ---
    interviews_practiced = interview_row['cnt'] if interview_row else 0

    # --- Roadmap progress: use overall_score from latest progress row ---
    roadmap_progress = progress_row['overall_score'] if progress_row else 0

    # --- Recent activity: built from progress table since no activity_log ---
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

    # Fallback if no activity yet
    if not recent_activity:
        recent_activity = [
            {'icon': 'fa-circle-info', 'text': 'No recent activity yet. Start exploring!', 'time': ''}
        ]

    # --- Student initials ---
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
    return jsonify({
      'success':False,
      'message':'Not logged in'
    }), 401
  
  data = request.get_json(silent=True) or {}
  technical = data.get('technical', {})
  soft = data.get('soft', {})
  all_skills = {**technical, **soft}

  if not all_skills:
    return jsonify({'success': False, 'message': 'No skills provided'}), 400
  
  user_id = session['user_id']
  cursor = mysql.connection.cursor()

   # Save all skills to DB
  for skill_name, level in all_skills.items():
    cursor.execute('''
            INSERT INTO skill(user_id, skill_name, current_level)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE current_level = %s
    ''', (user_id, skill_name, int(level), int(level)))

  mysql.connection.commit()
  cursor.close()

  return jsonify({'success': False})


# Skill assessment
@app.route('/skills', methods=['GET','POST'])
def skills():
  if not check_session():
    return redirect(url_for('login'))
  if request.method == 'POST':
    skills_names = request.form.getlist('skill_name')
    current_level = request.form.getlist('current_level')
    cursor = mysql.connection.cursor()

    for skill_name, current_level in zip(skills_names, current_level):
      if skill_name.strip() == '' or current_level.strip() == '':
        continue
      if not current_level.isdigit():
        flash('Please enter valid number','danger')
        return redirect(url_for('skills'))
      if not (1 <= int(current_level) <= 10):
        flash('Skill level must be between 1 and 10','danger')
        return redirect(url_for('skills'))
      cursor.execute('''
          INSERT INTO skill(user_id, skill_name, current_level) VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE current_level = %s
      ''', (session['user_id'], skill_name, int(current_level), int(current_level)))
    
    mysql.connection.commit()
    cursor.close()

    flash('Skills updated! Ready to see your roadmap!','success')
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

if __name__ == '__main__':
  app.run(debug=True)