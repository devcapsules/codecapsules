import type { CodeCapsule } from '../types/capsule';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class CodeValidator {
  /**
   * Validate that a code capsule has all required fields and valid structure
   */
  static validateSchema(capsule: CodeCapsule): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!capsule.id) errors.push('Capsule ID is required');
    if (!capsule.title) errors.push('Title is required');
    if (!capsule.language) errors.push('Programming language is required');
    if (!capsule.starterCode) errors.push('Starter code is required');
    if (!capsule.solutionCode) errors.push('Solution code is required');
    if (!capsule.testCases || capsule.testCases.length === 0) {
      errors.push('At least one test case is required');
    }

    // Warnings for best practices
    if (capsule.testCases && capsule.testCases.length < 3) {
      warnings.push('Consider adding more test cases for better coverage');
    }
    if (!capsule.hints || capsule.hints.length === 0) {
      warnings.push('Consider adding hints to help learners');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate that the solution code actually solves the problem
   */
  static async validateSolution(capsule: CodeCapsule): Promise<ValidationResult> {
    // TODO: Implement execution validation using Judge0
    throw new Error('CodeValidator.validateSolution() not yet implemented');
  }

  /**
   * Validate that starter code compiles but doesn't solve the problem
   */
  static async validateStarter(capsule: CodeCapsule): Promise<ValidationResult> {
    // TODO: Implement starter code validation
    throw new Error('CodeValidator.validateStarter() not yet implemented');
  }
}