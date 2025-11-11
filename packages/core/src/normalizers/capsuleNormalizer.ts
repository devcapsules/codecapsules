import type { Capsule, CodeCapsule } from '../types/capsule';

export class CapsuleNormalizer {
  /**
   * Normalize a capsule to ensure consistent formatting and structure
   */
  static normalize(capsule: Capsule): Capsule {
    const normalized = { ...capsule };

    // Normalize common fields
    normalized.title = normalized.title.trim();
    normalized.description = normalized.description.trim();
    normalized.tags = normalized.tags.map(tag => tag.toLowerCase().trim());

    if (normalized.type === 'code') {
      return this.normalizeCodeCapsule(normalized as CodeCapsule);
    }

    return normalized;
  }

  /**
   * Normalize code-specific capsule properties
   */
  private static normalizeCodeCapsule(capsule: CodeCapsule): CodeCapsule {
    const normalized = { ...capsule };

    // Normalize code formatting
    normalized.starterCode = this.normalizeCodeString(normalized.starterCode);
    normalized.solutionCode = this.normalizeCodeString(normalized.solutionCode);

    // Sort test cases by order index
    normalized.testCases = normalized.testCases.sort((a, b) => a.orderIndex - b.orderIndex);

    // Sort hints by order index
    normalized.hints = normalized.hints.sort((a, b) => a.orderIndex - b.orderIndex);

    return normalized;
  }

  /**
   * Normalize code string formatting
   */
  private static normalizeCodeString(code: string): string {
    return code
      .split('\n')
      .map(line => line.trimEnd()) // Remove trailing whitespace
      .join('\n')
      .trim(); // Remove leading/trailing empty lines
  }
}