<script setup lang="ts">
const galleryImages = [
  {
    src: 'https://images.unsplash.com/photo-1511300636408-a63a89df3482?w=900&h=1100&fit=crop',
    alt: 'Cliff path above the sea',
    caption: 'Cliff Path',
    width: 900,
    height: 1100,
  },
  {
    src: 'https://images.unsplash.com/photo-1511497584788-876760111969?w=900&h=1100&fit=crop',
    alt: 'Orange canyon walls',
    caption: 'Canyon',
    width: 900,
    height: 1100,
  },
  {
    src: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=900&h=1100&fit=crop',
    alt: 'River cutting through alpine woods',
    caption: 'Alpine River',
    width: 900,
    height: 1100,
  },
]
</script>

<template>
  <div>
    <!-- Caption: both -->
    <section class="section">
      <div class="section-header">
        <div>
          <p class="section-label">
            Caption Visible: both
          </p>
          <h2 class="section-title">
            Caption below + in lightbox
          </h2>
          <p class="section-description">
            Shows caption and description below the image and inside the lightbox overlay.
          </p>
        </div>
      </div>

      <PhotoLightboxImg
        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&h=900&fit=crop"
        alt="Fog over a mountain valley"
        caption="Mountain Fog"
        description="Morning mist drifting across a quiet alpine valley."
        :width="1400"
        :height="900"
        caption-visible="both"
      />
    </section>

    <!-- Caption: below only -->
    <section class="section">
      <div class="section-header">
        <div>
          <p class="section-label">
            Caption Visible: below
          </p>
          <h2 class="section-title">
            Caption below only
          </h2>
          <p class="section-description">
            Caption renders below the image but is hidden in the lightbox.
          </p>
        </div>
      </div>

      <PhotoLightboxImg
        src="https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=1800&h=1200&fit=crop"
        alt="Northern lights over a snowy landscape"
        caption="Aurora Borealis"
        description="This description only appears below the image."
        :width="1800"
        :height="1200"
        caption-visible="below"
      />
    </section>

    <!-- Caption: lightbox only -->
    <section class="section">
      <div class="section-header">
        <div>
          <p class="section-label">
            Caption Visible: lightbox
          </p>
          <h2 class="section-title">
            Caption in lightbox only
          </h2>
          <p class="section-description">
            No caption below the image. Open the lightbox to see the caption overlay.
          </p>
        </div>
      </div>

      <PhotoLightboxImg
        src="https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?w=2000&h=1000&fit=crop"
        alt="Desert panorama at golden hour"
        caption="Golden Desert"
        description="Only visible when you open the lightbox."
        :width="2000"
        :height="1000"
        caption-visible="lightbox"
      />
    </section>

    <!-- Lightbox disabled -->
    <section class="section">
      <div class="section-header">
        <div>
          <p class="section-label">
            Lightbox: false
          </p>
          <h2 class="section-title">
            Lightbox disabled
          </h2>
          <p class="section-description">
            Base PhotoImg now renders without any overlay ownership.
          </p>
        </div>
      </div>

      <PhotoImg
        src="https://images.unsplash.com/photo-1432405972618-c6b0cfba8b03?w=1200&h=1200&fit=crop"
        alt="Waterfall in a mossy gorge"
        caption="No lightbox"
        :width="1200"
        :height="1200"
        caption-visible="below"
      />
    </section>

    <!-- Grouped images -->
    <section class="section">
      <div class="section-header">
        <div>
          <p class="section-label">
            Gallery
          </p>
          <h2 class="section-title">
            Grouped images via PhotoGallery
          </h2>
          <p class="section-description">
            Grouped thumbnail flows now live in PhotoGallery. PhotoImg remains a single-image component.
          </p>
        </div>
      </div>

      <div class="group-grid">
        <PhotoGallery :items="galleryImages">
          <template #thumbnail="{ item, open, bindThumbnail }">
            <button
              :ref="bindThumbnail"
              class="gallery-thumb"
              type="button"
              @click="open"
            >
              <img
                :src="'src' in item ? String((item as Record<string, unknown>).msrc || item.src) : ''"
                :alt="'alt' in item ? String(item.alt) : ''"
                class="gallery-thumb__img"
              >
              <span class="gallery-thumb__caption">
                {{ 'caption' in item ? item.caption : '' }}
              </span>
            </button>
          </template>
        </PhotoGallery>
      </div>
    </section>
  </div>
</template>

<style scoped>
.group-grid {
  display: block;
}

.gallery-thumb {
  appearance: none;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: inherit;
  cursor: pointer;
  display: block;
  overflow: hidden;
  padding: 0;
  text-align: left;
  width: 100%;
}

.gallery-thumb__img {
  aspect-ratio: 9 / 11;
  display: block;
  object-fit: cover;
  width: 100%;
}

.gallery-thumb__caption {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 10px 12px;
}

@media (max-width: 640px) {
  .group-grid {
    display: block;
  }
}
</style>
