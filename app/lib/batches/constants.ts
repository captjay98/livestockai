/**
 * Get species options for a livestock type
 */
export function getSpeciesOptions(livestockType: 'poultry' | 'fish'): Array<string> {
  if (livestockType === 'poultry') {
    return [
      'Broiler',
      'Layer',
      'Cockerel',
      'Turkey',
      'Duck',
      'Goose',
      'Guinea Fowl',
    ]
  } else {
    return [
      'Catfish',
      'Tilapia',
      'Carp',
      'Salmon',
      'Mackerel',
      'Croaker',
      'Snapper',
    ]
  }
}
