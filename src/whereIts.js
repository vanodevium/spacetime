import Spacetime from './spacetime.js'
// const timezones = require('../data');

const whereIts = (a, b) => {
  let start = new Spacetime(null)
  let end = new Spacetime(null)
  start = start.time(a)
  //if b is undefined, use as 'within one hour'
  if (b) {
    end = end.time(b)
  } else {
    end = start.add(59, 'minutes')
  }

  const startHour = start.hour()
  const endHour = end.hour()
  const tzs = Object.keys(start.timezones).filter((tz) => {
    if (tz.indexOf('/') === -1) {
      return false
    }
    const m = new Spacetime(null, tz)
    const hour = m.hour()
    //do 'calendar-compare' not real-time-compare
    if (hour >= startHour && hour <= endHour) {
      //test minutes too, if applicable
      if (hour === startHour && m.minute() < start.minute()) {
        return false
      }
      if (hour === endHour && m.minute() > end.minute()) {
        return false
      }
      return true
    }
    return false
  })
  return tzs
}
export default whereIts
