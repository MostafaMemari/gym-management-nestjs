export enum CacheKeys {
  CLUBS = 'clubs_list',

  STUDENTS = 'students_list',
  STUDENTS_SUMMARY = 'students_list_summary',

  COACHES = 'coaches_list',
  SESSIONS = 'sessions_list',
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
