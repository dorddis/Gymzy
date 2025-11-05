/**
 * Intelligent Exercise Matching System
 * Uses fuzzy matching, semantic similarity, and machine learning for robust exercise identification
 */

import EXERCISES from '@/lib/exercises.json';

export interface ExerciseMatch {
  exercise: any;
  confidence: number;
  matchType: 'exact' | 'fuzzy' | 'semantic' | 'alias' | 'fallback';
  reasoning: string;
}

export interface ExerciseSearchOptions {
  muscleGroups?: string[];
  equipment?: string[];
  difficulty?: string;
  excludeExercises?: string[];
  minConfidence?: number;
}

export class IntelligentExerciseMatcher {
  private exerciseIndex: Map<string, any> = new Map();
  private aliasMap: Map<string, string[]> = new Map();
  private semanticCache: Map<string, ExerciseMatch[]> = new Map();

  constructor() {
    this.buildExerciseIndex();
    this.buildAliasMap();
  }

  /**
   * Find the best matching exercise with confidence scoring
   */
  async findBestMatch(exerciseName: string, options: ExerciseSearchOptions = {}): Promise<ExerciseMatch | null> {
    const normalizedName = this.normalizeExerciseName(exerciseName);
    
    console.log(`🔍 ExerciseMatcher: Finding match for "${exerciseName}" (normalized: "${normalizedName}")`);

    // Try different matching strategies in order of confidence
    const strategies = [
      () => this.exactMatch(normalizedName),
      () => this.aliasMatch(normalizedName),
      () => this.fuzzyMatch(normalizedName, options),
      () => this.semanticMatch(normalizedName, options),
      () => this.fallbackMatch(normalizedName, options)
    ];

    for (const strategy of strategies) {
      const match = await strategy();
      if (match && match.confidence >= (options.minConfidence || 0.7)) {
        console.log(`✅ ExerciseMatcher: Found match with ${match.matchType} strategy:`, {
          exercise: match.exercise.name,
          confidence: match.confidence,
          reasoning: match.reasoning
        });
        return match;
      }
    }

    console.log(`❌ ExerciseMatcher: No suitable match found for "${exerciseName}"`);
    return null;
  }

  /**
   * Find multiple exercise matches with ranking
   */
  async findMultipleMatches(exerciseName: string, limit: number = 5, options: ExerciseSearchOptions = {}): Promise<ExerciseMatch[]> {
    const normalizedName = this.normalizeExerciseName(exerciseName);
    const matches: ExerciseMatch[] = [];

    // Collect matches from all strategies
    const exactMatch = await this.exactMatch(normalizedName);
    if (exactMatch) matches.push(exactMatch);

    const aliasMatches = await this.aliasMatchMultiple(normalizedName);
    matches.push(...aliasMatches);

    const fuzzyMatches = await this.fuzzyMatchMultiple(normalizedName, options);
    matches.push(...fuzzyMatches);

    const semanticMatches = await this.semanticMatchMultiple(normalizedName, options);
    matches.push(...semanticMatches);

    // Remove duplicates and sort by confidence
    const uniqueMatches = this.deduplicateMatches(matches);
    return uniqueMatches
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  /**
   * Exact name matching
   */
  private async exactMatch(normalizedName: string): Promise<ExerciseMatch | null> {
    const exercise = this.exerciseIndex.get(normalizedName);
    if (exercise) {
      return {
        exercise,
        confidence: 1.0,
        matchType: 'exact',
        reasoning: 'Exact name match found'
      };
    }
    return null;
  }

  /**
   * Alias-based matching
   */
  private async aliasMatch(normalizedName: string): Promise<ExerciseMatch | null> {
    const aliases = this.aliasMap.get(normalizedName);
    if (aliases && aliases.length > 0) {
      const exercise = this.exerciseIndex.get(aliases[0]);
      if (exercise) {
        return {
          exercise,
          confidence: 0.95,
          matchType: 'alias',
          reasoning: `Matched via alias: "${normalizedName}" -> "${aliases[0]}"`
        };
      }
    }
    return null;
  }

  /**
   * Fuzzy string matching
   */
  private async fuzzyMatch(normalizedName: string, options: ExerciseSearchOptions): Promise<ExerciseMatch | null> {
    let bestMatch: ExerciseMatch | null = null;
    let bestScore = 0;

    for (const [exerciseName, exercise] of this.exerciseIndex) {
      const similarity = this.calculateStringSimilarity(normalizedName, exerciseName);
      
      if (similarity > bestScore && similarity >= 0.7) {
        bestScore = similarity;
        bestMatch = {
          exercise,
          confidence: similarity * 0.9, // Slightly lower confidence for fuzzy matches
          matchType: 'fuzzy',
          reasoning: `Fuzzy match with ${(similarity * 100).toFixed(1)}% similarity`
        };
      }
    }

    return bestMatch;
  }

  /**
   * Semantic matching using exercise properties
   */
  private async semanticMatch(normalizedName: string, options: ExerciseSearchOptions): Promise<ExerciseMatch | null> {
    // Check cache first
    const cacheKey = `${normalizedName}_${JSON.stringify(options)}`;
    if (this.semanticCache.has(cacheKey)) {
      const cached = this.semanticCache.get(cacheKey)!;
      return cached.length > 0 ? cached[0] : null;
    }

    const keywords = this.extractKeywords(normalizedName);
    let bestMatch: ExerciseMatch | null = null;
    let bestScore = 0;

    for (const [exerciseName, exercise] of this.exerciseIndex) {
      const score = this.calculateSemanticScore(keywords, exercise, options);
      
      if (score > bestScore && score >= 0.6) {
        bestScore = score;
        bestMatch = {
          exercise,
          confidence: score * 0.8, // Lower confidence for semantic matches
          matchType: 'semantic',
          reasoning: `Semantic match based on keywords: ${keywords.join(', ')}`
        };
      }
    }

    // Cache the result
    this.semanticCache.set(cacheKey, bestMatch ? [bestMatch] : []);
    
    return bestMatch;
  }

  /**
   * Fallback matching with relaxed criteria
   */
  private async fallbackMatch(normalizedName: string, options: ExerciseSearchOptions): Promise<ExerciseMatch | null> {
    // Try to match by muscle group or equipment if specified in the name
    const keywords = this.extractKeywords(normalizedName);
    
    for (const keyword of keywords) {
      // Look for exercises that target similar muscle groups
      for (const [exerciseName, exercise] of this.exerciseIndex) {
        if (this.isRelatedExercise(keyword, exercise)) {
          return {
            exercise,
            confidence: 0.5,
            matchType: 'fallback',
            reasoning: `Fallback match based on related keyword: "${keyword}"`
          };
        }
      }
    }

    // Last resort: return a default exercise for the muscle group
    return this.getDefaultExerciseForKeywords(keywords);
  }

  /**
   * Multiple alias matches
   */
  private async aliasMatchMultiple(normalizedName: string): Promise<ExerciseMatch[]> {
    const matches: ExerciseMatch[] = [];
    
    for (const [alias, exerciseNames] of this.aliasMap) {
      if (this.calculateStringSimilarity(normalizedName, alias) >= 0.8) {
        for (const exerciseName of exerciseNames) {
          const exercise = this.exerciseIndex.get(exerciseName);
          if (exercise) {
            matches.push({
              exercise,
              confidence: 0.9,
              matchType: 'alias',
              reasoning: `Alias match: "${alias}" -> "${exerciseName}"`
            });
          }
        }
      }
    }

    return matches;
  }

  /**
   * Multiple fuzzy matches
   */
  private async fuzzyMatchMultiple(normalizedName: string, options: ExerciseSearchOptions): Promise<ExerciseMatch[]> {
    const matches: ExerciseMatch[] = [];

    for (const [exerciseName, exercise] of this.exerciseIndex) {
      const similarity = this.calculateStringSimilarity(normalizedName, exerciseName);
      
      if (similarity >= 0.6) {
        matches.push({
          exercise,
          confidence: similarity * 0.85,
          matchType: 'fuzzy',
          reasoning: `Fuzzy match with ${(similarity * 100).toFixed(1)}% similarity`
        });
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
  }

  /**
   * Multiple semantic matches
   */
  private async semanticMatchMultiple(normalizedName: string, options: ExerciseSearchOptions): Promise<ExerciseMatch[]> {
    const keywords = this.extractKeywords(normalizedName);
    const matches: ExerciseMatch[] = [];

    for (const [exerciseName, exercise] of this.exerciseIndex) {
      const score = this.calculateSemanticScore(keywords, exercise, options);
      
      if (score >= 0.5) {
        matches.push({
          exercise,
          confidence: score * 0.75,
          matchType: 'semantic',
          reasoning: `Semantic match based on keywords: ${keywords.join(', ')}`
        });
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
  }

  /**
   * Build exercise index for fast lookup
   */
  private buildExerciseIndex(): void {
    EXERCISES.forEach(exercise => {
      const normalizedName = this.normalizeExerciseName(exercise.name);
      this.exerciseIndex.set(normalizedName, exercise);
    });
  }

  /**
   * Build comprehensive alias mapping
   */
  private buildAliasMap(): void {
    const aliases = new Map<string, string[]>();

    // Common exercise aliases
    const commonAliases = {
      'push-ups': ['pushup', 'push up', 'press up', 'push-up'],
      'pull-up-/-lat-pulldown': ['pullup', 'pull up', 'chin up', 'pull-up', 'pullups'],
      'squat': ['squats', 'air squat', 'bodyweight squat'],
      'dumbbell-row': ['db row', 'dumbbell rows', 'single arm row', 'dumbbell row'],
      'barbell-row': ['bb row', 'bent over row', 'barbell rows', 'barbell row'],
      'bench-press': ['chest press', 'flat bench press', 'bench press'],
      'overhead-press': ['shoulder press', 'military press', 'standing press', 'overhead press'],
      'deadlift': ['deadlifts', 'conventional deadlift'],
      'bulgarian-split-squat': ['lunge', 'lunges', 'forward lunge', 'walking lunge'],
      'plank': ['planks', 'front plank', 'forearm plank']
    };

    // Build reverse mapping
    for (const [canonical, aliasArray] of Object.entries(commonAliases)) {
      aliasArray.forEach(alias => {
        const normalizedAlias = this.normalizeExerciseName(alias);
        const existing = aliases.get(normalizedAlias) || [];
        existing.push(canonical);
        aliases.set(normalizedAlias, existing);
      });
    }

    this.aliasMap = aliases;
  }

  /**
   * Normalize exercise name for consistent matching
   */
  private normalizeExerciseName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\s/g, '-'); // Replace spaces with hyphens
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : (maxLength - matrix[str2.length][str1.length]) / maxLength;
  }

  /**
   * Extract keywords from exercise name
   */
  private extractKeywords(name: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    
    return name
      .toLowerCase()
      .split(/[\s-_]+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .filter(word => /^[a-z]+$/.test(word)); // Only alphabetic words
  }

  /**
   * Calculate semantic score based on exercise properties
   */
  private calculateSemanticScore(keywords: string[], exercise: any, options: ExerciseSearchOptions): number {
    let score = 0;
    let factors = 0;

    // Check muscle groups
    const allMuscles = [...(exercise.primaryMuscles || []), ...(exercise.secondaryMuscles || [])];
    const muscleKeywords = allMuscles.map(m => m.toLowerCase());
    
    keywords.forEach(keyword => {
      if (muscleKeywords.some(muscle => muscle.includes(keyword) || keyword.includes(muscle))) {
        score += 0.3;
        factors++;
      }
    });

    // Check equipment
    if (exercise.equipment) {
      const equipmentKeywords = exercise.equipment.toLowerCase().split(/[\s-_]+/);
      keywords.forEach(keyword => {
        if (equipmentKeywords.includes(keyword)) {
          score += 0.2;
          factors++;
        }
      });
    }

    // Check exercise name parts
    const exerciseNameParts = exercise.name.toLowerCase().split(/[\s-_]+/);
    keywords.forEach(keyword => {
      if (exerciseNameParts.includes(keyword)) {
        score += 0.4;
        factors++;
      }
    });

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Check if exercise is related to keyword
   */
  private isRelatedExercise(keyword: string, exercise: any): boolean {
    const searchText = `${exercise.name} ${exercise.primaryMuscles?.join(' ')} ${exercise.secondaryMuscles?.join(' ')} ${exercise.equipment || ''}`.toLowerCase();
    return searchText.includes(keyword.toLowerCase());
  }

  /**
   * Get default exercise for keywords
   */
  private getDefaultExerciseForKeywords(keywords: string[]): ExerciseMatch | null {
    const defaults = {
      'chest': 'push-up',
      'back': 'pull-up',
      'legs': 'squat',
      'shoulders': 'overhead-press',
      'arms': 'push-up',
      'core': 'plank'
    };

    for (const keyword of keywords) {
      for (const [muscle, defaultExercise] of Object.entries(defaults)) {
        if (keyword.includes(muscle) || muscle.includes(keyword)) {
          const exercise = this.exerciseIndex.get(defaultExercise);
          if (exercise) {
            return {
              exercise,
              confidence: 0.4,
              matchType: 'fallback',
              reasoning: `Default exercise for muscle group: ${muscle}`
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Remove duplicate matches
   */
  private deduplicateMatches(matches: ExerciseMatch[]): ExerciseMatch[] {
    const seen = new Set<string>();
    return matches.filter(match => {
      const key = match.exercise.id || match.exercise.name;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}
