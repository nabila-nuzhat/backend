# SQL Complete Guide: Basics, Optimization, Transactions & Scaling
### Learn with a Mini LMS Database (MySQL + PostgreSQL alternatives)

> **MySQL version note (July 2026):**
> - **Latest release: MySQL 9.7.0** (Innovation track, released April 2026).
> - **MySQL 8.4 is the current LTS (Long-Term Support)** release — recommended for production and classrooms that want stability.
> - **MySQL 8.0 reached End of Life in April 2026** (final version 8.0.46). If you're still on 8.0, upgrade to 8.4 LTS or 9.x.
> - Everything in this guide works on **MySQL 8.4+ / 9.x** and **PostgreSQL 14+**. Wherever syntax differs, a **PostgreSQL alternative** is shown.

We'll build a **Learning Management System (LMS)** with 6 tables:
`departments`, `instructors`, `students`, `courses`, `enrollments`, `assignments`

This mirrors real-world design — one-to-many and many-to-many relationships, foreign keys, and realistic data — so what you learn here transfers directly to real projects.

**Practice environment:** all commands in this guide are written to run inside the **TablePlus query editor**, connected to a database running in **Docker**. Follow Part 0 first to get set up. Commands marked "psql only" or "MySQL CLI only" elsewhere on the internet won't work in TablePlus — this guide gives you the TablePlus-compatible SQL equivalent every time.

---

# PART 0 — SETUP: DOCKER + TABLEPLUS

## 0.1 Install the tools

1. **Docker Desktop** — download from docker.com and install. Verify in a terminal:
   ```bash
   docker --version
   ```
2. **TablePlus** — download from tableplus.com (free edition is enough; it limits you to 2 open tabs, which is fine for this course).

## 0.2 Run MySQL in Docker

```bash
docker run --name lms-mysql \
  -e MYSQL_ROOT_PASSWORD=secret123 \
  -e MYSQL_DATABASE=lms_db \
  -p 3306:3306 \
  -d mysql:8.4
```

- `mysql:8.4` = current LTS (recommended for the course). Use `mysql:9` if you want the latest release instead.
- `-e MYSQL_DATABASE=lms_db` → creates the `lms_db` database automatically, so you can skip `CREATE DATABASE`.
- `-p 3306:3306` → exposes MySQL on `localhost:3306`.
- `-d` → runs in the background.

## 0.3 Run PostgreSQL in Docker (optional, for the alternative commands)

```bash
docker run --name lms-postgres \
  -e POSTGRES_PASSWORD=secret123 \
  -e POSTGRES_DB=lms_db \
  -p 5432:5432 \
  -d postgres:18
```

You can run both containers at the same time — they use different ports.

## 0.4 Everyday Docker commands

```bash
docker ps                    # list running containers
docker stop lms-mysql        # stop (data is kept)
docker start lms-mysql       # start again
docker logs lms-mysql        # view server logs (useful when connection fails)
docker rm -f lms-mysql       # delete container AND its data — fresh start
```

> **Tip:** if a `CREATE TABLE` practice session goes wrong beyond repair, `docker rm -f` + the `docker run` command again gives you a clean database in ~10 seconds. Don't be afraid to break things.

## 0.5 Connect TablePlus

1. Open TablePlus → **Create a new connection** (⌘N / Ctrl+N) → choose **MySQL** (or **PostgreSQL**).
2. Fill in:

   | Field | MySQL | PostgreSQL |
   |---|---|---|
   | Host | `127.0.0.1` | `127.0.0.1` |
   | Port | `3306` | `5432` |
   | User | `root` | `postgres` |
   | Password | `secret123` | `secret123` |
   | Database | `lms_db` | `lms_db` |

3. Click **Test** — it should turn green — then **Connect**.

## 0.6 How to run SQL in TablePlus

- Open the **SQL editor** with **⌘E / Ctrl+E** (or the "SQL" button).
- **⌘Enter / Ctrl+Enter** → runs only the statement your cursor is on (or the highlighted selection).
- **⌘⇧Enter / Ctrl+Shift+Enter** → runs **all** statements in the editor, in order. Use this for the `CREATE TABLE` and `INSERT` blocks.
- After creating tables or inserting data, press **⌘R / Ctrl+R** to refresh the left sidebar so the new tables/rows appear.
- Right-click a table in the sidebar → **Open Structure** to see its columns, types, and indexes — this is TablePlus's replacement for `DESCRIBE` / `\d`.

⚠️ **TablePlus compatibility notes for this guide:**
- All plain SQL in this guide works in TablePlus as-is.
- **psql backslash commands (`\c`, `\dt`, `\d`, `\di`) do NOT work** in TablePlus — they belong to the `psql` terminal client only. This guide always shows the SQL or GUI equivalent alongside them.
- In **PostgreSQL you cannot switch databases with a SQL command** — the database is fixed per connection. In TablePlus, use the database dropdown at the top (or ⌘K / Ctrl+K) to switch. In **MySQL, `USE lms_db;` works fine** in the query editor.

---

# PART 1 — SQL FUNDAMENTALS

## 1. Creating a Database

```sql
-- MySQL
CREATE DATABASE lms_db;
USE lms_db;
```

```sql
-- PostgreSQL alternative
CREATE DATABASE lms_db;
-- PostgreSQL has no USE keyword. In TablePlus, switch databases with the
-- database dropdown at the top of the window (or press ⌘K / Ctrl+K).
-- (In the psql terminal client, the equivalent is \c lms_db.)
```

- `CREATE DATABASE` makes a new database container.
- `USE` (MySQL) tells SQL which database your next commands apply to. In PostgreSQL the database is chosen per connection — in TablePlus, use the dropdown.
- **Docker shortcut:** if you used the `docker run` commands from Part 0, `lms_db` already exists — just make sure it's selected in TablePlus and skip to Section 2.

---

## 2. CREATE TABLE — Building the Schema

### 2.1 `departments`

```sql
-- MySQL
CREATE TABLE departments (
    department_id   INT PRIMARY KEY AUTO_INCREMENT,
    department_name VARCHAR(100) NOT NULL,
    building        VARCHAR(50)
);
```

```sql
-- PostgreSQL alternative (no AUTO_INCREMENT — use IDENTITY or SERIAL)
CREATE TABLE departments (
    department_id   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,  -- modern, preferred
    department_name VARCHAR(100) NOT NULL,
    building        VARCHAR(50)
);
-- Older style: department_id SERIAL PRIMARY KEY
```

- `PRIMARY KEY` → uniquely identifies each row.
- `AUTO_INCREMENT` (MySQL) / `GENERATED ALWAYS AS IDENTITY` (PostgreSQL) → auto-generates the next ID (1, 2, 3...).
- `NOT NULL` → this column cannot be left empty.

### 2.2 `instructors`

```sql
CREATE TABLE instructors (
    instructor_id   INT PRIMARY KEY AUTO_INCREMENT,   -- PG: GENERATED ALWAYS AS IDENTITY
    first_name      VARCHAR(50) NOT NULL,
    last_name       VARCHAR(50) NOT NULL,
    email           VARCHAR(100) UNIQUE,
    department_id   INT,
    hire_date       DATE,
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);
```

- `UNIQUE` → no two instructors can share the same email.
- `FOREIGN KEY` → links `department_id` here to the `departments` table, enforcing that an instructor's department must actually exist.

### 2.3 `students`

```sql
CREATE TABLE students (
    student_id      INT PRIMARY KEY AUTO_INCREMENT,   -- PG: GENERATED ALWAYS AS IDENTITY
    first_name      VARCHAR(50) NOT NULL,
    last_name       VARCHAR(50) NOT NULL,
    email           VARCHAR(100) UNIQUE,
    enrollment_date DATE,
    gpa             DECIMAL(3,2) DEFAULT 0.00
);
```

- `DECIMAL(3,2)` → up to 3 digits total, 2 after the decimal (e.g., 3.75). Works identically in both databases (`NUMERIC` is a synonym in PostgreSQL).
- `DEFAULT 0.00` → if no value is given, GPA defaults to 0.00.

### 2.4 `courses`

```sql
CREATE TABLE courses (
    course_id      INT PRIMARY KEY AUTO_INCREMENT,    -- PG: GENERATED ALWAYS AS IDENTITY
    course_name    VARCHAR(100) NOT NULL,
    credits        INT CHECK (credits BETWEEN 1 AND 6),
    department_id  INT,
    instructor_id  INT,
    FOREIGN KEY (department_id) REFERENCES departments(department_id),
    FOREIGN KEY (instructor_id) REFERENCES instructors(instructor_id)
);
```

- `CHECK` → restricts values (credits must be 1–6). Invalid inserts are rejected. Same syntax in both databases.

### 2.5 `enrollments` (many-to-many bridge: students ↔ courses)

```sql
CREATE TABLE enrollments (
    enrollment_id   INT PRIMARY KEY AUTO_INCREMENT,   -- PG: GENERATED ALWAYS AS IDENTITY
    student_id      INT,
    course_id       INT,
    enroll_date     DATE,
    grade           VARCHAR(2),
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
);
```

A student can take many courses, and a course has many students — this table connects them.

### 2.6 `assignments`

```sql
CREATE TABLE assignments (
    assignment_id   INT PRIMARY KEY AUTO_INCREMENT,   -- PG: GENERATED ALWAYS AS IDENTITY
    course_id       INT,
    title           VARCHAR(100) NOT NULL,
    due_date        DATE,
    max_marks       INT DEFAULT 100,
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
);
```

### Inspecting your schema

```sql
-- MySQL
SHOW TABLES;
DESCRIBE students;              -- or: SHOW COLUMNS FROM students;
SHOW CREATE TABLE students;
```

```sql
-- PostgreSQL alternative (works in TablePlus)
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';                          -- list tables

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'students';                          -- describe a table
-- (The information_schema queries above also work in MySQL — fully portable.)
```

> **TablePlus shortcut:** you rarely need these queries at all — the left sidebar lists every table, and right-clicking a table → **Open Structure** shows all columns, types, constraints, and indexes. (`\dt` and `\d` only work in the psql terminal, not in TablePlus.)

---

## 3. INSERT — Adding Data

*(Identical syntax in MySQL and PostgreSQL.)*

### Departments

```sql
INSERT INTO departments (department_name, building) VALUES
('Computer Science', 'Block A'),
('Business Administration', 'Block B'),
('Mathematics', 'Block C');
```

### Instructors

```sql
INSERT INTO instructors (first_name, last_name, email, department_id, hire_date) VALUES
('Rafiq', 'Ahmed', 'rafiq.ahmed@lms.edu', 1, '2018-03-15'),
('Nasrin', 'Khatun', 'nasrin.khatun@lms.edu', 1, '2020-06-01'),
('Imran', 'Hossain', 'imran.hossain@lms.edu', 2, '2016-01-10'),
('Farhana', 'Islam', 'farhana.islam@lms.edu', 3, '2019-09-20');
```

### Students

```sql
INSERT INTO students (first_name, last_name, email, enrollment_date, gpa) VALUES
('Tanvir', 'Rahman', 'tanvir.rahman@lms.edu', '2023-01-15', 3.65),
('Mim', 'Akter', 'mim.akter@lms.edu', '2023-01-15', 3.90),
('Rakib', 'Hasan', 'rakib.hasan@lms.edu', '2022-08-20', 3.10),
('Sadia', 'Sultana', 'sadia.sultana@lms.edu', '2023-01-15', 3.45),
('Nayeem', 'Chowdhury', 'nayeem.chowdhury@lms.edu', '2022-08-20', 2.85);
```

### Courses

```sql
INSERT INTO courses (course_name, credits, department_id, instructor_id) VALUES
('Database Systems', 3, 1, 1),
('Web Development', 4, 1, 2),
('Principles of Management', 3, 2, 3),
('Calculus I', 4, 3, 4),
('Data Structures', 3, 1, 1);
```

### Enrollments

```sql
INSERT INTO enrollments (student_id, course_id, enroll_date, grade) VALUES
(1, 1, '2023-02-01', 'A'),
(1, 2, '2023-02-01', 'B+'),
(2, 1, '2023-02-01', 'A+'),
(2, 5, '2023-02-01', 'A'),
(3, 3, '2022-09-05', 'B'),
(4, 2, '2023-02-01', 'A-'),
(4, 4, '2023-02-01', 'B+'),
(5, 4, '2022-09-05', 'C+');
```

### Assignments

```sql
INSERT INTO assignments (course_id, title, due_date, max_marks) VALUES
(1, 'ER Diagram Design', '2023-03-01', 50),
(1, 'SQL Query Set', '2023-03-20', 100),
(2, 'Portfolio Website', '2023-03-15', 100),
(3, 'Case Study Report', '2022-10-10', 80),
(4, 'Limits & Derivatives Worksheet', '2022-10-05', 60);
```

> **Useful variants:**
> ```sql
> -- Get the inserted row back immediately (PostgreSQL only)
> INSERT INTO departments (department_name) VALUES ('Physics') RETURNING department_id;
>
> -- Insert-or-update on duplicate key
> -- MySQL:
> INSERT INTO students (student_id, first_name, last_name)
> VALUES (1, 'Tanvir', 'Rahman')
> ON DUPLICATE KEY UPDATE first_name = VALUES(first_name);
> -- PostgreSQL:
> INSERT INTO students (student_id, first_name, last_name)
> VALUES (1, 'Tanvir', 'Rahman')
> ON CONFLICT (student_id) DO UPDATE SET first_name = EXCLUDED.first_name;
> ```

---

## 4. ALTER TABLE — Modifying Structure

```sql
-- Add a new column (same in both)
ALTER TABLE students ADD phone VARCHAR(15);

-- Modify a column's data type
ALTER TABLE students MODIFY gpa DECIMAL(4,2);                      -- MySQL
ALTER TABLE students ALTER COLUMN gpa TYPE DECIMAL(4,2);           -- PostgreSQL

-- Rename a column (MySQL 8+ and PostgreSQL — same syntax)
ALTER TABLE students RENAME COLUMN phone TO contact_number;

-- Drop a column (same in both)
ALTER TABLE students DROP COLUMN contact_number;

-- Add a constraint after table creation (same in both)
ALTER TABLE courses ADD CONSTRAINT chk_credits CHECK (credits <= 6);

-- Rename a table
RENAME TABLE assignments TO course_assignments;                    -- MySQL
ALTER TABLE assignments RENAME TO course_assignments;              -- PostgreSQL (also works in MySQL)
```

Use `ALTER` when your table already has data and you need to evolve its structure without recreating it.

---

## 5. UPDATE and DELETE

*(Identical syntax in both databases.)*

```sql
-- Update a specific row
UPDATE students SET gpa = 3.95 WHERE student_id = 2;

-- Update multiple rows
UPDATE courses SET credits = 4 WHERE department_id = 1;

-- Delete a specific row
DELETE FROM assignments WHERE assignment_id = 5;
```

⚠️ Always use `WHERE` with `UPDATE`/`DELETE` — without it, **every row** is affected.

> **Safety tip:** MySQL has a "safe update mode" (`SET SQL_SAFE_UPDATES = 1;`) that blocks `UPDATE`/`DELETE` without a key-based `WHERE`. In both databases, you can also wrap risky changes in a transaction:
> ```sql
> START TRANSACTION;        -- PostgreSQL: BEGIN;
> DELETE FROM enrollments WHERE course_id = 3;
> -- check the result with SELECT...
> ROLLBACK;                 -- undo, or COMMIT; to keep
> ```

---

## 6. SELECT — Retrieving Data

*(Identical syntax in both databases.)*

```sql
-- All columns, all rows
SELECT * FROM students;

-- Specific columns
SELECT first_name, last_name, gpa FROM students;

-- Filtering
SELECT * FROM students WHERE gpa > 3.5;

-- Sorting
SELECT * FROM students ORDER BY gpa DESC;

-- Limiting results
SELECT * FROM students ORDER BY gpa DESC LIMIT 3;
-- SQL-standard alternative (PostgreSQL, SQL Server, Oracle):
-- SELECT * FROM students ORDER BY gpa DESC FETCH FIRST 3 ROWS ONLY;

-- Pattern matching
SELECT * FROM students WHERE last_name LIKE 'A%';
-- PostgreSQL bonus: case-insensitive matching with ILIKE
-- SELECT * FROM students WHERE last_name ILIKE 'a%';

-- Multiple conditions
SELECT * FROM students WHERE gpa > 3.0 AND enrollment_date > '2022-12-31';
```

---

## 7. JOINS — Combining Tables

This is where a relational database shows its real power.

### INNER JOIN — only matching rows in both tables

```sql
SELECT s.first_name, s.last_name, c.course_name, e.grade
FROM enrollments e
INNER JOIN students s ON e.student_id = s.student_id
INNER JOIN courses c ON e.course_id = c.course_id;
```
Returns only students who are actually enrolled in a course.

### LEFT JOIN — all rows from the left table, matched or not

```sql
SELECT s.first_name, s.last_name, e.course_id
FROM students s
LEFT JOIN enrollments e ON s.student_id = e.student_id;
```
Shows every student, even ones with zero enrollments (their course_id shows as `NULL`).

### RIGHT JOIN — all rows from the right table, matched or not

```sql
SELECT c.course_name, i.first_name, i.last_name
FROM courses c
RIGHT JOIN instructors i ON c.instructor_id = i.instructor_id;
```
Shows every instructor, even those not currently teaching a course.

### FULL OUTER JOIN — everything from both sides

```sql
-- PostgreSQL supports it natively:
SELECT s.first_name, c.course_name
FROM students s
FULL OUTER JOIN enrollments e ON s.student_id = e.student_id
FULL OUTER JOIN courses c ON e.course_id = c.course_id;
```

```sql
-- MySQL doesn't support FULL OUTER JOIN directly — simulate with UNION:
SELECT s.first_name, c.course_name
FROM students s
LEFT JOIN enrollments e ON s.student_id = e.student_id
LEFT JOIN courses c ON e.course_id = c.course_id
UNION
SELECT s.first_name, c.course_name
FROM courses c
LEFT JOIN enrollments e ON c.course_id = e.course_id
LEFT JOIN students s ON e.student_id = s.student_id;
```

### Multi-table JOIN example (a realistic query)

```sql
SELECT
    s.first_name AS student,
    c.course_name,
    d.department_name,
    i.first_name AS instructor,
    e.grade
FROM enrollments e
JOIN students s ON e.student_id = s.student_id
JOIN courses c ON e.course_id = c.course_id
JOIN departments d ON c.department_id = d.department_id
JOIN instructors i ON c.instructor_id = i.instructor_id;
```
One query pulls student name, course, department, instructor, and grade together.

---

## 8. GROUP BY and Aggregate Functions

```sql
-- Average GPA of all students
SELECT AVG(gpa) AS average_gpa FROM students;

-- Count students per course
SELECT c.course_name, COUNT(e.student_id) AS total_students
FROM courses c
LEFT JOIN enrollments e ON c.course_id = e.course_id
GROUP BY c.course_name;

-- Filter groups with HAVING
SELECT c.course_name, COUNT(e.student_id) AS total_students
FROM courses c
JOIN enrollments e ON c.course_id = e.course_id
GROUP BY c.course_name
HAVING COUNT(e.student_id) > 1;
```

- `WHERE` filters rows **before** grouping.
- `HAVING` filters groups **after** aggregation — this is the key difference.

> **Concatenating group members:**
> ```sql
> -- MySQL
> SELECT c.course_name, GROUP_CONCAT(s.first_name SEPARATOR ', ') AS students
> FROM enrollments e
> JOIN students s ON e.student_id = s.student_id
> JOIN courses c ON e.course_id = c.course_id
> GROUP BY c.course_name;
>
> -- PostgreSQL alternative
> SELECT c.course_name, STRING_AGG(s.first_name, ', ') AS students
> FROM enrollments e
> JOIN students s ON e.student_id = s.student_id
> JOIN courses c ON e.course_id = c.course_id
> GROUP BY c.course_name;
> ```

---

## 9. Other Important Commands

```sql
-- DISTINCT: remove duplicates
SELECT DISTINCT department_id FROM courses;

-- Subquery: students above the average GPA
SELECT first_name, gpa FROM students
WHERE gpa > (SELECT AVG(gpa) FROM students);

-- IN: match against a list
SELECT * FROM courses WHERE department_id IN (1, 3);

-- BETWEEN: range filtering
SELECT * FROM assignments WHERE due_date BETWEEN '2023-01-01' AND '2023-03-31';

-- CREATE INDEX: speed up lookups on large tables (same in both)
CREATE INDEX idx_student_email ON students(email);

-- DROP TABLE: delete a table entirely (structure + data)
DROP TABLE assignments;
DROP TABLE IF EXISTS assignments;   -- safer: no error if it doesn't exist

-- TRUNCATE: delete all rows, keep the structure
TRUNCATE TABLE enrollments;
-- PostgreSQL: TRUNCATE enrollments RESTART IDENTITY CASCADE;
--   RESTART IDENTITY resets the auto-increment counter;
--   CASCADE also truncates tables that reference this one.
```

---

# PART 2 — DATABASE OPTIMIZATION

We now reuse the same LMS schema but scale it up to **realistic size** — optimization techniques are invisible on 5 rows and dramatic on 500,000.

## 10. Generate a Large Practice Dataset

Small tables won't show you anything — a full table scan on 10 rows is already instant. Let's generate real volume.

```sql
-- MySQL (8.4+ / 9.x)
USE lms_db;

-- 1. Add more departments (10 total)
INSERT INTO departments (department_name, building)
SELECT CONCAT('Department ', n), CONCAT('Block ', CHAR(65 + (n % 10)))
FROM (
    SELECT ROW_NUMBER() OVER () AS n
    FROM information_schema.columns
    LIMIT 10
) x;

-- 2. Generate 200,000 students using a recursive CTE
SET SESSION cte_max_recursion_depth = 200001;   -- MySQL default limit is 1000

INSERT INTO students (first_name, last_name, email, enrollment_date, gpa)
WITH RECURSIVE seq(n) AS (
    SELECT 1
    UNION ALL
    SELECT n + 1 FROM seq WHERE n < 200000
)
SELECT
    CONCAT('First', n),
    CONCAT('Last', n),
    CONCAT('student', n, '@lms.edu'),
    DATE_ADD('2020-01-01', INTERVAL (n % 1500) DAY),
    ROUND(2.0 + (RAND() * 2.0), 2)
FROM seq;

-- 3. Generate 500,000 enrollments referencing real student/course IDs
SET SESSION cte_max_recursion_depth = 500001;

INSERT INTO enrollments (student_id, course_id, enroll_date, grade)
WITH RECURSIVE seq(n) AS (
    SELECT 1
    UNION ALL
    SELECT n + 1 FROM seq WHERE n < 500000
)
SELECT
    1 + FLOOR(RAND() * 200000),
    1 + FLOOR(RAND() * 5),
    DATE_ADD('2020-01-01', INTERVAL (n % 1500) DAY),
    ELT(1 + FLOOR(RAND() * 5), 'A', 'B', 'C', 'D', 'F')
FROM seq;
```

```sql
-- PostgreSQL alternative: generate_series() is cleaner than a recursive CTE
INSERT INTO students (first_name, last_name, email, enrollment_date, gpa)
SELECT
    'First' || n,
    'Last' || n,
    'student' || n || '@lms.edu',
    DATE '2020-01-01' + (n % 1500),
    ROUND((2.0 + RANDOM() * 2.0)::numeric, 2)
FROM generate_series(1, 200000) AS n;

INSERT INTO enrollments (student_id, course_id, enroll_date, grade)
SELECT
    1 + FLOOR(RANDOM() * 200000)::int,
    1 + FLOOR(RANDOM() * 5)::int,
    DATE '2020-01-01' + (n % 1500),
    (ARRAY['A','B','C','D','F'])[1 + FLOOR(RANDOM() * 5)::int]
FROM generate_series(1, 500000) AS n;
```

**Key differences:** MySQL `RAND()` → PostgreSQL `RANDOM()`; MySQL `ELT()` → PostgreSQL array indexing or `CASE`; MySQL `CONCAT()` → PostgreSQL `||` (CONCAT also works); MySQL `DATE_ADD(... INTERVAL n DAY)` → PostgreSQL `date + n`.

> **TablePlus notes for this section:**
> - Run `SET SESSION cte_max_recursion_depth = ...` and its `INSERT` **together** (select both lines, then ⌘Enter / Ctrl+Enter, or run all with ⌘⇧Enter). `SET SESSION` only lasts for the current connection — if you run it alone and TablePlus reconnects, the setting is lost and the CTE will fail at 1,000 rows.
> - The 500K insert takes 30–90 seconds; TablePlus may look frozen — it isn't. Wait for the "Query OK" message.
> - After inserting, press ⌘R / Ctrl+R and click the table to confirm the row count.

Now you have enough rows that a bad query will visibly hang, and a good query will visibly not.

---

## 11. How to Read a Query Plan (`EXPLAIN`)

Before adding any index, learn to diagnose the problem.

```sql
-- MySQL
EXPLAIN SELECT * FROM students WHERE email = 'student150000@lms.edu';
```

```sql
-- PostgreSQL alternative
EXPLAIN SELECT * FROM students WHERE email = 'student150000@lms.edu';
```

Key things to look for in **MySQL's** output:

| Field | Meaning |
|---|---|
| `type` | `ALL` = full table scan (bad). `ref`/`range`/`const` = using an index (good). |
| `rows` | Estimated rows scanned to answer the query — lower is better. |
| `key` | Which index (if any) MySQL chose to use. `NULL` means no index was used. |
| `Extra` | Watch for `Using filesort` or `Using temporary` — both are expensive. |

In **PostgreSQL's** output, the equivalents are: `Seq Scan` (bad on big tables) vs `Index Scan` / `Index Only Scan` (good), plus estimated `rows` and `cost`.

Run this query now — MySQL's `type` will show `ALL` and `rows` will be ~200,000, because `email` has no index yet.

> **In TablePlus:** `EXPLAIN` output appears as a normal result grid, so all of this works exactly as written. TablePlus also has a built-in shortcut — put your cursor on any query and press **⌘⇧E / Ctrl+Shift+E** to run `EXPLAIN` on it without typing the keyword.

### 11.1 MySQL EXPLAIN formats

MySQL supports four output formats. All run fine in TablePlus. (`FORMAT=TREE` and `EXPLAIN ANALYZE` need MySQL 8.0.18+ — always available on the 8.4/9.x containers from Part 0. Note that `EXPLAIN ANALYZE` outputs TREE format only; `FORMAT=JSON` can't be combined with it.)

```sql
-- 1. TRADITIONAL (the default) — one row per table, as a grid.
--    Best for: quick checks of type / key / rows.
EXPLAIN SELECT * FROM students WHERE email = 'student150000@lms.edu';
EXPLAIN FORMAT=TRADITIONAL SELECT ...;   -- same thing, explicit

-- 2. TREE — shows the plan as a nested tree of operations, in execution order.
--    Best for: understanding JOIN order and which step feeds which.
--    (Default format in MySQL 8.4+ for EXPLAIN ANALYZE.)
EXPLAIN FORMAT=TREE
SELECT s.first_name, e.grade
FROM students s
JOIN enrollments e ON s.student_id = e.student_id
WHERE e.course_id = 1;

-- 3. JSON — full detail: per-step cost estimates, used key parts,
--    attached conditions, whether an index covers the query.
--    Best for: deep-diving one stubborn query.
EXPLAIN FORMAT=JSON SELECT * FROM students WHERE gpa > 3.5;

-- 4. EXPLAIN ANALYZE — actually EXECUTES the query and reports
--    REAL timings and REAL row counts next to the estimates.
--    Output is in TREE format.
EXPLAIN ANALYZE
SELECT s.first_name, e.grade
FROM students s
JOIN enrollments e ON s.student_id = e.student_id
WHERE e.course_id = 1;
```

Reading `EXPLAIN ANALYZE` output — each plan line looks like:

```text
-> Index lookup on e using idx_enroll_course (course_id=1)
   (cost=1.2e+4 rows=98000) (actual time=0.04..212 rows=99612 loops=1)
```

| Part | Meaning |
|---|---|
| `cost=... rows=...` | The optimizer's **estimate** before running. |
| `actual time=A..B` | Real ms to produce the **first row** (A) and the **last row** (B). |
| `rows=` (actual) | Real rows produced. A big gap vs the estimate means stale statistics — run `ANALYZE TABLE enrollments;` |
| `loops=` | How many times this step ran (matters inside nested-loop joins: total cost ≈ time × loops). |

⚠️ `EXPLAIN ANALYZE` **really runs the query** — safe for `SELECT`, but on an `UPDATE`/`DELETE` it will really modify data. Plain `EXPLAIN` never executes anything.

```sql
-- Bonus: explain a query that is ALREADY running (find what's stuck)
SHOW PROCESSLIST;                    -- get the connection id
EXPLAIN FOR CONNECTION 42;           -- see the plan it's using
```

### 11.2 PostgreSQL EXPLAIN formats and options

PostgreSQL takes options in parentheses, and they can be combined freely:

```sql
-- Default: TEXT format, estimates only
EXPLAIN SELECT * FROM students WHERE email = 'student150000@lms.edu';

-- ANALYZE: really executes and shows actual times/rows (same warning as MySQL)
EXPLAIN ANALYZE SELECT ...;

-- BUFFERS: adds cache-hit vs disk-read page counts — shows whether the
-- query was served from memory (shared hit) or had to touch disk (read)
EXPLAIN (ANALYZE, BUFFERS) SELECT ...;

-- VERBOSE: adds output column lists and full object names
EXPLAIN (ANALYZE, VERBOSE) SELECT ...;

-- COSTS OFF: hides cost numbers — useful when comparing plan SHAPES
EXPLAIN (COSTS OFF) SELECT ...;

-- TIMING OFF: with ANALYZE, skips per-step timing (keeps row counts).
-- Use when timing overhead itself distorts a very fast query.
EXPLAIN (ANALYZE, TIMING OFF) SELECT ...;

-- SETTINGS: shows any non-default planner settings that influenced the plan
EXPLAIN (SETTINGS) SELECT ...;

-- GENERIC_PLAN (PostgreSQL 16+): plan a parameterized query without values —
-- handy for checking queries exactly as your app sends them
EXPLAIN (GENERIC_PLAN) SELECT * FROM students WHERE student_id = $1;

-- Output format: TEXT (default) | JSON | YAML | XML
EXPLAIN (ANALYZE, FORMAT JSON) SELECT ...;

-- Everything at once
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT JSON)
SELECT s.first_name, e.grade
FROM students s
JOIN enrollments e ON s.student_id = e.student_id
WHERE e.course_id = 1;
```

> **Safe ANALYZE on writes (PostgreSQL):** wrap it in a transaction and roll back —
> ```sql
> BEGIN;
> EXPLAIN ANALYZE DELETE FROM enrollments WHERE course_id = 3;
> ROLLBACK;   -- the delete is undone, but you saw the real plan + timing
> ```

### 11.3 Which format to use when

| Situation | MySQL | PostgreSQL |
|---|---|---|
| Quick "is my index used?" check | `EXPLAIN` (default grid) | `EXPLAIN` |
| Understand JOIN order / plan shape | `FORMAT=TREE` | `EXPLAIN` (TEXT is already a tree) |
| Real timings, estimate vs reality | `EXPLAIN ANALYZE` | `EXPLAIN ANALYZE` |
| Memory vs disk diagnosis | — | `(ANALYZE, BUFFERS)` |
| Feed plan to a tool / visualizer | `FORMAT=JSON` | `(FORMAT JSON)` — paste into explain.dalibo.com or explain.depesz.com |
| Debug a query stuck right now | `EXPLAIN FOR CONNECTION id` | `pg_stat_activity` view |

**Classroom habit to build:** run plain `EXPLAIN` first (free, instant), and only reach for `EXPLAIN ANALYZE` when you need to confirm the real numbers — that's also the order you'd use on a production database, where running the query twice isn't always free.

---

## 12. Indexing — Where and Why

### 12.1 The core rule

Index columns that appear in:
- `WHERE` clauses
- `JOIN ... ON` conditions
- `ORDER BY` / `GROUP BY`

**Don't** index columns that are rarely filtered on, or that change constantly (indexes slow down `INSERT`/`UPDATE` because they must be updated too).

### 12.2 Single-column index

```sql
CREATE INDEX idx_students_email ON students(email);   -- same in both
```

Re-run the `EXPLAIN` from above — `type` becomes `ref` or `const` (PostgreSQL: `Index Scan`), and `rows` drops to 1.

### 12.3 Composite (multi-column) index

If you frequently filter by multiple columns together:

```sql
CREATE INDEX idx_enroll_student_course ON enrollments(student_id, course_id);
```

**Order matters.** This index helps queries filtering on `student_id` alone, or `student_id AND course_id` together — but **not** queries filtering on `course_id` alone. Put the most selective / most-frequently-filtered column first.

```sql
-- Uses the index (student_id is leftmost)
EXPLAIN SELECT * FROM enrollments WHERE student_id = 500;

-- Does NOT use the index above (course_id isn't leftmost)
EXPLAIN SELECT * FROM enrollments WHERE course_id = 2;
```

If you need fast lookups on `course_id` alone too, add a second index:

```sql
CREATE INDEX idx_enroll_course ON enrollments(course_id);
```

### 12.4 Foreign key columns

Foreign keys are JOIN points — always index them if your database doesn't do it automatically (**MySQL auto-indexes foreign keys; PostgreSQL does NOT**):

```sql
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_department ON courses(department_id);
```

### 12.5 Covering index (advanced)

If a query only needs a few columns, an index that contains all of them lets the database skip the table entirely:

```sql
-- MySQL: put all needed columns in the index
CREATE INDEX idx_students_covering ON students(enrollment_date, first_name, last_name, gpa);

EXPLAIN SELECT first_name, last_name, gpa
FROM students
WHERE enrollment_date > '2023-01-01';
-- Extra shows "Using index" — MySQL never touched the actual table.
```

```sql
-- PostgreSQL alternative: INCLUDE keeps non-filter columns out of the sorted key
CREATE INDEX idx_students_covering ON students(enrollment_date)
INCLUDE (first_name, last_name, gpa);
-- EXPLAIN shows "Index Only Scan"
```

### 12.6 The cost of indexes

Every index speeds up reads but slows down writes (`INSERT`/`UPDATE`/`DELETE` must maintain it) and takes disk space. Don't index every column "just in case" — index based on actual query patterns.

```sql
-- See all indexes on a table (both work in TablePlus)
SHOW INDEX FROM students;                                   -- MySQL
SELECT * FROM pg_indexes WHERE tablename = 'students';      -- PostgreSQL
-- TablePlus GUI: right-click the table → Open Structure → Indexes tab

-- Remove an unused index
DROP INDEX idx_students_covering ON students;               -- MySQL
DROP INDEX idx_students_covering;                           -- PostgreSQL
```

---

## 13. Query Optimization Techniques

### 13.1 Avoid `SELECT *`

```sql
-- Bad: pulls every column, defeats covering indexes
SELECT * FROM students WHERE gpa > 3.5;

-- Good: only what you need
SELECT student_id, first_name, gpa FROM students WHERE gpa > 3.5;
```

### 13.2 Avoid functions on indexed columns

```sql
-- Bad: YEAR() runs on every row, index on enrollment_date is ignored
SELECT * FROM students WHERE YEAR(enrollment_date) = 2023;
-- (PostgreSQL equivalent of the same mistake: EXTRACT(YEAR FROM enrollment_date) = 2023)

-- Good: index-friendly range instead (works in both)
SELECT * FROM students
WHERE enrollment_date >= '2023-01-01' AND enrollment_date < '2024-01-01';
```

> **PostgreSQL bonus:** if you *must* filter on an expression, PostgreSQL supports expression indexes:
> `CREATE INDEX idx_enroll_year ON students ((EXTRACT(YEAR FROM enrollment_date)));`
> MySQL 8+ supports functional indexes too: `CREATE INDEX idx_enroll_year ON students ((YEAR(enrollment_date)));`

### 13.3 Prefer `EXISTS` over `IN` for subqueries on large sets

```sql
-- Slower on large subqueries
SELECT * FROM students
WHERE student_id IN (SELECT student_id FROM enrollments WHERE course_id = 1);

-- Faster: stops at the first match per row
SELECT * FROM students s
WHERE EXISTS (
    SELECT 1 FROM enrollments e
    WHERE e.student_id = s.student_id AND e.course_id = 1
);
```

### 13.4 Filter before you join, when possible

```sql
-- Less efficient: joins all 500K enrollments, then filters
SELECT s.first_name, e.grade
FROM students s
JOIN enrollments e ON s.student_id = e.student_id
WHERE e.course_id = 1;

-- More efficient with an index on enrollments(course_id):
-- the optimizer can filter enrollments down to matching rows first,
-- then join only those against students.
```
(The query looks the same — what matters is that the right index exists so the optimizer *can* filter early. Always check `EXPLAIN` rather than assuming.)

### 13.5 Avoid `OR` across different columns

```sql
-- Bad: often prevents index use
SELECT * FROM students WHERE gpa > 3.5 OR enrollment_date > '2023-01-01';

-- Better: UNION lets each half use its own index
SELECT * FROM students WHERE gpa > 3.5
UNION
SELECT * FROM students WHERE enrollment_date > '2023-01-01';
```

### 13.6 Use `LIMIT` when you don't need everything

```sql
-- Bad: computes and sorts all 500,000 rows before you look at 10
SELECT * FROM enrollments ORDER BY enroll_date DESC;

-- Good
SELECT * FROM enrollments ORDER BY enroll_date DESC LIMIT 10;
```

---

## 14. LIMIT and Batching

When you must process a huge table (e.g., a migration or export), never load it all into memory at once — process it in **batches**.

```sql
-- Batch 1
SELECT * FROM students ORDER BY student_id LIMIT 1000 OFFSET 0;

-- Batch 2
SELECT * FROM students ORDER BY student_id LIMIT 1000 OFFSET 1000;

-- Batch 3
SELECT * FROM students ORDER BY student_id LIMIT 1000 OFFSET 2000;
```

In application code (Node.js pseudocode), this becomes a loop:

```javascript
let offset = 0;
const batchSize = 1000;
let rows;

do {
  rows = await db.query(
    `SELECT * FROM students ORDER BY student_id LIMIT ? OFFSET ?`,  // PostgreSQL: $1 / $2 placeholders
    [batchSize, offset]
  );
  await processBatch(rows);
  offset += batchSize;
} while (rows.length === batchSize);
```

This keeps memory usage flat regardless of table size. But watch what happens as `OFFSET` grows — that leads directly into the pagination problem below.

---

## 15. Offset-Based Pagination

This is the pagination style most people learn first — and the one that quietly gets slower as users page deeper.

```sql
-- Page 1 (rows 1-20)
SELECT * FROM students ORDER BY student_id LIMIT 20 OFFSET 0;

-- Page 100 (rows 1981-2000)
SELECT * FROM students ORDER BY student_id LIMIT 20 OFFSET 1980;

-- Page 5000 (rows 99981-100000)
SELECT * FROM students ORDER BY student_id LIMIT 20 OFFSET 99980;
```

**Why it gets slow:** `OFFSET 99980` doesn't jump straight to row 99,980 — the database still has to scan and discard the first 99,980 matching rows every single time, even with an index. Run `EXPLAIN` on the last query above and check the `rows` estimate — it's counting almost the whole table.

**When offset pagination is fine:**
- Small tables
- Admin dashboards where deep pages are rarely visited
- When you need "jump to page 47" functionality (cursor pagination can't do this)

---

## 16. Cursor-Based Pagination (Keyset Pagination)

Instead of "skip N rows," you remember **where you left off** and ask for "rows after that point." This uses the index directly — no scanning and discarding.

### 16.1 Basic cursor pagination

```sql
-- Page 1: no cursor yet, just take the first 20
SELECT * FROM students ORDER BY student_id LIMIT 20;

-- Suppose the last row returned had student_id = 20.
-- Page 2: fetch rows AFTER that cursor
SELECT * FROM students
WHERE student_id > 20
ORDER BY student_id
LIMIT 20;

-- Page 3: last row from page 2 had student_id = 40
SELECT * FROM students
WHERE student_id > 40
ORDER BY student_id
LIMIT 20;
```

This is O(1) relative to page depth — page 5,000 is exactly as fast as page 1, because `WHERE student_id > X` uses the primary key index directly to seek to the right spot.

### 16.2 Cursor pagination on a non-unique column

If you're sorting by something that isn't unique (e.g., `enroll_date`), you need a **tie-breaker** — usually the primary key — so rows with identical values aren't skipped or duplicated:

```sql
-- Sort by enroll_date, with enrollment_id as tie-breaker
SELECT * FROM enrollments
ORDER BY enroll_date DESC, enrollment_id DESC
LIMIT 20;

-- Next page: cursor is (last_enroll_date, last_enrollment_id) from the previous page.
-- Row-value comparison works in both MySQL and PostgreSQL:
SELECT * FROM enrollments
WHERE (enroll_date, enrollment_id) < ('2023-06-15', 48213)
ORDER BY enroll_date DESC, enrollment_id DESC
LIMIT 20;
```

Support this with a composite index:

```sql
CREATE INDEX idx_enroll_date_id ON enrollments(enroll_date, enrollment_id);
```

### 16.3 Encoding the cursor for an API

In a real API, you'd base64-encode the cursor values so the client just passes back an opaque token:

```javascript
// Encoding a cursor to send to the client
const cursor = Buffer.from(
  JSON.stringify({ enroll_date: '2023-06-15', id: 48213 })
).toString('base64');

// Decoding it on the next request
const { enroll_date, id } = JSON.parse(
  Buffer.from(clientCursor, 'base64').toString()
);
```

### 16.4 Offset vs. Cursor — comparison

| | Offset Pagination | Cursor Pagination |
|---|---|---|
| Speed on deep pages | Degrades linearly | Stays constant |
| "Jump to page N" | Yes | No (sequential only) |
| Handles inserts/deletes mid-browse | Can skip/duplicate rows | Stable — no skipped/duplicated rows |
| Implementation complexity | Simple | Slightly more setup |
| Best for | Small datasets, admin UIs | Infinite scroll, large feeds, APIs |

**Practical rule:** if your table is small or users need numbered page links, use offset. If it's large or it's an infinite-scroll / API feed, use cursor pagination.

---

## 17. Putting It Together — A Realistic Optimization Exercise

Try this progression yourself on the dataset you generated:

```sql
-- Step 1: run this and check EXPLAIN — note the 'type' and 'rows'
EXPLAIN SELECT * FROM enrollments WHERE course_id = 3 ORDER BY enroll_date DESC LIMIT 20;

-- Step 2: add a composite index matching the filter + sort
CREATE INDEX idx_enroll_course_date ON enrollments(course_id, enroll_date);

-- Step 3: re-run the EXPLAIN — compare 'type' and 'rows' to before

-- Step 4: convert the same query to cursor pagination and compare EXPLAIN again
SELECT * FROM enrollments
WHERE course_id = 3 AND enroll_date < '2023-06-01'
ORDER BY enroll_date DESC
LIMIT 20;
```

Watching the `EXPLAIN` output change at each step is the fastest way to build real intuition — more useful than memorizing rules.

---

# PART 3 — DATABASE TRANSACTIONS

A **database transaction** is a sequence of one or more operations performed as a single logical unit of work. A transaction ensures that all the operations within it succeed together or fail together — maintaining the integrity and consistency of the data.

Key characteristics:
- It involves multiple steps or operations.
- It must be treated as an indivisible unit of work.
- It can either succeed completely (**COMMIT**) or fail entirely (**ROLLBACK**).

## 18. The Problems Transactions Solve

### 18.1 Partial updates

If a crash occurs mid-way, some changes apply and others don't, leaving the database inconsistent.

```sql
-- Without a transaction, run as two separate statements:
UPDATE account SET balance = balance - 100 WHERE account_id = 'A';
-- ...crash happens here...
UPDATE account SET balance = balance + 100 WHERE account_id = 'B';
-- Result: A lost $100, B never received it. The system is now out of sync.
```

### 18.2 Concurrency issues

Multiple users modifying the same data simultaneously can conflict.

```sql
-- User 1 checks seat availability
SELECT * FROM seats WHERE seat_id = '14A' AND is_booked = FALSE;
-- User 2 checks the same seat at nearly the same time
SELECT * FROM seats WHERE seat_id = '14A' AND is_booked = FALSE;
-- Both see it as available and both proceed to book it → double booking
```

### 18.3 Data loss

After a system failure, changes a user believed were saved might vanish — e.g., an e-commerce order confirmed to the customer but lost in a crash before being persisted.

## 19. Transaction Commands

```sql
-- MySQL
START TRANSACTION;        -- BEGIN; also works
UPDATE students SET gpa = 3.80 WHERE student_id = 1;
UPDATE students SET gpa = 3.20 WHERE student_id = 2;
COMMIT;                   -- make all changes permanent
-- or
ROLLBACK;                 -- undo everything since START TRANSACTION
```

```sql
-- PostgreSQL alternative: identical, but BEGIN; is the idiomatic keyword
BEGIN;
UPDATE students SET gpa = 3.80 WHERE student_id = 1;
COMMIT;   -- or ROLLBACK;
```

**Autocommit:** by default, every statement you run in TablePlus is its own auto-committed transaction — that's why your earlier `UPDATE`s took effect instantly. `START TRANSACTION` suspends autocommit until you `COMMIT` or `ROLLBACK`.

**SAVEPOINT** — partial rollback inside a transaction (same syntax in both databases):

```sql
START TRANSACTION;
UPDATE students SET gpa = 4.00 WHERE student_id = 1;
SAVEPOINT after_first;
UPDATE students SET gpa = 4.00 WHERE student_id = 2;
ROLLBACK TO after_first;   -- undoes only the second update
COMMIT;                    -- first update is saved
```

## 20. ACID Properties

### 20.1 Atomicity — "All or nothing"

**Problem addressed:** partial updates. Either every operation in the transaction completes, or none apply.

```sql
START TRANSACTION;
UPDATE account SET balance = balance - 100 WHERE account_id = 'A';
UPDATE account SET balance = balance + 100 WHERE account_id = 'B';
COMMIT;      -- both succeeded
-- If anything failed partway: ROLLBACK; undoes everything.
```

If the server crashes between the two updates, the database rolls back the uncommitted half automatically on recovery.

### 20.2 Consistency — "Maintaining integrity"

**Problem addressed:** data integrity violations. A transaction moves the database from one valid state to another, respecting constraints.

```sql
ALTER TABLE account ADD CONSTRAINT chk_balance CHECK (balance >= 0);

START TRANSACTION;
UPDATE account SET balance = balance - 500 WHERE account_id = 'A';
-- If this would make balance negative, the CHECK constraint rejects it
-- and the transaction cannot commit — consistency is preserved.
COMMIT;
```

### 20.3 Isolation — "No interference"

**Problem addressed:** concurrency conflicts. Concurrent transactions behave as if each runs alone.

```sql
-- Transaction 1
START TRANSACTION;
SELECT * FROM seats WHERE seat_id = '14A' FOR UPDATE;  -- locks the row
UPDATE seats SET is_booked = TRUE WHERE seat_id = '14A';
COMMIT;

-- Transaction 2, attempted concurrently, is blocked on this row until
-- Transaction 1 commits — preventing the double booking.
```

### 20.4 Durability — "Persistence of data"

**Problem addressed:** data loss after system failure. Once `COMMIT` returns successfully, the change survives crashes.

```sql
START TRANSACTION;
INSERT INTO orders (customer_id, total_amount, order_date) VALUES (130, 49.99, NOW());
COMMIT;
-- This order row is guaranteed to survive even a server crash one second later.
```

### Summary table

| Property | Problem Addressed | Key Concept | Example |
|---|---|---|---|
| **Atomicity** | Partial updates | "All or nothing." | Money transfer rollback if incomplete. |
| **Consistency** | Data integrity violations | "Maintaining integrity." | Preventing negative account balances. |
| **Isolation** | Concurrency conflicts | "No interference." | Avoiding double bookings for the same flight seat. |
| **Durability** | Data loss after system failure | "Persistence of data." | An e-commerce order surviving a crash after commit. |

## 21. Concurrency Anomalies

Anomalies are incorrect behaviors that occur when transactions run concurrently without proper isolation.

### 21.1 Dirty Reads

A transaction reads uncommitted data written by another transaction. If the writer rolls back, the reader has used a value that never officially existed.

```sql
-- Transaction T1
START TRANSACTION;
UPDATE account SET balance = 0 WHERE account_id = 'A';
-- not committed yet

-- Transaction T2 (at READ UNCOMMITTED isolation)
SELECT balance FROM account WHERE account_id = 'A';
-- reads 0 — but this value might not be real!

-- Transaction T1 changes its mind
ROLLBACK;
-- T2 already used a value that never actually existed
```

### 21.2 Non-Repeatable Reads

A transaction reads the same row twice and gets different values, because another transaction modified and committed it in between.

```sql
-- Transaction T1
START TRANSACTION;
SELECT balance FROM account WHERE account_id = 'A';  -- returns 5000

-- Transaction T2 commits a change in between
UPDATE account SET balance = 4000 WHERE account_id = 'A';
COMMIT;

-- Transaction T1 reads again, same transaction
SELECT balance FROM account WHERE account_id = 'A';  -- now returns 4000
COMMIT;
```

### 21.3 Phantom Reads

A transaction runs the same query twice and gets a different **set of rows**, because another transaction inserted or deleted matching rows in between.

```sql
-- Transaction T1
START TRANSACTION;
SELECT * FROM account WHERE balance > 1000;  -- returns 2 rows

-- Transaction T2 commits a new matching row
INSERT INTO account (account_id, balance) VALUES ('C', 1500);
COMMIT;

-- Transaction T1 repeats the exact same query
SELECT * FROM account WHERE balance > 1000;  -- now returns 3 rows
COMMIT;
```

## 22. Isolation Levels

Isolation levels control how transactions interact — a trade-off between performance and strictness.

| Isolation Level | Dirty Reads | Non-Repeatable Reads | Phantom Reads |
|---|---|---|---|
| Read Uncommitted | Possible | Possible | Possible |
| Read Committed | Prevented | Possible | Possible |
| Repeatable Read | Prevented | Prevented | Possible* |
| Serializable | Prevented | Prevented | Prevented |

\* MySQL (InnoDB) and PostgreSQL implement Repeatable Read in a way that largely mitigates phantom reads (next-key locking / snapshot isolation).

### Checking and setting the level

```sql
-- MySQL
SELECT @@transaction_isolation;                            -- check current level
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;    -- this connection, all following transactions
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;              -- next transaction only
```

```sql
-- PostgreSQL alternative
SHOW transaction_isolation;
SET SESSION CHARACTERISTICS AS TRANSACTION ISOLATION LEVEL READ COMMITTED;
BEGIN ISOLATION LEVEL SERIALIZABLE;    -- per-transaction, at BEGIN
```

### 22.1 Read Uncommitted

The lowest level — can read uncommitted (dirty) data. Prevents nothing. Rarely used in practice.

```sql
SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
```

> **PostgreSQL difference:** PostgreSQL never allows dirty reads. You can set READ UNCOMMITTED, but it silently behaves as READ COMMITTED — so the dirty-read experiment in Section 23 only works on MySQL.

### 22.2 Read Committed

Only committed data is visible. Prevents dirty reads; non-repeatable and phantom reads still possible. **PostgreSQL's default.** The most common level in real applications.

### 22.3 Repeatable Read

Every read within the transaction sees the same snapshot — re-reading a row always returns the same value. Prevents dirty and non-repeatable reads; classic phantom reads still theoretically possible. **MySQL's default.**

### 22.4 Serializable

The strictest level — transactions behave as if executed one after another. Prevents all three anomalies, at the cost of throughput. In MySQL this works by locking; in PostgreSQL by aborting conflicting transactions with a serialization error your app must catch and retry.

## 23. Hands-On Lab — See the Anomalies in TablePlus

Set up a small `account` table (the banking scenario maps directly to the concepts):

```sql
CREATE TABLE account (
    account_id VARCHAR(10) PRIMARY KEY,
    balance    DECIMAL(10,2) NOT NULL CHECK (balance >= 0)
);

INSERT INTO account (account_id, balance) VALUES
('A', 5000.00),
('B', 2000.00);
```

⚠️ **Open two separate connections** to `lms_db` — connect twice from the TablePlus connection list. Two tabs on one connection can share a session, and these experiments need two distinct sessions. Call them **Session A** and **Session B**.

**Lab 1 — Atomicity:** in Session A, run the money-transfer transaction, but deliberately break it mid-way (e.g., update a non-existent account, or violate the CHECK constraint), then `ROLLBACK` and confirm both balances are untouched.

**Lab 2 — Dirty read (MySQL only):**

```sql
-- Session B:
SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

-- Session A:
START TRANSACTION;
UPDATE account SET balance = 0 WHERE account_id = 'A';   -- no COMMIT

-- Session B:
SELECT balance FROM account WHERE account_id = 'A';      -- sees 0: dirty!

-- Session A:
ROLLBACK;   -- Session B read a value that never officially existed
```

**Lab 3 — Non-repeatable read:** Session A (at READ COMMITTED) starts a transaction and reads A's balance twice, with Session B committing an `UPDATE` between the reads — the two reads differ. Repeat with Session A at REPEATABLE READ — both reads now match, even after B commits.

**Lab 4 — Phantom read:** Session A runs `SELECT * FROM account WHERE balance > 1000;` twice inside one transaction, with Session B inserting a matching row in between. Try at REPEATABLE READ vs SERIALIZABLE (at SERIALIZABLE, Session B's insert blocks until A commits).

**Lab 5 — Row locking with `FOR UPDATE`:**

```sql
-- Session A:
START TRANSACTION;
SELECT * FROM account WHERE account_id = 'A' FOR UPDATE;   -- locks the row

-- Session B:
UPDATE account SET balance = 9999 WHERE account_id = 'A';
-- Session B FREEZES — waiting for A's lock

-- Session A:
COMMIT;   -- Session B instantly unblocks and completes
```

This is the double-booking problem solved in practice: lock the row first, then decide. The moment Session B freezes waiting on Session A is when isolation stops being abstract.

## 24. Transactions in Application Code (Node.js)

The try/catch/rollback pattern — every payment, order, or transfer flow should look like this:

```javascript
// mysql2 with a connection pool
const conn = await pool.getConnection();
try {
  await conn.beginTransaction();
  await conn.query('UPDATE account SET balance = balance - ? WHERE account_id = ?', [100, 'A']);
  await conn.query('UPDATE account SET balance = balance + ? WHERE account_id = ?', [100, 'B']);
  await conn.commit();
} catch (err) {
  await conn.rollback();   // any failure undoes everything
  throw err;
} finally {
  conn.release();          // always return the connection to the pool
}
```

Key rules: use one dedicated connection for the whole transaction (never mix pooled connections mid-transaction), keep transactions short (locks are held until COMMIT), and always release in `finally`.

---

# PART 4 — DATABASE SCALING: PARTITIONING & SHARDING

## 25. The Problem

Imagine a `customers` table with **10 billion rows**. Querying it is slow even when you've done everything from Part 2 right:

1. **Without an index**, the database performs a sequential scan — 10 billion rows, one by one.
2. **With a B-tree index**, lookups improve, but the index itself now manages 10 billion entries:
   - The **height of the B-tree** grows — more levels to traverse per lookup.
   - The index's **memory and storage consumption** becomes significant.
   - **Maintaining the index** on every insert/update/delete adds constant overhead.

At this scale, indexing alone isn't enough. The next tools are **partitioning** (split the table, same server) and **sharding** (split the data, multiple servers).

## 26. Database Partitioning

Partitioning divides a large table into smaller physical pieces, and **the database automatically routes queries** to the right piece based on the partitioning scheme and your `WHERE` clause. No client logic needed — all partitions live on the same database server and remain logically one table.

### 26.1 Horizontal partitioning (most common) — splitting rows

**By RANGE** — e.g., each year's data in its own partition:

```sql
-- MySQL
CREATE TABLE payment (
    payment_id    INT NOT NULL,
    customer_id   INT NOT NULL,
    amount        DECIMAL(5,2) NOT NULL,
    payment_date  DATE NOT NULL,
    PRIMARY KEY (payment_id, payment_date)
)
PARTITION BY RANGE (YEAR(payment_date)) (
    PARTITION p_2023 VALUES LESS THAN (2024),
    PARTITION p_2024 VALUES LESS THAN (2025),
    PARTITION p_2025 VALUES LESS THAN (2026),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

```sql
-- PostgreSQL alternative: declarative partitioning — parent table + child tables
CREATE TABLE payment (
    payment_id    INT NOT NULL,
    customer_id   INT NOT NULL,
    amount        DECIMAL(5,2) NOT NULL,
    payment_date  DATE NOT NULL,
    PRIMARY KEY (payment_id, payment_date)
) PARTITION BY RANGE (payment_date);

CREATE TABLE payment_2023 PARTITION OF payment
    FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');
CREATE TABLE payment_2024 PARTITION OF payment
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE payment_2025 PARTITION OF payment
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE payment_default PARTITION OF payment DEFAULT;
```

> ⚠️ **MySQL rules students hit immediately:**
> 1. Every unique key (including the primary key) **must include the partitioning column** — that's why the PK above is `(payment_id, payment_date)`, not just `payment_id`.
> 2. **Partitioned InnoDB tables cannot have foreign keys** (in either direction). This is why we practice on a standalone `payment` table rather than partitioning `enrollments` — its FKs to `students`/`courses` would have to be dropped first. In PostgreSQL, partitioned tables *can* have FKs (v12+).

**By LIST** — discrete values, e.g., region or state:

```sql
-- MySQL
CREATE TABLE customer_by_state (
    customer_id INT NOT NULL,
    name        VARCHAR(100),
    state_code  VARCHAR(2) NOT NULL
)
PARTITION BY LIST COLUMNS (state_code) (
    PARTITION p_ca VALUES IN ('CA'),
    PARTITION p_ny VALUES IN ('NY'),
    PARTITION p_tx VALUES IN ('TX'),
    PARTITION p_other VALUES IN ('FL', 'WA', 'IL')
);
```

```sql
-- PostgreSQL alternative
CREATE TABLE customer_by_state (
    customer_id INT NOT NULL,
    name        VARCHAR(100),
    state_code  VARCHAR(2) NOT NULL
) PARTITION BY LIST (state_code);

CREATE TABLE cust_ca PARTITION OF customer_by_state FOR VALUES IN ('CA');
CREATE TABLE cust_ny PARTITION OF customer_by_state FOR VALUES IN ('NY');
CREATE TABLE cust_other PARTITION OF customer_by_state DEFAULT;
```

**By HASH** — even distribution when values are random (e.g., UUIDs, where ranges make no sense):

```sql
-- MySQL: applies its own hash function and distributes rows evenly
CREATE TABLE users (
    user_id   INT NOT NULL,
    uuid      VARCHAR(36) NOT NULL,
    email     VARCHAR(100),
    PRIMARY KEY (user_id)
)
PARTITION BY HASH(user_id)
PARTITIONS 5;
```

```sql
-- PostgreSQL alternative: MODULUS / REMAINDER
CREATE TABLE users (
    user_id INT NOT NULL,
    uuid    VARCHAR(36) NOT NULL,
    email   VARCHAR(100)
) PARTITION BY HASH (user_id);

CREATE TABLE users_p0 PARTITION OF users FOR VALUES WITH (MODULUS 5, REMAINDER 0);
CREATE TABLE users_p1 PARTITION OF users FOR VALUES WITH (MODULUS 5, REMAINDER 1);
CREATE TABLE users_p2 PARTITION OF users FOR VALUES WITH (MODULUS 5, REMAINDER 2);
CREATE TABLE users_p3 PARTITION OF users FOR VALUES WITH (MODULUS 5, REMAINDER 3);
CREATE TABLE users_p4 PARTITION OF users FOR VALUES WITH (MODULUS 5, REMAINDER 4);
```

### 26.2 Vertical partitioning — splitting columns

Useful when some columns are rarely accessed or very large (BLOBs, long text). In practice you do this manually with two tables:

```sql
-- Frequently accessed, small columns
CREATE TABLE products_info (
    product_id INT PRIMARY KEY,
    name       VARCHAR(150),
    price      DECIMAL(8,2)
);

-- Rarely accessed, large columns
CREATE TABLE products_images (
    product_id INT PRIMARY KEY,
    image_blob LONGBLOB,             -- PostgreSQL: BYTEA
    FOREIGN KEY (product_id) REFERENCES products_info(product_id)
);
```

Now a product-listing query never drags image data through memory.

### 26.3 Managing partitions

```sql
-- MySQL: add a partition for a new period without touching existing data
ALTER TABLE payment REORGANIZE PARTITION p_future INTO (
    PARTITION p_2026 VALUES LESS THAN (2027),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
-- (Plain ADD PARTITION only works when there's no MAXVALUE partition yet.)

-- MySQL: drop an old partition — instant, vs DELETE-ing millions of rows
ALTER TABLE payment DROP PARTITION p_2023;
```

```sql
-- PostgreSQL alternative
CREATE TABLE payment_2026 PARTITION OF payment
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

DROP TABLE payment_2023;                          -- drop old data instantly
ALTER TABLE payment DETACH PARTITION payment_2023;  -- or detach but keep it (archiving)
```

### 26.4 Verifying partition pruning

The whole point of partitioning is that queries touch only relevant partitions — always verify:

```sql
-- MySQL 8+ : plain EXPLAIN includes a 'partitions' column automatically
EXPLAIN SELECT * FROM payment WHERE payment_date = '2024-08-15';
-- 'partitions' should show only p_2024.
-- (The old EXPLAIN PARTITIONS keyword from MySQL 5.x was REMOVED in 8.0 —
--  it will error on your 8.4/9.x container.)

-- A query that doesn't filter on the partitioning column scans ALL partitions:
EXPLAIN SELECT * FROM payment WHERE customer_id = 130;
-- 'partitions' lists every partition — no pruning benefit at all.

-- Row counts per partition:
SELECT partition_name, table_rows
FROM information_schema.partitions
WHERE table_name = 'payment';
```

```sql
-- PostgreSQL alternative: EXPLAIN shows which child tables are scanned
EXPLAIN SELECT * FROM payment WHERE payment_date = '2024-08-15';
-- Plan mentions only payment_2024. Filter on another column → all children appear.
```

### 26.5 Advantages and disadvantages

**Advantages:** queries scan only the relevant partition; bulk loading and archiving become partition operations (add/drop a partition instantly instead of inserting/deleting millions of rows); old partitions can live on cheaper storage.

**Disadvantages:** rows that change their partitioning value must physically move between partitions; queries that don't filter on the partitioning column scan everything (sometimes slower than an unpartitioned table); schema changes and key constraints get more complex (see the MySQL FK/unique-key rules above).

## 27. Database Sharding

Sharding splits a large database into independent pieces called **shards**, each on a **separate database server**. Together the shards form the complete dataset.

**Key difference from partitioning:** partitions live in one database and the database routes queries automatically; shards live on different servers, and **your application must know which server to query**.

### 27.1 Sharding strategies

**1. Range-based** — shard by value ranges (IDs, dates, first letter). Simple, but risks uneven load.

**2. Hash-based** — a hash of the shard key decides the server:

```javascript
// Application-level logic — unlike partitioning, the client picks the server
function getShardForUser(userId) {
    const hash = hashToInt(userId);
    const shardNumber = hash % 5;      // 5 total shards
    return shardConnections[shardNumber];
}
```

**3. Directory-based** — a lookup table maps key ranges to servers:

```sql
CREATE TABLE shard_directory (
    key_range_start VARCHAR(10),
    key_range_end   VARCHAR(10),
    shard_server    VARCHAR(50)
);

INSERT INTO shard_directory VALUES
('A', 'D', 'shard-server-1.internal'),
('E', 'H', 'shard-server-2.internal');
-- The application queries this table first, then connects to the right server.
```

**4. Geographical** — shard by region (Asia-Pacific users on one server, Europe on another) — also helps with latency and data-residency laws.

### 27.2 Advantages and disadvantages

**Advantages:** scales beyond one machine's limits (storage, CPU, connections); each query runs against a smaller dataset; one shard failing doesn't take down the rest; adding servers is cheaper than endlessly upgrading one.

**Disadvantages:**

```sql
-- Cross-shard queries can't be one query anymore:
-- "Total users across all shards" =
--   SELECT COUNT(*) FROM users;   -- run on shard 1
--   SELECT COUNT(*) FROM users;   -- run on shard 2
--   ...then sum the results in application code.
```

Plus: rebalancing when adding/removing shards means physically moving data; a poorly chosen shard key creates **hotspots** (one overloaded shard, others idle); JOINs across shards are effectively impossible; and every client carries routing logic.

**Practical rule:** partition first — it's free and built-in. Shard only when one server genuinely can't hold the load; it's an architectural commitment, not a query tweak.

### 27.3 Partitioning vs Sharding

| Aspect | Partitioning | Sharding |
|---|---|---|
| Where data is stored | Same database server | Multiple database servers |
| Who routes queries | The database, automatically | The application/client |
| Cross-piece queries | Normal SQL, transparent | Application must fan out and merge |
| Setup | One `CREATE TABLE` clause | Infrastructure + client logic |

## 28. Hands-On Lab — Partitioning and a Mini-Shard Simulation

**Lab 1 — Partition pruning:**

```sql
-- 1. Create the range-partitioned payment table (Section 26.1, MySQL version)

-- 2. Insert sample rows across different years
INSERT INTO payment VALUES
(1, 130, 4.99, '2023-05-10'),
(2, 130, 9.99, '2024-08-15'),
(3, 130, 2.99, '2025-01-20');

-- 3. Confirm pruning: 'partitions' column should show only p_2024
EXPLAIN SELECT * FROM payment WHERE payment_date = '2024-08-15';

-- 4. Confirm NO pruning when filtering on a non-partition column
EXPLAIN SELECT * FROM payment WHERE customer_id = 130;

-- 5. Row counts per partition
SELECT partition_name, table_rows
FROM information_schema.partitions
WHERE table_name = 'payment';
```

**Lab 2 — Scale it up:** generate ~100K payment rows spread across 2023–2025 with the recursive-CTE technique from Section 10, then time a date-filtered query against a partitioned vs an identical unpartitioned copy of the table. Check `EXPLAIN` on both.

**Lab 3 — Simulate sharding with Docker:** real sharding needs multiple servers — which Docker gives you for free:

```bash
docker run --name lms-shard-1 -e MYSQL_ROOT_PASSWORD=secret123 \
  -e MYSQL_DATABASE=lms_db -p 3307:3306 -d mysql:8.4
docker run --name lms-shard-2 -e MYSQL_ROOT_PASSWORD=secret123 \
  -e MYSQL_DATABASE=lms_db -p 3308:3306 -d mysql:8.4
```

Connect TablePlus to both (ports 3307 and 3308), create the same `users` table on each, then write a tiny Node.js script with two connection pools and a `userId % 2` router that decides which pool each insert goes to. Insert 20 users, then look at both servers in TablePlus — half the rows on each. Congratulations: you've built hash-based sharding, and you'll also immediately feel the pain point when you try to count all users.

---

## MySQL ↔ PostgreSQL Quick Reference

| Task | MySQL | PostgreSQL |
|---|---|---|
| Switch database | `USE lms_db;` | TablePlus database dropdown (⌘K) — no SQL command |
| Auto-increment ID | `AUTO_INCREMENT` | `GENERATED ALWAYS AS IDENTITY` / `SERIAL` |
| List tables | `SHOW TABLES;` | `information_schema.tables` query |
| Describe table | `DESCRIBE students;` | `information_schema.columns` query, or TablePlus → Open Structure |
| List indexes | `SHOW INDEX FROM t;` | `SELECT * FROM pg_indexes WHERE tablename='t';` |
| Random number | `RAND()` | `RANDOM()` |
| String concat | `CONCAT(a, b)` | `a \|\| b` (CONCAT also works) |
| Pick from list | `ELT(n, 'A','B',...)` | `(ARRAY['A','B',...])[n]` |
| Date arithmetic | `DATE_ADD(d, INTERVAL n DAY)` | `d + n` |
| Number series | recursive CTE | `generate_series(1, N)` |
| Group concat | `GROUP_CONCAT(col)` | `STRING_AGG(col, ', ')` |
| Upsert | `ON DUPLICATE KEY UPDATE` | `ON CONFLICT ... DO UPDATE` |
| Case-insensitive LIKE | `LIKE` (default collation) | `ILIKE` |
| FULL OUTER JOIN | ❌ simulate with UNION | ✅ native |
| Drop index | `DROP INDEX idx ON t;` | `DROP INDEX idx;` |
| Modify column type | `MODIFY col TYPE` | `ALTER COLUMN col TYPE type` |
| FK auto-indexed? | ✅ Yes | ❌ No — create manually |
| Start transaction | `START TRANSACTION;` (BEGIN works) | `BEGIN;` |
| Check isolation level | `SELECT @@transaction_isolation;` | `SHOW transaction_isolation;` |
| Default isolation level | REPEATABLE READ | READ COMMITTED |
| Dirty reads possible? | Yes (at READ UNCOMMITTED) | Never — READ UNCOMMITTED acts as READ COMMITTED |
| SERIALIZABLE behavior | Blocks with locks | Aborts conflicts — app must retry |
| Partition syntax | `PARTITION BY ... (PARTITION p1 ...)` inline | Parent table + `CREATE TABLE ... PARTITION OF` |
| FK on partitioned table | ❌ Not allowed | ✅ Allowed (v12+) |
| Check pruning | `EXPLAIN` → `partitions` column | `EXPLAIN` → which child tables appear |
| Drop old partition | `ALTER TABLE ... DROP PARTITION p;` | `DROP TABLE part;` or `DETACH PARTITION` |

---

## Suggested Practice Order

**Part 0 — Setup**
0. Install Docker Desktop + TablePlus, start the MySQL container, and connect (Part 0). Confirm the green "Test" before moving on.

**Part 1 — Fundamentals**
1. Run the `CREATE TABLE` statements in order (departments → instructors → students → courses → enrollments → assignments) — order matters because of foreign keys.
2. Run all `INSERT` statements.
3. Practice `SELECT`, `WHERE`, `ORDER BY` on single tables.
4. Move to `JOIN`s once comfortable.
5. Finish with `GROUP BY`, subqueries, and `ALTER`/`UPDATE`/`DELETE`.

**Part 2 — Optimization**
6. Generate the large dataset (Section 10).
7. Run `EXPLAIN` on a few unindexed queries and note the bad numbers.
8. Add indexes one at a time (Section 12), re-checking `EXPLAIN` after each.
9. Rewrite 2–3 of your own slow queries using Section 13's techniques.
10. Implement batching (Section 14) on a mock "export all students" task.
11. Build offset pagination, then convert it to cursor pagination, and time both at page 1 vs. page 1000.

**Part 3 — Transactions**
12. Create the `account` table and run the atomicity transfer with COMMIT and ROLLBACK (Sections 19–20).
13. Open two separate TablePlus connections and work through Labs 1–5 (Section 23) — seeing each anomaly happen, then seeing the isolation level that prevents it.
14. Finish by wiring the try/catch/rollback pattern into a small Node.js script (Section 24).

**Part 4 — Scaling**
15. Create the partitioned `payment` table, run Lab 1, and confirm pruning in `EXPLAIN` (Section 28).
16. Scale to ~100K rows and compare partitioned vs unpartitioned query times (Lab 2).
17. Spin up two extra Docker containers and build the mini-shard router (Lab 3) — then try to count all users across shards and feel why sharding is a last resort.