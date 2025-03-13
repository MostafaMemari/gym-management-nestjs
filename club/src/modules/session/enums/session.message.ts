export enum SessionMessages {
  CREATE_SUCCESS = 'Session created successfully',
  CREATE_FAILURE = 'Failed to create session. Try again later',

  UPDATE_SUCCESS = 'Session updated successfully',
  UPDATE_FAILURE = 'Failed to update session. Try again',

  GET_SUCCESS = 'Session retrieved successfully',
  GET_FAILURE = 'Failed to retrieve session',

  GET_ALL_SUCCESS = 'Sessions retrieved successfully',
  GET_ALL_FAILURE = 'Failed to retrieve sessions',

  REMOVE_SUCCESS = 'Session removed successfully',
  REMOVE_FAILURE = 'Failed to remove session',

  NOT_FOUND = 'Session not found',
  UnauthorizedSessions = 'The session IDs {ids} do not belong to this user',
}
