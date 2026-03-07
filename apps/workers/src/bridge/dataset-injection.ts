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
 * Intercepts Python execution payloads and prepends a shutil-based preamble
 * that copies universal datasets from /piston/datasets/ into the sandbox cwd.
 *
 * We stay in the Python runtime (no bash) because the custom Piston image
 * only has c, c++, java, javascript, and python runtimes installed.
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
  const needsDataset = mainFile.content.includes('.csv');
  if (!needsDataset) return pistonPayload;

  // 4. Prepend a Python preamble that symlinks CSVs into cwd
  // CSVs live at /piston/packages/python/3.10.0/datasets/ because Piston's nsjail
  // sandbox only mounts /piston/packages/ — anything outside is invisible to jobs.
  // We use symlinks instead of copies because the sandbox tmpfs is too small for
  // the 20MB Spotify dataset.
  const preamble = [
    '# === Dataset injection preamble (auto-injected) ===',
    'import os as _os',
    '_DATASET_DIR = "/piston/packages/python/3.10.0/datasets"',
    'if _os.path.isdir(_DATASET_DIR):',
    '    for _f in _os.listdir(_DATASET_DIR):',
    '        if _f.endswith(".csv") and not _os.path.exists(_f):',
    '            _os.symlink(_os.path.join(_DATASET_DIR, _f), _f)',
    '# === End preamble ===',
    '',
  ].join('\n');

  // Patch the main file content in-place (keep Python runtime)
  const patchedFiles = pistonPayload.files.map((f: any) => {
    if (f === mainFile) {
      return { ...f, content: preamble + f.content };
    }
    return f;
  });

  return {
    ...pistonPayload,
    files: patchedFiles,
    // Don't override timeout/memory — honour whatever the caller or Piston default provides.
    // Piston's server-side limit is the real cap; exceeding it causes a 400.
  };
}
