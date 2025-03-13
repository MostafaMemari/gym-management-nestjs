export enum AttendanceMessages {
  CREATE_SUCCESS = 'Attendance created successfully',
  CREATE_FAILURE = 'Failed to create attendance. Try again later',

  UPDATE_SUCCESS = 'Attendance updated successfully',
  UPDATE_FAILURE = 'Failed to update attendance. Try again',

  GET_SUCCESS = 'Attendance retrieved successfully',
  GET_FAILURE = 'Failed to retrieve attendance',

  GET_ALL_SUCCESS = 'Attendances retrieved successfully',
  GET_ALL_FAILURE = 'Failed to retrieve attendances',

  REMOVE_SUCCESS = 'Attendance removed successfully',
  REMOVE_FAILURE = 'Failed to remove attendance',

  NOT_FOUND = 'Attendance not found',
  ALREADY_RECORDED = 'Attendance has already been recorded',
  INVALID_SESSION_DAY = 'The session is not held on {dayOfWeek}',
  NO_STUDENTS_ELIGIBLE = 'No students found for this session on the given date',
}
