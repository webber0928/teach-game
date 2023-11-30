const XLSX = require('xlsx')
const Promise = require('bluebird')
const excelFile = `./temp/problem_set.xlsx`
const sqlite3 = require('sqlite3').verbose();
const file = './data/db/CALL_DB.db';
const MongoClient = require('mongodb').MongoClient;
const uri = 'mongodb://13.113.190.142:27017/kahootDB';


work()

async function work () {
    const workbook = XLSX.readFile(excelFile)
    const allSheet = workbook.SheetNames

    let obj = {}
    await Promise.each(allSheet, async (sheetName) => {
        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(sheet)
        jsonData.map((item, i) => {
            if (!i) return
            let key = null
            let o = {}
            for (const k in item) {
                if (typeof item[k] === 'number') {
                    key = k
                    obj[key] =  obj[key] || []
                    continue
                }

                o[key] = o[key] || []
                o[key].push(item[k])
            }
            for (const k in obj) {
                obj[k].push(o[k])
            }
        })
    })

    // to DB
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    const collection = db.collection('kahootGames');

    console.log(obj)
    let i = 1
    for (const key in obj) {
        console.log(key)
        let formatObj = obj[key].map((o) => {
            return {"question":o[0], "answers":o, "correct":1}
        })
        // stmt.run([i, key, JSON.stringify(formatObj)]);
        const documents = await collection.insertOne({
            id: i,
            name: key,
            questions: formatObj
        });
        console.log(JSON.stringify({
            id: i,
            name: key,
            questions: formatObj
        }))
        i++
    }

    await client.close();

        // console.log(result)
    // MongoClient.connect(url, async (err, db) => {
    //     console.log('L43')
    //     if (err) throw err;
    //     console.log('L44')
    //     var dbo = db.db('kahootDB');
    //     dbo.collection('kahootGames').find({}).toArray(async (err, result) => {
    //         if(err) throw err;
    //         let i = 1
    //         for (const key in obj) {
    //             console.log(key)
    //             let formatObj = obj[key].map((o) => {
    //                 return {"question":o[0], "answers":o, "correct":1}
    //             })
    //             // stmt.run([i, key, JSON.stringify(formatObj)]);
    //             let result = await dbo.collection("kahootGames").insertOne({
    //                 id: i,
    //                 name: key,
    //                 questions: formatObj
    //             })

    //             console.log(result)
    //             i++
    //         }

    //         dbo.collection('kahootGames').find({}).toArray(function(err, result){
    //             console.log(result)
    //         })
    //     })
    //     db.close();
    //     // let i = 1
    //     // for (const key in obj) {
    //     //     console.log(key)
    //     //     let formatObj = obj[key].map((o) => {
    //     //         return {"question":o[0], "answers":o, "correct":1}
    //     //     })
    //     //     // stmt.run([i, key, JSON.stringify(formatObj)]);
    //     //     let result = await dbo.collection("kahootGames").insertOne({
    //     //         id: i,
    //     //         name: key,
    //     //         questions: formatObj
    //     //     })

    //     //     console.log(result)
    //     //     i++
    //     // }

    //     // dbo.collection('kahootGames').find({}).toArray(function(err, result){
    //     //     console.log(result)
    //     // })
    //     // db.close();
    // })
    

    // process.exit()
}
