# 🏆 CODM Tournament Platform

A Flask-based web application for managing **Single-Elimination** and **Round-Robin** tournaments.

---

## 📁 Project Structure

```
CODM-TOURNAMENT/
│
├── client/
│   ├── static/css/
│   │   └── style.css          # Styling for the web pages
│   └── templates/
│       ├── base.html           # Base HTML template
│       └── index.html          # Main content template
│
├── server/
│   ├── app.py                  # Flask web server (routes & pages)
│   └── logic.py                # Tournament logic (brain of the app)
│
└── requirements.txt            # Python packages needed
```

---

## 🧠 How Each File Works

### **1. logic.py** - The Brain 🧩

This file contains all the tournament logic. Think of it as the "rules engine."

#### **What it does:**
- **Creates tournaments** with name, max teams, and type (single-elim or round-robin)
- **Registers teams** and validates names (no duplicates, no empty names)
- **Generates fixtures** (who plays who, when)
- **Tracks scores** and calculates winners
- **Handles byes** (when a team doesn't play because of odd numbers)

#### **Key Functions:**

**`Tournament.__init__()`**
- Creates a new tournament
- Sets up empty lists for teams, scores, match history

**`register_team(team)`**
- Adds a team to the tournament
- Checks: not empty, not duplicate, not exceeding max teams
- Returns success/failure message

**`complete_registration()`**
- Called when you're done adding teams
- Shuffles teams randomly for fairness
- **For Round-Robin:** Generates all rounds using rotation algorithm
- **For Single-Elimination:** Just stores all teams, will pair them later

**`get_bracket_structure()`**
- Shows how many rounds and matches will happen
- Example: "Round 1: 5 teams (2 matches, 1 bye)"

**`get_all_rounds_info()`** *(Round-Robin only)*
- Returns ALL rounds at once with their matches
- Shows which rounds are completed (✓) and which aren't
- Used for flexible round selection

**`get_current_round_info()`**
- **For Single-Elimination:** Returns current round matches (sequential)
- **For Round-Robin:** Returns first incomplete round (legacy support)

**`submit_round_results(results, round_num)`**
- Takes match results (scores) and saves them
- **For Round-Robin:** Can submit ANY round (not just next one)
- **For Single-Elimination:** Must be sequential (current round only)
- Updates points, wins, differentials, total scores
- Checks for ties (not allowed)

**`_compute_standings()`** *(Round-Robin only)*
- Calculates final rankings using:
  1. Points (3 per win)
  2. Number of wins
  3. Goal differential (rounds won - rounds lost)
  4. Total score (total rounds won)
  5. Head-to-head (if exactly 2 teams tied)
- Declares winner(s) or co-winners

---

### **2. app.py** - The Web Server 🌐

This file handles the website - what you see and click. It uses Flask framework.

#### **What it does:**
- Creates web pages (routes)
- Handles form submissions (when you click buttons)
- Stores tournament data in session (temporary browser storage)
- Redirects you between pages

#### **Key Routes (Pages):**

**`/` (setup page)**
- **GET:** Shows tournament setup form
- **POST:** Creates tournament with name, max teams, bracket type
- Validates input (teams ≥ 2, valid bracket type)
- Saves tournament and redirects to registration

**`/registration`**
- **GET:** Shows team registration page with current teams
- **POST:** 
  - Action "add": Adds a new team
  - Action "done": Completes registration, generates fixtures
- Shows error messages if team can't be added

**`/bracket`**
- **GET only:** Shows tournament structure
- Displays how many rounds, matches, byes
- Button to proceed to tournament

**`/progress`**
- **Main tournament page** - different behavior for each type:

**For Round-Robin:**
- Shows ALL rounds at once in card layout
- Each incomplete round has a form to submit scores
- Completed rounds are grayed out with ✓
- Shows live standings table at bottom
- Can submit ANY round in ANY order

**For Single-Elimination:**
- Shows ONLY current round
- Must complete rounds sequentially (Round 1 → 2 → 3...)
- Submit scores to advance to next round

**`/results`**
- **GET only:** Shows final results
- Displays winner(s)
- Shows full standings (round-robin)
- Shows complete match history

#### **Helper Functions:**

**`get_tournament()`**
- Gets tournament from browser session
- Returns Tournament object or None

**`save_tournament(t)`**
- Saves tournament to browser session
- Converts Tournament object to dictionary

---

### **3. index.html** - The Content Template 📄

This file defines what content appears on each page. Uses Jinja2 templating.

#### **What it does:**
- Shows different content based on `page` variable
- Displays forms, tables, lists
- Shows error messages

#### **Page Types:**

**`page='setup'`**
- Form with: tournament name, max teams, bracket type dropdown
- Submit button creates tournament

**`page='registration'`**
- Shows list of registered teams
- Form to add new team
- "Done Registering" button to proceed

**`page='bracket'`**
- Displays bracket structure as bullet list
- Shows number of rounds, matches, byes
- Button to start tournament

**`page='round_robin_progress'`** *(NEW!)*
- Grid of round cards
- Each card shows:
  - Round number
  - Matches for that round
  - Byes (if any)
  - Form to submit scores (if not completed)
  - ✓ mark if completed
- Live standings table at bottom

**`page='round'`** *(Single-Elimination)*
- Shows current round number
- Lists byes
- Form with matches and score inputs
- Submit button to advance

**`page='results'`**
- Winner announcement
- Standings table (round-robin)
- How rankings work (info box)
- Complete match history

---

### **4. base.html** - The Layout 🎨

This is the skeleton/wrapper for all pages.

#### **What it does:**
- Defines HTML structure (head, body)
- Includes CSS stylesheet
- Has "blocks" that index.html fills in:
  - `{% block title %}` - Page title
  - `{% block header %}` - Page heading
  - `{% block content %}` - Main content

---

### **5. style.css** - The Styling 💅

Makes everything look nice and organized.

#### **What it does:**

**Info boxes** (`.info-box`, `.logic-box`)
- Light blue background, green border
- Used for explanations and rules

**Round cards** (`.round-card`)
- Grid layout (responsive, adjusts to screen size)
- White background with shadow
- Completed rounds: green background + green border

**Forms** (`.match-input`, `.submit-round`)
- Input fields for scores
- Styled buttons (green for submit, blue for navigation)
- Hover effects

**Tables** (`.current-standings table`)
- Striped rows for readability
- Dark header row
- Hover effect on rows

**Error messages** (`.error`)
- Red background with red text
- Border and padding for visibility

---

## 🎮 How Everything Works Together

### **Flow Diagram:**

```
1. User visits website
   ↓
2. app.py shows setup page (index.html)
   ↓
3. User fills form, clicks "Start Registration"
   ↓
4. app.py creates Tournament (logic.py), saves to session
   ↓
5. app.py shows registration page
   ↓
6. User adds teams, clicks "Done Registering"
   ↓
7. logic.py generates fixtures (all rounds)
   ↓
8. app.py shows bracket structure
   ↓
9. User clicks "Proceed to Tournament"
   ↓
10. app.py shows progress page

   ROUND-ROBIN PATH:
   - Shows ALL rounds at once
   - User picks any incomplete round
   - Submits scores for that round
   - logic.py marks round as completed
   - Repeat until all rounds done
   - logic.py calculates standings
   - app.py redirects to results

   SINGLE-ELIMINATION PATH:
   - Shows ONLY current round
   - User submits scores
   - logic.py determines winners
   - Winners advance to next round
   - Repeat until 1 team remains
   - app.py redirects to results
```

---

## 🔑 Key Concepts

### **Session Storage**
- Tournament data stored in browser session
- Survives page refreshes
- Lost when browser closes
- Uses `session['tournament']` dictionary

### **Round-Robin Algorithm**
- Uses "rotation method" to generate fixtures
- Ensures each team plays every other team once
- Handles odd numbers with byes
- Example (4 teams):
  - Round 1: (A,B), (C,D)
  - Round 2: (A,C), (B,D)
  - Round 3: (A,D), (B,C)

### **Single-Elimination Logic**
- Teams paired sequentially
- Odd team gets bye (sits out that round)
- Winners advance, losers eliminated
- Continues until 1 team remains

### **Flexible Round Selection** *(Round-Robin)*
- `completed_rounds` set tracks which rounds are done
- Can submit Round 3 before Round 1
- Standings update live after each round
- Tournament completes when ALL rounds submitted

### **Tie-Breaking** *(Round-Robin)*
1. Most points (3 per win)
2. Most wins
3. Best differential
4. Highest total score
5. Head-to-head winner (if exactly 2 teams tied)
6. Co-winners (if 3+ teams tied or no h2h)

---

## 🚀 Running the App

1. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the server:
   ```bash
   cd server
   python app.py
   ```

3. Open browser:
   ```
   http://localhost:5000
   ```

---

## 📝 Summary

**logic.py** = Brain (tournament rules and calculations)  
**app.py** = Web server (pages and navigation)  
**index.html** = Content (forms, tables, displays)  
**base.html** = Layout (HTML structure)  
**style.css** = Beauty (colors, spacing, design)

**Main Feature:** Round-Robin rounds can be played in ANY order! 🎯
