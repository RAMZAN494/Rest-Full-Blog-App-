var bodyParser 		 = require("body-parser"),
methodOverride 	 = require("method-override"),
expressSanitizer = require("express-sanitizer"),
mongoose         = require("mongoose"),
express          = require("express"),
passport         = require("passport"),
passportLocal    = require("passport-local"),
passportMongoose = require("passport-local-mongoose"),
User            = require("./models/user"),
Blog            = require("./models/Blog"),
app          = express();


// APP CONFIG
mongoose.connect("mongodb://localhost:27017/myBlog", {useNewUrlParser: true, useUnifiedTopology: true});

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(expressSanitizer());
app.use(methodOverride("_method"));



app.use(require("express-session")({
    secret:"Wellcome To The Yelp Camp",
    resave:false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new passportLocal(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){
	res.locals.currentUser = req.user;
	next()
})

// MONGOOSE/ MODEL CONFIG


//RESTFULL ROUTED

app.get("/", function(req,res){
	res.render("home");
});
app.get("/blogs", function(req,res){
	Blog.find({}, function(err, blogs){
		if (err) {
			console.log(err);
		}else{
			res.render("index", {blogs:blogs, currentUser:req.user});
		}
	})
	
});

app.get("/blogs/new",isLoggedIn, function(req,res){
	res.render("new");
});

//Create Route...
app.post("/blogs" ,isLoggedIn, function(req, res){

	Blog.create(req.body.blog,  function(err, newBlog){
		if (err) {
			console.log(err);
			 res.render("new")
		} else{
			
			res.redirect("/blogs");
		}
	});
});

//Show Route
app.get("/blogs/:id",isLoggedIn, function(req,res){
	Blog.findById(req.params.id, function(err, findBlog){
		if (err) {
			res.redirect("/blogs");
		} else{
			res.render("show", {blog:findBlog})
		}
	});
});

//Edit Route

app.get("/blogs/:id/edit", function(req,res){
	Blog.findById(req.params.id, function(err, findBlog){
		if (err) {
			res.redirect("/blogs");
		} else {
			res.render("edit", {blog:findBlog});
		}
	});
});

// Upadate Route...

app.put("/blogs/:id", function(req,res){
	req.body.blog.body = req.sanitize(req.body.blog.body);
	Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(err, updateBLog){
		if (err) {
			res.redirect("/bogs");
		} else{
			res.redirect("/blogs/"+ req.params.id);
		}
	});
});

//DELETE ROUTE

app.delete("/blogs/:id",function(req,res){
	Blog.findByIdAndRemove(req.params.id, function(err){
		if(err){
			res.redirect("/blogs");
		}else{
			res.redirect("/blogs");
		}
	})
});

app.get("/register", function(req,res){
	res.render("register")
});

app.post("/register", function(req,res){
	var newUser = new User({username:req.body.username});
	User.register(newUser, req.body.password, function(err,user){
		if (err) {
			console.log(err);
			return res.render("register");
		}
		passport.authenticate("local")(req,res,function(){
			res.redirect("/blogs");
		});
	});
});

//HANDLE LOGIN LOGIN LOGIC
app.get("/login",function(req,res){
	res.render("login");
});

app.post("/login",passport.authenticate("local",
{
	successRedirect:"/blogs",
	failureRedirect:"/login"

}), function(req,res){

});

//LOGOUT ROUTES

app.get("/logout", function(req,res){
	req.logout();
	res.redirect("/");
});

function isLoggedIn(req,res,next){
  if (req.isAuthenticated()) {
  	return next();
  }
  res.redirect("/login");
}

let port = process.env.PORT;
if(port==null || port==""){
    port=4500;
}
app.listen(port,function(){
    console.log("Server Start On Port 4500");
});


