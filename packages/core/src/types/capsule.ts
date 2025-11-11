export interface CapsuleMetadata {
  id: string;
  title: string;
  description: string;
  language: ProgrammingLanguage;
  difficulty: DifficultyLevel;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  creatorId: string;
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  hidden: boolean;
  orderIndex: number;
}

export interface Hint {
  id: string;
  hintText: string;
  orderIndex: number;
}

export interface CodeCapsule extends CapsuleMetadata {
  type: 'code';
  starterCode: string;
  solutionCode: string;
  testCases: TestCase[];
  hints: Hint[];
  timeLimit?: number; // in seconds
  memoryLimit?: number; // in MB
}

export interface QuizCapsule extends CapsuleMetadata {
  type: 'quiz';
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[]; // for multiple choice
  correctAnswer: string | number;
  explanation?: string;
}

export interface TerminalCapsule extends CapsuleMetadata {
  type: 'terminal';
  commands: TerminalCommand[];
  environment: TerminalEnvironment;
}

export interface TerminalCommand {
  command: string;
  expectedOutput?: string;
  description: string;
}

export interface TerminalEnvironment {
  image: string; // Docker image
  workingDirectory: string;
  environmentVariables?: Record<string, string>;
}

export interface DatabaseCapsule extends CapsuleMetadata {
  type: 'database';
  schema: DatabaseSchema;
  queries: DatabaseQuery[];
  sampleData: any[];
}

export interface DatabaseSchema {
  tables: DatabaseTable[];
}

export interface DatabaseTable {
  name: string;
  columns: DatabaseColumn[];
}

export interface DatabaseColumn {
  name: string;
  type: string;
  constraints: string[];
}

export interface DatabaseQuery {
  id: string;
  task: string;
  starterQuery: string;
  solutionQuery: string;
  explanation: string;
  difficulty: DifficultyLevel;
}

export interface SystemDesignCapsule extends CapsuleMetadata {
  type: 'system-design';
  scenario: string;
  requirements: string[];
  components: SystemComponent[];
  tradeoffs: SystemTradeoff[];
}

export interface SystemComponent {
  name: string;
  type: string;
  description: string;
  connections: string[];
}

export interface SystemTradeoff {
  aspect: string;
  options: string[];
  recommendation: string;
  reasoning: string;
}

export type Capsule = CodeCapsule | QuizCapsule | TerminalCapsule | DatabaseCapsule | SystemDesignCapsule;

export type ProgrammingLanguage = 
  | 'python' 
  | 'javascript' 
  | 'typescript'
  | 'java' 
  | 'cpp' 
  | 'go' 
  | 'rust' 
  | 'sql';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export type CapsuleType = 'code' | 'quiz' | 'terminal' | 'database' | 'system-design';