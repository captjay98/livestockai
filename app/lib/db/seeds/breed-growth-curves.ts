/**
 * Breed-Specific Growth Curves
 *
 * Growth data based on official breed performance standards:
 * - Cobb 500: Cobb Broiler Performance & Nutrition Supplement (2022)
 * - Ross 308: Aviagen Ross 308 Performance Objectives (2022)
 * - Arbor Acres: Aviagen Arbor Acres Performance Objectives (2019)
 * - Hy-Line Brown: Hy-Line Brown Commercial Management Guide (2021)
 * - Lohmann Brown: Lohmann Brown Management Guide (2018)
 * - Clarias gariepinus: FAO Aquaculture Feed Resources (2020)
 * - Channel Catfish: USDA Catfish Production Guide (2019)
 * - Nile Tilapia: WorldFish Tilapia Growth Standards (2020)
 * - Red Tilapia: FAO Red Tilapia Culture Manual (2018)
 */

interface GrowthPoint {
    day: number
    expected_weight_g: number
}

interface BreedGrowthCurve {
    breedName: string
    species: string
    data: Array<GrowthPoint>
}

/**
 * Cobb 500 Growth Curve (Male, As-Hatched, Standard Nutrition)
 * Source: Cobb500 Broiler Performance & Nutrition Supplement 2022
 */
export const COBB_500_GROWTH: BreedGrowthCurve = {
    breedName: 'cobb_500',
    species: 'Broiler',
    data: [
        { day: 0, expected_weight_g: 42 },
        { day: 7, expected_weight_g: 169 },
        { day: 14, expected_weight_g: 442 },
        { day: 21, expected_weight_g: 883 },
        { day: 28, expected_weight_g: 1476 },
        { day: 35, expected_weight_g: 2193 },
        { day: 42, expected_weight_g: 2977 },
        { day: 49, expected_weight_g: 3809 },
        { day: 56, expected_weight_g: 4677 },
    ],
}

/**
 * Ross 308 Growth Curve (Male, As-Hatched, Standard Nutrition)
 * Source: Aviagen Ross 308 Performance Objectives 2022
 */
export const ROSS_308_GROWTH: BreedGrowthCurve = {
    breedName: 'ross_308',
    species: 'Broiler',
    data: [
        { day: 0, expected_weight_g: 42 },
        { day: 7, expected_weight_g: 175 },
        { day: 14, expected_weight_g: 464 },
        { day: 21, expected_weight_g: 925 },
        { day: 28, expected_weight_g: 1533 },
        { day: 35, expected_weight_g: 2269 },
        { day: 42, expected_weight_g: 3066 },
        { day: 49, expected_weight_g: 3913 },
        { day: 56, expected_weight_g: 4798 },
    ],
}

/**
 * Arbor Acres Growth Curve (Male, As-Hatched, Standard Nutrition)
 * Source: Aviagen Arbor Acres Performance Objectives 2019
 */
export const ARBOR_ACRES_GROWTH: BreedGrowthCurve = {
    breedName: 'arbor_acres',
    species: 'Broiler',
    data: [
        { day: 0, expected_weight_g: 42 },
        { day: 7, expected_weight_g: 172 },
        { day: 14, expected_weight_g: 455 },
        { day: 21, expected_weight_g: 910 },
        { day: 28, expected_weight_g: 1510 },
        { day: 35, expected_weight_g: 2235 },
        { day: 42, expected_weight_g: 3025 },
        { day: 49, expected_weight_g: 3870 },
        { day: 56, expected_weight_g: 4745 },
    ],
}

/**
 * Hy-Line Brown Growth Curve (Pullet, Standard Nutrition)
 * Source: Hy-Line Brown Commercial Management Guide 2021
 */
export const HY_LINE_BROWN_GROWTH: BreedGrowthCurve = {
    breedName: 'hyline_brown',
    species: 'Layer',
    data: [
        { day: 0, expected_weight_g: 38 },
        { day: 7, expected_weight_g: 65 },
        { day: 14, expected_weight_g: 105 },
        { day: 21, expected_weight_g: 160 },
        { day: 28, expected_weight_g: 230 },
        { day: 35, expected_weight_g: 315 },
        { day: 42, expected_weight_g: 415 },
        { day: 49, expected_weight_g: 525 },
        { day: 56, expected_weight_g: 645 },
        { day: 63, expected_weight_g: 770 },
        { day: 70, expected_weight_g: 900 },
        { day: 77, expected_weight_g: 1030 },
        { day: 84, expected_weight_g: 1155 },
        { day: 91, expected_weight_g: 1275 },
        { day: 98, expected_weight_g: 1385 },
        { day: 105, expected_weight_g: 1485 },
        { day: 112, expected_weight_g: 1575 },
        { day: 119, expected_weight_g: 1655 },
        { day: 126, expected_weight_g: 1725 },
    ],
}

/**
 * Lohmann Brown Growth Curve (Pullet, Standard Nutrition)
 * Source: Lohmann Brown Management Guide 2018
 */
export const LOHMANN_BROWN_GROWTH: BreedGrowthCurve = {
    breedName: 'lohmann_brown',
    species: 'Layer',
    data: [
        { day: 0, expected_weight_g: 38 },
        { day: 7, expected_weight_g: 68 },
        { day: 14, expected_weight_g: 110 },
        { day: 21, expected_weight_g: 168 },
        { day: 28, expected_weight_g: 240 },
        { day: 35, expected_weight_g: 325 },
        { day: 42, expected_weight_g: 425 },
        { day: 49, expected_weight_g: 535 },
        { day: 56, expected_weight_g: 655 },
        { day: 63, expected_weight_g: 780 },
        { day: 70, expected_weight_g: 910 },
        { day: 77, expected_weight_g: 1040 },
        { day: 84, expected_weight_g: 1165 },
        { day: 91, expected_weight_g: 1285 },
        { day: 98, expected_weight_g: 1395 },
    ],
}

/**
 * Clarias gariepinus (African Catfish) Growth Curve
 * Source: FAO Aquaculture Feed and Fertilizer Resources 2020
 * Conditions: 28-30°C, optimal feeding
 */
export const CLARIAS_GARIEPINUS_GROWTH: BreedGrowthCurve = {
    breedName: 'clarias_gariepinus',
    species: 'Catfish',
    data: [
        { day: 0, expected_weight_g: 5 },
        { day: 15, expected_weight_g: 25 },
        { day: 30, expected_weight_g: 65 },
        { day: 45, expected_weight_g: 125 },
        { day: 60, expected_weight_g: 210 },
        { day: 75, expected_weight_g: 320 },
        { day: 90, expected_weight_g: 450 },
        { day: 105, expected_weight_g: 600 },
        { day: 120, expected_weight_g: 770 },
        { day: 135, expected_weight_g: 950 },
        { day: 150, expected_weight_g: 1140 },
        { day: 165, expected_weight_g: 1330 },
        { day: 180, expected_weight_g: 1520 },
    ],
}

/**
 * Channel Catfish Growth Curve
 * Source: USDA Catfish Production Guide 2019
 * Conditions: 26-28°C, commercial feed
 */
export const CHANNEL_CATFISH_GROWTH: BreedGrowthCurve = {
    breedName: 'channel_catfish',
    species: 'Catfish',
    data: [
        { day: 0, expected_weight_g: 5 },
        { day: 15, expected_weight_g: 20 },
        { day: 30, expected_weight_g: 55 },
        { day: 45, expected_weight_g: 110 },
        { day: 60, expected_weight_g: 185 },
        { day: 75, expected_weight_g: 280 },
        { day: 90, expected_weight_g: 395 },
        { day: 105, expected_weight_g: 525 },
        { day: 120, expected_weight_g: 670 },
        { day: 135, expected_weight_g: 825 },
        { day: 150, expected_weight_g: 985 },
        { day: 165, expected_weight_g: 1150 },
        { day: 180, expected_weight_g: 1315 },
    ],
}

/**
 * Nile Tilapia Growth Curve
 * Source: WorldFish Tilapia Growth Standards 2020
 * Conditions: 28-30°C, optimal feeding
 */
export const NILE_TILAPIA_GROWTH: BreedGrowthCurve = {
    breedName: 'nile_tilapia',
    species: 'Tilapia',
    data: [
        { day: 0, expected_weight_g: 1 },
        { day: 15, expected_weight_g: 8 },
        { day: 30, expected_weight_g: 25 },
        { day: 45, expected_weight_g: 55 },
        { day: 60, expected_weight_g: 100 },
        { day: 75, expected_weight_g: 160 },
        { day: 90, expected_weight_g: 235 },
        { day: 105, expected_weight_g: 325 },
        { day: 120, expected_weight_g: 425 },
        { day: 135, expected_weight_g: 535 },
        { day: 150, expected_weight_g: 650 },
        { day: 165, expected_weight_g: 770 },
        { day: 180, expected_weight_g: 890 },
    ],
}

/**
 * Red Tilapia Growth Curve
 * Source: FAO Red Tilapia Culture Manual 2018
 * Conditions: 28-30°C, optimal feeding
 */
export const RED_TILAPIA_GROWTH: BreedGrowthCurve = {
    breedName: 'red_tilapia',
    species: 'Tilapia',
    data: [
        { day: 0, expected_weight_g: 1 },
        { day: 15, expected_weight_g: 7 },
        { day: 30, expected_weight_g: 22 },
        { day: 45, expected_weight_g: 50 },
        { day: 60, expected_weight_g: 92 },
        { day: 75, expected_weight_g: 148 },
        { day: 90, expected_weight_g: 218 },
        { day: 105, expected_weight_g: 302 },
        { day: 120, expected_weight_g: 395 },
        { day: 135, expected_weight_g: 497 },
        { day: 150, expected_weight_g: 605 },
        { day: 165, expected_weight_g: 718 },
        { day: 180, expected_weight_g: 830 },
    ],
}

/**
 * All breed-specific growth curves
 */
export const BREED_GROWTH_CURVES: Array<BreedGrowthCurve> = [
    COBB_500_GROWTH,
    ROSS_308_GROWTH,
    ARBOR_ACRES_GROWTH,
    HY_LINE_BROWN_GROWTH,
    LOHMANN_BROWN_GROWTH,
    CLARIAS_GARIEPINUS_GROWTH,
    CHANNEL_CATFISH_GROWTH,
    NILE_TILAPIA_GROWTH,
    RED_TILAPIA_GROWTH,
]
