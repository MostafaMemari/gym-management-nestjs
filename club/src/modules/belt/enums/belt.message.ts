export enum BeltMessages {
  CREATE_SUCCESS = 'Belt created successfully',
  CREATE_FAILURE = 'Failed to create belt. Try again later',

  UPDATE_SUCCESS = 'Belt updated successfully',
  UPDATE_FAILURE = 'Failed to update belt. Try again',

  GET_SUCCESS = 'Belt retrieved successfully',
  GET_FAILURE = 'Failed to retrieve belt',

  GET_ALL_SUCCESS = 'Belts retrieved successfully',
  GET_ALL_FAILURE = 'Failed to retrieve belts',

  REMOVE_SUCCESS = 'Belt removed successfully',
  REMOVE_FAILURE = 'Failed to remove belt',

  NOT_FOUND = 'Belt not found',
  MULTIPLE_NOT_FOUND = 'Belts with IDs {ids} were not found',
}
