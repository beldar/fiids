var Feeds = new Meteor.Collection("feeds");
var Posts = new Meteor.Collection("posts");


/** Events **/
Template.user_loggedout.events({
   "click #login": function(){
       Meteor.loginWithGithub({
           requestPermissions: ['user', 'public_repo']
       }, function(err){
           if(err)
               console.log('Error during login: '+err);
       });
   } 
});
Template.user_loggedin.events({
    "click #logout": function(){
       Meteor.logout(function(err){
           if(err)
               console.log('Error during logout:'+err);
       });
    }
});
Template.main.events({
   "click #newfeed": function(){
        var furl = $("#feedurl");
        if(furl.val()!="")
            Meteor.call("newfeed",furl.val());
   } 
});
Template.feed.events({
   "click":function(){
       console.log('Feed selected');
       console.log(this);
       Session.set("active_feed", this._id);
   }
});
Template.activefeed.events({
   "click #frem": function(){
       if(Session.get("active_feed"))
           Meteor.call("deletefeed", Session.get("active_feed"));
   },
   "click #expand": function(){
       $(".snippet").hide();
       $(".content").show();
   },
   "click #compress": function(){
       $(".snippet").show();
       $(".content").hide();
   },
   "click #refresh": function(){
       if(Session.get("active_feed"))
           Meteor.call("refresh", Session.get("active_feed"));
   },
   "click #onlyunread": function(){
       $(".readed").hide();
   },
   "click #all": function(){
       $(".post").show();
   }
});
Template.post.events({
   "click": function(){
        var uid = Meteor.userId();
        var userIndex = _.indexOf(_.pluck(this.users, 'user'),uid);
        if(userIndex!=-1 && !this.users[userIndex].readed){
            var modifier = {$set:{}};
            var field = "users."+userIndex+".readed";
            modifier.$set[field] = true;
            Posts.update(this._id, modifier);
        }
   },
   "click .exp": function(evt,tmpl){
       var ctn = tmpl.find('.content');
       var snp = tmpl.find('.snippet');
       var tg = evt.target.tagName=='I' ? $(evt.target) : $(evt.target).find('i');
       if(ctn.style.display=='none'){
           snp.style.display = 'none';
           ctn.style.display = 'block';
           tg.removeClass('icon-resize-full');
           tg.addClass('icon-resize-small');
       }else{
           snp.style.display = 'block';
           ctn.style.display = 'none';
           tg.addClass('icon-resize-full');
           tg.removeClass('icon-resize-small');
       }
   },
   "click .fav": function(evt, tmpl){
       var uid = Meteor.userId();
       var userIndex = _.indexOf(_.pluck(this.users, 'user'),uid);
       if(userIndex!=-1){
            var modifier = {$set:{}};
            var field = "users."+userIndex+".favorite";
            var isfav = this.users[userIndex].favorite;
            modifier.$set[field] = !isfav;
            Posts.update(this._id, modifier);
       }
   }
});

/** Init **/
Deps.autorun(function(){
   Meteor.subscribe("feeds");
   Meteor.subscribe("posts");
   //Meteor.setInterval(function(){
        console.log("Checking feeds");
        //console.log("User id: "+Meteor.userId);
        Meteor.call("refresh", false);
    //},30000);
});

/** Live data **/
Template.feeds.myfeeds = function(){
    return Feeds.find();
};
Template.activefeed.afeed = function(){
   return Posts.find({feedid:Session.get("active_feed")}, {sort:{publishedDate:-1}});
};
Template.activefeed.currentFeed = function(){
   return typeof Session.get("active_feed") !== 'undefined';
};
Template.feed.selected = function(){
    return Session.get("active_feed") == this._id ? 'active':'';
};
Template.feed.unread = function(){
    var posts = Posts.find({feedid:this._id}).fetch();
    var uid = Meteor.userId();
    console.log(posts);
    var unreaded = 0;
    _.each(posts, function(el){
        console.log(el.title);
        var usr = _.find(el.users, function(us){return us.user==uid && !us.readed});
        if(typeof usr !== "undefined") unreaded++;
        //if(!el.users[uid].readed) unreaded++;
    });
    //var unreaded = _.where(, {user:Meteor.userId(), readed:false});
    //console.log(users);
    
    return unreaded;
};
Template.post.readed = function(){
    var uid = Meteor.userId();
    var userIndex = _.indexOf(_.pluck(this.users, 'user'),uid);
    var readed = this.users[userIndex].readed;
    return readed;
};
Template.post.isfavorite = function(){
    var uid = Meteor.userId();
    var userIndex = _.indexOf(_.pluck(this.users, 'user'),uid);
    var favorite = this.users[userIndex].favorite;
    return favorite;
};
Template.post.normaldate = function(){
    return this.publishedDate!==null ? moment(this.publishedDate).fromNow():'';
};