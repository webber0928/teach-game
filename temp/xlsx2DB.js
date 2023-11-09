const XLSX = require('xlsx')
const Promise = require('bluebird')
const excelFile = `./temp/problem_set.xlsx`
const sqlite3 = require('sqlite3').verbose();
const file = './data/db/epd.db';
const db = new sqlite3.Database(file);



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
    db.serialize(() => {    
        db.run("CREATE TABLE IF NOT EXISTS lorem (name TEXT, question TEXT)");
    
        // const stmt = db.prepare("INSERT INTO lorem VALUES (?,?)");
        let i = 1
        for (const key in obj) {
            console.log(key)
            obj[key].map((o) => {
                console.log('L50', o)
                return 
            })
            // stmt.run([key, JSON.stringify(obj[key])]);
        }
        // for (let i = 0; i < 10; i++) {
        //     stmt.run("Ipsum " + i);
        // }
        // stmt.finalize();
    
        db.each("SELECT rowid AS id, name, question FROM lorem", (err, row) => {
            console.log(row.id, row.name, row.question);
            // console.log(row.id + ": " + row.info);
        });
    });
    
    
    db.close();
    // db.serialize(() => {    
    //     db.run("CREATE TABLE IF NOT EXISTS CALL_DB (info TEXT)");
        
    
    //     // const stmt = db.prepare("INSERT INTO GameInfo(id, name, questions) values(?, ?, ?)");
    //     for (let i = 0; i < obj.length; i++) {
    //         console.log(obj[i])
    //         // stmt.run("Ipsum " + i);
    //     }
    //     // stmt.finalize();
    
    //     // db.each("SELECT rowid AS id, info FROM lorem", (err, row) => {
    //     //     console.log(row.id + ": " + row.info);
    //     // });
    // });



/// tilesData format; [[level, column, row, content], [level, column, row, content]]
// DB.SqliteDB.prototype.insertData = function (sql, objects) {
//     DB.db.serialize(function () {
//         let stmt = DB.db.prepare(sql);
//         for (let i = 0; i < objects.length; ++i) {
//             stmt.run(objects[i]);
//         }

//         stmt.finalize();
//     });
    
    
//     db.close();

    // process.exit()
}
