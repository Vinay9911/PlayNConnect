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
        self.completed_rounds = set()  # Track completed rounds for round-robin

    def register_team(self, team):
        # Strip whitespace and validate
        team = team.strip()
        if not team:
            return False, "Team name cannot be empty"
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
            self.completed_rounds = set()
        else:
            # Single-elimination: All teams start in current_teams
            self.original_teams = self.teams[:]
            self.current_teams = self.teams[:]
            self.fixtures = []
        return True

    def get_bracket_structure(self):
        if self.bracket_type == 'single-elimination':
            structure = []
            current_teams = len(self.original_teams)
            round_num = 1
            
            # Simulate rounds until one team remains
            while current_teams > 1:
                matches = current_teams // 2
                byes = current_teams % 2
                bye_text = ', 1 bye' if byes else ''
                structure.append(f"Round {round_num}: {current_teams} teams ({matches} matches{bye_text})")
                current_teams = matches + byes
                round_num += 1
            return structure
        elif self.bracket_type == 'round-robin':
            structure = []
            for round_num, round_matches in enumerate(self.fixtures, 1):
                played = set()
                for t1, t2 in round_matches:
                    played.add(t1)
                    played.add(t2)
                byes = [t for t in self.original_teams if t not in played]
                bye_text = f", {len(byes)} bye(s)" if byes else ""
                completed = "✓" if (round_num - 1) in self.completed_rounds else ""
                structure.append(f"Round {round_num}: {len(round_matches)} matches{bye_text} {completed}")
            return structure
        return []

    def is_tournament_complete(self):
        return self.winners is not None

    def get_all_rounds_info(self):
        """For round-robin: Get info for ALL rounds with completion status"""
        if self.bracket_type != 'round-robin':
            return None
        
        all_rounds = []
        for round_num, round_matches in enumerate(self.fixtures):
            played = set()
            for t1, t2 in round_matches:
                played.add(t1)
                played.add(t2)
            byes = [t for t in self.original_teams if t not in played]
            all_rounds.append({
                'round_num': round_num,
                'matches': round_matches,
                'byes': byes,
                'completed': round_num in self.completed_rounds
            })
        return all_rounds

    def get_current_round_info(self):
        if self.is_tournament_complete():
            return None
        if self.bracket_type == 'round-robin':
            # For round-robin, this is now handled by get_all_rounds_info
            # But keep for backwards compatibility with single-elimination
            if len(self.completed_rounds) >= len(self.fixtures):
                self._compute_standings()
                return None
            # Return first incomplete round
            for round_num, round_matches in enumerate(self.fixtures):
                if round_num not in self.completed_rounds:
                    played = set()
                    for t1, t2 in round_matches:
                        played.add(t1)
                        played.add(t2)
                    byes = [t for t in self.original_teams if t not in played]
                    return {'matches': round_matches, 'byes': byes, 'round_num': round_num}
            return None
        else:
            # Single-elimination
            if len(self.current_teams) <= 1:
                if len(self.current_teams) == 1:
                    self.winners = self.current_teams
                return None
            
            # Create matches from current_teams (pair them up)
            matches = []
            byes = []
            
            i = 0
            while i + 1 < len(self.current_teams):
                matches.append((self.current_teams[i], self.current_teams[i + 1]))
                i += 2
            
            # If odd number of teams, last team gets bye
            if i < len(self.current_teams):
                byes.append(self.current_teams[i])
            
            return {'matches': matches, 'byes': byes}

    def submit_round_results(self, results, round_num=None):
        """
        For round-robin: round_num specifies which round to submit
        For single-elimination: round_num is ignored
        """
        for (t1, t2), (s1, s2) in results.items():
            if not isinstance(s1, int) or not isinstance(s2, int) or s1 < 0 or s2 < 0:
                raise ValueError("Scores must be non-negative integers")
            if s1 == s2:
                raise ValueError(f"No ties allowed for {t1} vs {t2}")
        
        if self.bracket_type == 'round-robin':
            # Validate round_num
            if round_num is None:
                raise ValueError("round_num required for round-robin")
            if round_num < 0 or round_num >= len(self.fixtures):
                raise ValueError(f"Invalid round_num: {round_num}")
            if round_num in self.completed_rounds:
                raise ValueError(f"Round {round_num + 1} already completed")
            
            # Get the specific round info
            round_matches = self.fixtures[round_num]
            played = set()
            for t1, t2 in round_matches:
                played.add(t1)
                played.add(t2)
            byes = [t for t in self.original_teams if t not in played]
            
            # Validate submitted results match this round
            submitted_normalized = set(tuple(sorted(k)) for k in results)
            expected_normalized = set(tuple(sorted(m)) for m in round_matches)
            if submitted_normalized != expected_normalized:
                raise ValueError("Mismatched or missing match results for this round")
            
            # Record byes
            for bye in byes:
                self.match_history.append((bye, 0, None, 0, "bye"))
            
            # Record match results
            for (t1, t2), (s1, s2) in results.items():
                winner = t1 if s1 > s2 else t2
                self.match_history.append((t1, s1, t2, s2, winner))
                self.points[winner] += 3
                self.wins[winner] += 1
                self.differentials[t1] += s1 - s2
                self.differentials[t2] += s2 - s1
                self.total_scores[t1] += s1
                self.total_scores[t2] += s2
            
            # Mark round as completed
            self.completed_rounds.add(round_num)
            
            # Check if all rounds completed
            if len(self.completed_rounds) >= len(self.fixtures):
                self._compute_standings()
        else:
            # Single-elimination (unchanged)
            round_info = self.get_current_round_info()
            submitted_normalized = set(tuple(sorted(k)) for k in results)
            expected_normalized = set(tuple(sorted(m)) for m in round_info['matches'])
            if submitted_normalized != expected_normalized:
                raise ValueError("Mismatched or missing match results")
            
            next_round = []
            
            # Add bye teams first
            for bye in round_info['byes']:
                self.match_history.append((bye, 0, None, 0, "bye"))
                next_round.append(bye)
            
            # Add match winners
            for (t1, t2), (s1, s2) in results.items():
                winner = t1 if s1 > s2 else t2
                self.match_history.append((t1, s1, t2, s2, winner))
                next_round.append(winner)
            
            # Update current_teams for next round
            self.current_teams = next_round
            self.current_round += 1
            
            # Check if tournament is complete
            if len(self.current_teams) == 1:
                self.winners = self.current_teams

    def _compute_standings(self):
        if self.bracket_type != 'round-robin':
            return
        expected_matches = len(list(combinations(self.original_teams, 2)))
        completed_matches = len([m for m in self.match_history if m[4] != "bye"])
        if completed_matches != expected_matches:
            print("Warning: Not all matches completed.")
        
        self.standings = sorted(
            self.original_teams,
            key=lambda t: (-self.points[t], -self.wins[t], -self.differentials[t], -self.total_scores[t])
        )
        
        # Find all teams with same stats as top team
        top_team = self.standings[0]
        top_points = self.points[top_team]
        top_wins = self.wins[top_team]
        top_diff = self.differentials[top_team]
        top_scores = self.total_scores[top_team]
        
        tied_teams = [top_team]
        for team in self.standings[1:]:
            if (self.points[team] == top_points and 
                self.wins[team] == top_wins and 
                self.differentials[team] == top_diff and 
                self.total_scores[team] == top_scores):
                tied_teams.append(team)
            else:
                break
        
        # Apply head-to-head tiebreaker only if exactly 2 teams tied
        if len(tied_teams) == 2:
            t1, t2 = tied_teams
            # Find their head-to-head match
            for match in self.match_history:
                if match[4] == "bye":
                    continue
                match_teams = {match[0], match[2]}
                if match_teams == {t1, t2}:
                    # Found the match, winner breaks the tie
                    self.winners = [match[4]]
                    return
        
        # If not exactly 2 teams, or head-to-head not found, declare co-winners
        self.winners = tied_teams

    def to_dict(self):
        d = self.__dict__.copy()
        if 'completed_rounds' in d:
            d['completed_rounds'] = list(d['completed_rounds'])
        return d

    @classmethod
    def from_dict(cls, d):
        obj = cls(d['name'], d['max_teams'], d['bracket_type'])
        obj.__dict__.update(d)
        if 'completed_rounds' in d:
            obj.completed_rounds = set(d['completed_rounds'])
        return obj