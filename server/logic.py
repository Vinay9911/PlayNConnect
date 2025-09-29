import random
from itertools import combinations

class Tournament:
    def __init__(self, name, max_teams, bracket_type):
        self.name = name
        self.max_teams = max_teams
        self.bracket_type = bracket_type
        self.teams = []
        self.original_teams = None
        self.fixtures = None
        self.match_history = []
        self.current_round = 0
        self.points = None
        self.wins = None
        self.differentials = None
        self.total_scores = None
        self.standings = None
        self.winners = None
        self.current_teams = None  # For single-elimination

    def register_team(self, team):
        if len(self.teams) >= self.max_teams:
            return False, "Max teams reached"
        if team in self.teams:
            return False, "Team name already exists"
        self.teams.append(team)
        return True, "Team added"

    def complete_registration(self):
        if len(self.teams) < 2:
            return False
        random.shuffle(self.teams)
        if self.bracket_type == 'round-robin':
            self.original_teams = self.teams[:]
            teams_temp = self.teams[:]
            n = len(teams_temp)
            if n % 2 == 1:
                teams_temp.append(None)
                n += 1
            rounds = []
            for _ in range(n - 1):
                round_matches = []
                for i in range(n // 2):
                    t1 = teams_temp[i]
                    t2 = teams_temp[n - 1 - i]
                    if t1 is not None and t2 is not None:
                        round_matches.append((t1, t2))
                rounds.append(round_matches)
                teams_temp = [teams_temp[0]] + [teams_temp[-1]] + teams_temp[1:-1]
            self.fixtures = rounds
            self.points = {team: 0 for team in self.original_teams}
            self.wins = {team: 0 for team in self.original_teams}
            self.differentials = {team: 0 for team in self.original_teams}
            self.total_scores = {team: 0 for team in self.original_teams}
        else:
            self.original_teams = self.teams[:]
            self.current_teams = self.teams[:]
            self.fixtures = []
        return True

    def get_bracket_structure(self):
        if self.bracket_type != 'single-elimination':
            return []
        structure = []
        current_teams = len(self.original_teams)
        round_num = 1
        while current_teams > 1:
            matches = current_teams // 2
            byes = current_teams % 2
            structure.append(f"Round {round_num}: {current_teams} teams ({matches} matches{' , ' + str(byes) + ' bye' if byes else ''})")
            current_teams = matches + byes
            round_num += 1
        return structure

    def is_tournament_complete(self):
        return self.winners is not None

    def get_current_round_info(self):
        if self.is_tournament_complete():
            return None
        if self.bracket_type == 'round-robin':
            if self.current_round >= len(self.fixtures):
                self._compute_standings()
                return None
            round_matches = self.fixtures[self.current_round]
            played = set()
            for t1, t2 in round_matches:
                played.add(t1)
                played.add(t2)
            byes = [t for t in self.original_teams if t not in played]
            return {'matches': round_matches, 'byes': byes}
        else:
            if len(self.current_teams) <= 1:
                if len(self.current_teams) == 1:
                    self.winners = [self.current_teams[0]]
                return None
            matches = []
            byes = []
            i = 0
            while i < len(self.current_teams):
                if i + 1 >= len(self.current_teams):
                    byes.append(self.current_teams[i])
                    i += 1
                else:
                    matches.append((self.current_teams[i], self.current_teams[i + 1]))
                    i += 2
            return {'matches': matches, 'byes': byes}

    def submit_round_results(self, results):
        for (t1, t2), (s1, s2) in results.items():
            if not isinstance(s1, int) or not isinstance(s2, int) or s1 < 0 or s2 < 0:
                raise ValueError("Scores must be non-negative integers")
            if s1 == s2:
                raise ValueError(f"No ties allowed for {t1} vs {t2}")
        round_info = self.get_current_round_info()
        submitted_normalized = set(tuple(sorted(k)) for k in results)
        expected_normalized = set(tuple(sorted(m)) for m in round_info['matches'])
        if submitted_normalized != expected_normalized:
            raise ValueError("Mismatched or missing match results")
        if self.bracket_type == 'round-robin':
            for bye in round_info['byes']:
                self.match_history.append((bye, 0, None, 0, "bye"))
            for (t1, t2), (s1, s2) in results.items():
                winner = t1 if s1 > s2 else t2
                self.match_history.append((t1, s1, t2, s2, winner))
                self.points[winner] += 3
                self.wins[winner] += 1
                self.differentials[t1] += s1 - s2
                self.differentials[t2] += s2 - s1
                self.total_scores[t1] += s1
                self.total_scores[t2] += s2
            self.current_round += 1
            if self.current_round >= len(self.fixtures):
                self._compute_standings()
        else:
            next_round = []
            for bye in round_info['byes']:
                self.match_history.append((None, 0, bye, 0, bye))
                next_round.append(bye)
            for (t1, t2), (s1, s2) in results.items():
                winner = t1 if s1 > s2 else t2
                self.match_history.append((t1, s1, t2, s2, winner))
                next_round.append(winner)
            self.current_teams = next_round
            self.current_round += 1
            if len(self.current_teams) == 1:
                self.winners = self.current_teams

    def _compute_standings(self):
        if self.bracket_type != 'round-robin':
            return
        expected_matches = len(list(combinations(self.original_teams, 2)))
        completed_matches = len([m for m in self.match_history if m[4] != "bye"])
        if completed_matches != expected_matches:
            print("Warning: Not all matches completed.")  # Log, but proceed
        self.standings = sorted(
            self.original_teams,
            key=lambda t: (-self.points[t], -self.differentials[t], -self.total_scores[t])
        )
        top_points, top_diff, top_scores = self.points[self.standings[0]], self.differentials[self.standings[0]], self.total_scores[self.standings[0]]
        winners = [self.standings[0]]
        for team in self.standings[1:]:
            if self.points[team] == top_points and self.differentials[team] == top_diff and self.total_scores[team] == top_scores:
                winners.append(team)
            else:
                break
        self.winners = winners

    def to_dict(self):
        d = self.__dict__.copy()
        return d

    @classmethod
    def from_dict(cls, d):
        obj = cls(d['name'], d['max_teams'], d['bracket_type'])
        obj.__dict__.update(d)
        return obj