export enum CoachMessages {
  CreatedCoach = 'Coach created successfully',
  UpdatedCoach = 'Coach updated successfully',
  NotFoundCoach = 'Coach not found',
  AlreadyExistsCoachWithUsername = 'A coach with this username already exists',
  RemovedCoachSuccess = 'Coach removed successfully',

  FailedToCreateCoach = 'Failed to create coach Please try again later',
  FailedToRemoveCoach = 'Failed to remove coach Please try again',
  InvalidCoachData = 'Invalid coach data provided',
  UnauthorizedAction = 'You are not authorized to perform this action',
  CoachUpdateSuccess = 'Coach updated successfully',
  FailedToUpdateCoach = 'Failed to update coach Please try again',
  CoachListFetchError = 'Error fetching coach list',
  DuplicateCoachEntry = 'This coach is already registered',
  DuplicateNationalCode = 'A coach with this national code already exists',
  FailedToUploadImage = 'Failed to upload image. Please try again',

  FailedToCreateUser = 'Failed to create user Please try again later',
  CoachNotFound = 'Coach not found',
}
