var Feeds = new Meteor.Collection("feeds");
var Posts = new Meteor.Collection("posts");


/** Events **/
/*Template.user_loggedout.events({
   "click #login": function(){
       Meteor.loginWithGithub({
           requestPermissions: ['user', 'public_repo']
       }, function(err){
           if(err)
               console.log('Error during login: '+err);
       });
   } 
});*/
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
   },
   "click #seefav": function(){
       //Session.set("active_feed", undefined);
       //Session.set("active_feeds", []);
       Session.set("showingnofeed", true);
       $("#seefav").parent().addClass('active');
       Session.set("postLimit", 20);
       Session.set("postsel",{users:{$elemMatch:{user:Meteor.userId(), favorite:true}}});
   }
});
Template.feed.events({
   "click":function(){
       console.log('Feed selected');
       Session.set("active_feed", this._id);
       Session.set("active_feeds", [this._id]);
       Session.set("filters", {tags:[]});
       Session.set("showingnofeed", false);
       Session.set("postLimit", 20);
       $("#seefav").parent().removeClass("active");
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
   },
   "click .tagtxt": function(evt){
       var tg = $(evt.target);
       if(typeof Session.get("filters") === 'undefined')
           Session.set("filters", {tags:[tg.html()]});
       else{
           var fltr = Session.get("filters");
           fltr.tags.push(tg.html());
           console.log(fltr);
           Session.set("filters", fltr);
       }       
   },
   "click #addtagfilter": function(){
       var tag = $("#taginputfilter").val();
       if(tag!=''){
           console.log('New tag');
           var fltr = Session.get("filters");
           if(!_.contains(fltr.tags,tag)){
                fltr.tags.push(tag);
                Session.set("filters", fltr);
           }
       }
   },
   "click .remfilter": function(evt,tmpl){
        var tg = evt.target.tagName=='A' ? $(evt.target) : $(evt.target).parent();
        var tag = tg.prev().html();
        var fltr = Session.get("filters");
        console.log("Remove tag: "+tag);
        fltr.tags = _.without(fltr.tags,tag);
        Session.set("filters", fltr);
   },
   "click #readall": function(){
        Meteor.call("readall", Session.get("active_feeds"));
   },
   "click #getmore": function(){
        var lim = Session.get("postLimit");
        lim += 20;
        Session.set("postLimit", lim);
        return false;
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
Meteor.startup(function(){
   Meteor.setInterval(function(){
        console.log("Checking feeds");
        Meteor.call("refresh", false);
   },1800000);//30 min default
   console.log("Checking feeds first time");
   Meteor.call("refresh", false);
   Session.set("postLimit", 20);
});
/** Dependencies **/
Deps.autorun(function(){
   Meteor.subscribe("feeds");
   Meteor.subscribe("posts");
   if(typeof Session.get("filters") !== 'undefined'){
       if(Session.get("filters").tags.length>0)
           Session.set("active_feeds",_.pluck(Feeds.find({users:{$elemMatch:{user:Meteor.userId(), tags:{$in:Session.get("filters").tags}}}}).fetch(), '_id'));
       else
           Session.set("active_feeds", [Session.get("active_feed")]);
       console.log(Session.get("active_feeds"));
   }
   Session.set("postsel", {feedid:{$in: Session.get("active_feeds")}});
   Session.set("postopts", {sort:{publishedDate:-1}, limit:Session.get("postLimit")});
   document.title = 'FiidsMe ('+Posts.find({users: {$elemMatch:{user:Meteor.userId(), readed:false}}}).count()+')';
});

/** Live data **/
Template.feeds.myfeeds = function(){
    return Feeds.find();
};
Template.activefeed.afeed = function(){
   return Posts.find(Session.get("postsel"), Session.get("postopts"));
};
Template.activefeed.currentFeed = function(){
   return typeof Session.get("active_feed") !== 'undefined';
};
Template.activefeed.noFeed = function(){
   return !Session.get("showingnofeed");
};
Template.activefeed.filters = function(){
    if(typeof Session.get("filters") !== 'undefined' && Session.get("filters").tags.length>0){
        return Session.get("filters").tags;
    }else
        return false;
};
Template.activefeed.alltags = function(){
    var uid = Meteor.userId();
    var tags = [];
    var userIndex = -1;
    Feeds.find().forEach(function(feed){
        userIndex = _.indexOf(_.pluck(feed.users, 'user'),uid);
        _.each(feed.users[userIndex].tags, function(tag){
            if(!_.contains(tags, tag) && !_.contains(Session.get("filters").tags,tag))
                tags.push(tag);
        });
    });
    $("#taginputfilter").typeahead({source:tags, items:5});
};
Template.activefeed.therearemore = function(){
    return Posts.find(Session.get("postsel")).count()>Session.get("postLimit");
}
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
   return ((Session.get("active_feed") == this._id || _.contains(Session.get("active_feeds"), this._id)) && !Session.get("showingnofeed")) ? 'active':'';
};
Template.feed.unread = function(){
    return Posts.find({feedid:this._id, users: {$elemMatch:{user:Meteor.userId(), readed:false}}}).count();
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
    return this.publishedDate!==null ? moment('"'+this.publishedDate+'"',"X").fromNow():'';
};