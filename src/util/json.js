
function getKeyValue(str) {
  let key = str.split(":")[0]
  let value = str.split(":")[1] || ""
  return [key.trim(), value.trim()]
}

function getKeyValues(str) {
  let isShow = false
  if (str.indexOf(",") === 0) isShow = true
  let list = str.split(",").filter(m => m)
  let line = list.map(m => {
    let [key, value] = getKeyValue(m)
    if (value !== "true" && value !== "false" && Number(value) != value) {
      return `"${key}":"${value}"`
    }
    return `"${key}":${value}`
  }).join(",")

  if (isShow) line = `,${line}`

  return line
}

function strToJSON(word) {
  word = word.replace(/'/g, '').replace(/\"/g, '').replace(/{/g, '\n{\n').replace(/}/g, '\n}\n')
  // console.log(word)
  let docs = word.split("\n").map(m => m.trim()).filter(m => m);
  let strjson = ""
  let count = 0;
  for (const str of docs) {
    if (str === "{") {
      strjson += str;
    }
    if (str === "}") {
      strjson += str;
    }

    if (str.indexOf('{') === -1 && str.indexOf('}') === -1) {
      strjson += getKeyValues(str)
    }
    count++
  }
  // console.log(strjson)
  // console.log(JSON.stringify(JSON.parse(strjson), null, 2))
  return JSON.parse(strjson);
}

if (module.parent) {
  // 被 require，则导出 app
  module.exports = {
    strToJSON
  }
} else {
  // boolean,number,string,date
  // let word = "{'a':'1','b':1,'c':3}";
  // let word = "{\"a\":'1','b':1,'c':3}";
  // let word = `{"a":'1','b':1,'c':3}`;
  let word = "{'a':'1','b':1,'c':{ok:1,test:true,ttt:\"abc\"},dd:12,bb:11, 'd':{f:1,h:2}}";
  // let word = "{'a': { b: { c: { d: 1 } } } }";
  strToJSON(word)
}