import { isAbsolute, win32 } from 'node:path'

const localProtocol = /^(?:file|link|portal|workspace):/i
const allowedRegistryProtocol = /^(?:catalog|npm):/i
const dependencyProtocol = /^[a-z][a-z+.-]*:/i
const repositoryShorthand = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:#.*)?$/
const scpStyleGitReference = /^[^@\s]+@[^:\s]+:.+/
const localPathInText =
  /(?:file:\/\/|\/(?:Users|home|private\/tmp|tmp)\/|[A-Za-z]:\\|\\\\[^\\]+\\[^\\]+)/

export function isLocalDependencyReference(value) {
  const reference = String(value).trim()
  return localProtocol.test(reference) || isAbsolute(reference) || win32.isAbsolute(reference)
}

export function isNonRegistryDependencyReference(value) {
  const reference = String(value).trim()
  if (allowedRegistryProtocol.test(reference)) {
    return false
  }

  return (
    isLocalDependencyReference(reference) ||
    dependencyProtocol.test(reference) ||
    repositoryShorthand.test(reference) ||
    scpStyleGitReference.test(reference)
  )
}

export function containsLocalFilesystemPath(content, repositoryRoot) {
  return content.includes(repositoryRoot) || localPathInText.test(content)
}
