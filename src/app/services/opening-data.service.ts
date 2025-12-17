import { Injectable } from '@angular/core';

export interface OpeningDetail {
  id: string;
  name: string;
  moves: string;
  description: string;
  goodFor: string[];
  badFor: string[];
  category:
    | 'Open Games'
    | 'Semi-Open Games'
    | 'Closed Games'
    | 'Indian Defenses'
    | 'Flank Openings';
  children?: OpeningDetail[];
}

export interface OpeningCategory {
  name: string;
  description: string;
  openings: OpeningDetail[];
}

@Injectable({
  providedIn: 'root',
})
export class OpeningDataService {
  constructor() {}

  getOpenings(): OpeningCategory[] {
    return [
      {
        name: 'Open Games (1. e4 e5)',
        description: "Classic chess openings starting with the King's Pawn.",
        openings: [
          {
            id: 'ruy-lopez',
            name: 'Ruy Lopez',
            moves: '1. e4 e5 2. Nf3 Nc6 3. Bb5',
            description:
              'One of the oldest and most popular openings. Controls center, develops quickly.',
            goodFor: ['Strategic squeeze', 'Tactical & Positional balance'],
            badFor: ['Impatience', 'Ignoring theory'],
            category: 'Open Games',
            children: [
              {
                id: 'ruy-berlin',
                name: 'Berlin Defense',
                moves: '1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6',
                description:
                  'The "Berlin Wall". Extremely solid and hard to crack. Famous for being used by Kramnik to beat Kasparov.',
                goodFor: ['Drawish endgames', 'Solid defense'],
                badFor: ['Winning chances (creates dull positions)'],
                category: 'Open Games',
              },
              {
                id: 'ruy-morphy',
                name: 'Morphy Defense (3... a6)',
                moves: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6',
                description: 'The main line. Challenges the bishop immediately.',
                goodFor: ['Flexibility', 'kicking the bishop'],
                badFor: [],
                category: 'Open Games',
                children: [
                  {
                    id: 'ruy-exchange',
                    name: 'Exchange Variation',
                    moves: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Bxc6',
                    description: "White trades bishop for knight to damage Black's structure.",
                    goodFor: ['Endgame advantage', 'Simple plans'],
                    badFor: ['Giving up Bishop pair'],
                    category: 'Open Games',
                  },
                  {
                    id: 'ruy-closed',
                    name: 'Closed Ruy Lopez',
                    moves: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7',
                    description: 'The classic main line. Strategic maneuvering.',
                    goodFor: ['Rich complex middle games'],
                    badFor: ['requiring distinct positional knowledge'],
                    category: 'Open Games',
                  },
                ],
              },
            ],
          },
          {
            id: 'italian-game',
            name: 'Italian Game',
            moves: '1. e4 e5 2. Nf3 Nc6 3. Bc4',
            description: 'Direct development targeting f7.',
            goodFor: ['Tactics', 'Rapid attacks'],
            badFor: ['Allowing early equality'],
            category: 'Open Games',
            children: [
              {
                id: 'italian-giuoco-piano',
                name: 'Giuoco Piano',
                moves: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5',
                description: 'The "Quiet Game". Builds a strong center slowly.',
                goodFor: ['Central control', 'Long games'],
                badFor: [],
                category: 'Open Games',
              },
              {
                id: 'two-knights',
                name: 'Two Knights Defense',
                moves: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6',
                description: 'A sharp, counter-attacking response by Black.',
                goodFor: ['Tactical complications (Fried Liver Attack)'],
                badFor: ['Passive play'],
                category: 'Open Games',
              },
              {
                id: 'evans-gambit',
                name: 'Evans Gambit',
                moves: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4',
                description:
                  'A romantic, aggressive gambit sacrificing a pawn for rapid development.',
                goodFor: ['Attacking players', 'Open lines'],
                badFor: ['Materialistic players'],
                category: 'Open Games',
              },
            ],
          },
          {
            id: 'scotch-game',
            name: 'Scotch Game',
            moves: '1. e4 e5 2. Nf3 Nc6 3. d4',
            description: 'White immediately contests the center, opening lines.',
            goodFor: ['Open positions', 'Active piece play'],
            badFor: ['Releasing tension too early'],
            category: 'Open Games',
          },
        ],
      },
      {
        name: 'Semi-Open Games',
        description: 'Asymmetric responses to 1. e4.',
        openings: [
          {
            id: 'sicilian-defense',
            name: 'Sicilian Defense',
            moves: '1. e4 c5',
            description: 'The fighting choice against e4.',
            goodFor: ['Winning as Black', 'Unbalanced positions'],
            badFor: ['Safety-first players'],
            category: 'Semi-Open Games',
            children: [
              {
                id: 'sicilian-najdorf',
                name: 'Najdorf Variation',
                moves: '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6',
                description: 'The choice of champions (Fischer, Kasparov).',
                goodFor: ['Complex battles', 'Counter-attacks'],
                badFor: ['Theory heavy'],
                category: 'Semi-Open Games',
              },
              {
                id: 'sicilian-dragon',
                name: 'Dragon Variation',
                moves: '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6',
                description: 'Black fianchettoes for a diagonal attack.',
                goodFor: ['Sharp, tactical games'],
                badFor: ['Getting checkmated by the Yugoslav Attack'],
                category: 'Semi-Open Games',
              },
              {
                id: 'sicilian-closed',
                name: 'Closed Sicilian',
                moves: '1. e4 c5 2. Nc3',
                description: 'A slower, more positional approach for White.',
                goodFor: ['Avoiding main line theory'],
                badFor: ['Lack of central break'],
                category: 'Semi-Open Games',
              },
            ],
          },
          {
            id: 'french-defense',
            name: 'French Defense',
            moves: '1. e4 e6',
            description: 'Solid and counter-attacking.',
            goodFor: ['Locked centers', 'Strategic play'],
            badFor: ['Bad light-squared bishop'],
            category: 'Semi-Open Games',
            children: [
              {
                id: 'french-advance',
                name: 'Advance Variation',
                moves: '1. e4 e6 2. d4 d5 3. e5',
                description: 'White grabs space immediately.',
                goodFor: ['Space advantage'],
                badFor: ['Overextending'],
                category: 'Semi-Open Games',
              },
              {
                id: 'french-winawer',
                name: 'Winawer Variation',
                moves: '1. e4 e6 2. d4 d5 3. Nc3 Bb4',
                description: 'Sharp and unbalancing.',
                goodFor: ['Doubling White pawns'],
                badFor: ['Dynamic risks'],
                category: 'Semi-Open Games',
              },
            ],
          },
          {
            id: 'caro-kann',
            name: 'Caro-Kann Defense',
            moves: '1. e4 c6',
            description: 'Known for its solidity and endgame resilience.',
            goodFor: ['Solid structure', 'Endgames'],
            badFor: ['Slow development'],
            category: 'Semi-Open Games',
            children: [
              {
                id: 'caro-advance',
                name: 'Advance Variation',
                moves: '1. e4 c6 2. d4 d5 3. e5',
                description: 'White gains space, Black develops the light bishop.',
                goodFor: ['Space'],
                badFor: [],
                category: 'Semi-Open Games',
              },
            ],
          },
          {
            id: 'alekhine',
            name: 'Alekhine Defense',
            moves: '1. e4 Nf6',
            description: 'Provocative defense enticing White to chase the Knight.',
            goodFor: ['Counter-attacking', 'Hypermodern play'],
            badFor: ['Overwhelmed by center pawns'],
            category: 'Semi-Open Games',
          },
          {
            id: 'pirc',
            name: 'Pirc Defense',
            moves: '1. e4 d6 2. d4 Nf6 3. Nc3 g6',
            description: 'Hypermodern defense allowing White to build a center to attack it later.',
            goodFor: ['Flexibility'],
            badFor: ['Cramped positions'],
            category: 'Semi-Open Games',
          },
        ],
      },
      {
        name: "Queen's Pawn Games",
        description: 'Positional and strategic games (1. d4).',
        openings: [
          {
            id: 'queens-gambit',
            name: "Queen's Gambit",
            moves: '1. d4 d5 2. c4',
            description: 'The gold standard of positional chess.',
            goodFor: ['Center control'],
            badFor: [],
            category: 'Closed Games',
            children: [
              {
                id: 'qgd',
                name: 'Declined (QGD)',
                moves: '1. d4 d5 2. c4 e6',
                description: 'Solid and classical.',
                goodFor: ['Safety', 'Solid structure'],
                badFor: ['Passive bishop on c8'],
                category: 'Closed Games',
              },
              {
                id: 'qga',
                name: 'Accepted (QGA)',
                moves: '1. d4 d5 2. c4 dxc4',
                description: 'Testing White to regain the pawn.',
                goodFor: ['Open piece play'],
                badFor: ['Giving up the center temporarily'],
                category: 'Closed Games',
              },
              {
                id: 'slav',
                name: 'Slav Defense',
                moves: '1. d4 d5 2. c4 c6',
                description: 'Very solid, supporting the center without blocking the bishop.',
                goodFor: ['Solid structure'],
                badFor: ['Passive play'],
                category: 'Closed Games',
              },
            ],
          },
          {
            id: 'london-system',
            name: 'London System',
            moves: '1. d4 d5 2. Bf4',
            description: 'System-based opening. Setup is almost always the same.',
            goodFor: ['Avoiding theory', 'Solid setup'],
            badFor: ['Ambition (can be drawish)'],
            category: 'Closed Games',
          },
        ],
      },
      {
        name: 'Indian Defenses',
        description: "Black's hypermodern responses to 1. d4.",
        openings: [
          {
            id: 'kings-indian',
            name: "King's Indian Defense",
            moves: '1. d4 Nf6 2. c4 g6',
            description: 'Aggressive counter-attack. Black attacks the King.',
            goodFor: ['Attacking', 'Complex positions'],
            badFor: ['Space'],
            category: 'Indian Defenses',
            children: [
              {
                id: 'kid-classical',
                name: 'Classical Variation',
                moves: '1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2',
                description: 'White builds a strong center.',
                goodFor: ['Classic battles'],
                badFor: [],
                category: 'Indian Defenses',
              },
            ],
          },
          {
            id: 'nimzo-indian',
            name: 'Nimzo-Indian Defense',
            moves: '1. d4 Nf6 2. c4 e6 3. Nc3 Bb4',
            description: 'Controls e4 by pinning the knight.',
            goodFor: ['Unbalanced positions', 'Active play'],
            badFor: [],
            category: 'Indian Defenses',
          },
          {
            id: 'grunfeld',
            name: 'Grünfeld Defense',
            moves: '1. d4 Nf6 2. c4 g6 3. Nc3 d5',
            description: 'Black challenges the center with pieces and pawn breaks.',
            goodFor: ['Dynamic play'],
            badFor: ['Theory heavy'],
            category: 'Indian Defenses',
          },
        ],
      },
      {
        name: 'Flank Openings',
        description: 'Openings not starting with e4 or d4.',
        openings: [
          {
            id: 'english-opening',
            name: 'English Opening',
            moves: '1. c4',
            description: 'Controls d5 from the flank.',
            goodFor: ['Transpositions', 'Positional play'],
            badFor: [],
            category: 'Flank Openings',
          },
          {
            id: 'reti-opening',
            name: 'Réti Opening',
            moves: '1. Nf3',
            description: 'Flexible, waiting to see what Black does.',
            goodFor: ['Flexibility'],
            badFor: [],
            category: 'Flank Openings',
          },
          {
            id: 'kia',
            name: "King's Indian Attack",
            moves: '1. Nf3 d5 2. g3',
            description: 'A system for White with a fianchetto.',
            goodFor: ['System players'],
            badFor: [],
            category: 'Flank Openings',
          },
        ],
      },
    ];
  }
}
