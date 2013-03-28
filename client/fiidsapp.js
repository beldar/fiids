var Feeds = new Meteor.Collection("feeds");
var Posts = new Meteor.Collection("posts");
var UserPosts = new Meteor.Collection("userposts");

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
   }
});
Template.post.events({
   "click": function(){
       var up = UserPosts.findOne({postid:this._id});
       if(!up.readed)
            UserPosts.update({_id:up._id}, {$set: {readed:true}});
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
   "click .fav": function(){
       var up = UserPosts.findOne({postid:this._id});
       UserPosts.update({_id:up._id}, {$set: {favorite:!up.favorite}});
   }
});

/** Init **/
Deps.autorun(function(){
   Meteor.subscribe("feeds");
   Meteor.subscribe("posts");
   Meteor.subscribe("userposts");
});

/** Live data **/
Template.feeds.myfeeds = function(){
    return Feeds.find();
}
Template.activefeed.afeed = function(){
   return Posts.find({feedid:Session.get("active_feed")}, {sort:{publishedDate:-1}});
}
Template.activefeed.currentFeed = function(){
   return typeof Session.get("active_feed") !== 'undefined';
}
Template.feed.selected = function(){
    return Session.get("active_feed") == this._id ? 'active':'';
}
Template.feed.unread = function(){
    return UserPosts.find({feedid:this._id, readed:false}).count();
}
Template.post.readed = function(){
    return UserPosts.find({postid:this._id, readed:true}).count();
}
Template.post.isfavorite = function(){
    return UserPosts.find({postid:this._id, favorite:true}).count();
}
Template.post.normaldate = function(){
    return moment(this.publishedDate).fromNow();
}