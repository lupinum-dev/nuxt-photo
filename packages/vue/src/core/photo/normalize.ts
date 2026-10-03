import type { PhotoItem } from '../types'

export type PhotoValidationIssueCode =
  | 'missing-id'
  | 'missing-src'
  | 'invalid-width'
  | 'invalid-height'
  | 'duplicate-id'
  | 'invalid-item'
  | 'invalid-optional-field'
  | 'invalid-meta'

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

export type NormalizePhotosResult<TMeta extends object = Readonly<Record<string, unknown>>> = {
  readonly photos: PhotoItem<TMeta>[]
  readonly issues: readonly PhotoValidationIssue[]
}

export type NormalizePhotosOptions = {
  owner: string
  resolveDimensions?: ((src: string) => { width: number; height: number } | undefined) | null
  onInvalid?: InvalidPhotoPolicy | 'return'
}

const PHOTO_DATA_HELP = 'https://nuxt-photo.lupinum.com/docs/help/troubleshooting'

/** A structured public boundary error for invalid photo collections. */
export class PhotoValidationError extends Error {
  readonly owner: string
  readonly issues: readonly PhotoValidationIssue[]

  constructor(owner: string, issues: readonly PhotoValidationIssue[]) {
    super([...issues.map((issue) => issue.message), `See ${PHOTO_DATA_HELP}`].join('\n'))
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
  includeOwner = true,
): PhotoValidationIssue {
  const normalizedId = id === undefined || id === null ? undefined : String(id)
  return {
    code,
    owner,
    index,
    id: normalizedId,
    message: includeOwner ? `${owner}: ${message}` : message,
  }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

export function normalizePhotos<TMeta extends object = Readonly<Record<string, unknown>>>(
  rawPhotos: readonly unknown[],
  options: NormalizePhotosOptions,
): NormalizePhotosResult<TMeta> {
  const onInvalid = options.onInvalid ?? 'throw'
  const issues: PhotoValidationIssue[] = []
  const candidates: Array<PhotoItem<TMeta> | null> = []
  const indexesById = new Map<string, number[]>()
  const invalidIndexes = new Set<number>()

  rawPhotos.forEach((rawPhoto, index) => {
    if (!isPlainRecord(rawPhoto)) {
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

    let photo = rawPhoto
    if (photo.width == null && photo.height == null && typeof photo.src === 'string') {
      const dimensions = options.resolveDimensions?.(photo.src)
      if (dimensions) photo = { ...photo, width: dimensions.width, height: dimensions.height }
    }

    const id = photo.id
    if (!isNonEmptyString(id)) {
      issues.push(
        createIssue(
          'missing-id',
          options.owner,
          index,
          id,
          `photo at index ${index} is missing a non-empty string id; use a stable ID from your data, not the array index`,
        ),
      )
      invalidIndexes.add(index)
    } else {
      const indexes = indexesById.get(id) ?? []
      indexes.push(index)
      indexesById.set(id, indexes)
    }

    if (!isNonEmptyString(photo.src)) {
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

    if (!isFinitePositiveNumber(photo.width)) {
      issues.push(
        createIssue(
          'invalid-width',
          options.owner,
          index,
          id,
          photo.width == null
            ? `photo "${String(id ?? '')}" has no width; pass width and height, or in Nuxt use localImages / usePhotoFolder for files in public/`
            : `photo "${String(id ?? '')}" has invalid width ${String(photo.width)}; use the real pixel width of the image file`,
          photo.width != null,
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
          id,
          photo.height == null
            ? `photo "${String(id ?? '')}" has no height; pass width and height, or in Nuxt use localImages / usePhotoFolder for files in public/`
            : `photo "${String(id ?? '')}" has invalid height ${String(photo.height)}; use the real pixel height of the image file`,
          photo.height != null,
        ),
      )
      invalidIndexes.add(index)
    }

    for (const field of [
      'thumbSrc',
      'placeholderSrc',
      'alt',
      'caption',
      'description',
      'srcset',
    ] as const) {
      const value = rawPhoto[field]
      if (value !== undefined && typeof value !== 'string') {
        issues.push(
          createIssue(
            'invalid-optional-field',
            options.owner,
            index,
            id,
            `photo "${String(id ?? '')}" field "${field}" must be a string`,
          ),
        )
        invalidIndexes.add(index)
      }
    }

    if (photo.meta !== undefined && (typeof photo.meta !== 'object' || photo.meta === null)) {
      issues.push(
        createIssue(
          'invalid-meta',
          options.owner,
          index,
          id,
          `photo "${String(id ?? '')}" field "meta" must be an object`,
        ),
      )
      invalidIndexes.add(index)
    }

    // Every consumed field has been checked above; preserve unknown app fields.
    candidates.push(photo as unknown as PhotoItem<TMeta>)
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
          `duplicate photo id "${id}" used at indexes ${indexes.join(', ')}; IDs must be unique in one collection`,
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
      (photo, index): photo is PhotoItem<TMeta> =>
        photo !== null && !(issues.length > 0 && onInvalid === 'drop' && invalidIndexes.has(index)),
    ),
    issues,
  }
}

/** Validate and return valid photos without throwing or modifying the input. */
export function validatePhotos(
  input: unknown[],
  options?: { owner?: string },
): { photos: PhotoItem[]; issues: PhotoValidationIssue[] } {
  const result = normalizePhotos(input, {
    owner: options?.owner ?? 'validatePhotos',
    onInvalid: 'drop',
  })
  return { photos: result.photos, issues: [...result.issues] }
}
