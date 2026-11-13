export const subjectPath = (subjectId: string) => `/learn/s/${subjectId}`
export const itemPath = (subjectId: string, itemId: string) => `/learn/s/${subjectId}/${itemId}`
export const searchPath = (q: string) => `/learn/search?q=${encodeURIComponent(q)}`
