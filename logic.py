import random
from itertools import combinations
from operator import itemgetter

def setup():
    """Setup the tournament by getting name, max teams, and bracket type."""
    name = input("Enter tournament name: ")
    while True:
        try:
            max_teams = int(input("Enter max number of teams: "))
            if max_teams >= 2:
                break
            print("Must be at least 2.")
        except ValueError:
            print("Invalid number.")
    bracket_type = input("Enter bracket type (single-elimination or round-robin): ").lower()
    while bracket_type not in ['single-elimination', 'round-robin']:
        print("Invalid type.")
        bracket_type = input("Enter bracket type (single-elimination or round-robin): ").lower()
    return name, max_teams, bracket_type

def registration(max_teams):
    """Register teams until max reached or 'done'."""
    teams = []
    while len(teams) < max_teams:
        team = input(f"Enter team name (or 'done' to finish): ")
        if team.lower() == 'done':
            if len(teams) < 2:
                print("Need at least 2 teams to start.")
                continue
            break
        if team in teams:
            print("Team name already exists.")
            continue
        teams.append(team)
    return teams

def display_bracket_structure(num_teams):
    """Display the bracket structure for single-elimination."""
    print("\nBracket Structure:")
    current_teams = num_teams
    round_num = 1
    while current_teams > 1:
        matches = current_teams // 2
        byes = current_teams % 2
        bye_str = f", {byes} bye" if byes else ""
        print(f"Round {round_num}: {current_teams} teams ({matches} matches{bye_str})")
        current_teams = matches + byes
        round_num += 1

def generate_fixtures(teams, bracket_type):
    """Generate initial fixtures based on bracket type."""
    random.shuffle(teams)
    if bracket_type == 'round-robin':
        # Generate scheduled rounds for round-robin
        original_teams = teams[:]
        n = len(teams)
        if n % 2 == 1:
            teams.append(None)
            n += 1
        rounds = []
        for _ in range(n - 1):
            round_matches = []
            for i in range(n // 2):
                t1 = teams[i]
                t2 = teams[n - 1 - i]
                if t1 is not None and t2 is not None:
                    round_matches.append((t1, t2))
            rounds.append(round_matches)
            # Rotate
            teams = [teams[0]] + [teams[-1]] + teams[1:-1]
        return rounds, original_teams
    else:
        # For single-elimination, return shuffled teams for round generation
        return teams, teams

def enter_results(team1, team2):
    """Enter results for a match and determine winner."""
    if team1 is None or team2 is None:
        # Bye case
        winner = team2 if team1 is None else team1
        return 0, 0, winner
    print(f"\nMatch: {team1} vs {team2}")
    while True:
        try:
            score1 = int(input(f"Enter rounds won by {team1}: "))
            score2 = int(input(f"Enter rounds won by {team2}: "))
            if score1 == score2:
                print("No ties allowed, please re-enter.")
                continue
            winner = team1 if score1 > score2 else team2
            print(f"{winner} wins!")
            return score1, score2, winner
        except ValueError:
            print("Invalid input, enter integers.")

def progression(bracket_type, fixtures, match_history, original_teams):
    """Handle tournament progression and return winner(s)."""
    if bracket_type == 'round-robin':
        points = {team: 0 for team in original_teams}
        wins = {team: 0 for team in original_teams}
        differentials = {team: 0 for team in original_teams}
        total_scores = {team: 0 for team in original_teams}
        expected_matches = len(list(combinations(original_teams, 2)))
        for r, round_matches in enumerate(fixtures):
            print(f"\nRound {r + 1}:")
            played = set()
            for match in round_matches:
                t1, t2 = match
                played.add(t1)
                played.add(t2)
            byes = [t for t in original_teams if t not in played]
            for bye in byes:
                print(f"{bye} has a bye this round.")
                match_history.append((bye, 0, None, 0, "bye"))
            for match in round_matches:
                team1, team2 = match
                score1, score2, winner = enter_results(team1, team2)
                match_history.append((team1, score1, team2, score2, winner))
                points[winner] += 3
                wins[winner] += 1
                differentials[team1] += score1 - score2
                differentials[team2] += score2 - score1
                total_scores[team1] += score1
                total_scores[team2] += score2
        
        # Validate all matches completed
        completed_matches = len([m for m in match_history if m[4] != "bye"])
        if completed_matches != expected_matches:
            print("Warning: Not all matches were completed. Results may be invalid.")
        
        # Sort by points desc, diff desc, total scores desc
        standings = sorted(
            original_teams,
            key=lambda t: (-points[t], -differentials[t], -total_scores[t])
        )
        
        # Find all with same top stats (co-winners if fully tied)
        top_points, top_diff, top_scores = points[standings[0]], differentials[standings[0]], total_scores[standings[0]]
        winners = [standings[0]]
        for team in standings[1:]:
            if points[team] == top_points and differentials[team] == top_diff and total_scores[team] == top_scores:
                winners.append(team)
            else:
                break
        return winners, points, wins, differentials, total_scores, standings
    else:
        # Single-elimination
        current_teams = fixtures[:]  # Shuffled teams
        round_num = 1
        while len(current_teams) > 1:
            print(f"\nRound {round_num}:")
            next_round = []
            i = 0
            while i < len(current_teams):
                if i + 1 >= len(current_teams):
                    # Bye
                    team = current_teams[i]
                    print(f"{team} advances with a bye.")
                    match_history.append((None, 0, team, 0, team))
                    next_round.append(team)
                    i += 1
                else:
                    team1 = current_teams[i]
                    team2 = current_teams[i + 1]
                    score1, score2, winner = enter_results(team1, team2)
                    match_history.append((team1, score1, team2, score2, winner))
                    next_round.append(winner)
                    i += 2
            current_teams = next_round
            round_num += 1
        return [current_teams[0]], None, None, None, None, None

def print_standings(standings, points, wins):
    """Print the standings table for round-robin."""
    print("\nStandings:")
    print("Rank | Team | Points | Matches Won")
    rank = 1
    for team in standings:
        print(f"{rank:<4} | {team:<4} | {points[team]:<6} | {wins[team]} wins")
        rank += 1

def print_final_results(name, winners, match_history, bracket_type, points=None, wins=None, standings=None):
    """Print the final results including winner(s) and match history."""
    print(f"\nTournament: {name}")
    if bracket_type == 'round-robin' and points is not None:
        print_standings(standings, points, wins)
    if len(winners) == 1:
        print(f"Winner: {winners[0]}")
    else:
        print(f"Co-winners: {', '.join(winners)} (unbreakable tie)")
    print("\nMatch History:")
    for match in match_history:
        if match[0] is None:
            print(f"Bye: {match[2]} advances.")
        elif match[2] is None:
            print(f"Bye: {match[0]} (rest).")
        else:
            print(f"{match[0]} ({match[1]}) vs {match[2]} ({match[3]}), Winner: {match[4]}")

if __name__ == "__main__":
    name, max_teams, bracket_type = setup()
    teams = registration(max_teams)
    print(f"\nRegistered teams: {', '.join(teams)}")
    if bracket_type == 'single-elimination':
        display_bracket_structure(len(teams))
    fixtures, original_teams = generate_fixtures(teams, bracket_type)
    print("\nFixtures generated.")
    match_history = []
    winners, points, wins, differentials, total_scores, standings = progression(bracket_type, fixtures, match_history, original_teams)
    print_final_results(name, winners, match_history, bracket_type, points, wins, standings)