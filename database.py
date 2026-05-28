# Database setup
import MySQLdb

def initialize_db():
  try:
    # Connect to your MySQL Server
    conn = MySQLdb.connect(
      host = 'localhost',
      user = 'root',
      password = 'root@123',
      db = 'career_readiness_db'
    )
    cursor = conn.cursor()
    
    # User Table
    cursor.execute("""
      CREATE TABLE IF NOT EXISTS user(
          user_id INT AUTO_INCREMENT PRIMARY KEY,
                   name VARCHAR(100) NOT NULL,
                   email VARCHAR(100) UNIQUE NOT NULL,
                   password VARCHAR(255) NOT NULL,
                   course VARCHAR(100),
                   created_at DATETIME DEFAULT CURRENT_TIMESTAMP        
      )
    """)

    # Skill Table
    cursor.execute("""
       CREATE TABLE IF NOT EXISTS skill(
                   skill_id INT AUTO_INCREMENT PRIMARY KEY,
                   user_id INT NOT NULL,
                   skill_name VARCHAR(100) NOT NULL,
                   current_level INT DEFAULT 1,
                   target_level INT DEFAULT 10,
                   FOREIGN KEY(user_id) REFERENCES user(user_id)
                   )
    """)
    
    # Roadmap table
    cursor.execute("""
       CREATE TABLE IF NOT EXISTS roadmap(
                   roadmap_id INT AUTO_INCREMENT PRIMARY KEY,
                   user_id INT NOT NULL,
                   topic VARCHAR(255) NOT NULL,
                   resources TEXT,
                   status VARCHAR(50) DEFAULT 'Not Started',
                   FOREIGN KEY(user_id) REFERENCES user(user_id)
                   )
    """)

    # Interview Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS interview(
                   interview_id INT AUTO_INCREMENT PRIMARY KEY,
                   user_id INT NOT NULL,
                   question TEXT NOT NULL,
                   answer TEXT,
                   feedback TEXT,
                   score INT,
                   FOREIGN KEY(user_id) REFERENCES user(user_id)
                   )
    """)

    # Progress Table
    cursor.execute("""
      CREATE TABLE IF NOT EXISTS progress(
                   progress_id INT AUTO_INCREMENT PRIMARY KEY,
                   user_id INT NOT NULL,
                   date DATE NOT NULL,
                   skill_score INT,
                   overall_score INT,
                   FOREIGN KEY(user_id) REFERENCES user(user_id)
                   )
    """)

    conn.commit()
    print("Database initialized successfully!")

  except Exception as e:
    print(f"Database initialization error: {e}")
  finally:
    if 'conn' in locals():
      cursor.close()
      conn.close()

if __name__ == '__main__':
  initialize_db()