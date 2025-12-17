import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface TabPiece {
  title: string;
  composer: string;
  url: string;
  midiUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ClasstabService {
  private pieces = signal<TabPiece[]>([]);
  private composers = signal<string[]>([]);

  constructor(private http: HttpClient) {
    this.loadMockData();
  }

  private loadMockData() {
    // Mock data based on the ClassTab.org structure
    // In a real implementation, this would parse the actual HTML or use an API
    const mockPieces: TabPiece[] = [
      // Albéniz
      {
        title: 'Op 47 Suite Española - 5. Asturias (Leyenda)',
        composer: 'Isaac Albéniz',
        url: 'https://www.classtab.org/albeniz_isaac_op047_no5_espanola_asturias.txt',
        midiUrl: 'https://www.classtab.org/albeniz_isaac_op047_no5_espanola_asturias.mid',
      },
      {
        title: 'Op 47 Suite Española - 1. Granada (Serenata)',
        composer: 'Isaac Albéniz',
        url: 'https://www.classtab.org/albeniz_isaac_op047_no1_espanola_granada.txt',
      },
      {
        title: 'Op 47 Suite Española - 3. Sevilla (Sevillanas)',
        composer: 'Isaac Albéniz',
        url: 'https://www.classtab.org/albeniz_isaac_op047_no3_espanola_sevilla.txt',
        midiUrl: 'https://www.classtab.org/albeniz_isaac_op047_no3_espanola_sevilla.mid',
      },
      {
        title: 'Op 165 Suite España - 2. Tango in D',
        composer: 'Isaac Albéniz',
        url: 'https://www.classtab.org/albeniz_isaac_op165_no2_tango_in_d.txt',
        midiUrl: 'https://www.classtab.org/albeniz_isaac_op165_no2_tango_in_d.mid',
      },
      {
        title: 'Op 92 Piezas Caracteristicas - 12. Torre Bermeja',
        composer: 'Isaac Albéniz',
        url: 'https://www.classtab.org/albeniz_isaac_op092_no12_torre_bermeja.txt',
      },

      // Bach
      {
        title: 'BWV 1006a - Suite No 3 in E - 1. Prelude',
        composer: 'Johann Sebastian Bach',
        url: 'https://www.classtab.org/bach_js_bwv1006a_suite_no3_in_e_1_prelude.txt',
      },
      {
        title: 'BWV 1006a - Suite No 3 in E - 3. Gavotte en Rondeau',
        composer: 'Johann Sebastian Bach',
        url: 'https://www.classtab.org/bach_js_bwv1006a_suite_no3_in_e_3_gavotte.txt',
      },
      {
        title: 'BWV 1007 - Cello Suite No 1 in G - 1. Prelude',
        composer: 'Johann Sebastian Bach',
        url: 'https://www.classtab.org/bach_js_bwv1007_cello_suite_no1_in_g_1_prelude.txt',
      },
      {
        title: 'BWV 772 - Two-Part Invention No 1 in C',
        composer: 'Johann Sebastian Bach',
        url: 'https://www.classtab.org/bach_js_bwv0772_two-part_invention_01.txt',
      },
      {
        title: "BWV 639 - Ich ruf' zu dir, Herr Jesu Christ",
        composer: 'Johann Sebastian Bach',
        url: 'https://www.classtab.org/bach_js_bwv0639_ich_ruf_zu_dir.txt',
      },

      // Tárrega
      {
        title: 'Recuerdos de la Alhambra',
        composer: 'Francisco Tárrega',
        url: 'https://www.classtab.org/tarrega_recuerdos_de_la_alhambra.txt',
      },
      {
        title: 'Capricho Árabe',
        composer: 'Francisco Tárrega',
        url: 'https://www.classtab.org/tarrega_capricho_arabe.txt',
      },
      {
        title: 'Lágrima',
        composer: 'Francisco Tárrega',
        url: 'https://www.classtab.org/tarrega_lagrima.txt',
      },

      // Sor
      {
        title: 'Op 60 - Introduction and Variations on a Theme by Mozart',
        composer: 'Fernando Sor',
        url: 'https://www.classtab.org/sor_op060_variations_mozart.txt',
      },
      {
        title: 'Op 35 No 22 - Study in Bm',
        composer: 'Fernando Sor',
        url: 'https://www.classtab.org/sor_op035_no22_study_in_bm.txt',
      },

      // Villa-Lobos
      {
        title: 'Prelude No 1 in Em',
        composer: 'Heitor Villa-Lobos',
        url: 'https://www.classtab.org/villa-lobos_prelude_no1_in_em.txt',
      },
      {
        title: 'Prelude No 3 in Am',
        composer: 'Heitor Villa-Lobos',
        url: 'https://www.classtab.org/villa-lobos_prelude_no3_in_am.txt',
      },

      // Giuliani
      {
        title: 'Op 48 - Le Rossiniane No 1',
        composer: 'Mauro Giuliani',
        url: 'https://www.classtab.org/giuliani_op048_rossiniane_no1.txt',
      },

      // Granados
      {
        title: 'Spanish Dance No 5 - Andaluza',
        composer: 'Enrique Granados',
        url: 'https://www.classtab.org/granados_spanish_dance_no5_andaluza.txt',
      },
      {
        title: 'Spanish Dance No 10 - Danza Triste',
        composer: 'Enrique Granados',
        url: 'https://www.classtab.org/granados_spanish_dance_no10_danza_triste.txt',
      },
    ];

    this.pieces.set(mockPieces);

    // Extract unique composers
    const uniqueComposers = [...new Set(mockPieces.map((p) => p.composer))].sort();
    this.composers.set(uniqueComposers);
  }

  searchPieces(query: string): TabPiece[] {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    return this.pieces().filter(
      (piece) =>
        piece.title.toLowerCase().includes(lowerQuery) ||
        piece.composer.toLowerCase().includes(lowerQuery)
    );
  }

  getComposers(): string[] {
    return this.composers();
  }

  getPiecesByComposer(composer: string): TabPiece[] {
    return this.pieces().filter((p) => p.composer === composer);
  }

  async loadTabContent(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Error loading tablature:', error);
      return 'Error loading tablature content. Please try again or visit the original URL.';
    }
  }
}
