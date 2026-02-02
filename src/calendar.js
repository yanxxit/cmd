import moment from "dayjs";
import chalk from "chalk";
function getWeekByDay(week) {
  switch (week) {
    case 1:
      return '一'
    case 2:
      return '二'
    case 3:
      return '三'
    case 4:
      return '四'
    case 5:
      return '五'
    case 6:
      return '六'
    case 0:
      return '日'
  }
};


function showMonthCalendar(currentMonth = moment().format("YYYY-MM")) {
  let weeks = [0, 1, 2, 3, 4, 5, 6].map(m => {
    let title = getWeekByDay(moment().add(m, "days").day());
    return title
  })
  let start = moment(currentMonth).startOf("months").format("YYYY-MM-DD");
  let lines = [];
  let dd = [];
  for (let i = 0; i < 6; i++) {
    let wstart = moment(start).add(i, "week").startOf("week").format("YYYY-MM-DD")
    let wend = moment(start).add(i, "week").endOf("week").format("YYYY-MM-DD")
    let days = []
    while (wstart <= wend) {
      let myMonth = moment(wstart).format("YYYY-MM")
      let tmpstr = "  ";
      // console.log(wstart, currentMonth, myMonth)
      if (currentMonth == myMonth) {
        tmpstr = moment(wstart).format("DD");
        if (tmpstr == moment().format("DD") && currentMonth == moment().format("YYYY-MM")) {
          tmpstr = chalk.bgWhite(chalk.green(tmpstr))
        }
      }
      days.push(tmpstr)
      wstart = moment(wstart).add(1, "days").format("YYYY-MM-DD")
    }
    dd.push(days)
  }
  lines.push(`      ${moment(currentMonth).format("M月 YYYY")}     `)
  lines.push(weeks.join(" "))
  for (const m of dd) {
    lines.push((m.join(" ")))
  }
  return lines
}

function getCalendarByMonth(currentMonth = moment().format("YYYY-MM")) {
  let lines = showMonthCalendar(currentMonth)
  for (let i = 0; i < lines.length; i++) {
    console.log(lines[i])
  }
}

function getCurrentThreeCalendars() {
  let currentMonth = moment().format("YYYY-MM")
  let nextMonth = moment().add(1, "month").format("YYYY-MM")
  let threeMonth = moment().add(2, "month").format("YYYY-MM")
  let oneLines = showMonthCalendar(currentMonth)
  let twoLines = showMonthCalendar(nextMonth)
  let threeLines = showMonthCalendar(threeMonth)
  for (let i = 0; i < oneLines.length; i++) {
    console.log(oneLines[i] + "   " + twoLines[i] + "   " + threeLines[i])
  }
}

function getCurrentYearCalendars() {
  let startMonth = moment().startOf("years").format("YYYY-MM")
  for (let i = 0; i < 4; i++) {
    let currentMonth = moment(startMonth).add(i * 3 + 0, "months").format("YYYY-MM")
    let nextMonth = moment(startMonth).add(i * 3 + 1, "months").format("YYYY-MM")
    let threeMonth = moment(startMonth).add(i * 3 + 2, "months").format("YYYY-MM")
    let oneLines = showMonthCalendar(currentMonth)
    let twoLines = showMonthCalendar(nextMonth)
    let threeLines = showMonthCalendar(threeMonth)
    for (let i = 0; i < oneLines.length; i++) {
      console.log(oneLines[i] + "   " + twoLines[i] + "   " + threeLines[i])
    }
  }

}

export {
  getWeekByDay,
  getCurrentThreeCalendars,
  getCalendarByMonth,
  getCurrentYearCalendars,
}