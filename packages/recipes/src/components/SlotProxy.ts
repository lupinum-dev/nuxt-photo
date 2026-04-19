import { defineComponent, type PropType } from 'vue'

/** Internal helper to render injected slot functions without cryptic `<component :is="() => ...">` patterns. */
export default defineComponent({
  name: 'SlotProxy',
  props: {
    // `any` on the parameter is required so callers can pass specifically-typed
    // renderers (e.g. `(p: LightboxControlsSlotProps) => VNode`) without contravariance errors.
    render: { type: Function as PropType<(props: any) => unknown>, required: true },
    props: { type: Object as PropType<Record<string, unknown>>, default: () => ({}) },
  },
  setup(props) {
    return () => typeof props.render === 'function' ? props.render(props.props) : null
  },
})
