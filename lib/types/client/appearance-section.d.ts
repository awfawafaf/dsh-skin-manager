/**
 * Appearance settings section: the skin chips and the custom-background
 * library live here instead of the General section, mirroring the
 * GeneralSection pattern — the section column only stacks rows, so each
 * row draws its own internals. Declared at runtime by this section's
 * entry; the type lives here with the section.
 */
import type { PropsRenderSlots, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface SlotMap {
        /**
         * One preference row inside the Appearance section (the skin chips and
         * the custom-background library), contributed by the feature plugin
         * that owns the preference. Options: `id` (row key), `order` (row
         * position). Declared at runtime by this section's entry.
         */
        'settings.appearance.item': {
            kind: 'list';
            scope: 'root';
            owner: SettingsAppearanceItemOwnerProps;
        };
    }
}
/** Owner share of an Appearance row (the section supplies nothing). */
export interface SettingsAppearanceItemOwnerProps {
    /** Marker field: item owner props are intentionally empty. */
    children?: never;
}
/** Full component props: section owner share plus item render share. */
export type AppearanceSectionComponentProps = PropsRuntime<'settings.section'> & PropsRenderSlots<'settings.appearance.item'>;
/**
 * Render the Appearance section content column.
 * @param props - composed slot props (contract/slots.ts).
 * @returns the section element tree.
 */
export declare function AppearanceSection({ renderSlot }: AppearanceSectionComponentProps): import("react").JSX.Element;
