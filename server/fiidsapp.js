var Feeds = new Meteor.Collection("feeds");
var Posts = new Meteor.Collection("posts");
var UserFeeds = new Meteor.Collection("userfeeds");
var UserPosts = new Meteor.Collection("userposts");

Meteor.startup(function () {
    console.log('Init');
    Meteor.publish('feeds', function(){
        return Feeds.find({users:this.userId});
    });
    
    Meteor.publish('posts', function(){
       return Posts.find({users:{$elemMatch: {user: this.userId}}}); 
    });

});

Posts.allow({
    update: function(userId,doc,fields,mod){
        //return _.contains(_.pluck(fields.users, user), userId);
        return true;
    }
});

/*Accounts.onCreateUser(function(options,user){
   var at = user.services.github.accessToken,
       result,
       profile;
       
   result = Meteor.http.get("https://api.github.com/user",{
       params: {access_token: at}
   });
   
   if(result.error)
       throw result.error;
   
   profile = _.pick(result.data,
        "login",
        "name",
        "avatar_url",
        "url",
        "company",
        "blog",
        "location",
        "email",
        "bio",
        "html_url"
   );
       
   user.profile = profile;
   return user; 
});*/

Meteor.methods({
   newfeed: function(feedurl){
       var feed = Feeds.findOne({feedurl:feedurl});
       if(!feed){
           var fs = Meteor.http.get("https://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=20&q="+feedurl);
           if(fs.error){
                   console.log('Error getting feed: '+err);
           }else{
               var fd = fs.data.responseData.feed;
               var entries = fd.entries;
               console.log('New feed: '+fd.title);
               var fid = Feeds.insert({
                        feedurl: feedurl,
                        feedname: fd.title,
                        users: [this.userId]
                    });
               for(var i in entries){
                   var v = entries[i];
                   Posts.insert({
                       feedid: fid,
                       title: v.title,
                       link: v.link,
                       author: v.author,
                       publishedDate: v.publishedDate,
                       contentSnippet: v.contentSnippet,
                       content: v.content,
                       categories: v.categories,
                       users: [{user:this.userId, readed:false, favorite:false}]
                   });
               }
               
           }
       }else{
           if(!_.contains(feed.users, this.userId)){
               Feeds.update(feed._id,{$push: {users: this.userId}});
               Posts.update({feedid:feed._id}, {$addToSet: {users: {user:this.userId, readed:false, favorite:false}}}, {multi:true});
           }
           
       }
   },
   deletefeed: function(feedid){
       console.log("Deleting feed for user");
       //Remove user from feed
       Feeds.update(feedid, {$pull: {users: this.userId}});
       var f = Feeds.findOne(feedid);
       if(f.users.length==0){
           //No users have this feed delete it
           Feeds.remove(feedid);
           Posts.remove({feedid:feedid});
       }else{
           //Remove the user from posts
           Posts.update({feedid:feedid}, {$pull: {users:{user: this.userId}}}, {multi:true});
       }
   },
   refresh: function(feedid){
       var userId = this.userId;
       console.log('User id: '+userId);
       console.log('Refreshing feed: '+feedid);
       if(!feedid){
           console.log("Refreshing all feeds");
           var uf = Feeds.find({users:{$in:[userId]}});
           console.log("Numberof feeds: "+uf.count());
           uf.forEach(function(feed){
                console.log("Getting feed: "+feed.feedname);
                var fs = Meteor.http.get("https://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=20&q="+feed.feedurl);
                if(fs.error){
                        console.log('Error getting feed: '+err);
                }else{
                   var fd = fs.data.responseData.feed;
                   var entries = fd.entries;
                   console.log("Getting entries total: "+entries.length);
                   Meteor.call("refreshposts",feed,entries, userId);
                }
           });
       }else{
           var feed = Feeds.findOne({_id:feedid});
           if(feed){
                var fs = Meteor.http.get("https://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=20&q="+feed.feedurl);
                if(fs.error){
                        console.log('Error getting feed: '+err);
                }else{
                   var fd = fs.data.responseData.feed;
                   var entries = fd.entries;
                   Meteor.call("refreshposts",feed,entries, userId);
                } 
           }
       }
   },
   refreshposts: function(feed,entries, userId){
        console.log("Checking for new posts");
        for(var i in entries){
            var v = entries[i];
            if(typeof v !== 'undefined'){
                var p = Posts.findOne({feedid:feed._id,title:v.title});
                if(!p){
                    console.log("New post: "+v.title);
                    idp = Posts.insert({
                        feedid: feed._id,
                        title: v.title,
                        link: v.link,
                        author: v.author,
                        publishedDate: v.publishedDate,
                        contentSnippet: v.contentSnippet,
                        content: v.content,
                        categories: v.categories,
                        users: []
                    });
                    //Add all users subscribed to this feed
                    var pusers = [];
                    _.each(feed.users, function(el){
                        pusers.push({user:el, readed:false, favorite:false});
                    },this);
                    Posts.update(idp, {$set: {users:pusers}});
                }
            }
        }
   }
});

