export enum StudentMessages {
  CreatedStudent = 'Student created successfully',
  UpdatedStudent = 'Student updated successfully',
  NotFoundStudent = 'Student not found',
  AlreadyExistsStudentWithUsername = 'A student with this username already exists',
  RemovedStudentSuccess = 'Student removed successfully',
  FailedToCreateStudent = 'Failed to create student. Try again later',
  FailedToRemoveStudent = 'Failed to remove student. Try again',
  InvalidStudentData = 'Invalid student data',
  UnauthorizedAction = 'You are not authorized',
  StudentUpdateSuccess = 'Student updated successfully',
  FailedToUpdateStudent = 'Failed to update student. Try again',
  StudentListFetchError = 'Error fetching student list',
  DuplicateStudentEntry = 'This student is already registered',
  DuplicateNationalCode = 'A student with this national code already exists',
  FailedToUploadImage = 'Image upload failed. Try again',
  FailedToCreateUser = 'Failed to create user. Try again later',
  StudentNotFound = 'Student not found',
  GetStudentSuccess = 'Student data retrieved successfully',
  ClubGenderMismatch = 'Student gender does not match club',
  CoachGenderMismatch = 'Student gender does not match coach',
  CannotRemoveClubsInArray = 'Cannot remove clubs:',
  NotAssignedToClub = 'Coach is not assigned to the specified club:',
  CheckCoachAssignmentFailed = 'Failed to check if the coach is assigned to students',
  GetCountStudentSuccessfully = 'get count students successfully',
}
