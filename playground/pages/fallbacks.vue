<script setup lang="ts">
const controlImage = {
  src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1800&h=1200&fit=crop',
  thumbnailSrc: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&h=600&fit=crop',
  alt: 'Mountain ridge above a foggy valley',
  caption: 'Trusted metadata',
  description: 'Expected behavior: full zoom transition.',
  width: 1800,
  height: 1200,
}

const missingDimsImage = {
  src: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1800&h=1200&fit=crop',
  thumbnailSrc: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=900&h=600&fit=crop',
  alt: 'Road winding through a green mountain valley',
  caption: 'Missing width/height',
  description: 'Expected behavior: graceful fade/scale instead of a broken zoom.',
}

const mismatchedImage = {
  src: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1800&h=1200&fit=crop',
  thumbnailSrc: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&h=600&fit=crop',
  alt: 'Snow covered mountain peak against a pale sky',
  caption: 'Wrong aspect metadata',
  description: 'Declared dimensions are intentionally wrong to force the fallback path.',
  width: 1200,
  height: 1200,
}

const edgeImage = {
  src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1800&h=1200&fit=crop',
  thumbnailSrc: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&h=600&fit=crop',
  alt: 'Aerial view of bright ocean waves',
  caption: 'Mostly offscreen trigger',
  description: 'Expected behavior: graceful fade/scale because the source thumbnail is not sufficiently visible.',
  width: 1800,
  height: 1200,
}
</script>

<template>
  <div>
    <section class="section">
      <div class="section-header">
        <div>
          <p class="section-label">
            Graceful Fallbacks
          </p>
          <h1 class="section-title fallback-title">
            Open transitions with weak metadata
          </h1>
          <p class="section-description fallback-lead">
            These examples exercise the new preflight logic directly. Compare the trusted zoom case with the fallback cases below.
          </p>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <div>
          <p class="section-label">
            Control
          </p>
          <h2 class="section-title">
            Trusted thumbnail geometry keeps zoom
          </h2>
          <p class="section-description">
            The trigger has real dimensions, a matching aspect ratio, and a separate thumbnail source.
          </p>
        </div>
        <span class="expectation expectation--zoom">Expected: zoom</span>
      </div>

      <PhotoImg
        :src="controlImage.src"
        :thumbnail-src="controlImage.thumbnailSrc"
        :alt="controlImage.alt"
        :caption="controlImage.caption"
        :description="controlImage.description"
        :width="controlImage.width"
        :height="controlImage.height"
      />
    </section>

    <section class="section">
      <div class="section-header">
        <div>
          <p class="section-label">
            Fallback
          </p>
          <h2 class="section-title">
            Missing dimensions
          </h2>
          <p class="section-description">
            Width and height are omitted on purpose. The opener should avoid zoom and fall back cleanly.
          </p>
        </div>
        <span class="expectation expectation--fade">Expected: graceful fade</span>
      </div>

      <PhotoImg
        :src="missingDimsImage.src"
        :thumbnail-src="missingDimsImage.thumbnailSrc"
        :alt="missingDimsImage.alt"
        :caption="missingDimsImage.caption"
        :description="missingDimsImage.description"
      />
    </section>

    <section class="section">
      <div class="section-header">
        <div>
          <p class="section-label">
            Fallback
          </p>
          <h2 class="section-title">
            Declared aspect ratio is wrong
          </h2>
          <p class="section-description">
            The thumbnail is landscape, but the declared metadata says square. This should downgrade to the fallback path.
          </p>
        </div>
        <span class="expectation expectation--fade">Expected: graceful fade</span>
      </div>

      <PhotoImg
        :src="mismatchedImage.src"
        :thumbnail-src="mismatchedImage.thumbnailSrc"
        :alt="mismatchedImage.alt"
        :caption="mismatchedImage.caption"
        :description="mismatchedImage.description"
        :width="mismatchedImage.width"
        :height="mismatchedImage.height"
      />
    </section>

    <section class="section">
      <div class="section-header">
        <div>
          <p class="section-label">
            Fallback
          </p>
          <h2 class="section-title">
            Trigger is mostly offscreen
          </h2>
          <p class="section-description">
            This image is intentionally pushed past the left viewport edge. Click it there and the opener should avoid a bad zoom.
          </p>
        </div>
        <span class="expectation expectation--fade">Expected: graceful fade</span>
      </div>

      <div class="edge-bleed">
        <div class="edge-card">
          <PhotoImg
            :src="edgeImage.src"
            :thumbnail-src="edgeImage.thumbnailSrc"
            :alt="edgeImage.alt"
            :caption="edgeImage.caption"
            :description="edgeImage.description"
            :width="edgeImage.width"
            :height="edgeImage.height"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.fallback-title {
  font-size: clamp(1.35rem, 3vw, 1.75rem);
}

.fallback-lead {
  max-width: 56ch;
}

.expectation {
  align-self: flex-start;
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 8px 12px;
  text-transform: uppercase;
}

.expectation--zoom {
  background: rgba(13, 148, 136, 0.12);
  border-color: rgba(13, 148, 136, 0.24);
  color: var(--accent-hover);
}

.expectation--fade {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.18);
  color: #1d4ed8;
}

.edge-bleed {
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  overflow: hidden;
  padding: 0 0 0 0;
}

.edge-card {
  max-width: 420px;
  transform: translateX(-72px);
}

@media (max-width: 640px) {
  .edge-card {
    max-width: calc(100vw - 24px);
    transform: translateX(-48px);
  }
}
</style>
