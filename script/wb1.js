const MongoClient = require('mongodb').MongoClient;
var url = "mongodb://13.113.190.142:9453/";

MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db('kahootDB');
    dbo.collection('gamesRecord')
        .find({}).toArray(function (err, result) {
            if (err) throw err;
            dbo.collection('kahootGames')
                .find({}).toArray(function (err, res) {
                    if (err) throw err;
                    let qObject = {}
                    res.forEach(item => qObject[item.id] = item.name)

                    result.forEach((item) => {
                        const specificDate = new Date(item.createdAt);
                        const specificYear = specificDate.getFullYear(); // 年份
                        const specificMonth = specificDate.getMonth() + 1; // 月份
                        const specificDay = specificDate.getDate(); // 日期
                        const specificHours = specificDate.getHours(); // 小时
                        const specificMinutes = specificDate.getMinutes(); // 分钟
                        const specificSeconds = specificDate.getSeconds(); // 秒钟

                        item.createdAt = `${specificYear}-${specificMonth}-${specificDay} ${specificHours}:${specificMinutes}:${specificSeconds}`
                        item.id = qObject[item.id]
                        // console.log(item)

                        item.playerData = item.playerData.map((it) => {
                            let answerObj = {}
                            it.answerList.forEach(item => {
                                answerObj[item.question] = item.num
                            });
                            return {
                                name: it.name,
                                score: it.gameData.score,
                                answer: it.gameData.answer,
                                q1: answerObj[1],
                                q2: answerObj[2],
                                q3: answerObj[3],
                                q4: answerObj[4],
                                q5: answerObj[5],
                                q6: answerObj[6],
                                answerList: it.answerList,
                            }
                        })
                        console.log(item)
                    })
                })
        });
});