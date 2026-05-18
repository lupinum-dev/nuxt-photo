import { photoId, type PhotoItem, type PhotoMapper } from '../types'

export type PhotoValidationIssueCode =
  | 'missing-id'
  | 'missing-src'
  | 'invalid-width'
  | 'invalid-height'
  | 'duplicate-id'

export type PhotoValidationIssue = {
  code: PhotoValidationIssueCode
  owner: string
  index: number
  id?: string
  message: string
}

export type NormalizePhotosResult = {
  photos: PhotoItem[]
  issues: PhotoValidationIssue[]
}

export type NormalizePhotosOptions<T = unknown> = {
  owner: string
  mapper?: PhotoMapper<T>
  onInvalid?: 'throw' | 'drop' | 'return'
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
  photo: Partial<PhotoItem>,
  message: string,
): PhotoValidationIssue {
  const id =
    photo.id === undefined || photo.id === null ? undefined : String(photo.id)
  return { code, owner, index, id, message: `${owner}: ${message}` }
}

export function normalizePhotos<T = unknown>(
  rawPhotos: readonly T[],
  options: NormalizePhotosOptions<T>,
): NormalizePhotosResult {
  const onInvalid = options.onInvalid ?? 'throw'
  const issues: PhotoValidationIssue[] = []
  const mapped = rawPhotos.map((item, index) =>
    options.mapper ? options.mapper(item, index, rawPhotos as T[]) : item,
  ) as PhotoItem[]
  const seen = new Map<string, number>()
  const invalidIndexes = new Set<number>()

  mapped.forEach((photo, index) => {
    if (photo.id === undefined || photo.id === null || photoId(photo) === '') {
      issues.push(
        createIssue(
          'missing-id',
          options.owner,
          index,
          photo,
          `photo at index ${index} is missing a non-empty id`,
        ),
      )
      invalidIndexes.add(index)
    }

    if (!isNonEmptyString(photo.src)) {
      issues.push(
        createIssue(
          'missing-src',
          options.owner,
          index,
          photo,
          `photo "${photoId(photo)}" is missing a non-empty src`,
        ),
      )
      invalidIndexes.add(index)
    }

    if (!isFinitePositiveNumber(photo.width)) {
      issues.push(
        createIssue(
          'invalid-width',
          options.owner,
          index,
          photo,
          `photo "${photoId(photo)}" has invalid width`,
        ),
      )
      invalidIndexes.add(index)
    }

    if (!isFinitePositiveNumber(photo.height)) {
      issues.push(
        createIssue(
          'invalid-height',
          options.owner,
          index,
          photo,
          `photo "${photoId(photo)}" has invalid height`,
        ),
      )
      invalidIndexes.add(index)
    }

    const id = photoId(photo)
    const previousIndex = seen.get(id)
    if (previousIndex !== undefined) {
      issues.push(
        createIssue(
          'duplicate-id',
          options.owner,
          index,
          photo,
          `duplicate photo id "${id}" also used at index ${previousIndex}`,
        ),
      )
      invalidIndexes.add(index)
      invalidIndexes.add(previousIndex)
    }
    seen.set(id, index)
  })

  if (issues.length > 0 && onInvalid === 'throw') {
    throw new Error(issues.map((issue) => issue.message).join('\n'))
  }

  return {
    photos:
      issues.length > 0 && onInvalid === 'drop'
        ? mapped.filter((_, index) => !invalidIndexes.has(index))
        : mapped,
    issues,
  }
}
