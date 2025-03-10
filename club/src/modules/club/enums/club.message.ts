export enum ClubMessages {
  CREATE_SUCCESS = 'Club created successfully',
  CREATE_FAILURE = 'Failed to create club. Try again later',

  UPDATE_SUCCESS = 'Club updated successfully',
  UPDATE_FAILURE = 'Failed to update club. Try again',

  GET_SUCCESS = 'Club retrieved successfully',
  GET_FAILURE = 'Failed to retrieve club',

  GET_ALL_SUCCESS = 'Clubs retrieved successfully',
  GET_ALL_FAILURE = 'Failed to retrieve clubs',

  REMOVE_SUCCESS = 'Club removed successfully',
  REMOVE_FAILURE = 'Failed to remove club',

  NOT_FOUND = 'Club not found',

  CANNOT_REMOVE_MALE_COACH = 'Cannot remove male coach while assigned coaches exist',
  CANNOT_REMOVE_FEMALE_COACH = 'Cannot remove female coach while assigned coaches exist',

  CANNOT_REMOVE_ASSIGNED_COACHES = 'The club has assigned coaches and cannot be removed',
  CLUBS_NOT_OWNED_BY_USER = 'Clubs with IDs {ids} do not belong to you',
  NOT_BELONG_TO_USER = 'This club does not belong to the user',

  WALLET_DEPLETION_UPDATED = 'Wallet depletion status updated successfully',

  COACH_NOT_ASSIGNED = 'Coach is not assigned to any club',
}
