import * as moment from 'moment-jalaali';

export function shmasiToMiladi(shamsiDate: string) {
  return moment(shamsiDate, 'jYYYY/jMM/jDD').format('YYYY-MM-DD');
}

export function mildadiToShamsi(mildaidDate: Date) {
  return moment(mildaidDate).format('jYYYY/jMM/jDD');
}
