const moment = require("moment");
const chalk = require("chalk");
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

function showCalendar() {
  let currentMonth = moment().format("YYYY-MM")
  let weeks = [0, 1, 2, 3, 4, 5, 6].map(m => {
    let title = getWeekByDay(moment().add(m, "days").day());
    return title
  })
  let start = moment().startOf("months").format("YYYY-MM-DD");

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
        if (tmpstr == moment().format("DD")) {
          tmpstr = chalk.bgWhite(chalk.green(tmpstr))
        }
      }
      days.push(tmpstr)
      wstart = moment(wstart).add(1, "days").format("YYYY-MM-DD")
    }
    dd.push(days)
  }
  console.log(`      ${moment().format("M月 YYYY")}`)
  console.log(weeks.join(" "))
  for (const m of dd) {
    console.log(m.join(" "))
  }

}

module.exports = {
  getWeekByDay,
  showCalendar
}