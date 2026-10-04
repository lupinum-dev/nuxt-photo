---
'@lupinum/vue-photo': major
'@lupinum/nuxt-photo': major
---

Replace image adapters with PhotoProvider and definePhotoProvider. Remove imageAdapter props and ImageAdapter, ImageSource and ImageContext types. Providers resolve URLs; each layout owns image sizes and the core caps and deduplicates width candidates.

Remove nuxtPhoto.image. Configure quality, format, screens and densities through Nuxt Image, and select a named provider with nuxtPhoto.provider or a component provider prop. Nuxt Image is detected automatically; native images remain the default without it.
