import sh from 'shelljs'
sh.config.silent = true
import data from '../zonefile/iana.js'
import { writeFileSync } from 'fs'
const year = 2025 //new Date().getFullYear()
// /usr/share/zoneinfo only stores changes, and will use the most-recent change
// see /usr/share/zoneinfo/Africa/Algiers - has changes scheduled for 2038

// linux/osx seem to have slightly different dst-change times in their zonefiles.
// (we're using the mac ones)
// but linux seems to have offset numbers in their zonefiles
// so use it, if it's there.

const months = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12
}
const zeroPad = (str, len = 2) => {
  const pad = '0'
  str = str + ''
  return str.length >= len ? str : new Array(len - str.length + 1).join(pad) + str
}

const parseLine = (line) => {
  const arr = line.split(/ +/)
  let hour = arr[11].replace(/:[0-9:]+/, '')
  const min = arr[11].replace(/[0-9]{1,2}:([0-9]+):/, '$1')
  const dst = line.includes('isdst=1')
  hour = parseInt(hour, 10)
  if (min === '0000' && dst === true) {
    hour -= 1
  } else if (min === '0000' && dst === false) {
    hour += 1
  }
  if (hour < 0) {
    console.log('Hour: ', hour)
    console.log(line)
    hour = 0
  }
  //this only appears on unix zonefiles..
  let offset = arr[arr.length - 1].replace(/gmtoff=/, '')
  offset = parseInt(offset, 10) || null
  if (offset !== null) {
    offset = offset / 60 / 60
  }
  const obj = {
    month: zeroPad(months[arr[9].toLowerCase()]),
    date: zeroPad(parseInt(arr[10], 10)),
    hour: zeroPad(hour),
    min,
    dst,
    offset
  }
  if (obj.hour > 24 || obj.day > 31 || obj.month > 12) {
    console.error('oops', obj)
  }

  return obj
}

const parseTz = (tz) => {
  let lines = sh.exec(`zdump -v /usr/share/zoneinfo/${tz} | grep ${year}`).toString().split('\n')
  lines = lines.filter((l) => l)
  if (lines.length !== 0 && lines.length !== 4) {
    // console.error('weird: ' + lines.length + ' lines for ' + tz)
    return null
  }
  if (!lines.length) {
    return null //console.log(' - no change for ' + tz)
  }
  lines = lines.map(parseLine)

  //remove 'end-of' dst changes
  lines = lines.filter((o) => o.min !== '5959' && o.min !== '2959') //urgh :/
  const a = lines[0]
  const b = lines[1]
  //this weird format i made: "03/26:03->10/29:02"
  const dst = `${a.month}/${a.date}:${a.hour}->${b.month}/${b.date}:${b.hour}`
  return {
    dst,
    offset: a.offset
  }
}

const doAll = () => {
  let changes = 0
  const keys = Object.keys(data)
  keys.forEach((k) => {
    const obj = parseTz(k)
    if (obj) {
      //compare offsets
      if (obj.offset !== null && obj.offset !== data[k].o && data[k].o !== undefined) {
        console.log('\n----offset change ' + k + '----')
        console.log('from: ' + data[k].o)
        console.log('to: ' + obj.offset)
      }
      //compare DST-change day
      if (obj.dst !== data[k].dst) {
        console.log('\n----DST change ' + k + '----')
        console.log('to: ' + obj.dst)
        console.log('was ' + data[k].dst)
        console.log('')
        data[k].dst = obj.dst
        changes += 1
      } else {
        console.log(k, '👍')
      }
    }
  })
  console.log('\n\nmade ' + changes + ' changes to ' + keys.length + ' timezones')
  writeFileSync('./zonefile.' + year + '.js', 'export default ' + JSON.stringify(data, null, 2))
}
doAll()
// console.log(parseTz('Europe/Berlin'))
// console.log(parseTz('Africa/Algiers'))
// console.log(parseTz('America/Godthab'))
// console.log(zonefile['America/Godthab'].dst)
