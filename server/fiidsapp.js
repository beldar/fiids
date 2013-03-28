var Feeds = new Meteor.Collection("feeds");
var Posts = new Meteor.Collection("posts");
var UserFeeds = new Meteor.Collection("userfeeds");
var UserPosts = new Meteor.Collection("userposts");

Meteor.startup(function () {
    console.log('Init');
    Meteor.publish('feeds', function(){
        return Feeds.find({_id:{$in:_.pluck(UserFeeds.find({user:this.userId}).fetch(),'feedid')}});
    });
    Meteor.publish('posts', function(){
       var uf = Feeds.find({_id:{$in:_.pluck(UserFeeds.find({user:this.userId}).fetch(),'feedid')}}).fetch();
       var pk = _.pluck(uf, '_id');
       return Posts.find({feedid:{$in:pk}}); 
    });
    Meteor.publish('userposts', function(){
       return UserPosts.find({user:this.userId}); 
    });
    //Meteor.setInterval(function(){
        console.log("Checking feeds");
        //console.log("User id: "+Meteor.userId);
        Meteor.call("refresh", false);
    //},30000);
});

UserPosts.allow({
    update: function(userId,doc,fields,mod){
        return doc.user === userId
    }
});

Accounts.onCreateUser(function(options,user){
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
});

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
                        countunread:entries.length
                    });
               UserFeeds.insert({
                   feedid:fid,
                   user: this.userId
               })
               for(var i in entries){
                   var v = entries[i];
                   var idp = Posts.insert({
                       feedid: fid,
                       title: v.title,
                       link: v.link,
                       author: v.author,
                       publishedDate: v.publishedDate,
                       contentSnippet: v.contentSnippet,
                       content: v.content,
                       categories: v.categories
                   });
                   UserPosts.insert({
                       postid: idp,
                       feedid: fid,
                       user: this.userId,
                       readed: false,
                       favorite: false
                   });
               }
               
           }
       }else{
           /**
            * TODO: Check if feed exists but has no relation to user
            *
            */
           var fu = UserFeeds.find({user:this.userId});
           
       }
   },
   deletefeed: function(feedid){
       /**
        * TODO: When a feed is deleted, don't delete de feed, delete the relation to the user!!
        */
       Feeds.remove(feedid);
       Posts.remove({feedid:feedid});
       //UserPosts
   },
   refresh: function(feedid){
       var userId = Meteor.userId;
       console.log('Refreshing feed: '+feedid);
       if(!feedid){
           console.log("Refreshing all feeds");
           var fdid = _.pluck(UserFeeds.find({user:userId}).fetch(),'feedid');
           console.log(fdid);
           var uf = Feeds.find({_id:{$in:fdid}});
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
                   Meteor.call("refreshposts",entries, userId);
                } 
           }
       }
   },
   refreshposts: function(feed,entries, userId){
        var rep = false;
        var i = 0;
        console.log("Checking for new posts");
        while(i<entries.length){
            var v = entries[i];
            //console.log("Searching post from feed "+feed._id)
            var p = Posts.findOne({feedid:feed._id,title:v.title});
            var idp = false;
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
                    categories: v.categories
                });
            }else
                idp = p._id;
            var up = UserPosts.findOne({user:userId,postid:idp});
            if(!up){
                console.log("New user post: "+idp);
                UserPosts.insert({
                    postid: idp,
                    feedid: feed._id,
                    user: userId,
                    readed: false,
                    favorite: false
                });
            }
            i++;
        }
   }
});

