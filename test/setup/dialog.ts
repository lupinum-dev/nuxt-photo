// jsdom (30.x) has HTMLDialogElement but no showModal() or close(). Unit tests need only the
// open state and the close event; modality, inertness and focus run in the Playwright suite.
if (typeof HTMLDialogElement !== 'undefined' && !('showModal' in HTMLDialogElement.prototype)) {
  Object.assign(HTMLDialogElement.prototype, {
    showModal(this: HTMLDialogElement) {
      this.setAttribute('open', '')
    },
    close(this: HTMLDialogElement) {
      if (!this.hasAttribute('open')) return
      this.removeAttribute('open')
      this.dispatchEvent(new Event('close'))
    },
  })
}
