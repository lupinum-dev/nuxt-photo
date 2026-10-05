/** Trim only boundary slashes; interior path separators must remain unchanged. */
export function trimFolderSlashes(folder: string): string {
  let start = 0
  let end = folder.length
  while (start < end && folder[start] === '/') start++
  while (end > start && folder[end - 1] === '/') end--
  return folder.slice(start, end)
}
