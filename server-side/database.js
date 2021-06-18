var mysql = require('mysql');
var db_info = {
    host: 'localhost',
    port: '3307',
    user: 'internet_project_1',
    password: 'JongbinKyuu12',
    database: 'inpro_db'
}

module.exports={
    init: function(){
        return mysql.createConnection(db_info);
    },
    connect: function(conn){
        conn.connect(function(err){
            if(err) console.error('mysql connection error: '+ err);
            else console.log('mysql is connected successfully!');
        });
    }
}