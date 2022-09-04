// let word = "{'a':'1','b':{e:1,f:2,g:{k:1,h:2}},'c':3}";
let word = "{'a':{b:{c:{d:1}}}}";

word = word.replace(/'/g, '').replace(/{/g, '\${')
console.log(word)
let docs = word.split(",")
console.log(docs)

let myjson = "";
let indexs = {}
let count = 0;

function getKey(str) {
  str = str.replace(/{/g, '').replace(/}/g, '')
  let key = str.split(":")[0]
  console.log(key)
  return key
}


for (const str of docs) {
  if (str.indexOf("{") === 0) {
    indexs[count]
  }
  // getKey(str)
}