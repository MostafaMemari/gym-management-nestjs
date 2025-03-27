export enum CacheKeys {
  COURSES = 'courses_list',
  COURSE_DETAILS = 'course_details',
  CHAPTERS = 'chapters_list',
  LESSONS = 'lesson_list',
}
export enum CachePatterns {
  COURSES = 'courses_list*',
  COURSE_DETAILS_BY_ID = 'course_details-{courseId}*',
  COURSE_DETAILS = 'course_details*',
  CHAPTERS = 'chapters_list*',
  LESSONS = 'lesson_list*',
}

export enum CacheTTLMilliseconds {
  GET_ALL_LESSONS = 3600 * 1000,
  GET_ALL_CHAPTERS = 3600 * 1000,
  GET_ALL_COURSES = 3600 * 1000,
  GET_COURSE_DETAILS = 3600 * 1000,
}
