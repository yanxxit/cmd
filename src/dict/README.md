
# 词典


- https://github.com/skywind3000/ECDICT.git
- https://github.com/fxsjy/diaosi


参考@src/dict/diaosi python项目，改写一份nodejs 版本的项目，建议项目名在同级目录下，名字叫ds

将上一个任务的任务并总结，写到对应项目的 README.md中，使用中文编写

参考@bin/fy.js @src/dict/main.js, 将@src/dict/ds/src/index.js @src/dict/ds/src/server.js,提取命令行相关内容提取到 @bin/ds.js 下 

参考 @src/dict/lib 和@src/dict/main.js                                                                                  │
│   ，将fetch的网页信息记录到本地缓存，第一次读取网络内容，第二次，读取本地缓存                                             │
│                                                                                                                           │
│   本地缓存位置 放到@logs/cache                                                                                            │
│   如果不存在，在脚本中创建，缓存文件名(使用网址链接进行md5生成)，并将输入的单词和缓存文件，结果文件，存放在一个           │
│   json 对象中  