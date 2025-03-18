import * as moment from 'moment-jalaali';

export function shmasiToMiladi(shamsiDate: string): Date {
  const date = moment(shamsiDate, 'jYYYY/jMM/jDD').format('YYYY-MM-DD');
  return new Date(date);
}

export function mildadiToShamsi(mildaidDate: Date) {
  return moment(mildaidDate).format('jYYYY/jMM/jDD');
}
