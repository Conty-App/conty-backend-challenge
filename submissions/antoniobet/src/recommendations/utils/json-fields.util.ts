export function tagsToJson(tags: string[]): string {
  return JSON.stringify(tags);
}

export function tagsFromJson(json: string): string[] {
  try {
    const parsed: unknown = JSON.parse(json);
    if (
      Array.isArray(parsed) &&
      parsed.every((item) => typeof item === 'string')
    ) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}
