/**
 * Converts a textarea string (one bullet per line) into a features array.
 * Trims each line, drops blank lines.
 */
export function parseFeaturesInput(raw: string): string[] {
  return raw.split('\n').map(line => line.trim()).filter(line => line.length > 0)
}
