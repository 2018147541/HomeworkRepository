// 원래 database 설정 시 pool을 이용하는게 맞지만, 이미 늦었기에 일단 이렇게 프로그래밍하겟다.
// https://blog.naver.com/pjt3591oo/221505148267 참조 - pool 이용하는 방법
// https://gongbu-ing.tistory.com/32 : 내가 이용한 수작업 방법
// login 유지하는 것도 쿠키/session을 사용하여 구현하는게 좋지만
// 그걸 제출하기 12시간 전에 알았으므로, 일단 ejs의 객체를 이용하여 판별하는 것으로 하자.

var express = require('express');
var app = express();
var db_config = require(__dirname + '/database.js');
var conn = db_config.init();
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
require('date-utils');
var newDate = new Date();
var fs = require('fs');
const request = require('request');
const convert = require('xml-js');
const multer = require('multer');
const upload = multer({ dest: 'server_side/product_img/' });

// default value
var who_login = 0;
var login_success = false;

db_config.connect(conn);

//app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/test', function (req, res) {
    console.log("test");
    res.send("test site");

});

app.get('/', function (req, res) { // 2: ??
    res.write("<script>window.location.href = 'http://localhost:3000/map'</script>", function (err) {
        res.end();
    });
});
app.get('/hello', function (req, res) { // 2: ??
    res.render('index_map', { name: req.query.nameQuery });
});

app.get('/login', async function (req, res) { // 2: 완료
    res.render('login_lost', {login_able: login_success, login_user: who_login});
});
app.post('/login', async function (req, res) { // 2: 완료
    var body = req.body;
    user_ID = body.user_id;
    user_PW = body.user_pw;
    user_ID = user_ID.toLowerCase();
    var func_input = "SELECT us_id, user_id, user_pw FROM user_db WHERE user_ID = '" + user_ID.toLowerCase() + "' and user_PW = '" + user_PW + "';";
    conn.query(func_input, function (err, rows, field) {
        //print_user_from_sql();
        if (err) console.error("error from login: " + err);
        else {
            if (rows.length === 1 && user_ID == rows[0].user_id && user_PW == rows[0].user_pw) {
                //login succes
                who_login = rows[0].us_id;
                login_success = true;
                res.write("<script>alert('Login success! Hello " + user_ID + "!')</script>");
                res.write("<script>window.location.href = 'http://localhost:3000/map'</script>", function (err) {
                    res.end();
                });
                return user_ID;
            }
            else {
                res.write("<script>alert('Login Failed!')</script>");
                res.write("<script>window.location.href = 'http://localhost:3000/login'</script>", function (err) {
                    res.end();
                });
                return false;
            }
        }
    });
});

app.get('/logout', async function(req, res){
    who_login = 0;
    login_success = false;
    res.write("<script>alert('Log out! ByeBye!')</script>");
    res.write("<script>window.location.href = 'http://localhost:3000/map'</script>", function (err) {
        res.end();
    });
});

app.get('/signup', async function (req, res) { // 2
    res.render('signup_lost', {login_able: login_success, login_user: who_login});
});
app.post('/signup', async function (req, res) { // 2
    var body = req.body;
    user_ID = body.user_id;
    user_PW = body.user_pw;
    var id_temp = user_ID.toLowerCase();
    if (!(id_temp.length >= 6 && id_temp.length <= 15 && user_PW.length >= 8 && user_PW.length <= 20)) {
        res.write("<script>alert('See the conditions!')</script>");
        res.write("<script>window.location.href = 'http://localhost:3000/signup'</script>", function (err) {
            res.end();
        });
        return false;
    }
    //우선 겹치는 것이 있는지 SQL을 통해 확인한다.
    var func_input = "SELECT user_ID FROM user_db WHERE user_ID = '" + id_temp + "';";
    conn.query(func_input, function (err, rows, fields) {
        if (err) {
            console.log('query is not excuted. select fail...\n' + err);
            res.write("<script>alert('Error!')</script>");
            res.write("<script>window.location.href = 'http://localhost:3000/signup'</script>", function (err) {
                res.end();
            });
            return false;
        }
        else {
            //https://opentutorials.org/course/3347/21187의 박찬울씨의 댓글 보기
            // 만약에 rows의 길이가 0이라면 아얘 없다.
            // 그러면 회원가입을 할 수 있다.
            if (rows.length !== 0) {
                res.write("<script>alert('already ID exists!')</script>");
                res.write("<script>window.location.href = 'http://localhost:3000/signup'</script>", function (err) {
                    res.end();
                });
                return false;
            }
            // 만약 겹치는 것이 없다면 추가를 해도 좋다!
            //추가하는 과정을 여기다가 넣어주면 된다.
            func_input = "insert into user_db (user_ID, user_PW, signup_date) VALUES ('";
            //기본 시간 형태: var time = newDate.toFormat("YYYY-MM-DD HH24:MI:SS");
            var time = newDate.toFormat("YYYY-MM-DD");
            func_input = func_input + id_temp + "', '" + user_PW + "', '" + time + "');";
            conn.query(func_input, function (error, rows2, fields2) {
                if (error) {
                    res.write("<script>alert('Error!')</script>");
                    res.write("<script>window.location.href = 'http://localhost:3000/signup'</script>", function (err) {
                        res.end();
                    });
                    console.error("error on adding new user! " + error);
                    return false;
                }
                else {
                    // 제대로 되었는지 확인하기
                    res.write("<script>alert('Success!')</script>");
                    res.write("<script>window.location.href = 'http://localhost:3000/login'</script>", function (err) {
                        res.end();
                    });
                    return true;
                }
            });
        }
    });
});

app.get('/map', async function (req, res) {
    const found_key = "ncMNVNEWpjy2TwVB6%2FFU32Di1kXi9uc5pOe%2FPNW2IW5nD6%2FOuAQznNYsVBWsD1%2BKBiIoZ%2F36ZRI%2BSazHtVZyBQ%3D%3D";
    var url = 'http://apis.data.go.kr/1320000/LosfundInfoInqireService/getLosfundInfoAccToClAreaPd';
    var queryParams = '?' + encodeURIComponent('ServiceKey') + '=' + found_key; /* 서비스 키 값 */
    queryParams += '&' + encodeURIComponent('START_YMD') + '=' + encodeURIComponent('20210101'); /* 검색 구간 시작일 */
    queryParams += '&' + encodeURIComponent('END_YMD') + '=' + encodeURIComponent('20210611');/* 검색 구간 끝 일*/
    queryParams += '&' + encodeURIComponent('N_FD_LCT_CD') + '=' + encodeURIComponent('LCA000'); /* 검색 지역 코드 */
    queryParams += '&' + encodeURIComponent('pageNo') + '=' + encodeURIComponent('1'); /* 출력 페이지 */
    queryParams += '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent('10'); /* 페이지당 출력 습득물 수*/

    request({
        url: url + queryParams,
        method: 'GET'
    }, function (error, response, body) {
        var xmltojson = convert.xml2json(body, { compact: true, spaces: 4 });
        const obj = JSON.parse(xmltojson)
        const rows = obj.response.body.items.item;
        //console.log(rows);
        var dbquery = "Select * from item_db;"
        conn.query(dbquery, function (error, dbrows, fields2) {
            if (error) {
                res.write("<script>alert('Error!')</script>");
                res.write("<script>window.location.href = 'http://localhost:3000/login'</script>", function (err) {
                    res.end();
                });
                console.error("error on loading map" + error);
                return false;
            }
            else {
                // 제대로 되었는지 확인하기
                res.render('index_map', { rows, dbrows, login_able: login_success, login_user: who_login });
            }
        });
    });
});

app.get('/talk', async function (req, res) { // 2
    if(login_success){
        res.render('talk', {login_able: login_success, login_user: who_login});
    }
    else{
        res.write("<script>alert('Please Log in!')</script>");
        res.write("<script>window.location.href = 'http://localhost:3000/login'</script>", function (err) {
            res.end();
        });
        return true;
    }

});

//////////////////////////////////////////////////////////////////
// 제안1. wtalk는 뭐하는데 쓰는거임?
app.get('/wtalk', async function (req, res) {
    if(login_success){
        let json_file = fs.readFileSync('./public/talk_list.json');
        let dataJson = json_file.toString();
        let data = JSON.parse(dataJson);
        let data_chg = JSON.stringify(data);
        res.render('write_talk', { data_chg , login_able: login_success, login_user: who_login});
    }
    else{
        res.write("<script>alert('Please Log in!')</script>");
        res.write("<script>window.location.href = 'http://localhost:3000/login'</script>", function (err) {
            res.end();
        });
        return true;
    }
    
});


app.post('/wtalk', async function (req, res) {
    if(login_success){
        const json_file = fs.readFileSync('./public/talk_list.json');
        const dataJson = json_file.toString();
        const data = JSON.parse(dataJson);
        let review = req.body.review_content;
        let endpt = data[0].comment.length;
        data[0].comment[endpt] = review;
        const data_chg = JSON.stringify(data);
        fs.writeFileSync('./public/talk_list.json', data_chg);
        res.render('write_talk', { data_chg, login_able: login_success});
    }
    else{
        res.write("<script>alert('Please Log in!')</script>");
        res.write("<script>window.location.href = 'http://localhost:3000/login'</script>", function (err) {
            res.end();
        });
        return true;
    }
    
});

app.get('/register', async function (req, res) {
    res.render('lost_register', {login_able: login_success, login_user: who_login});
});

// 이건 bodyparser가 아닌 multer를 이용해서 구현.
// multer 사용을 위해 form에 enctype="multipart/form-data"을 추가.
// 로그인 된 상태라면 자동으로 원래주인(real_user=null), 찾았는지 여부(found=0)를 뺀 나머지를 자동으로 넣어준다.
app.post('/register', upload.single('img'), async function (req, res, next) {
    var it_id_num = 0;

    //가장 마지막 index 찾기
    func_input = "select it_id from item_db order by it_id DESC LIMIT 1;";
    await conn.query(func_input, function (error, rows, field) {
        if (error) {
            console.log('error at adding new item!\n' + error);
            return false;
        }
        else {
            var body = req.body;
            var name = body.name;
            var category = body.category;
            var img_src = body.img;
            var acq_gps = body.acq_gps;
            acq_gps = acq_gps.substring(1,acq_gps.length-1);
            var com_index = acq_gps.indexOf(',');
            var acq_lat = acq_gps.substring(0, com_index);
            var acq_long = acq_gps.substring(com_index+1);
            acq_lat = parseFloat(acq_lat);
            acq_long = parseFloat(acq_long);
            var place = body.place;
            var acq_time = body.acq_time;
            acq_time = acq_time.replace('T', ' ');
            acq_time = acq_time + ":00";
            var spec = body.spec;
            it_id_num = rows[0].it_id;
            it_id_num++;
            it_id_num = parseInt(it_id_num);
            //img file 이름 바꾸기
            var strange_name = 'server_side/product_img/' + req.file.filename;
            var index = req.file.mimetype.indexOf('/');
            var ext = '.' + req.file.mimetype.substr(index + 1);
            var chg_name = "server_side/product_img/" + it_id_num + ext;
            fs.rename(strange_name, chg_name, function (err) {
                if (err) console.log(err);
            });

            //image file의 이름이 바뀐 후, mysql에 이 data를 추가한다.
            func_input = "insert into item_db (name, category, acq_lat, acq_long, acq_time, real_user, found, place, spec, img_src) VALUES ('";
            func_input = func_input + name + "', '" + category + "', " + acq_lat + ", " + acq_long + ", '" + acq_time + "', NULL, 0, '" + place + "', '" + spec + "', '" + it_id_num + ext + "');";
            //console.log(func_input);
            
            conn.query(func_input, function (error, rows, field) {
                if (error) {
                    console.log('error at adding new item!\n' + error);
                    return false;
                }
                else {
                    // 자동적으로 Home으로 가는 것. 이 app은 전체적으로 건들 필요가 없다.
                    res.write("<script>alert('Success at adding new Item!')</script>");
                    res.write("<script>window.location.href = 'http://localhost:3000/map'</script>", function (err) {
                        res.end();
                    });
                    return true;
                }
            });
            return true;
        }
    });

});

// 얘는 단순 처음에 page 볼 때 확인하는것
app.get('/search', async function (req, res) {
    res.render('lost_search', {login_able: login_success, login_user: who_login});
    //id받아와서 rows로 정보 전달
});

// 분실물 검색 -> 해당하는 것들이 있는 것을 dbms에서 찾아서 출력하는게 좋을듯. 미완성!
app.post('/search', async function (req, res) {
    // 제안2. 습득물 사진 필요없다고 생각->이건 빼도 괜찮을듯
    // 분실물 이름, 분실물 카테고리, 분실 추정장소, 분실 추정시간 정도만 있어도 충분할듯.
    // 이미지 같은 경우, 여기서 item의 고유 id인 it_id를 전송하면 이제 ejs로 image를 표현하면 된다.
    var body = req.body;
    //console.log(body);
    var name = body.name;
    var category = body.category;
    var acq_gps = body.acq_gps;
    acq_gps = acq_gps.substring(1,acq_gps.length-1);
    var com_index = acq_gps.indexOf(',');
    // 왠지 모르겠으나 substring으로 acq_gps를 생성해도 그 특이사항이 계속 딸려옴, 그래서 index 조종 필요
    var acq_lat = acq_gps.substring(0, com_index);
    var acq_long = acq_gps.substring(com_index+1,acq_gps.length-1);
    acq_lat = parseFloat(acq_lat);
    acq_long = parseFloat(acq_long);
    // 잃어버릴거라 추정한 날짜의 +/- 3일 정도의 data를 찾아본다.
    var acq_time = body.acq_time;
    acq_time = acq_time.substring(0, 10);
    // lattitude, longitude 모두 +-0.015 정도의 범위(신촌역~신촌캠퍼스 맨 끝이 대략 0.015정도이다.

    //데이터를 가져오시오~
    var func_input='';
    if(category === ''){
        func_input = "select * from item_db where name LIKE '%" + name + "%' and DATEDIFF(acq_time, '" + acq_time + "')<3 and DATEDIFF(acq_time, '" + acq_time + "')>-3";
        func_input += " and " + acq_lat + "-acq_lat<0.015 and " + acq_lat + "-acq_lat >-0.015 and " + acq_long + "-acq_long<0.015 and " + acq_long + "-acq_long >-0.015;";
    }
    else{
        func_input = "select * from item_db where name LIKE '%" + name + "%' and category ='" + category + "' and DATEDIFF(acq_time, '" + acq_time + "')<3 and DATEDIFF(acq_time, '" + acq_time + "')>-3";
        func_input += " and " + acq_lat + "-acq_lat<0.015 and " + acq_lat + "-acq_lat >-0.015 and " + acq_long + "-acq_long<0.015 and " + acq_long + "-acq_long >-0.015;";
    }

    //console.log(func_input);
    conn.query(func_input, function(error, rows, field){
        if(error){
            console.log('error at adding new item!\n' + error);
            return false;
        }
        else {
            //console.log("sorted data: " + rows);
            //for(var i=0; i<rows.length; i++){
            //   console.log(rows[i]);
            //}
            // rows가 해당하는 object이다. [0], [1] 이렇게 해서 접근하면 된다.(1개짜리 배열이라도 마찬가지)
            // 여기에다가 이제 res.render 이런거 넣어서 특정 site를 부르면 된다!!!!
            if(rows.length == 0){
                res.write("<script>alert('There are No items that fits those condition!')</script>");
                res.write("<script>window.location.href = 'http://localhost:3000/search'</script>", function (err) {
                    res.end();
                });
            }   
            else{
                res.render('lost_list', {rows, login_able: login_success, login_user: who_login});
            }
            
        }
    });
});
// image에 접근하기 위해서, 저런 link를 받으면 file을 보내주는 함수다!
app.get('/image/:id', async function(req,res){
    var img_id = req.params.id;
    img_id = img_id.substring(1);
    var func_input = "SELECT img_src FROM item_db WHERE it_id = " + img_id + ";";
    conn.query(func_input, function (error, rows, field) {
        if (error) {
            console.log('error at adding new item!\n' + error);
            return false;
        }
        else {
            let path = __dirname + "/server_side/product_img/" + rows[0].img_src;
            res.sendFile(path);
            return true;
        }
    });
});


app.get('/search/:id', async function (req, res) {
    var pro_id = req.params.id;
    pro_id = pro_id.substring(1);
    var func_input = "select * from item_db where it_ID = " + pro_id + ";";
    conn.query(func_input, function (err, rows, fields) {
        if (err) {
            console.log('query is not excuted. select fail...\n' + err);
            res.write("<script>alert('No Things like that!')</script>");
            res.write("<script>window.location.href = 'http://localhost:3000/search'</script>");
            return false;
        }
        else if (rows.length === 0) {
            res.write("<script>alert('No Things like that!')</script>");
            res.write("<script>window.location.href = 'http://localhost:3000/search'</script>");
            return false;
        }
        else {
            //console.log(rows[0]);
            res.render('lost_product', {rows, login_able: login_success, login_user: who_login});
        }
    });
});
app.post('/search/:id', async function (req, res) {
    var pro_id = req.params.id;
});

app.get('/lost', async function (req, res) {
    res.render('lost_product');
});



var port = 3000;
app.listen(port, function () {
    console.log("server on!" + port);
});
/*
function sign_up(user_ID, user_PW){
    var id_temp = user_ID.toLowerCase();
    if(id_temp.length<6 || id_temp.length > 15 || user_PW.length<8 || user_PW.length>20){
        console.log("return False");
        return false;
    }

    //우선 겹치는 것이 있는지 SQL을 통해 확인한다.
    var func_input = "SELECT user_ID FROM user_db WHERE user_ID = '" + id_temp+ "';";
    conn.query(func_input, function(err, rows, fields){
        if(err){
            console.log('query is not excuted. select fail...\n' + err);
            return false;
        }
        else{
            //https://opentutorials.org/course/3347/21187의 박찬울씨의 댓글 보기
            // 만약에 rows의 길이가 0이라면 아얘 없다.
            // 그러면 회원가입을 할 수 있다.
            if(rows.length !== 0){
                return false;
            }
            // 만약 겹치는 것이 없다면 추가를 해도 좋다!
            //추가하는 과정을 여기다가 넣어주면 된다.
            func_input = "insert into user_db (user_ID, user_PW, signup_date) VALUES ('";
            //기본 시간 형태: var time = newDate.toFormat("YYYY-MM-DD HH24:MI:SS");
            var time = newDate.toFormat("YYYY-MM-DD");
            func_input = func_input + id_temp + "', '" + user_PW + "', '" + time + "');";
            conn.query(func_input, function(error, rows2, fields2){
                if(error){
                    console.error("error on adding new user! "+ error);
                    return false;
                }
                else{
                    // 제대로 되었는지 확인하기
                    print_user_from_sql();
                    return true;
                }
            });
        }
    });
}
*/

/*
function log_in(user_ID, user_PW){
    var func_input = "SELECT user_id, user_pw FROM user_db WHERE user_ID = '" + user_ID.toLowerCase()+ "' and user_PW = '" + user_PW + "';";
    conn.query(func_input, function(err, rows, field){
        //print_user_from_sql();
        if(err) console.error("error from login: " + err);
        else{
            //console.log(rows[0].user_id);
            //console.log(user_ID);
            // 사실 이 과정을 거칠 필요 없이 그냥 길이 1 or 0으로 구분할 수 있지만,
            // sql 명령문에 특정 글자를 넣어서 이를 같게 만드려는 시도가 있을 수 있기 때문에 일부러 이과정을 넣어준다
            if(rows.length === 1 && user_ID==rows[0].user_id && user_PW==rows[0].user_pw){
                res.redirect('/login');
                return user_ID;
            }
            else{
                res.redirect('/signup');
                return false;
            }
        }
    });
    //console.log(func_input);
}*/

/*
function print_user_from_sql(){
    conn.query("Select * from user_db", function(error, rows, field){
        if(error){
            console.error("error from print_user_from_sql: "+ error);
        }
        console.log(rows);
    });
}
*/

/*
function print_item_from_sql(){
    conn.query("Select * from item_db", function(error, rows, field){
        if(error){
            console.error("error from print_item_from_sql: "+ error);
        }
        console.log(rows);
    });
}
*/
/*
//미완성!!!!!!!!!
function add_item(name, category, acq_gps, acq_time, acq_user, real_user, found, place, spec, img_src){
    var func_input = "insert into item_db (name, category, acq_gps, acq_time, acq_user, real_user, found, place, spec, img_src) VALUES ('";
    func_input = func_input + name + "', '" + category + "', '" + acq_gps + "', '" + acq_time + "', '" +acq_user + "', NULL, 0, '" + place + "', '" + spec + "', NULL);";
    console.log(func_input);
    conn.query(func_input, function(error, rows, field){
        if(error){
            console.log('error at adding new item!\n' + error);
            return false;
        }
        else{
            print_item_from_sql();
            return true;
        }
    });
}
*/

/*
function chg_id_to_idnumber(user_id){
    try{
        conn.query("Select us_id from user_db where user_id = '" + user_id+ "';", function(error, row, field){
            if(error){
                console.error("error from chg_id_to_idnumber: "+ error);
            }
            else{
                var id = row[0].us_id;
                console.log("from function chg_id_to_idnumber: " + id);
                return row[0].us_id;
            }
        });
    }
    catch(error){
        console.error("error from chg_id_to_idnumber: " + error);
    }
}*/