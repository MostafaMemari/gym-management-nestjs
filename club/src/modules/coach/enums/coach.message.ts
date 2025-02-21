export enum CoachMessages {
  CreatedCoach = 'Coach created successfully',
  UpdatedCoach = 'Coach updated successfully',
  NotFoundCoach = 'Coach not found',
  AlreadyExistsCoachWithUsername = 'A student with this username already exists',
  RemovedCoachSuccess = 'Coach removed successfully',

  FailedToCreateCoach = 'Failed to create student Please try again later',
  FailedToRemoveCoach = 'Failed to remove student Please try again',
  InvalidCoachData = 'Invalid student data provided',
  UnauthorizedAction = 'You are not authorized to perform this action',
  CoachUpdateSuccess = 'Coach updated successfully',
  FailedToUpdateCoach = 'Failed to update student Please try again',
  CoachListFetchError = 'Error fetching student list',
  DuplicateCoachEntry = 'This student is already registered',
  DuplicateNationalCode = 'A student with this national code already exists',
  FailedToUploadImage = 'Failed to upload image. Please try again',

  FailedToCreateUser = 'Failed to create user Please try again later',
  CoachNotFound = 'Coach not found',
}
