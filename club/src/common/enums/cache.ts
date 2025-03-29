export enum CacheKeys {
  STUDENTS = 'students_list-:ownerId',
  STUDENTS_SUMMARY = 'students_list_summary-:ownerId',

  GYMS = 'gyms_list-:ownerId',
  COACHES = 'coaches_list-:ownerId',
  SESSIONS = 'sessions_list-:ownerId',

  BELT_EXAMS = 'belt_exams_list',
  BELTS = 'belts_list',
  ATTENDANCES = 'attendances_list',
  AGE_CATEGORIES = 'age_categories_list',
}

export enum CacheTTLMilliseconds {
  GET_ALL_STUDENTS = 3600 * 1000 * 1, // 1h
  GET_ALL_STUDENTS_SUMMARY = 3600 * 1000 * 1,
  GET_ALL_COACHES = 3600 * 1000 * 1,
  GET_ALL_GYMS = 3600 * 1000 * 1,
  GET_ALL_SESSIONS = 3600 * 1000 * 1,
  GET_ALL_BELTS = 3600 * 1000 * 1,
  GET_ALL_ATTENDANCES = 3600 * 1000 * 1,
  GET_ALL_AGE_CATEGORIES = 3600 * 1000 * 1,
}

export enum CacheTTLSeconds {
  GET_ALL_BELT_EXAMS = 3600 * 1, // 60h
}
