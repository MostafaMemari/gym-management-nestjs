export enum CoursePatterns {
  CHECK_CONNECTION = 'check_connection',
  CREATE = 'create_course',
  UPDATE = 'update_course',
  GET_ALL = 'get_courses',
  GET_ONE = 'get_course',
  GET_ONE_DETAILS = 'get_course_details',
  REMOVE = 'remove_course',
}

export enum ChapterPatterns {
  CHECK_CONNECTION = 'check_connection',
  CREATE = 'create_chapter',
  UPDATE = 'update_chapter',
  GET_ALL = 'get_chapters',
  GET_ONE = 'get_chapter',
  REMOVE = 'remove_chapter',
}

export enum LessonPatterns {
  CHECK_CONNECTION = 'check_connection',
  CREATE = 'create_lesson',
  UPDATE = 'update_lesson',
  GET_ALL = 'get_lessons',
  GET_ONE = 'get_lesson',
  REMOVE = 'remove_lesson',

  MARK_LESSON_COMPLETED = 'mark_lesson_completed',
}
