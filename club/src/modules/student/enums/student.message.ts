export enum StudentMessages {
  CREATE_SUCCESS = 'Student created successfully',
  CREATE_FAILURE = 'Failed to create student. Try again later',

  UPDATE_SUCCESS = 'Student updated successfully',
  UPDATE_FAILURE = 'Failed to update student. Try again later',

  GET_SUCCESS = 'Student data retrieved successfully',
  GET_FAILURE = 'Failed to retrieve student data',

  GET_ALL_SUCCESS = 'Students list retrieved successfully',
  GET_ALL_FAILURE = 'Failed to retrieve students list',

  REMOVE_SUCCESS = 'Student removed successfully',
  REMOVE_FAILURE = 'Failed to remove student. Try again later',

  NOT_FOUND = 'Student not found',
  GET_COUNT_SUCCESS = 'Total {count} students retrieved successfully',
  GET_COUNT_FAILURE = 'Failed to retrieve student count. Try again later',

  BULK_CREATE_SUCCESS = '{count} students created successfully',
  BULK_CREATE_FAILURE = 'Failed to create students. Try again later',

  DUPLICATE_ENTRY = 'This student is already registered',
  CLUB_GENDER_MISMATCH = 'Student gender does not match the club gender',
  COACH_GENDER_MISMATCH = 'Student gender does not match the coach gender',

  MULTIPLE_NOT_FOUND = 'Students with IDs {ids} were not found',
  COACH_NOT_IN_CLUB = 'Student with ID {coachId} is not associated with club ID {clubId}',
}
