/**
 * StringMatcher - Advanced string comparison utility with fuzzy matching
 * Handles typos, variations, and partial matches with configurable thresholds
 */
class StringMatcher {
  // Levenshtein Distance - measures character insertions, deletions, substitutions
  static levenshteinDistance(str1, str2) {
    const matrix = [];
    const n = str1.length;
    const m = str2.length;

    // Initialize matrix
    for (let i = 0; i <= n; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= m; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          );
        }
      }
    }

    return matrix[n][m];
  }

  // Jaro-Winkler Distance - better for shorter strings and typos
  static jaroWinklerDistance(s1, s2) {
    const jaro = this.jaroDistance(s1, s2);

    if (jaro < 0.7) return jaro;

    // Calculate common prefix length (max 4)
    let prefix = 0;
    const maxPrefix = Math.min(4, Math.min(s1.length, s2.length));

    for (let i = 0; i < maxPrefix; i++) {
      if (s1[i] === s2[i]) prefix++;
      else break;
    }

    return jaro + 0.1 * prefix * (1 - jaro);
  }

  static jaroDistance(s1, s2) {
    if (s1 === s2) return 1.0;

    const len1 = s1.length;
    const len2 = s2.length;

    if (len1 === 0 || len2 === 0) return 0.0;

    const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
    if (matchWindow < 0) return 0.0;

    const s1Matches = new Array(len1).fill(false);
    const s2Matches = new Array(len2).fill(false);

    let matches = 0;
    let transpositions = 0;

    // Identify matches
    for (let i = 0; i < len1; i++) {
      const start = Math.max(0, i - matchWindow);
      const end = Math.min(i + matchWindow + 1, len2);

      for (let j = start; j < end; j++) {
        if (s2Matches[j] || s1[i] !== s2[j]) continue;
        s1Matches[i] = s2Matches[j] = true;
        matches++;
        break;
      }
    }

    if (matches === 0) return 0.0;

    // Count transpositions
    let k = 0;
    for (let i = 0; i < len1; i++) {
      if (!s1Matches[i]) continue;
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }

    return (
      (matches / len1 +
        matches / len2 +
        (matches - transpositions / 2) / matches) /
      3.0
    );
  }

  // Check if a string represents a number or year
  static isNumericAnswer(str) {
    const cleaned = str.trim();

    // Check if it's a pure number (including decimals)
    if (/^\d+(\.\d+)?$/.test(cleaned)) return true;

    // Check if it's a year (4 digits, reasonable range)
    if (/^\d{4}$/.test(cleaned)) {
      const year = parseInt(cleaned);
      return year >= 1000 && year <= 3000;
    }

    // Check for common numeric patterns
    if (/^[\d,]+$/.test(cleaned.replace(/,/g, ""))) return true; // Numbers with commas
    if (/^\$?[\d,]+(\.\d{2})?$/.test(cleaned)) return true; // Currency
    if (/^\d+%$/.test(cleaned)) return true; // Percentages
    if (/^-?\d+$/.test(cleaned)) return true; // Negative numbers

    // Check for spelled-out numbers in common patterns
    const spelledNumbers = [
      "zero",
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
      "ten",
      "eleven",
      "twelve",
      "thirteen",
      "fourteen",
      "fifteen",
      "sixteen",
      "seventeen",
      "eighteen",
      "nineteen",
      "twenty",
      "thirty",
      "forty",
      "fifty",
      "sixty",
      "seventy",
      "eighty",
      "ninety",
      "hundred",
      "thousand",
      "million",
      "billion",
    ];

    const lowerCleaned = cleaned.toLowerCase();
    const words = lowerCleaned.split(/\s+/);

    // If any word is a spelled number, consider it numeric
    return words.some((word) => spelledNumbers.includes(word));
  }

  // Normalize numeric strings for comparison
  static normalizeNumeric(str) {
    const cleaned = str.trim().toLowerCase();

    // Remove common formatting
    let normalized = cleaned
      .replace(/,/g, "") // Remove commas
      .replace(/\$/g, "") // Remove dollar signs
      .replace(/%/g, "") // Remove percent signs
      .replace(/\s+/g, " "); // Normalize spaces

    // Convert spelled-out numbers to digits (basic cases)
    const numberMap = {
      zero: "0",
      one: "1",
      two: "2",
      three: "3",
      four: "4",
      five: "5",
      six: "6",
      seven: "7",
      eight: "8",
      nine: "9",
      ten: "10",
      eleven: "11",
      twelve: "12",
      thirteen: "13",
      fourteen: "14",
      fifteen: "15",
      sixteen: "16",
      seventeen: "17",
      eighteen: "18",
      nineteen: "19",
      twenty: "20",
      thirty: "30",
      forty: "40",
      fifty: "50",
      sixty: "60",
      seventy: "70",
      eighty: "80",
      ninety: "90",
    };

    // Simple replacement for single word numbers
    if (numberMap[normalized]) {
      normalized = numberMap[normalized];
    }

    return normalized;
  }

  // Normalized similarity score (0-1, where 1 is perfect match)
  static similarity(str1, str2, algorithm = "levenshtein") {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1.0;

    if (algorithm === "jaro-winkler") {
      return this.jaroWinklerDistance(s1, s2);
    } else {
      const maxLen = Math.max(s1.length, s2.length);
      if (maxLen === 0) return 1.0;
      const distance = this.levenshteinDistance(s1, s2);
      return 1 - distance / maxLen;
    }
  }

  // Check if strings are similar enough based on threshold
  static isMatch(
    userAnswer,
    correctAnswer,
    threshold = 0.85,
    algorithm = "levenshtein"
  ) {
    // Clean and normalize strings
    const cleanUser = userAnswer
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, "");
    const cleanCorrect = correctAnswer
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, "");

    // NUMERIC ANSWER HANDLING - Force exact match for numbers/years
    if (
      this.isNumericAnswer(correctAnswer) ||
      this.isNumericAnswer(userAnswer)
    ) {
      const normalizedUser = this.normalizeNumeric(userAnswer);
      const normalizedCorrect = this.normalizeNumeric(correctAnswer);

      const isExactMatch = normalizedUser === normalizedCorrect;
      return {
        isMatch: isExactMatch,
        score: isExactMatch ? 1.0 : 0.0,
        method: "numeric-exact",
        originalUser: userAnswer,
        originalCorrect: correctAnswer,
        normalizedUser,
        normalizedCorrect,
      };
    }

    // Exact match first (for non-numeric)
    if (cleanUser === cleanCorrect)
      return { isMatch: true, score: 1.0, method: "exact" };

    // Check if user answer is contained in correct answer or vice versa
    if (cleanUser.includes(cleanCorrect) || cleanCorrect.includes(cleanUser)) {
      return { isMatch: true, score: 0.95, method: "contains" };
    }

    // Use string distance algorithm
    const score = this.similarity(cleanUser, cleanCorrect, algorithm);
    const isMatch = score >= threshold;

    return {
      isMatch,
      score: Math.round(score * 100) / 100,
      method: algorithm,
      threshold,
    };
  }

  // Advanced matching with multiple strategies
  static advancedMatch(userAnswer, correctAnswer, options = {}) {
    const {
      strictThreshold = 0.9,
      lenientThreshold = 0.75,
      enableWordOrder = true,
      enablePartialMatch = true,
    } = options;

    // NUMERIC ANSWER HANDLING - Override all other options for numbers
    if (
      this.isNumericAnswer(correctAnswer) ||
      this.isNumericAnswer(userAnswer)
    ) {
      return this.isMatch(userAnswer, correctAnswer, 1.0); // Force exact match
    }

    const results = [];

    // Strategy 1: Exact match
    const exactResult = this.isMatch(userAnswer, correctAnswer, 1.0);
    if (exactResult.isMatch) return { ...exactResult, strategy: "exact" };
    results.push({ ...exactResult, strategy: "exact" });

    // Strategy 2: Levenshtein with strict threshold
    const levenResult = this.isMatch(
      userAnswer,
      correctAnswer,
      strictThreshold,
      "levenshtein"
    );
    if (levenResult.isMatch)
      return { ...levenResult, strategy: "levenshtein-strict" };
    results.push({ ...levenResult, strategy: "levenshtein-strict" });

    // Strategy 3: Jaro-Winkler (good for typos)
    const jaroResult = this.isMatch(
      userAnswer,
      correctAnswer,
      strictThreshold,
      "jaro-winkler"
    );
    if (jaroResult.isMatch) return { ...jaroResult, strategy: "jaro-winkler" };
    results.push({ ...jaroResult, strategy: "jaro-winkler" });

    // Strategy 4: Word-by-word comparison (for multi-word answers)
    if (enableWordOrder) {
      const userWords = userAnswer.toLowerCase().trim().split(/\s+/);
      const correctWords = correctAnswer.toLowerCase().trim().split(/\s+/);

      if (userWords.length === correctWords.length) {
        let wordMatches = 0;
        for (let i = 0; i < userWords.length; i++) {
          const wordResult = this.isMatch(
            userWords[i],
            correctWords[i],
            lenientThreshold
          );
          if (wordResult.isMatch) wordMatches++;
        }

        const wordScore = wordMatches / correctWords.length;
        if (wordScore >= 0.8) {
          return {
            isMatch: true,
            score: wordScore,
            strategy: "word-by-word",
            wordMatches,
            totalWords: correctWords.length,
          };
        }
        results.push({
          isMatch: false,
          score: wordScore,
          strategy: "word-by-word",
        });
      }
    }

    // Strategy 5: Partial matching (any algorithm with lenient threshold)
    if (enablePartialMatch) {
      const partialResult = this.isMatch(
        userAnswer,
        correctAnswer,
        lenientThreshold,
        "jaro-winkler"
      );
      if (partialResult.isMatch)
        return { ...partialResult, strategy: "partial-match" };
      results.push({ ...partialResult, strategy: "partial-match" });
    }

    // Return best result if no match found
    const bestResult = results.reduce((best, current) =>
      current.score > best.score ? current : best
    );

    return { ...bestResult, allResults: results };
  }

  // Utility method to test if matching logic is working as expected
  static test() {
    const testCases = [
      // Text answers - should use fuzzy matching
      { user: "Abraham Lincoln", correct: "Abraham Lincoln", expected: true },
      { user: "abraham lincoln", correct: "Abraham Lincoln", expected: true },
      { user: "Abraham Lincon", correct: "Abraham Lincoln", expected: true },
      { user: "Abe Lincoln", correct: "Abraham Lincoln", expected: true },
      {
        user: "George Washington",
        correct: "Abraham Lincoln",
        expected: false,
      },

      // Numeric answers - should require exact match
      { user: "1776", correct: "1776", expected: true },
      { user: "1776", correct: "1777", expected: false },
      { user: "seventeen seventy six", correct: "1776", expected: false }, // Different formats
      { user: "42", correct: "42", expected: true },
      { user: "42.0", correct: "42", expected: false }, // Different formats
      { user: "1,000", correct: "1000", expected: true }, // Comma normalization
      { user: "$100", correct: "100", expected: true }, // Currency normalization

      // Edge cases
      { user: "", correct: "Test", expected: false },
      { user: "Test", correct: "", expected: false },
    ];

    console.log("StringMatcher Test Results:");
    console.log("===========================");

    testCases.forEach(({ user, correct, expected }, index) => {
      const result = this.advancedMatch(user, correct);
      const passed = result.isMatch === expected;

      console.log(`Test ${index + 1}: ${passed ? "✅ PASS" : "❌ FAIL"}`);
      console.log(`  Input: "${user}" vs "${correct}"`);
      console.log(`  Expected: ${expected}, Got: ${result.isMatch}`);
      console.log(`  Strategy: ${result.strategy}, Score: ${result.score}`);
      if (!passed) {
        console.log(`  ⚠️  Test failed!`);
      }
      console.log("");
    });
  }
}

export default StringMatcher;
