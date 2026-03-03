/**
 * Universal Dataset Catalog — Schema Dictionary for Data Analysis Capsules
 *
 * This module defines the pre-baked datasets available in the Piston execution
 * environment. Instead of sending full CSVs over the wire on every request,
 * we inject only the **schema** (column names, types, 1 sample row) into the
 * AI agent system prompts.
 *
 * WHY:
 * - Token-efficient: ~50 tokens per dataset vs. millions for the full CSV
 * - AI can write accurate test cases because it knows exact column names & types
 * - Students run real 10K-row datasets in Piston → authentic data-science feel
 *
 * DATASETS:
 * 1. apple_global_sales_dataset.csv  — Corporate tech sales (10K rows)
 * 2. spotify-tracks-dataset.csv      — Music audio features (114K rows)
 *
 * USAGE:
 * - Injected into Pedagogist & Coder agent prompts when language is "python" or "sql"
 * - The actual CSV files live inside the Piston Docker image at /app/
 * - For Piston delivery: fetched from R2/CDN and injected as additional files[]
 */

// ══════════════════════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════════════════════

export interface DatasetColumn {
  name: string;
  type: 'string' | 'int' | 'float' | 'boolean';
  description: string;
}

export interface UniversalDataset {
  dataset_name: string;
  description: string;
  columns: DatasetColumn[];
  sample_row: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// Dataset Catalog
// ══════════════════════════════════════════════════════════════════════════════

export const UNIVERSAL_DATASETS: UniversalDataset[] = [
  {
    dataset_name: 'apple_global_sales_dataset.csv',
    description:
      'Global corporate sales data for a major tech company. Excellent for multi-dimensional analysis, time-series (quarters/months), currency conversion logic, and customer segmentation.',
    columns: [
      { name: 'sale_id', type: 'string', description: 'Unique sale identifier' },
      { name: 'sale_date', type: 'string', description: 'Date in YYYY-MM-DD format' },
      { name: 'year', type: 'int', description: 'Year of sale' },
      { name: 'quarter', type: 'string', description: 'Financial quarter (Q1, Q2, etc.)' },
      { name: 'month', type: 'string', description: 'Month name' },
      { name: 'country', type: 'string', description: 'Country of sale' },
      { name: 'region', type: 'string', description: 'Global region (e.g., South America, Asia)' },
      { name: 'city', type: 'string', description: 'City of sale' },
      { name: 'product_name', type: 'string', description: 'Specific product model' },
      { name: 'category', type: 'string', description: 'Product category (Mac, AirPods, Accessories, etc.)' },
      { name: 'storage', type: 'string', description: "Storage capacity (Contains 'N/A' for non-storage items)" },
      { name: 'color', type: 'string', description: 'Product color' },
      { name: 'unit_price_usd', type: 'float', description: 'Base price in USD' },
      { name: 'discount_pct', type: 'int', description: 'Discount applied as a percentage (0-100)' },
      { name: 'units_sold', type: 'int', description: 'Quantity sold' },
      { name: 'discounted_price_usd', type: 'float', description: 'Price after discount per unit' },
      { name: 'revenue_usd', type: 'float', description: 'Total revenue in USD' },
      { name: 'currency', type: 'string', description: 'Local currency code (e.g., ARS, VND)' },
      { name: 'fx_rate_to_usd', type: 'float', description: 'Exchange rate used' },
      { name: 'revenue_local_currency', type: 'float', description: 'Total revenue in local currency' },
      { name: 'sales_channel', type: 'string', description: 'Where the sale occurred (e.g., Online, Third-Party)' },
      { name: 'payment_method', type: 'string', description: 'Payment type' },
      { name: 'customer_segment', type: 'string', description: 'Individual, Business, Government, etc.' },
      { name: 'customer_age_group', type: 'string', description: "Age bracket (e.g., '18-24', '45-54')" },
      { name: 'previous_device_os', type: 'string', description: "Prior OS (contains 'N/A' frequently)" },
      { name: 'customer_rating', type: 'float', description: 'Rating out of 5. Contains null/blank values.' },
      { name: 'return_status', type: 'string', description: "'Kept' or 'Returned'" },
    ],
    sample_row:
      'APPL-00000001,2022-01-03,2022,Q1,January,Argentina,South America,Buenos Aires,AirPods (3rd Gen),AirPods,N/A,Starlight,159.27,7,1,148.12,148.12,ARS,907.0,134344.84,Third-Party Retailer,Cash,Government,45–54,N/A,4.1,Kept',
  },
  {
    dataset_name: 'spotify-tracks-dataset.csv',
    description:
      'Massive dataset of Spotify tracks with audio features. Perfect for teaching correlation, sorting, boolean masking, and statistical features (mean, std).',
    columns: [
      { name: 'Unnamed: 0', type: 'int', description: 'Original index column (should often be dropped during cleaning)' },
      { name: 'track_id', type: 'string', description: 'Unique Spotify ID for the track' },
      { name: 'artists', type: 'string', description: 'Artist names (multiple artists are separated by semicolons)' },
      { name: 'album_name', type: 'string', description: 'Name of the album' },
      { name: 'track_name', type: 'string', description: 'Name of the song' },
      { name: 'popularity', type: 'int', description: 'Spotify popularity metric (0 to 100)' },
      { name: 'duration_ms', type: 'int', description: 'Track length in milliseconds' },
      { name: 'explicit', type: 'boolean', description: 'True if the track has explicit lyrics' },
      { name: 'danceability', type: 'float', description: 'Score from 0.0 to 1.0 indicating how suitable a track is for dancing' },
      { name: 'energy', type: 'float', description: 'Score from 0.0 to 1.0 indicating intensity and activity' },
      { name: 'key', type: 'int', description: 'The key the track is in (0 = C, 1 = C#, etc.)' },
      { name: 'loudness', type: 'float', description: 'Overall loudness of a track in decibels (dB)' },
      { name: 'mode', type: 'int', description: 'Major (1) or minor (0)' },
      { name: 'speechiness', type: 'float', description: 'Presence of spoken words in a track' },
      { name: 'acousticness', type: 'float', description: 'Confidence measure from 0.0 to 1.0 of whether the track is acoustic' },
      { name: 'instrumentalness', type: 'float', description: 'Predicts whether a track contains no vocals' },
      { name: 'liveness', type: 'float', description: 'Detects the presence of an audience in the recording' },
      { name: 'valence', type: 'float', description: 'Positivity of the track (0.0 to 1.0)' },
      { name: 'tempo', type: 'float', description: 'Beats per minute (BPM)' },
      { name: 'time_signature', type: 'int', description: 'Estimated overall time signature (e.g., 4 for 4/4 time)' },
      { name: 'track_genre', type: 'string', description: 'The genre the track belongs to' },
    ],
    sample_row:
      '0,5SuOikwiRyPMVoIQDJUgSV,Gen Hoshino,Comedy,Comedy,73,230666,False,0.676,0.461,1,-6.746,0,0.143,0.0322,1.01e-06,0.358,0.715,87.917,4,acoustic',
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// Prompt Injection Helpers
// ══════════════════════════════════════════════════════════════════════════════

/** Languages that trigger dataset injection */
const DATA_ANALYSIS_LANGUAGES = ['python', 'sql'];

/**
 * Check if a language/prompt combination should use universal datasets.
 * Returns true for Python (Pandas) and SQL capsules.
 */
export function isDataAnalysisContext(language: string, userPrompt?: string): boolean {
  const lang = language.toLowerCase();

  // Always inject for SQL
  if (lang === 'sql') return true;

  // For Python, inject when prompt suggests data analysis
  if (lang === 'python') {
    if (!userPrompt) return false;
    const lower = userPrompt.toLowerCase();
    const dataKeywords = [
      'pandas', 'dataframe', 'csv', 'data analysis', 'data science',
      'dataset', 'columns', 'rows', 'filter', 'groupby', 'group by',
      'aggregate', 'merge', 'join', 'pivot', 'correlation',
      'statistics', 'mean', 'median', 'std', 'plot', 'chart',
      'visualization', 'matplotlib', 'seaborn', 'numpy',
      'sales', 'revenue', 'spotify', 'apple', 'tracks', 'songs',
      'top-selling', 'top selling', 'analyze', 'analysis',
      'ecommerce', 'e-commerce', 'demographics',
      'data cleaning', 'data wrangling', 'exploratory',
    ];
    return dataKeywords.some(kw => lower.includes(kw));
  }

  return false;
}

/**
 * Build the dataset catalog block to inject into AI agent system prompts.
 * Returns formatted Markdown-style text ready for prompt concatenation.
 */
export function buildDatasetCatalogPrompt(): string {
  const sections = UNIVERSAL_DATASETS.map((ds, i) => {
    const columnList = ds.columns
      .map(col => `  - \`${col.name}\` (${col.type}): ${col.description}`)
      .join('\n');

    return `**Dataset ${i + 1}: \`${ds.dataset_name}\`**
${ds.description}

Columns:
${columnList}

Sample row:
\`${ds.sample_row}\``;
  });

  return `
=== UNIVERSAL DATASET CATALOG ===
You MUST use one of the following pre-loaded datasets already present in the execution environment.
The student can load them directly with: df = pd.read_csv('filename.csv')
Do NOT generate fake/mock data. Use the real column names and types below.

${sections.join('\n\n')}

=== END DATASET CATALOG ===`;
}

/**
 * Build a compact schema-only reference (for tighter token budgets).
 * Used by the Debugger agent or when context windows are limited.
 */
export function buildCompactDatasetSchema(): string {
  return UNIVERSAL_DATASETS.map(ds => {
    const cols = ds.columns.map(c => `${c.name}:${c.type}`).join(', ');
    return `${ds.dataset_name} → [${cols}]`;
  }).join('\n');
}

/**
 * Get the list of dataset filenames for Piston file injection.
 */
export function getDatasetFilenames(): string[] {
  return UNIVERSAL_DATASETS.map(ds => ds.dataset_name);
}
