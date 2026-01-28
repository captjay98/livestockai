export const FEED_TYPES = [
    { value: 'starter', label: 'Starter Feed' },
    { value: 'grower', label: 'Grower Feed' },
    { value: 'finisher', label: 'Finisher Feed' },
    { value: 'layer_mash', label: 'Layer Mash' },
    { value: 'fish_feed', label: 'Fish Feed' },
] as const

export type FeedType = (typeof FEED_TYPES)[number]['value']
