export default defineEventHandler(async (event) => {
  const file = getRouterParam(event, 'file') ?? ''
  if (!/^[\w-]+\.(jpg|jpeg|png|gif|svg)$/.test(file)) throw createError({ statusCode: 404 })
  const data = await useStorage('assets:lab').getItemRaw<Buffer>(file)
  if (!data) throw createError({ statusCode: 404 })
  const extension = file.split('.').at(-1)!
  setHeader(
    event,
    'content-type',
    `image/${extension === 'svg' ? 'svg+xml' : extension === 'jpg' ? 'jpeg' : extension}`,
  )
  setHeader(event, 'cache-control', 'public, max-age=31536000, immutable')
  return data
})
