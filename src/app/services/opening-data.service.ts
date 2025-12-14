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
                description: ' The "Berlin Wall". Extremely solid and hard to crack.',
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
            ],
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
            ],
          },
          {
            id: 'kings-indian',
            name: "King's Indian Defense",
            moves: '1. d4 Nf6 2. c4 g6',
            description: 'Hypermodern counter-attack.',
            goodFor: ['Attacking the King', 'Complex positions'],
            badFor: ['Space disadvantage'],
            category: 'Indian Defenses',
          },
        ],
      },
    ];
  }
}
