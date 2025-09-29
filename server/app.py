from flask import Flask, render_template, request, session, redirect, url_for
import secrets
from logic import Tournament

app = Flask(__name__, template_folder='../client/templates', static_folder='../client/static')
app.secret_key = secrets.token_hex(16)

app.jinja_env.globals.update(enumerate=enumerate)

def get_tournament():
    if 'tournament' in session:
        return Tournament.from_dict(session['tournament'])
    return None

def save_tournament(t):
    session['tournament'] = t.to_dict()

@app.route('/', methods=['GET', 'POST'])
def setup():
    if request.method == 'POST':
        name = request.form.get('name')
        try:
            max_teams = int(request.form.get('max_teams'))
            bracket_type = request.form.get('bracket_type')
            if max_teams < 2 or bracket_type not in ['single-elimination', 'round-robin']:
                return render_template('index.html', page='setup', error="Invalid input. Max teams >=2, valid bracket type.")
            t = Tournament(name, max_teams, bracket_type)
            save_tournament(t)
            return redirect(url_for('registration'))
        except ValueError:
            return render_template('index.html', page='setup', error="Invalid number for max teams.")
    return render_template('index.html', page='setup')

@app.route('/registration', methods=['GET', 'POST'])
def registration():
    t = get_tournament()
    if not t:
        return redirect(url_for('setup'))
    msg = None
    if request.method == 'POST':
        action = request.form.get('action')
        if action == 'add':
            team = request.form.get('team')
            if team:
                success, msg = t.register_team(team)
        elif action == 'done':
            if t.complete_registration():
                save_tournament(t)
                if t.bracket_type == 'single-elimination':
                    return redirect(url_for('bracket'))
                return redirect(url_for('progress'))
            else:
                msg = "Need at least 2 teams to start."
    save_tournament(t)
    return render_template('index.html', page='registration', teams=t.teams, max_teams=t.max_teams, msg=msg)

@app.route('/bracket')
def bracket():
    t = get_tournament()
    if not t or t.bracket_type != 'single-elimination':
        return redirect(url_for('setup'))
    structure = t.get_bracket_structure()
    return render_template('index.html', page='bracket', structure=structure)

@app.route('/progress', methods=['GET', 'POST'])
def progress():
    t = get_tournament()
    if not t:
        return redirect(url_for('setup'))
    if t.is_tournament_complete():
        return redirect(url_for('results'))
    round_info = t.get_current_round_info()
    if round_info is None:
        return redirect(url_for('results'))
    error = None
    if request.method == 'POST':
        results = {}
        try:
            for i, match in enumerate(round_info['matches']):
                s1 = int(request.form[f'score1_{i}'])
                s2 = int(request.form[f'score2_{i}'])
                results[match] = (s1, s2)
            t.submit_round_results(results)
            save_tournament(t)
            return redirect(url_for('progress'))
        except (ValueError, KeyError) as e:
            error = str(e)
    return render_template('index.html', page='round', round_num=t.current_round + 1, round_info=round_info, error=error)

@app.route('/results')
def results():
    t = get_tournament()
    if not t or not t.is_tournament_complete():
        return redirect(url_for('setup'))
    return render_template('index.html', page='results', t=t)

if __name__ == '__main__':
    app.run(debug=True)