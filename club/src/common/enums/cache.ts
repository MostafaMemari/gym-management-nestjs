export enum CacheKeys {
  STUDENTS = 'students_list-:userId',
  STUDENTS_SUMMARY = 'students_list_summary-:userId',

  CLUBS = 'clubs_list-:userId',
  COACHES = 'coaches_list-:userId',
  SESSIONS = 'sessions_list-:userId',

  BELT_EXAMS = 'belt_exams_list',
  BELTS = 'belts_list',
  ATTENDANCES = 'attendances_list',
  AGE_CATEGORIES = 'age_categories_list',
}

export enum CacheTTLMilliseconds {
  GET_ALL_STUDENTS = 3600 * 1000,
  GET_ALL_STUDENTS_SUMMARY = 3600 * 1000,

  GET_ALL_COACHES = 3600 * 1000,
  GET_ALL_CLUBS = 3600 * 1000,
  GET_ALL_SESSIONS = 3600 * 1000,
  GET_ALL_BELT_EXAMS = 3600 * 1000 * 60,
  GET_ALL_BELTS = 3600 * 1000,
  GET_ALL_ATTENDANCES = 3600 * 1000,
  GET_ALL_AGE_CATEGORIES = 3600 * 1000,
}
