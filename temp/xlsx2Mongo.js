const XLSX = require('xlsx')
const Promise = require('bluebird')
const excelFile = `./temp/problem_set.xlsx`
const sqlite3 = require('sqlite3').verbose();
const file = './data/db/CALL_DB.db';
const db = new sqlite3.Database(file);
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://AdminWebber:0000@13.113.190.142:27017/kahootDB'; 



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
    console.log(obj)
    // db.serialize(() => {    
    //     db.run("CREATE TABLE IF NOT EXISTS GameInfo (id INTEGER, name TEXT, questions TEXT)");
    
    //     const stmt = db.prepare("INSERT INTO GameInfo VALUES (?, ?,?)");
    //     let i = 1
    //     for (const key in obj) {
    //         console.log(key)
    //         let formatObj = obj[key].map((o) => {
    //             return {"question":o[0], "answers":o, "correct":1}
    //         })
    //         stmt.run([i, key, JSON.stringify(formatObj)]);
    //         i++
    //     }
    //     stmt.finalize();
    
    //     db.each("SELECT * FROM GameInfo", (err, row) => {
    //         console.log(row.id, row.name, row.questions);
    //         console.log();
    //     });
    // });
    
    
    // db.close();

    // process.exit()
}
