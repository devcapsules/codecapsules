/**
 * Dataset Injection for Piston Execution
 *
 * When a student runs Python code that uses our Universal Datasets,
 * we need the CSV files to be present in the Piston job sandbox.
 *
 * The datasets are baked into the custom Piston Docker image at /piston/datasets/.
 * This module intercepts Python payloads and wraps them in a Bash script
 * that copies the datasets into the ephemeral sandbox before execution.
 *
 * Flow:
 *   1. Only apply to Python executions
 *   2. Find the main .py file in the payload
 *   3. Heuristic: only inject if the code references a .csv file
 *   4. Transform to bash: run_lab.sh copies datasets + runs python3
 *
 * This is transparent to the student — they just write `pd.read_csv('...')`.
 */

/**
 * Intercepts Python execution payloads and wraps them in a Bash script
 * to inject universal datasets into the ephemeral Piston sandbox.
 */
export function wrapWithDatasetInjection(pistonPayload: any) {
  // 1. Only apply this to Python executions
  if (pistonPayload.language !== 'python' && pistonPayload.language !== 'python3') {
    return pistonPayload;
  }

  // 2. Find the main Python file in the payload
  const mainFile = pistonPayload.files.find((f: any) =>
    f.name === pistonPayload.main || f.name.endsWith('.py')
  );

  if (!mainFile) return pistonPayload;

  // 3. Heuristic: Only inject if the code actually looks for a CSV
  // (Saves a few milliseconds on basic "Hello World" algorithms)
  const needsDataset = mainFile.content.includes('.csv');
  if (!needsDataset) return pistonPayload;

  // 4. Transform the payload into a Bash execution
  return {
    ...pistonPayload,
    language: 'bash',
    version: '5.1.0', // Default bash version in Piston
    files: [
      {
        name: 'run_lab.sh',
        // The 2>/dev/null || true ensures the script doesn't crash if the folder is empty
        content: `#!/bin/bash\n\n# Inject read-only datasets into ephemeral job folder\ncp /piston/datasets/*.csv . 2>/dev/null || true\n\n# Run the student's Python code\npython3 ${mainFile.name}`,
      },
      ...pistonPayload.files,
    ],
    // Tell Piston to execute the bash script instead of the Python file directly
    main: 'run_lab.sh',
    // Bump limits for data analysis workloads
    run_timeout: Math.max(pistonPayload.run_timeout || 3000, 10000),
    run_memory_limit: Math.max(pistonPayload.run_memory_limit || 0, 256 * 1024 * 1024),
  };
}
