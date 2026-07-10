import type { PhotoItem } from '../types'

export type PhotoValidationIssueCode =
  | 'missing-id'
  | 'missing-src'
  | 'invalid-width'
  | 'invalid-height'
  | 'duplicate-id'
  | 'invalid-item'

export type PhotoValidationIssue = {
  readonly code: PhotoValidationIssueCode
  readonly owner: string
  readonly index: number
  readonly id?: string
  readonly message: string
}

export type InvalidPhotoPolicy = 'throw' | 'drop'

export type InvalidPhotosEvent = {
  readonly owner: string
  readonly issues: readonly PhotoValidationIssue[]
  readonly rawPhotos: readonly unknown[]
}

export type NormalizePhotosResult = {
  readonly photos: PhotoItem[]
  readonly issues: readonly PhotoValidationIssue[]
}

export type NormalizePhotosOptions = {
  owner: string
  onInvalid?: InvalidPhotoPolicy | 'return'
}

/** A structured public boundary error for invalid photo collections. */
export class PhotoValidationError extends Error {
  readonly owner: string
  readonly issues: readonly PhotoValidationIssue[]

  constructor(owner: string, issues: readonly PhotoValidationIssue[]) {
    super(issues.map((issue) => issue.message).join('\n'))
    this.name = 'PhotoValidationError'
    this.owner = owner
    this.issues = issues
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function isFinitePositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function createIssue(
  code: PhotoValidationIssueCode,
  owner: string,
  index: number,
  id: unknown,
  message: string,
): PhotoValidationIssue {
  const normalizedId = id === undefined || id === null ? undefined : String(id)
  return {
    code,
    owner,
    index,
    id: normalizedId,
    message: `${owner}: ${message}`,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function normalizePhotos(
  rawPhotos: readonly unknown[],
  options: NormalizePhotosOptions,
): NormalizePhotosResult {
  const onInvalid = options.onInvalid ?? 'throw'
  const issues: PhotoValidationIssue[] = []
  const candidates: Array<PhotoItem | null> = []
  const indexesById = new Map<string, number[]>()
  const invalidIndexes = new Set<number>()

  rawPhotos.forEach((rawPhoto, index) => {
    if (!isRecord(rawPhoto)) {
      issues.push(
        createIssue(
          'invalid-item',
          options.owner,
          index,
          undefined,
          `photo at index ${index} must be a plain object`,
        ),
      )
      invalidIndexes.add(index)
      candidates.push(null)
      return
    }

    const id = rawPhoto.id
    if (!isNonEmptyString(id)) {
      issues.push(
        createIssue(
          'missing-id',
          options.owner,
          index,
          id,
          `photo at index ${index} is missing a non-empty string id`,
        ),
      )
      invalidIndexes.add(index)
    } else {
      const indexes = indexesById.get(id) ?? []
      indexes.push(index)
      indexesById.set(id, indexes)
    }

    if (!isNonEmptyString(rawPhoto.src)) {
      issues.push(
        createIssue(
          'missing-src',
          options.owner,
          index,
          id,
          `photo "${String(id ?? '')}" is missing a non-empty src`,
        ),
      )
      invalidIndexes.add(index)
    }

    if (!isFinitePositiveNumber(rawPhoto.width)) {
      issues.push(
        createIssue(
          'invalid-width',
          options.owner,
          index,
          id,
          `photo "${String(id ?? '')}" has invalid width`,
        ),
      )
      invalidIndexes.add(index)
    }

    if (!isFinitePositiveNumber(rawPhoto.height)) {
      issues.push(
        createIssue(
          'invalid-height',
          options.owner,
          index,
          id,
          `photo "${String(id ?? '')}" has invalid height`,
        ),
      )
      invalidIndexes.add(index)
    }

    candidates.push(rawPhoto as unknown as PhotoItem)
  })

  for (const [id, indexes] of indexesById) {
    if (indexes.length < 2) continue
    for (const index of indexes) {
      issues.push(
        createIssue(
          'duplicate-id',
          options.owner,
          index,
          id,
          `duplicate photo id "${id}" used at indexes ${indexes.join(', ')}`,
        ),
      )
      invalidIndexes.add(index)
    }
  }

  if (issues.length > 0 && onInvalid === 'throw') {
    throw new PhotoValidationError(options.owner, issues)
  }

  return {
    photos: candidates.filter(
      (photo, index): photo is PhotoItem =>
        photo !== null &&
        !(
          issues.length > 0 &&
          onInvalid === 'drop' &&
          invalidIndexes.has(index)
        ),
    ),
    issues,
  }
}
