export enum GymMessages {
  CREATE_SUCCESS = 'Gym created successfully',
  CREATE_FAILURE = 'Failed to create gym. Try again later',

  UPDATE_SUCCESS = 'Gym updated successfully',
  UPDATE_FAILURE = 'Failed to update gym. Try again',

  GET_SUCCESS = 'Gym retrieved successfully',
  GET_FAILURE = 'Failed to retrieve gym',

  GET_ALL_SUCCESS = 'Gyms retrieved successfully',
  GET_ALL_FAILURE = 'Failed to retrieve gyms',

  REMOVE_SUCCESS = 'Gym removed successfully',
  REMOVE_FAILURE = 'Failed to remove gym',

  NOT_FOUND = 'Gym not found',

  CANNOT_REMOVE_MALE_COACH = 'Cannot remove male coach while assigned coaches exist',
  CANNOT_REMOVE_FEMALE_COACH = 'Cannot remove female coach while assigned coaches exist',

  CANNOT_REMOVE_ASSIGNED_COACHES = 'The gym has assigned coaches and cannot be removed',
  CLUBS_NOT_OWNED_BY_USER = 'Gyms with IDs {ids} do not belong to you',
  NOT_BELONG_TO_USER = 'This gym does not belong to the user',

  WALLET_DEPLETION_UPDATED = 'Wallet depletion status updated successfully',

  COACH_NOT_ASSIGNED = 'Coach is not assigned to any gym',
}
