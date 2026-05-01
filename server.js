const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();

app.set('view engine','ejs');
app.set('views', __dirname + '/views');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.use(session({
secret:'iotsecret',
resave:false,
saveUninitialized:true
}));

function auth(req,res,next){
if(req.session.user){
next();
}else{
res.redirect('/');
}
}

app.get('/',(req,res)=>{
res.render('login');
});

app.get('/register',(req,res)=>{
res.render('register');
});

app.post('/register', async (req,res)=>{

const {name,email,password}=req.body;

const hash = await bcrypt.hash(password,10);

try{

db.prepare(
"INSERT INTO users(name,email,password) VALUES(?,?,?)"
).run(name,email,hash);

res.redirect('/');

}catch(err){

res.send("User Exists");

}

});

app.post('/login', async (req,res)=>{

const {email,password}=req.body;

const user = db.prepare(
"SELECT * FROM users WHERE email=?"
).get(email);

if(!user) return res.send("Invalid Login");

const match = await bcrypt.compare(password,user.password);

if(match){

req.session.user=user;
res.redirect('/dashboard');

}else{

res.send("Wrong Password");

}

});

app.get('/dashboard',auth,(req,res)=>{

const current = db.prepare(
"SELECT * FROM sensor_data ORDER BY id DESC LIMIT 1"
).get();

const page = parseInt(req.query.page) || 1;
const limit = 10;
const offset = (page-1)*limit;

const rows = db.prepare(
"SELECT * FROM sensor_data ORDER BY id DESC LIMIT ? OFFSET ?"
).all(limit,offset);

const count = db.prepare(
"SELECT COUNT(*) as total FROM sensor_data"
).get();

res.render('dashboard',{
user:req.session.user,
current:current,
data:rows,
total:count.total,
page:page,
limit:limit
});

});

app.get('/delete/:id',auth,(req,res)=>{

db.prepare(
"DELETE FROM sensor_data WHERE id=?"
).run(req.params.id);

res.redirect('/dashboard');

});

app.get('/logout',(req,res)=>{

req.session.destroy();
res.redirect('/');

});

const API_KEY="iot123";

app.post('/api/data',(req,res)=>{

const {temperature,humidity,key}=req.body;

if(key!==API_KEY){
return res.json({status:"unauthorized"});
}

db.prepare(
"INSERT INTO sensor_data(temperature,humidity) VALUES(?,?)"
).run(temperature,humidity);

res.json({status:"success"});

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{
console.log("Server running on port " + PORT);
});