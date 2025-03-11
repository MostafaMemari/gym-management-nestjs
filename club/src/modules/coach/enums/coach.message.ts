export enum CoachMessages {
  CREATE_SUCCESS = 'Coach created successfully',
  CREATE_FAILURE = 'Failed to create coach. Try again later',

  UPDATE_SUCCESS = 'Coach updated successfully',
  UPDATE_FAILURE = 'Failed to update coach. Try again later',

  GET_SUCCESS = 'Coach data retrieved successfully',
  GET_FAILURE = 'Failed to retrieve coach data',

  GET_ALL_SUCCESS = 'Coach list retrieved successfully',
  GET_ALL_FAILURE = 'Failed to retrieve coaches list',

  REMOVE_SUCCESS = 'Coach removed successfully',
  REMOVE_FAILURE = 'Failed to remove coach. Try again later',
  COACH_HAS_STUDENTS = 'Coach (ID: {coachId}) cannot be removed, assigned students exist',

  NOT_FOUND = 'Coach not found',

  COACH_GENDER_CHANGE_NOT_ALLOWED = 'Cannot change coach gender, assigned students exist',
  DUPLICATE_ENTRY = 'This coach is already registered',
  COACH_GENDER_MISMATCH = 'Clubs {ids} do not allow this coach gender',
}
