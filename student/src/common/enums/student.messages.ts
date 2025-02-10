export enum StudentMessages {
  CreatedStudent = 'Student created successfully',
  NotFoundStudent = 'Student not found',
  AlreadyExistsStudentWithUsername = 'A student with this username already exists',
  RemovedStudentSuccess = 'Student removed successfully',

  FailedToCreateStudent = 'Failed to create student Please try again later',
  FailedToRemoveStudent = 'Failed to remove student Please try again',
  InvalidStudentData = 'Invalid student data provided',
  UnauthorizedAction = 'You are not authorized to perform this action',
  StudentUpdateSuccess = 'Student updated successfully',
  FailedToUpdateStudent = 'Failed to update student Please try again',
  StudentListFetchError = 'Error fetching student list',
  DuplicateStudentEntry = 'This student is already registered',
  DuplicateNationalCode = 'A student with this national code already exists',
}
