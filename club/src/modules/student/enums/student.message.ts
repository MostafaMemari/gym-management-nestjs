export enum StudentMessages {
  CREATE_SUCCESS = 'Student created successfully',
  CREATE_FAILURE = 'Failed to create student. Try again later',

  UPDATE_SUCCESS = 'Student updated successfully',
  UPDATE_FAILURE = 'Failed to update student. Try again later',

  REMOVE_SUCCESS = 'Student removed successfully',
  REMOVE_FAILURE = 'Failed to remove student. Try again later',

  GET_SUCCESS = 'Belt data retrieved successfully',
  GET_FAILURE = 'Failed to retrieve belt data',

  GET_ALL_SUCCESS = 'Belt list retrieved successfully',
  GET_ALL_FAILURE = 'Failed to retrieve belt list',

  NOT_FOUND = 'Student not found',
  GET_COUNT_SUCCESS = 'Total {count} students retrieved successfully',
  GET_COUNT_FAILURE = 'Failed to retrieve student count. Try again later',

  BULK_CREATE_SUCCESS = '{count} students created successfully',
  BULK_CREATE_FAILURE = 'Failed to create students. Try again later',
}

// UPLOAD_IMAGE_SUCCESS = 'Image uploaded successfully',
// UPLOAD_IMAGE_FAILURE = 'Image upload failed. Try again',

// COACH_NOT_IN_CLUB = 'Coach with ID {coachId} is not associated with club ID {clubId}',

// DUPLICATE_USERNAME = 'A student with this username already exists',
// DUPLICATE_NATIONAL_CODE = 'A student with this national code already exists',
// DUPLICATE_ENTRY = 'This student is already registered',

// INVALID_DATA = 'Invalid student data',
// UNAUTHORIZED_ACTION = 'You are not authorized to perform this action',

// CLUB_GENDER_MISMATCH = 'Student gender does not match the club gender',
// COACH_GENDER_MISMATCH = 'Student gender does not match the coach gender',

// CHECK_ASSIGNMENT_FAILED = 'Failed to check if the coach is assigned to students',
// NOT_ASSIGNED_TO_CLUB = 'Coach is not assigned to the specified club',

// MULTIPLE_NOT_FOUND = 'Students with IDs {ids} were not found',
// CANNOT_REMOVE_CLUBS = 'Clubs with IDs {ids} cannot be removed',
