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
        furl.val('');
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
   },
   "click #addtag": function(evt, tmpl){
       var inp = $('#taginput');
       if(inp.val()!=""){
           var tag = inp.val();
           var uid = Meteor.userId();
           var feed = Feeds.findOne(Session.get("active_feed"));
           var userIndex = _.indexOf(_.pluck(feed.users, 'user'),uid);
           if(userIndex!=-1 && !_.contains(feed.users[userIndex].tags,tag)){
                var modifier = {$push:{}};
                var field = "users."+userIndex+".tags";
                modifier.$push[field] = tag;
                Feeds.update(Session.get("active_feed"), modifier);
           }
           inp.val('');
       }
   },
   "click .remtag": function(evt,tmpl){
        var tg = evt.target.tagName=='A' ? $(evt.target) : $(evt.target).parent();
        var tag = tg.prev().html();
        var uid = Meteor.userId();
        var feed = Feeds.findOne(Session.get("active_feed"));
        var userIndex = _.indexOf(_.pluck(feed.users, 'user'),uid);
        if(userIndex!=-1 && _.contains(feed.users[userIndex].tags,tag)){
             var modifier = {$pull:{}};
             var field = "users."+userIndex+".tags";
             modifier.$pull[field] = tag;
             Feeds.update(Session.get("active_feed"), modifier);
        }
   },
   "keydown #taginput": function(evt){
       if(evt.which === 13)
           Template.activefeed._tmpl_data.events["click #addtag"][0].call();
   }
});
Template.post.events({
   "click": function(evt,tmpl){
        var uid = Meteor.userId();
        var userIndex = _.indexOf(_.pluck(this.users, 'user'),uid);
        if(userIndex!=-1 && !this.users[userIndex].readed){
            var modifier = {$set:{}};
            var field = "users."+userIndex+".readed";
            modifier.$set[field] = true;
            Posts.update(this._id, modifier);
            tmpl.find('.snippet').style.display = 'none';
            tmpl.find('.content').style.display = 'block';
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
   "click .fav": function(){
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
   Meteor.setInterval(function(){
        console.log("Checking feeds");
        Meteor.call("refresh", false);
   },1800000);//30 min default
   console.log("Checking feeds first time");
   Meteor.call("refresh", false);
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
Template.activefeed.feedtags = function(){
   var feed = Feeds.findOne({_id:Session.get("active_feed")});
   if(typeof feed !== 'undefined'){
        var uid = Meteor.userId();
        var userIndex = _.indexOf(_.pluck(feed.users, 'user'),uid);
        return feed.users[userIndex].tags;
   }else
       return [];
};
Template.feed.selected = function(){
   return Session.get("active_feed") == this._id ? 'active':'';
};
Template.feed.unread = function(){
    var posts = Posts.find({feedid:this._id}).fetch();
    var uid = Meteor.userId();
    var unreaded = 0;
    _.each(posts, function(el){
        var usr = _.find(el.users, function(us){return us.user==uid && !us.readed});
        if(typeof usr !== "undefined") unreaded++;
    });
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